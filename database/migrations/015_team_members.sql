-- Migration: 015_team_members
-- Description: Creates the schema for team collaborators with specific project permissions.

CREATE TABLE IF NOT EXISTS team_members (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(255) DEFAULT 'Viewer', -- 'Viewer' | 'Editor' | 'Admin'
    project_id VARCHAR(255),            -- Link to a specific project, or 'all' for organization-wide
    status VARCHAR(50) DEFAULT 'invited', -- 'invited' | 'active'
    organization_id VARCHAR(255) DEFAULT 'org_default',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0
);

-- Indexing for lookup performance
CREATE INDEX IF NOT EXISTS idx_team_members_org ON team_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);
CREATE INDEX IF NOT EXISTS idx_team_members_project ON team_members(project_id);
