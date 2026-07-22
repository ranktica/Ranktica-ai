-- Migration: 018_team_capacity_extensions
-- Description: Adds a skills_matrix column to team_member_capacities to store task type proficiencies (1-5 scale) for refined auto-rebalancing.

ALTER TABLE team_member_capacities ADD COLUMN skills_matrix TEXT DEFAULT '{}';
