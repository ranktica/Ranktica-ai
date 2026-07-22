-- Migration: 002_auth_roles_permissions
-- Description: Establishes enterprise role-based access control (RBAC) schemas and security tables.

CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    permissions TEXT, -- Serialized JSON array of permission keys
    organization_id VARCHAR(255) DEFAULT 'org_default',
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS permissions (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    organization_id VARCHAR(255) DEFAULT 'org_default',
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- Indexing for multi-tenant isolation and security performance
CREATE INDEX IF NOT EXISTS idx_roles_organization ON roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_permissions_organization ON permissions(organization_id);
CREATE INDEX IF NOT EXISTS idx_roles_deleted ON roles(deleted_at);
CREATE INDEX IF NOT EXISTS idx_permissions_deleted ON permissions(deleted_at);
