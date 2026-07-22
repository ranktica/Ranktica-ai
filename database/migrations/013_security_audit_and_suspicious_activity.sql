-- Migration: 013_security_audit_and_suspicious_activity
-- Description: Sets up enterprise schema for Suspicious Activity Detection and advanced Security Access Tracking.

CREATE TABLE IF NOT EXISTS suspicious_activity_logs (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255),
    organization_id VARCHAR(255) DEFAULT 'org_default',
    activity_type VARCHAR(100) NOT NULL, -- 'IDOR_ATTEMPT', 'PRIVILEGE_ESCALATION', 'PROMPT_INJECTION', 'RAPID_VIOLATIONS', 'UNAUTHORIZED_API_ACCESS'
    severity VARCHAR(50) NOT NULL, -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    description TEXT NOT NULL,
    ip_address VARCHAR(150),
    request_path VARCHAR(255),
    details TEXT, -- JSON payload of contextual data
    detected_at BIGINT DEFAULT 0
);

-- Index optimizations for high-performance tenant compliance lookups
CREATE INDEX IF NOT EXISTS idx_suspicious_activity_org ON suspicious_activity_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_suspicious_activity_user ON suspicious_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_suspicious_activity_type ON suspicious_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_suspicious_activity_date ON suspicious_activity_logs(detected_at);
