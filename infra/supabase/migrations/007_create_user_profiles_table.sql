CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL UNIQUE,
  caption TEXT,
  city TEXT,
  show_email BOOLEAN DEFAULT FALSE,
  song_chasing TEXT,
  band_chasing TEXT,
  favorite_show TEXT,
  favorite_venue TEXT,
  cashortrade_username TEXT,
  instagram_username TEXT,
  x_username TEXT,
  facebook_username TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_clerk_user_id ON user_profiles(clerk_user_id);
