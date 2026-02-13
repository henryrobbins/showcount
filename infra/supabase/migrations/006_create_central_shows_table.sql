-- Migration: Create central shows table and migrate existing shows data
-- This migration normalizes show data by creating a central shows table
-- Each show has a unique show_id based on date-artist-venue format
-- User shows reference central shows via show_ids array

-- Step 1: Create central_shows table
CREATE TABLE IF NOT EXISTS central_shows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    show_id TEXT UNIQUE NOT NULL,
    date DATE NOT NULL,
    artist TEXT NOT NULL,
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for central_shows
CREATE INDEX IF NOT EXISTS idx_central_shows_show_id ON central_shows(show_id);
CREATE INDEX IF NOT EXISTS idx_central_shows_date ON central_shows(date DESC);
CREATE INDEX IF NOT EXISTS idx_central_shows_artist ON central_shows(artist);
CREATE INDEX IF NOT EXISTS idx_central_shows_venue_id ON central_shows(venue_id);

-- Create unique constraint to prevent duplicates (same date, artist, venue)
CREATE UNIQUE INDEX IF NOT EXISTS idx_central_shows_unique ON central_shows(date, artist, venue_id);

-- Disable RLS for central_shows (authorization handled at application level)
ALTER TABLE central_shows DISABLE ROW LEVEL SECURITY;

-- Add trigger to automatically update updated_at for central_shows
DROP TRIGGER IF EXISTS update_central_shows_updated_at ON central_shows;
CREATE TRIGGER update_central_shows_updated_at
    BEFORE UPDATE ON central_shows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 2: Rename shows table to user_shows
ALTER TABLE shows RENAME TO user_shows;

-- Update trigger name after table rename
DROP TRIGGER IF EXISTS update_shows_updated_at ON user_shows;
CREATE TRIGGER update_user_shows_updated_at
    BEFORE UPDATE ON user_shows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 3: Add show_ids column to user_shows and make legacy columns nullable
ALTER TABLE user_shows ADD COLUMN IF NOT EXISTS show_ids UUID[] NOT NULL DEFAULT '{}';

-- Make legacy columns nullable (they're now optional since data lives in central_shows)
ALTER TABLE user_shows ALTER COLUMN date DROP NOT NULL;
ALTER TABLE user_shows ALTER COLUMN artists DROP NOT NULL;

-- Step 4: Create function to normalize artist names (for show_id generation)
CREATE OR REPLACE FUNCTION normalize_artist_name(artist_name TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Convert to lowercase, replace spaces/special chars with hyphens, remove consecutive hyphens
    RETURN regexp_replace(
        regexp_replace(
            lower(trim(artist_name)),
            '[^a-z0-9]+',
            '-',
            'g'
        ),
        '-+',
        '-',
        'g'
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 5: Migrate existing shows data to central_shows and update user_shows
DO $$
DECLARE
    user_show RECORD;
    artist_name TEXT;
    show_id_base TEXT;
    show_id_final TEXT;
    central_show_id UUID;
    show_ids_array UUID[];
    duplicate_count INTEGER;
BEGIN
    -- Process each user_show
    FOR user_show IN SELECT * FROM user_shows WHERE venue_id IS NOT NULL ORDER BY created_at
    LOOP
        show_ids_array := '{}';
        
        -- Process each artist in the artists array
        FOREACH artist_name IN ARRAY user_show.artists
        LOOP
            -- Generate base show_id
            show_id_base := user_show.date::TEXT || '-' || 
                           normalize_artist_name(artist_name) || '-' || 
                           user_show.venue_id::TEXT;
            
            -- Check if this show_id already exists (for deduplication)
            SELECT id INTO central_show_id
            FROM central_shows
            WHERE date = user_show.date
              AND artist = artist_name
              AND venue_id = user_show.venue_id;
            
            -- If not found, create new central show
            IF central_show_id IS NULL THEN
                -- Check for show_id collisions (same-day duplicates)
                SELECT COUNT(*) INTO duplicate_count
                FROM central_shows
                WHERE show_id LIKE show_id_base || '%';
                
                -- Append sequence number if duplicates exist
                IF duplicate_count > 0 THEN
                    show_id_final := show_id_base || '-' || duplicate_count::TEXT;
                ELSE
                    show_id_final := show_id_base;
                END IF;
                
                -- Insert into central_shows
                INSERT INTO central_shows (show_id, date, artist, venue_id, created_at, updated_at)
                VALUES (
                    show_id_final,
                    user_show.date,
                    artist_name,
                    user_show.venue_id,
                    user_show.created_at,
                    user_show.updated_at
                )
                RETURNING id INTO central_show_id;
                
                RAISE NOTICE 'Created central show: % (id: %)', show_id_final, central_show_id;
            ELSE
                RAISE NOTICE 'Reusing existing central show for: % (id: %)', artist_name, central_show_id;
            END IF;
            
            -- Add central_show_id to array
            show_ids_array := array_append(show_ids_array, central_show_id);
        END LOOP;
        
        -- Update user_shows with show_ids array
        UPDATE user_shows
        SET show_ids = show_ids_array
        WHERE id = user_show.id;
        
        RAISE NOTICE 'Updated user_show % with % show_ids', user_show.id, array_length(show_ids_array, 1);
    END LOOP;
    
    RAISE NOTICE 'Migration complete';
END $$;

-- Step 6: Verify data integrity
DO $$
DECLARE
    empty_show_ids_count INTEGER;
    orphan_show_ids_count INTEGER;
BEGIN
    -- Check for user_shows with empty show_ids
    SELECT COUNT(*) INTO empty_show_ids_count
    FROM user_shows
    WHERE array_length(show_ids, 1) IS NULL OR array_length(show_ids, 1) = 0;
    
    IF empty_show_ids_count > 0 THEN
        RAISE WARNING 'Found % user_shows with empty show_ids (likely missing venue_id)', empty_show_ids_count;
    END IF;
    
    -- Check for orphaned show_ids (references to non-existent central_shows)
    SELECT COUNT(*) INTO orphan_show_ids_count
    FROM (
        SELECT DISTINCT unnest(show_ids) AS show_id
        FROM user_shows
        WHERE show_ids IS NOT NULL
    ) AS expanded_ids
    WHERE show_id NOT IN (SELECT id FROM central_shows);
    
    IF orphan_show_ids_count > 0 THEN
        RAISE EXCEPTION 'Found % orphaned show_ids - migration integrity check failed', orphan_show_ids_count;
    END IF;
    
    RAISE NOTICE 'Data integrity check passed';
END $$;

-- Step 7: Add helpful comments
COMMENT ON TABLE central_shows IS 'Central repository of all shows. Each row represents one artist performing at one venue on one date.';
COMMENT ON COLUMN central_shows.show_id IS 'Unique slug identifier: {date}-{artist-slug}-{venue_id}';
COMMENT ON TABLE user_shows IS 'User show attendance records. References central_shows via show_ids array.';
COMMENT ON COLUMN user_shows.show_ids IS 'Array of central_shows.id references. Multiple IDs indicate multi-artist show.';

-- Note: Legacy columns (artists, venue, city, state, country) are kept for backward compatibility
-- They can be removed in a future migration once all application code is updated
