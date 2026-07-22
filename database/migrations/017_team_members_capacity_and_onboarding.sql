-- Migration: 017_team_members_capacity_and_onboarding
-- Description: Schema additions for capacity planner, Active/On Leave status, skills, and onboarding checklists.

CREATE TABLE IF NOT EXISTS team_member_capacities (
    member_id VARCHAR(255) PRIMARY KEY,
    weekly_capacity INTEGER DEFAULT 40,
    current_load INTEGER DEFAULT 0,
    work_status VARCHAR(50) DEFAULT 'Active', -- 'Active' | 'On Leave'
    skills VARCHAR(500) DEFAULT 'AI Optimization, Scriptwriting, Content Creation, Analytics',
    onboarding_checklist TEXT DEFAULT '[]', -- JSON representation of the custom onboarding steps
    updated_at BIGINT DEFAULT 0
);
