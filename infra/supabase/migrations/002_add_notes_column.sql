-- Add notes column to shows table
ALTER TABLE shows
ADD COLUMN notes TEXT;

-- Add comment to document the column
COMMENT ON COLUMN shows.notes IS 'Optional notes about the show, up to 4096 characters';
