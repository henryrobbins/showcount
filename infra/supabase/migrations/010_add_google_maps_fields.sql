-- Migration: Add Google Maps fields to venues table
-- This allows venues to store Google Maps Place IDs and formatted addresses

ALTER TABLE venues 
  ADD COLUMN google_place_id TEXT,
  ADD COLUMN google_formatted_address TEXT;

-- Create index on google_place_id for lookups
CREATE INDEX idx_venues_google_place_id ON venues(google_place_id);

-- Keep OSM fields (osm_place_id, osm_display_name) for backward compatibility during transition
-- They remain nullable and can coexist with Google Maps fields
