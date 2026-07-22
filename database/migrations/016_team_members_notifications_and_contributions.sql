-- Migration: 016_team_members_notifications_and_contributions
-- Description: Creates schemas for granular notification toggles and historical task contributions/activities.

CREATE TABLE IF NOT EXISTS team_member_notification_settings (
    member_id VARCHAR(255) PRIMARY KEY,
    email_assignments INTEGER DEFAULT 1,     -- 1 for enabled, 0 for disabled
    email_status_changes INTEGER DEFAULT 1,  -- 1 for enabled, 0 for disabled
    inapp_assignments INTEGER DEFAULT 1,     -- 1 for enabled, 0 for disabled
    inapp_status_changes INTEGER DEFAULT 1,  -- 1 for enabled, 0 for disabled
    updated_at BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS team_member_activities (
    id VARCHAR(255) PRIMARY KEY,
    member_id VARCHAR(255) NOT NULL,
    activity_type VARCHAR(100) NOT NULL,    -- 'task_completed', 'project_assigned', 'status_changed', 'comment_added', 'campaign_created'
    project_id VARCHAR(255) DEFAULT 'all',
    contribution_score INTEGER DEFAULT 1,   -- arbitrary weight of activity (e.g., 1 to 5)
    timestamp BIGINT DEFAULT 0
);

-- Indexing for quick lookups over last 30 days
CREATE INDEX IF NOT EXISTS idx_tm_activities_member ON team_member_activities(member_id);
CREATE INDEX IF NOT EXISTS idx_tm_activities_time ON team_member_activities(timestamp);
