-- Migration: Add rating column to user_shows
-- This allows users to rate their shows

ALTER TABLE user_shows ADD COLUMN rating TEXT;
