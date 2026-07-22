-- Migration: 020_batch_processing_queue
-- Description: Sets up the enterprise schema for the off-peak cost-optimized batch API processing queue.

CREATE TABLE IF NOT EXISTS batch_queue (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    service VARCHAR(100) NOT NULL, -- 'Gemini' or 'Veo'
    model VARCHAR(255) NOT NULL, -- e.g. 'gemini-3.5-flash' or 'veo-3.1-lite-generate-preview'
    payload TEXT NOT NULL, -- JSON payload containing prompts/inputs
    scheduled_time BIGINT NOT NULL, -- timestamp when it's scheduled to run
    status VARCHAR(100) DEFAULT 'Pending', -- 'Pending', 'Processing', 'Completed', 'Failed'
    result TEXT, -- JSON response or error message
    cost_optimized BOOLEAN DEFAULT TRUE,
    organization_id VARCHAR(255) DEFAULT 'org_default',
    created_at BIGINT DEFAULT 0,
    updated_at BIGINT DEFAULT 0,
    completed_at BIGINT DEFAULT 0
);
