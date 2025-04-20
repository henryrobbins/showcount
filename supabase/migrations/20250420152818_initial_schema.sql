-- Enable UUID extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Venues table
CREATE TABLE venues (
  venue_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  country TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Artists table
CREATE TABLE artists (
  artist_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shows table
CREATE TABLE shows (
  show_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  date DATE NOT NULL,
  venue_id UUID REFERENCES venues(venue_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Artists performing at shows (many-to-many)
CREATE TABLE show_artists (
  show_id UUID REFERENCES shows(show_id) ON DELETE CASCADE,
  artist_id UUID REFERENCES artists(artist_id) ON DELETE CASCADE,
  performance_order INTEGER NOT NULL,
  PRIMARY KEY (show_id, artist_id)
);

-- User profiles table that links to auth.users
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE CHECK (username ~* '^[a-z0-9_-]{3,30}$'),
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users attending shows (many-to-many)
CREATE TABLE user_shows (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  show_id UUID REFERENCES shows(show_id) ON DELETE CASCADE,
  rating INTEGER CHECK (
    rating >= 1
    AND rating <= 5
  ),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, show_id)
);

-- Trigger to automatically create a profile when a new user signs up
CREATE
OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO
  public.profiles (id, username)
VALUES
  (new.id, NULL);

RETURN new;

END;

$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER
INSERT
  ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update the updated_at timestamp
CREATE
OR REPLACE FUNCTION update_modified_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();

RETURN NEW;

END;

$$ LANGUAGE plpgsql;

-- Set up triggers for updated_at
CREATE TRIGGER update_profiles_modified BEFORE
UPDATE
  ON profiles FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_user_shows_modified BEFORE
UPDATE
  ON user_shows FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Enable Row Level Security
ALTER TABLE
  profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE
  user_shows ENABLE ROW LEVEL SECURITY;

ALTER TABLE
  shows ENABLE ROW LEVEL SECURITY;

ALTER TABLE
  venues ENABLE ROW LEVEL SECURITY;

ALTER TABLE
  artists ENABLE ROW LEVEL SECURITY;

ALTER TABLE
  show_artists ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view public profiles" ON profiles FOR
SELECT
  USING (is_public = TRUE);

CREATE POLICY "Users can manage their own profile" ON profiles FOR ALL USING (auth.uid() = id);

-- RLS Policies for user_shows
CREATE POLICY "Users can manage their own show attendance" ON user_shows FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for shows, venues, artists, and show_artists
-- (Anyone can view these tables, but only admins can modify them)
CREATE POLICY "Anyone can view shows" ON shows FOR
SELECT
  USING (TRUE);

CREATE POLICY "Anyone can view venues" ON venues FOR
SELECT
  USING (TRUE);

CREATE POLICY "Anyone can view artists" ON artists FOR
SELECT
  USING (TRUE);

CREATE POLICY "Anyone can view show_artists" ON show_artists FOR
SELECT
  USING (TRUE);
