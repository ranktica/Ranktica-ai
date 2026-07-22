-- Migration: 014_search_agent_network
-- Description: Sets up enterprise schema for Ranktica AI Autonomous Search Agent Network, agents configuration, workflows, execution phases, and audit telemetry.

-- Search Agents Configurations
CREATE TABLE IF NOT EXISTS search_agents (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    purpose TEXT NOT NULL,
    tools TEXT NOT NULL, -- JSON serialized string array
    memory TEXT, -- JSON serialized string array or custom schema
    tasks TEXT, -- JSON serialized string array of default responsibilities
    metrics TEXT, -- JSON serialized performance indicators
    status VARCHAR(100) DEFAULT 'idle',
    organization_id VARCHAR(255) DEFAULT 'org_default',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- Search Agent Network Workflow Runs
CREATE TABLE IF NOT EXISTS search_agent_runs (
    id VARCHAR(255) PRIMARY KEY,
    url VARCHAR(512) NOT NULL,
    niche VARCHAR(255) NOT NULL,
    audience VARCHAR(255) DEFAULT 'General',
    status VARCHAR(100) DEFAULT 'Pending', -- 'Pending', 'In Progress', 'Completed', 'Failed'
    current_phase VARCHAR(100) DEFAULT 'Website Analysis', -- 'Website Analysis' -> 'SEO Diagnosis' -> 'Strategy Generation' -> 'Content Creation' -> 'Optimization' -> 'Measurement' -> 'Learning'
    
    -- High-fidelity JSON output telemetry reports for each phase of the Search Agent Network
    website_analysis_results TEXT,
    seo_diagnosis_results TEXT,
    strategy_generation_results TEXT,
    content_creation_results TEXT,
    optimization_results TEXT,
    measurement_results TEXT,
    learning_results TEXT,
    
    organization_id VARCHAR(255) DEFAULT 'org_default',
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- Indexing for multi-tenant isolation and fast searches
CREATE INDEX IF NOT EXISTS idx_search_agents_org ON search_agents(organization_id);
CREATE INDEX IF NOT EXISTS idx_search_agent_runs_org ON search_agent_runs(organization_id);
CREATE INDEX IF NOT EXISTS idx_search_agent_runs_status ON search_agent_runs(status);
