-- Add venue_id column to shows table
ALTER TABLE shows ADD COLUMN IF NOT EXISTS venue_id UUID;

-- Add foreign key constraint to venues table
ALTER TABLE shows
ADD CONSTRAINT fk_shows_venue_id
FOREIGN KEY (venue_id)
REFERENCES venues(id)
ON DELETE SET NULL;

-- Create index on venue_id for faster joins
CREATE INDEX IF NOT EXISTS idx_shows_venue_id ON shows(venue_id);

-- Note: We're keeping the existing venue, city, state, country columns
-- for backward compatibility with existing shows
-- These will be NULL for new shows that use venue_id
-- A future migration can remove these columns once all data is migrated
