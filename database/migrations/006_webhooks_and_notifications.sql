-- Migration: 006_webhooks_and_notifications
-- Description: Configures secure webhooks, notifications, enterprise API keys, and essential platform status tables with full temporal-actor columns.

-- API Keys Table
CREATE TABLE IF NOT EXISTS api_keys (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    scopes TEXT, -- Serialized JSON scopes list
    last_used_at BIGINT,
    expires_at BIGINT,
    organization_id VARCHAR(255) DEFAULT 'org_default',
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- Webhooks Configuration Table
CREATE TABLE IF NOT EXISTS webhooks (
    id VARCHAR(255) PRIMARY KEY,
    url TEXT NOT NULL,
    secret VARCHAR(255),
    events TEXT, -- Serialized JSON list of events
    active INTEGER DEFAULT 1,
    organization_id VARCHAR(255) DEFAULT 'org_default',
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- Stripe webhook logs
CREATE TABLE IF NOT EXISTS stripe_webhook_logs (
    id VARCHAR(255) PRIMARY KEY,
    eventType VARCHAR(255),
    payload TEXT,
    status VARCHAR(100),
    timestamp VARCHAR(255),
    organization_id VARCHAR(255) DEFAULT 'org_default',
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- Usage events
CREATE TABLE IF NOT EXISTS usage_events (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255),
    event_type VARCHAR(255),
    metadata TEXT,
    timestamp BIGINT,
    organization_id VARCHAR(255) DEFAULT 'org_default',
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- Analytics events
CREATE TABLE IF NOT EXISTS analytics_events (
    id VARCHAR(255) PRIMARY KEY,
    category VARCHAR(255),
    action VARCHAR(255),
    value REAL,
    timestamp BIGINT,
    organization_id VARCHAR(255) DEFAULT 'org_default',
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- User stats table
CREATE TABLE IF NOT EXISTS user_stats (
    email VARCHAR(255) PRIMARY KEY,
    stats TEXT,
    organization_id VARCHAR(255) DEFAULT 'org_default',
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(255) PRIMARY KEY,
    recipient VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(100) DEFAULT 'unread',
    organization_id VARCHAR(255) DEFAULT 'org_default',
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- Supplementary campaign and agent telemetry tables (to support legacy modules fully)
CREATE TABLE IF NOT EXISTS members (
    user_id VARCHAR(255),
    organization_id VARCHAR(255) DEFAULT 'org_default',
    role VARCHAR(100) DEFAULT 'member',
    created_at BIGINT DEFAULT 0,
    PRIMARY KEY (user_id, organization_id)
);

CREATE TABLE IF NOT EXISTS agent_performance (
    id VARCHAR(255) PRIMARY KEY,
    agent_id VARCHAR(255) NOT NULL,
    success_rate REAL,
    accuracy_score REAL,
    cost_efficiency REAL,
    revenue_impact REAL,
    organization_id VARCHAR(255) DEFAULT 'org_default',
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS agent_metrics (
    id VARCHAR(255) PRIMARY KEY,
    agent_id VARCHAR(255) NOT NULL,
    execution_time INTEGER,
    tokens_consumed INTEGER,
    latency_ms INTEGER,
    success_flag INTEGER,
    organization_id VARCHAR(255) DEFAULT 'org_default',
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS agent_feedback (
    id VARCHAR(255) PRIMARY KEY,
    task_id VARCHAR(255) NOT NULL,
    score INTEGER,
    comments TEXT,
    timestamp BIGINT,
    organization_id VARCHAR(255) DEFAULT 'org_default',
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS agent_evaluations (
    id VARCHAR(255) PRIMARY KEY,
    run_id VARCHAR(255) NOT NULL,
    evaluator_agent_id VARCHAR(255),
    score REAL,
    reasoning TEXT,
    status VARCHAR(100),
    organization_id VARCHAR(255) DEFAULT 'org_default',
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS campaign_learning (
    id VARCHAR(255) PRIMARY KEY,
    campaign_id VARCHAR(255) NOT NULL,
    key_takeaways TEXT,
    optimized_prompt TEXT,
    success_indicators TEXT,
    timestamp BIGINT,
    organization_id VARCHAR(255) DEFAULT 'org_default',
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS campaign_results (
    id VARCHAR(255) PRIMARY KEY,
    campaign_id VARCHAR(255) NOT NULL,
    metric_name VARCHAR(255),
    current_value REAL,
    target_value REAL,
    margin REAL,
    timestamp BIGINT,
    organization_id VARCHAR(255) DEFAULT 'org_default',
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS optimization_history (
    id VARCHAR(255) PRIMARY KEY,
    campaign_id VARCHAR(255) NOT NULL,
    agent_id VARCHAR(255),
    phase_changed VARCHAR(255),
    previous_data TEXT,
    absolute_improvement REAL,
    timestamp BIGINT,
    organization_id VARCHAR(255) DEFAULT 'org_default',
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS business_brain (
    id VARCHAR(255) PRIMARY KEY,
    item_category VARCHAR(255),
    item_key VARCHAR(255),
    content TEXT,
    relevance REAL,
    accuracy REAL,
    freshness REAL,
    business_impact REAL,
    organization_id VARCHAR(255) DEFAULT 'org_default',
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- Index mappings
CREATE INDEX IF NOT EXISTS idx_api_keys_org ON api_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_org ON webhooks(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_org ON notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_api_keys_deleted ON api_keys(deleted_at);
CREATE INDEX IF NOT EXISTS idx_webhooks_deleted ON webhooks(deleted_at);
CREATE INDEX IF NOT EXISTS idx_notifications_deleted ON notifications(deleted_at);
