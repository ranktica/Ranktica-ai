-- Migration: 012_production_postgresql_upgrade
-- Description: Upgrades database schema to enterprise production PostgreSQL specifications.
-- Establishes fully constrained multi-tenant relational tables, indexes, foreign keys, and audit logging triggers.

-- ============================================================================
-- 1. ENSURE DEFAULT TENANT STRUCTURE
-- ============================================================================
CREATE TABLE IF NOT EXISTS organizations (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    organization_id VARCHAR(255) DEFAULT 'org_default',
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- Seed default tenant to guarantee referential integrity
INSERT INTO organizations (id, name, domain, organization_id, created_by, created_at, updated_at)
VALUES ('org_default', 'Default SaaS Organization', 'ranktica.ai', 'org_default', 'system', 0, 0)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. PRODUCTION SCHEMA DEFINITIONS
-- ============================================================================

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    role VARCHAR(255) DEFAULT 'member',
    organization_id VARCHAR(255) DEFAULT 'org_default' REFERENCES organizations(id) ON DELETE SET DEFAULT,
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    organization_id VARCHAR(255) DEFAULT 'org_default' REFERENCES organizations(id) ON DELETE CASCADE,
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- Permissions Table
CREATE TABLE IF NOT EXISTS permissions (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    organization_id VARCHAR(255) DEFAULT 'org_default' REFERENCES organizations(id) ON DELETE CASCADE,
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- Teams Table
CREATE TABLE IF NOT EXISTS teams (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    organization_id VARCHAR(255) DEFAULT 'org_default' REFERENCES organizations(id) ON DELETE CASCADE,
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    organization_id VARCHAR(255) DEFAULT 'org_default' REFERENCES organizations(id) ON DELETE CASCADE,
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- Campaigns Table
CREATE TABLE IF NOT EXISTS campaigns (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    project_id VARCHAR(255) REFERENCES projects(id) ON DELETE CASCADE,
    status VARCHAR(100) DEFAULT 'draft',
    organization_id VARCHAR(255) DEFAULT 'org_default' REFERENCES organizations(id) ON DELETE CASCADE,
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- Agents Table
CREATE TABLE IF NOT EXISTS agents (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    status VARCHAR(100) DEFAULT 'idle',
    organization_id VARCHAR(255) DEFAULT 'org_default' REFERENCES organizations(id) ON DELETE CASCADE,
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- Agent Tasks Table
CREATE TABLE IF NOT EXISTS agent_tasks (
    id VARCHAR(255) PRIMARY KEY,
    agent_id VARCHAR(255) NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(100) DEFAULT 'pending',
    payload TEXT,
    organization_id VARCHAR(255) DEFAULT 'org_default' REFERENCES organizations(id) ON DELETE CASCADE,
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- Agent Runs Table
CREATE TABLE IF NOT EXISTS agent_runs (
    id VARCHAR(255) PRIMARY KEY,
    agent_id VARCHAR(255) NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    status VARCHAR(100) NOT NULL,
    duration INTEGER DEFAULT 0,
    metrics TEXT,
    organization_id VARCHAR(255) DEFAULT 'org_default' REFERENCES organizations(id) ON DELETE CASCADE,
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- Agent Memory Table
CREATE TABLE IF NOT EXISTS agent_memory (
    id VARCHAR(255) PRIMARY KEY,
    agent_id VARCHAR(255) NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    memory_key VARCHAR(255) NOT NULL,
    memory_value TEXT,
    organization_id VARCHAR(255) DEFAULT 'org_default' REFERENCES organizations(id) ON DELETE CASCADE,
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- Knowledge Nodes Table (RAG Engine)
CREATE TABLE IF NOT EXISTS knowledge_nodes (
    id VARCHAR(255) PRIMARY KEY,
    label VARCHAR(255) NOT NULL,
    type VARCHAR(100) DEFAULT 'generic',
    properties TEXT,
    organization_id VARCHAR(255) DEFAULT 'org_default' REFERENCES organizations(id) ON DELETE CASCADE,
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- Knowledge Edges Table
CREATE TABLE IF NOT EXISTS knowledge_edges (
    id VARCHAR(255) PRIMARY KEY,
    source_id VARCHAR(255) NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    target_id VARCHAR(255) NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    relation VARCHAR(100) NOT NULL,
    organization_id VARCHAR(255) DEFAULT 'org_default' REFERENCES organizations(id) ON DELETE CASCADE,
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- Prompts Table
CREATE TABLE IF NOT EXISTS prompts (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    agent VARCHAR(255) NOT NULL,
    system_instruction TEXT NOT NULL,
    organization_id VARCHAR(255) DEFAULT 'org_default' REFERENCES organizations(id) ON DELETE CASCADE,
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- Prompt Versions Table
CREATE TABLE IF NOT EXISTS prompt_versions (
    id VARCHAR(255) PRIMARY KEY,
    prompt_id VARCHAR(255) NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    version VARCHAR(100) NOT NULL,
    system_instruction TEXT NOT NULL,
    organization_id VARCHAR(255) DEFAULT 'org_default' REFERENCES organizations(id) ON DELETE CASCADE,
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- AI Usage Table
CREATE TABLE IF NOT EXISTS ai_usage (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    plan VARCHAR(100),
    credits_consumed INTEGER DEFAULT 0,
    organization_id VARCHAR(255) DEFAULT 'org_default' REFERENCES organizations(id) ON DELETE CASCADE,
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- AI Cost Tracking Table
CREATE TABLE IF NOT EXISTS ai_cost_tracking (
    id VARCHAR(255) PRIMARY KEY,
    model_name VARCHAR(255) NOT NULL,
    tokens_consumed INTEGER DEFAULT 0,
    estimated_cost REAL DEFAULT 0.0,
    organization_id VARCHAR(255) DEFAULT 'org_default' REFERENCES organizations(id) ON DELETE CASCADE,
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
    id VARCHAR(255) PRIMARY KEY,
    planName VARCHAR(255) NOT NULL,
    price VARCHAR(255),
    status VARCHAR(100),
    paymentMethod VARCHAR(255),
    nextBillingDate VARCHAR(255),
    autoRenew INTEGER DEFAULT 1,
    organization_id VARCHAR(255) DEFAULT 'org_default' REFERENCES organizations(id) ON DELETE CASCADE,
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(255) PRIMARY KEY,
    customerName VARCHAR(255),
    amount VARCHAR(255),
    paymentMethod VARCHAR(225),
    status VARCHAR(100),
    timestamp VARCHAR(255),
    organization_id VARCHAR(255) DEFAULT 'org_default' REFERENCES organizations(id) ON DELETE CASCADE,
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    ip_address VARCHAR(150),
    organization_id VARCHAR(255) DEFAULT 'org_default' REFERENCES organizations(id) ON DELETE CASCADE,
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- ============================================================================
-- 3. ENTERPRISE OPTIMIZATION INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_teams_org ON teams(organization_id);
CREATE INDEX IF NOT EXISTS idx_roles_org ON roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_permissions_org ON permissions(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_org ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_org ON campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_project ON campaigns(project_id);
CREATE INDEX IF NOT EXISTS idx_agents_org ON agents(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_agent ON agent_tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_agent ON agent_runs(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_memory_agent ON agent_memory(agent_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_org ON knowledge_nodes(organization_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_edges_org ON knowledge_edges(organization_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_edges_source ON knowledge_edges(source_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_edges_target ON knowledge_edges(target_id);
CREATE INDEX IF NOT EXISTS idx_prompts_org ON prompts(organization_id);
CREATE INDEX IF NOT EXISTS idx_prompt_versions_prompt ON prompt_versions(prompt_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_org ON ai_usage(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON ai_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_cost_tracking_org ON ai_cost_tracking(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_org ON payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);

-- ============================================================================
-- 4. DATABASE AUTOMATION & AUDIT TRIGGERS (PostgreSQL-Specific)
-- ============================================================================

-- Function to automatically update the 'updated_at' millisecond timestamp column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CAST(EXTRACT(EPOCH FROM clock_timestamp()) * 1000 AS BIGINT);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger configurations for 'updated_at' auto-update
DROP TRIGGER IF EXISTS trg_organizations_updated_at ON organizations;
CREATE TRIGGER trg_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_teams_updated_at ON teams;
CREATE TRIGGER trg_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_projects_updated_at ON projects;
CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_campaigns_updated_at ON campaigns;
CREATE TRIGGER trg_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_agents_updated_at ON agents;
CREATE TRIGGER trg_agents_updated_at BEFORE UPDATE ON agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_agent_tasks_updated_at ON agent_tasks;
CREATE TRIGGER trg_agent_tasks_updated_at BEFORE UPDATE ON agent_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_agent_runs_updated_at ON agent_runs;
CREATE TRIGGER trg_agent_runs_updated_at BEFORE UPDATE ON agent_runs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_agent_memory_updated_at ON agent_memory;
CREATE TRIGGER trg_agent_memory_updated_at BEFORE UPDATE ON agent_memory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_prompts_updated_at ON prompts;
CREATE TRIGGER trg_prompts_updated_at BEFORE UPDATE ON prompts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER trg_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Centralized Production Audit Logging Trigger Function
CREATE OR REPLACE FUNCTION audit_log_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id VARCHAR(255) := 'system';
    v_action TEXT;
    v_org_id VARCHAR(255) := 'org_default';
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_action := 'INSERT ON ' || TG_TABLE_NAME || ' WITH ID ' || COALESCE(NEW.id, 'unknown');
        IF NEW.created_by IS NOT NULL THEN
            v_user_id := NEW.created_by;
        END IF;
        IF NEW.organization_id IS NOT NULL THEN
            v_org_id := NEW.organization_id;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'UPDATE ON ' || TG_TABLE_NAME || ' WITH ID ' || COALESCE(NEW.id, 'unknown');
        IF NEW.created_by IS NOT NULL THEN
            v_user_id := NEW.created_by;
        END IF;
        IF NEW.organization_id IS NOT NULL THEN
            v_org_id := NEW.organization_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'DELETE ON ' || TG_TABLE_NAME || ' WITH ID ' || COALESCE(OLD.id, 'unknown');
        IF OLD.created_by IS NOT NULL THEN
            v_user_id := OLD.created_by;
        END IF;
        IF OLD.organization_id IS NOT NULL THEN
            v_org_id := OLD.organization_id;
        END IF;
    END IF;

    -- Safeguard block to prevent recursive trigger invocations on the audit_logs table itself
    IF TG_TABLE_NAME <> 'audit_logs' THEN
        INSERT INTO audit_logs (
            id, 
            user_id, 
            action, 
            ip_address, 
            organization_id, 
            created_by, 
            created_at, 
            updated_at
        ) VALUES (
            'audit_' || CAST(EXTRACT(EPOCH FROM clock_timestamp()) * 1000 AS BIGINT) || '_' || substring(md5(random()::text) from 1 for 6),
            v_user_id,
            v_action,
            '127.0.0.1',
            v_org_id,
            'system_trigger',
            CAST(EXTRACT(EPOCH FROM clock_timestamp()) * 1000 AS BIGINT),
            CAST(EXTRACT(EPOCH FROM clock_timestamp()) * 1000 AS BIGINT)
        );
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;


-- Attach Audit Log Triggers to Core SaaS Tables
DROP TRIGGER IF EXISTS trg_audit_users ON users;
CREATE TRIGGER trg_audit_users AFTER INSERT OR UPDATE OR DELETE ON users FOR EACH ROW EXECUTE FUNCTION audit_log_trigger_func();

DROP TRIGGER IF EXISTS trg_audit_teams ON teams;
CREATE TRIGGER trg_audit_teams AFTER INSERT OR UPDATE OR DELETE ON teams FOR EACH ROW EXECUTE FUNCTION audit_log_trigger_func();

DROP TRIGGER IF EXISTS trg_audit_projects ON projects;
CREATE TRIGGER trg_audit_projects AFTER INSERT OR UPDATE OR DELETE ON projects FOR EACH ROW EXECUTE FUNCTION audit_log_trigger_func();

DROP TRIGGER IF EXISTS trg_audit_campaigns ON campaigns;
CREATE TRIGGER trg_audit_campaigns AFTER INSERT OR UPDATE OR DELETE ON campaigns FOR EACH ROW EXECUTE FUNCTION audit_log_trigger_func();

DROP TRIGGER IF EXISTS trg_audit_agents ON agents;
CREATE TRIGGER trg_audit_agents AFTER INSERT OR UPDATE OR DELETE ON agents FOR EACH ROW EXECUTE FUNCTION audit_log_trigger_func();

DROP TRIGGER IF EXISTS trg_audit_prompts ON prompts;
CREATE TRIGGER trg_audit_prompts AFTER INSERT OR UPDATE OR DELETE ON prompts FOR EACH ROW EXECUTE FUNCTION audit_log_trigger_func();

DROP TRIGGER IF EXISTS trg_audit_subscriptions ON subscriptions;
CREATE TRIGGER trg_audit_subscriptions AFTER INSERT OR UPDATE OR DELETE ON subscriptions FOR EACH ROW EXECUTE FUNCTION audit_log_trigger_func();
