-- Migration: 011_prompt_management_platform
-- Description: Sets up enterprise schema for Prompt Registry, Version Control, Evaluations, and Security.

CREATE TABLE IF NOT EXISTS prompt_registry (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    agent VARCHAR(255) NOT NULL,
    version VARCHAR(100) NOT NULL,
    system_instruction TEXT NOT NULL,
    tools TEXT, -- Serialized JSON array of tools
    model VARCHAR(100) NOT NULL,
    temperature REAL DEFAULT 0.7,
    token_limit INTEGER DEFAULT 4096,
    evaluation_score REAL DEFAULT 0.0,
    is_active INTEGER DEFAULT 1, -- 1 for active, 0 for inactive
    ab_test_ratio REAL DEFAULT 0.0, -- for A/B testing (0.0 to 1.0)
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS prompt_version_history (
    id VARCHAR(255) PRIMARY KEY,
    prompt_id VARCHAR(255) NOT NULL,
    version VARCHAR(100) NOT NULL,
    system_instruction TEXT NOT NULL,
    tools TEXT,
    model VARCHAR(100) NOT NULL,
    temperature REAL DEFAULT 0.7,
    token_limit INTEGER DEFAULT 4096,
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS prompt_evaluations (
    id VARCHAR(255) PRIMARY KEY,
    prompt_id VARCHAR(255) NOT NULL,
    version VARCHAR(100) NOT NULL,
    accuracy REAL DEFAULT 0.0,
    quality REAL DEFAULT 0.0,
    cost REAL DEFAULT 0.0,
    user_satisfaction REAL DEFAULT 0.0,
    sample_count INTEGER DEFAULT 0,
    evaluated_at BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS prompt_security_violations (
    id VARCHAR(255) PRIMARY KEY,
    prompt_id VARCHAR(255),
    prompt_text TEXT NOT NULL,
    detection_type VARCHAR(100) NOT NULL, -- 'injection', 'unsafe_instruction', 'conflict'
    risk_score REAL NOT NULL,
    details TEXT,
    organization_id VARCHAR(255) DEFAULT 'org_default',
    user_id VARCHAR(255) DEFAULT 'system',
    detected_at BIGINT DEFAULT 0
);

-- Index optimization for prompt retrieval and version history lookup
CREATE INDEX IF NOT EXISTS idx_prompt_registry_agent ON prompt_registry(agent);
CREATE INDEX IF NOT EXISTS idx_prompt_version_prompt ON prompt_version_history(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_evaluations_prompt ON prompt_evaluations(prompt_id);
