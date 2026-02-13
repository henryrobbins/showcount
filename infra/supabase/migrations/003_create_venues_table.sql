-- Create venues table
CREATE TABLE IF NOT EXISTS venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    city TEXT,
    country TEXT NOT NULL,
    latitude NUMERIC,
    longitude NUMERIC,
    osm_place_id TEXT,
    osm_display_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on (name, city, country) for fast lookups when matching venues
CREATE INDEX IF NOT EXISTS idx_venues_lookup ON venues(name, city, country);

-- Create index on osm_place_id for deduplication
CREATE INDEX IF NOT EXISTS idx_venues_osm_place_id ON venues(osm_place_id);

-- Note: RLS is disabled for this table
-- Authorization is handled at the application level in the API routes
ALTER TABLE venues DISABLE ROW LEVEL SECURITY;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_venues_updated_at ON venues;
CREATE TRIGGER update_venues_updated_at
    BEFORE UPDATE ON venues
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
