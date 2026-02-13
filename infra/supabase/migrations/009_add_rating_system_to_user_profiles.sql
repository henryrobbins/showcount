-- Migration: Add rating system configuration to user_profiles
-- This allows users to configure custom rating schemes

ALTER TABLE user_profiles 
  ADD COLUMN ratings_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN rating_system_type TEXT CHECK (rating_system_type IN ('ordered_list', 'numeric_range', 'numeric_unbounded')),
  ADD COLUMN rating_system_config JSONB;
