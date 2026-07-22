-- Migration: 019_team_weekly_reports_and_leave
-- Description: Adds tables for tracking leave & availability calendar, and history of weekly capacity reports.

CREATE TABLE IF NOT EXISTS team_member_leaves (
    id VARCHAR(255) PRIMARY KEY,
    member_id VARCHAR(255) NOT NULL,
    start_date TEXT NOT NULL, -- YYYY-MM-DD
    end_date TEXT NOT NULL, -- YYYY-MM-DD
    reason TEXT,
    status TEXT DEFAULT 'Approved', -- 'Approved' | 'Pending'
    created_at BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS weekly_capacity_reports (
    id VARCHAR(255) PRIMARY KEY,
    organization_id VARCHAR(255) DEFAULT 'org_default',
    week_start TEXT NOT NULL, -- YYYY-MM-DD
    summary TEXT,
    report_details TEXT, -- JSON representation
    created_at BIGINT DEFAULT 0
);
