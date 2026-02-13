-- Add state column to venues table
ALTER TABLE venues ADD COLUMN state TEXT;

-- Update the lookup index to include state for better matching
DROP INDEX IF EXISTS idx_venues_lookup;
CREATE INDEX idx_venues_lookup ON venues(name, city, state, country);
