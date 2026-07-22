-- Migration: 007_ai_cost_governance
-- Description: Sets up token tracking and budget control definitions.

-- AI Token Logs Table
CREATE TABLE IF NOT EXISTS ai_token_logs (
    id VARCHAR(255) PRIMARY KEY,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    model VARCHAR(255) NOT NULL,
    agent VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    organization_id VARCHAR(255) NOT NULL,
    cost REAL DEFAULT 0.0,
    created_at BIGINT NOT NULL,
    project_id VARCHAR(255) DEFAULT "default_project"
);

-- AI Budget & Limit Configurations Table
CREATE TABLE IF NOT EXISTS ai_budgets (
    organization_id VARCHAR(255) PRIMARY KEY,
    organization_budget REAL NOT NULL DEFAULT 500.00,
    project_budget REAL NOT NULL DEFAULT 200.00,
    agent_budget REAL NOT NULL DEFAULT 100.00,
    daily_limit REAL NOT NULL DEFAULT 50.00,
    monthly_limit REAL NOT NULL DEFAULT 500.00,
    created_at BIGINT,
    updated_at BIGINT
);

-- Seed defaults for default organization
INSERT OR IGNORE INTO ai_budgets (organization_id, organization_budget, project_budget, agent_budget, daily_limit, monthly_limit, created_at, updated_at)
VALUES ('org_default', 500.00, 200.00, 100.00, 50.00, 500.00, 1770000000000, 1770000000000);
