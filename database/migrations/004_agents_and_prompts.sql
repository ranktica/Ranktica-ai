-- Migration: 004_agents_and_prompts
-- Description: Sets up enterprise schema for AI orchestrators, agents, memories, graph configurations, prompt templates, and runs.

-- Agents Matrix
CREATE TABLE IF NOT EXISTS agents (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(225),
    status VARCHAR(100),
    performance_score REAL,
    organization_id VARCHAR(255) DEFAULT 'org_default',
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- Agent Tasks Table
CREATE TABLE IF NOT EXISTS agent_tasks (
    id VARCHAR(255) PRIMARY KEY,
    agent_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    priority VARCHAR(100),
    status VARCHAR(100),
    organization_id VARCHAR(255) DEFAULT 'org_default',
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- Agent Runs Table
CREATE TABLE IF NOT EXISTS agent_runs (
    id VARCHAR(255) PRIMARY KEY,
    campaign_id VARCHAR(255),
    agent_id VARCHAR(255),
    status VARCHAR(100),
    metrics TEXT, -- Serialized JSON stats
    organization_id VARCHAR(255) DEFAULT 'org_default',
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- Agent Memory Table
CREATE TABLE IF NOT EXISTS agent_memory (
    id VARCHAR(255) PRIMARY KEY,
    agent_id VARCHAR(255),
    context TEXT,
    embedding TEXT, -- Vector or high-fidelity token representation
    organization_id VARCHAR(255) DEFAULT 'org_default',
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- Knowledge Nodes Table (Brain nodes / LSI clusters)
CREATE TABLE IF NOT EXISTS knowledge_nodes (
    id VARCHAR(255) PRIMARY KEY,
    label VARCHAR(255),
    category VARCHAR(255),
    properties TEXT, -- JSON configurations key-value
    organization_id VARCHAR(255) DEFAULT 'org_default',
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- Knowledge Graph Edges Table (Relations mapping schemas)
CREATE TABLE IF NOT EXISTS knowledge_edges (
    id VARCHAR(255) PRIMARY KEY,
    source_id VARCHAR(255) NOT NULL,
    target_id VARCHAR(255) NOT NULL,
    relation VARCHAR(255),
    weight REAL,
    organization_id VARCHAR(255) DEFAULT 'org_default',
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- Prompt Templates Table (prompts)
CREATE TABLE IF NOT EXISTS prompts (
    id VARCHAR(255) PRIMARY KEY,
    agent_name VARCHAR(255) NOT NULL,
    version VARCHAR(100),
    template TEXT,
    performance_score REAL,
    organization_id VARCHAR(255) DEFAULT 'org_default',
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- Prompt Versions Table
CREATE TABLE IF NOT EXISTS prompt_versions (
    id VARCHAR(255) PRIMARY KEY,
    prompt_id VARCHAR(255) NOT NULL,
    version VARCHAR(100),
    template TEXT,
    organization_id VARCHAR(255) DEFAULT 'org_default',
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- Indexes for AI workloads and security bounds
CREATE INDEX IF NOT EXISTS idx_agents_organization ON agents(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_agent ON agent_tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_organization ON agent_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_campaign ON agent_runs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_organization ON agent_runs(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_memory_agent ON agent_memory(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_memory_organization ON agent_memory(organization_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_org ON knowledge_nodes(organization_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_edges_org ON knowledge_edges(organization_id);
CREATE INDEX IF NOT EXISTS idx_prompts_org ON prompts(organization_id);
CREATE INDEX IF NOT EXISTS idx_prompt_versions_prompt ON prompt_versions(prompt_id);
CREATE INDEX IF NOT EXISTS idx_agents_deleted ON agents(deleted_at);
CREATE INDEX IF NOT EXISTS idx_prompts_deleted ON prompts(deleted_at);
