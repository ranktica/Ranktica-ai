-- Migration: 008_prompt_firewall
-- Description: Creates logs for Prompt Firewall 2.0 scanning, categorization and audit actions.

CREATE TABLE IF NOT EXISTS prompt_firewall_logs (
    id VARCHAR(255) PRIMARY KEY,
    prompt_text TEXT NOT NULL,
    risk_score INTEGER NOT NULL,
    risk_classification VARCHAR(255) NOT NULL,
    action_taken VARCHAR(50) NOT NULL,
    matched_heuristics TEXT,
    user_id VARCHAR(255) NOT NULL,
    organization_id VARCHAR(255) NOT NULL,
    agent VARCHAR(255) NOT NULL,
    scanned_at BIGINT NOT NULL
);
