-- Migration: 003_saas_teams_projects
-- Description: Creates enterprise schemas for teams, workspaces, projects, campaigns, and their assets.

-- Teams Table
CREATE TABLE IF NOT EXISTS teams (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    organization_id VARCHAR(255) DEFAULT 'org_default',
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    niche VARCHAR(255),
    audience VARCHAR(255),
    status VARCHAR(100),
    lastUpdated BIGINT,
    assets TEXT, -- JSON representation of CDN & reference URLs
    team TEXT, -- CSV/JSON representation of team participants
    archived INTEGER DEFAULT 0,
    organization_id VARCHAR(255) DEFAULT 'org_default',
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- Campaigns Table
CREATE TABLE IF NOT EXISTS campaigns (
    id VARCHAR(255) PRIMARY KEY,
    project_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(100),
    memory TEXT, -- Embedded campaign history context
    organization_id VARCHAR(255) DEFAULT 'org_default',
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- Storage Assets Table
CREATE TABLE IF NOT EXISTS storage_assets (
    id VARCHAR(255) PRIMARY KEY,
    project_id VARCHAR(255),
    name VARCHAR(255),
    category VARCHAR(255),
    file_size BIGINT,
    mime_type VARCHAR(100),
    storage_url TEXT,
    organization_id VARCHAR(255) DEFAULT 'org_default',
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- Storage Configs Table
CREATE TABLE IF NOT EXISTS storage_configs (
    id VARCHAR(255) PRIMARY KEY,
    provider VARCHAR(100),
    endpoint TEXT,
    region VARCHAR(100),
    bucket VARCHAR(255),
    access_key_id TEXT,
    secret_access_key TEXT,
    public_url TEXT,
    organization_id VARCHAR(255) DEFAULT 'org_default',
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- Indexing for multi-tenant isolation and foreign key lookups
CREATE INDEX IF NOT EXISTS idx_teams_organization ON teams(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_organization ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_deleted ON projects(deleted_at);
CREATE INDEX IF NOT EXISTS idx_campaigns_organization ON campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_project ON campaigns(project_id);
CREATE INDEX IF NOT EXISTS idx_storage_assets_organization ON storage_assets(organization_id);
CREATE INDEX IF NOT EXISTS idx_storage_assets_project ON storage_assets(project_id);
CREATE INDEX IF NOT EXISTS idx_storage_configs_organization ON storage_configs(organization_id);
