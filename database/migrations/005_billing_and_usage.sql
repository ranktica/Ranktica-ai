-- Migration: 005_billing_and_usage
-- Description: Establishes enterprise SaaS usage logging, cost calculations, financial audits, subscriptions, invoices, and billing matrices.

-- Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
    id VARCHAR(255) PRIMARY KEY,
    planName VARCHAR(255) NOT NULL,
    price VARCHAR(255),
    status VARCHAR(100),
    paymentMethod VARCHAR(255),
    nextBillingDate VARCHAR(255),
    autoRenew INTEGER DEFAULT 1,
    is_seed_data INTEGER DEFAULT 0,
    organization_id VARCHAR(255) DEFAULT 'org_default',
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(255) PRIMARY KEY,
    invoiceNumber VARCHAR(255) NOT NULL,
    customerName VARCHAR(255),
    amount VARCHAR(255),
    dueDate VARCHAR(255),
    status VARCHAR(100),
    issuedDate VARCHAR(255),
    is_seed_data INTEGER DEFAULT 0,
    organization_id VARCHAR(255) DEFAULT 'org_default',
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
    is_seed_data INTEGER DEFAULT 0,
    organization_id VARCHAR(255) DEFAULT 'org_default',
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    subscriptionStatus VARCHAR(100),
    totalSpent REAL DEFAULT 0.0,
    lastActive VARCHAR(255),
    planType VARCHAR(100),
    is_seed_data INTEGER DEFAULT 0,
    organization_id VARCHAR(255) DEFAULT 'org_default',
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- User Usage table (mapped to alias 'ai_usage')
CREATE TABLE IF NOT EXISTS user_usage (
    user_id VARCHAR(255) PRIMARY KEY,
    plan VARCHAR(100) DEFAULT 'free',
    ai_credits_used INTEGER DEFAULT 0,
    ai_credits_limit INTEGER DEFAULT 10,
    billing_cycle_start BIGINT,
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    organization_id VARCHAR(255) DEFAULT 'org_default',
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- AI Usage Table alias representing business requirement
CREATE TABLE IF NOT EXISTS ai_usage (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255),
    plan VARCHAR(100),
    credits_consumed INTEGER,
    organization_id VARCHAR(255) DEFAULT 'org_default',
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
    organization_id VARCHAR(255) DEFAULT 'org_default',
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255),
    action TEXT NOT NULL,
    ip_address VARCHAR(150),
    organization_id VARCHAR(255) DEFAULT 'org_default',
    created_by VARCHAR(255) DEFAULT 'system',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    deleted_at BIGINT DEFAULT 0
);

-- Indexes for lightning fast SaaS billing checks
CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_org ON payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_customers_org ON customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_user_usage_org ON user_usage(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_org ON ai_usage(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_cost_tracking_org ON ai_cost_tracking(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_deleted ON subscriptions(deleted_at);
CREATE INDEX IF NOT EXISTS idx_invoices_deleted ON invoices(deleted_at);
CREATE INDEX IF NOT EXISTS idx_payments_deleted ON payments(deleted_at);
CREATE INDEX IF NOT EXISTS idx_customers_deleted ON customers(deleted_at);
