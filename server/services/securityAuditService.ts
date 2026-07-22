import { v4 as uuidv4 } from 'uuid';
import { dbService } from './dbService';
import { observabilityService } from './observabilityService';

export interface AuditLogEntry {
  id: string;
  user_id?: string;
  organization_id: string;
  action: string;
  ip_address?: string;
  created_by?: string;
  created_at: number;
  updated_at?: number;
  deleted_at?: number;
}

export interface SuspiciousActivityEntry {
  id: string;
  user_id?: string;
  organization_id: string;
  activity_type: 'IDOR_ATTEMPT' | 'PRIVILEGE_ESCALATION' | 'PROMPT_INJECTION' | 'RAPID_VIOLATIONS' | 'UNAUTHORIZED_API_ACCESS' | 'AUTH_FAILURE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  ip_address?: string;
  request_path?: string;
  details?: string;
  detected_at: number;
}

export class SecurityAuditService {
  /**
   * Records structured user access event in `audit_logs` table
   */
  public async logAccessEvent(
    action: string,
    userId?: string,
    organizationId: string = 'org_default',
    ipAddress?: string,
    createdBy: string = 'system'
  ): Promise<void> {
    const id = uuidv4();
    const timestamp = Date.now();

    try {
      await dbService.run(
        `INSERT INTO audit_logs (id, user_id, action, ip_address, organization_id, created_by, created_at, updated_at, deleted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [id, userId || 'anonymous', action, ipAddress || '0.0.0.0', organizationId, createdBy, timestamp, timestamp]
      );

      await observabilityService.logEvent('INFO', 'security-firewall', `User Access Audit: ${action}`, {
        userId,
        orgId: organizationId,
        action,
        ipAddress
      });
    } catch (err: any) {
      console.error('[SecurityAuditService] Failed to record user access event to audit table:', err.message);
    }
  }

  /**
   * Records a security threat or suspicious access attempt in `suspicious_activity_logs` table
   */
  public async logSecurityEvent(
    activityType: SuspiciousActivityEntry['activity_type'],
    severity: SuspiciousActivityEntry['severity'],
    description: string,
    userId?: string,
    organizationId: string = 'org_default',
    ipAddress?: string,
    requestPath?: string,
    details?: Record<string, any>
  ): Promise<void> {
    const id = uuidv4();
    const timestamp = Date.now();
    const serializedDetails = details ? JSON.stringify(details) : '{}';

    try {
      await dbService.run(
        `INSERT INTO suspicious_activity_logs (id, user_id, organization_id, activity_type, severity, description, ip_address, request_path, details, detected_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, userId || 'anonymous', organizationId, activityType, severity, description, ipAddress || '0.0.0.0', requestPath || '/', serializedDetails, timestamp]
      );

      // Also create high-priority audit entry
      await this.logAccessEvent(
        `SECURITY_VIOLATION: ${activityType} (${severity}) - ${description}`,
        userId,
        organizationId,
        ipAddress,
        'security_firewall'
      );

      await observabilityService.logEvent(
        severity === 'CRITICAL' || severity === 'HIGH' ? 'ERROR' : 'WARN',
        'security-firewall',
        `Security Event Detected: ${activityType} - ${description}`,
        {
          userId,
          orgId: organizationId,
          activityType,
          severity,
          requestPath,
          ipAddress
        }
      );
    } catch (err: any) {
      console.error('[SecurityAuditService] Failed to record security event:', err.message);
    }
  }

  /**
   * Retrieves audit logs for an organization
   */
  public async getAuditLogs(organizationId: string = 'org_default', limit: number = 100): Promise<AuditLogEntry[]> {
    try {
      const rows = await dbService.all(
        `SELECT id, user_id, action, ip_address, organization_id, created_by, created_at, updated_at
         FROM audit_logs
         WHERE organization_id = ? AND deleted_at = 0
         ORDER BY created_at DESC
         LIMIT ?`,
        [organizationId, limit]
      );
      return rows as AuditLogEntry[];
    } catch (err: any) {
      console.error('[SecurityAuditService] Failed to query audit logs:', err.message);
      return [];
    }
  }

  /**
   * Retrieves suspicious activity logs
   */
  public async getSuspiciousActivityLogs(organizationId: string = 'org_default', limit: number = 100): Promise<SuspiciousActivityEntry[]> {
    try {
      const rows = await dbService.all(
        `SELECT id, user_id, organization_id, activity_type, severity, description, ip_address, request_path, details, detected_at
         FROM suspicious_activity_logs
         WHERE organization_id = ?
         ORDER BY detected_at DESC
         LIMIT ?`,
        [organizationId, limit]
      );
      return rows as SuspiciousActivityEntry[];
    } catch (err: any) {
      console.error('[SecurityAuditService] Failed to query suspicious activity logs:', err.message);
      return [];
    }
  }
}

export const securityAuditService = new SecurityAuditService();
