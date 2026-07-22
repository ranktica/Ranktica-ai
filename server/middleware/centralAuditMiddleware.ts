import { Request, Response, NextFunction } from 'express';
import { securityAuditService } from '../services/securityAuditService';

export interface AuditRequest extends Request {
  user?: any;
  tenant?: any;
}

/**
  Centralized Express Audit Middleware.
  Intercepts incoming API requests and writes immutable logs for:
  1. User Access & Navigation Events (`audit_logs`)
  2. Auth State & Session Interception (`audit_logs`)
  3. Security Anomaly & Threat Detection (`suspicious_activity_logs`)
 */
export function centralAuditMiddleware(req: AuditRequest, res: Response, next: NextFunction) {
  const startTime = Date.now();

  // Intercept response termination to log final execution status and audit metrics
  res.on('finish', async () => {
    const durationMs = Date.now() - startTime;
    const path = req.originalUrl || req.path;
    const method = req.method;
    const statusCode = res.statusCode;

    // Only audit backend API routes
    if (!path.startsWith('/api')) return;

    const userId = req.user?.uid || req.tenant?.userId || (req.headers['x-user-id'] as string) || 'anonymous';
    const orgId = req.tenant?.organizationId || (req.headers['x-org-id'] as string) || 'org_default';
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || req.socket.remoteAddress || '0.0.0.0';

    const action = `${method} ${path} [HTTP ${statusCode}] (${durationMs}ms)`;

    // 1. Immutable User Access & Auth Audit
    const isCriticalMutation = method !== 'GET';
    const isSensitiveRoute = path.includes('/security') || 
                             path.includes('/db') || 
                             path.includes('/billing') || 
                             path.includes('/auth') || 
                             path.includes('/prompts') ||
                             path.includes('/cache') ||
                             path.includes('/storage');

    if (isCriticalMutation || isSensitiveRoute) {
      await securityAuditService.logAccessEvent(
        action,
        userId,
        orgId,
        ipAddress,
        userId !== 'anonymous' ? 'user_session' : 'anonymous_client'
      );
    }

    // 2. Auth State & Security Anomaly Interception
    if (statusCode === 401) {
      await securityAuditService.logSecurityEvent(
        'AUTH_FAILURE',
        'MEDIUM',
        `Unauthenticated access attempt to protected endpoint ${path}`,
        userId,
        orgId,
        ipAddress,
        path,
        { statusCode, method, durationMs, userAgent: req.headers['user-agent'] }
      );
    } else if (statusCode === 403) {
      await securityAuditService.logSecurityEvent(
        'PRIVILEGE_ESCALATION',
        'HIGH',
        `Forbidden or missing permission access attempt to ${path}`,
        userId,
        orgId,
        ipAddress,
        path,
        { statusCode, method, durationMs, userAgent: req.headers['user-agent'] }
      );
    } else if (statusCode === 429) {
      await securityAuditService.logSecurityEvent(
        'RAPID_VIOLATIONS',
        'HIGH',
        `Rate limit violation threshold exceeded on ${path}`,
        userId,
        orgId,
        ipAddress,
        path,
        { statusCode, method, durationMs }
      );
    } else if (path.includes('/security/firewall/simulate') || (path.includes('/prompts') && statusCode >= 400)) {
      await securityAuditService.logSecurityEvent(
        'PROMPT_INJECTION',
        'HIGH',
        `Security firewall or prompt governance violation on ${path}`,
        userId,
        orgId,
        ipAddress,
        path,
        { statusCode, method, durationMs }
      );
    }
  });

  next();
}
