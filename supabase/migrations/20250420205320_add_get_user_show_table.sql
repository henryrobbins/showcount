-- Drop existing version if re-defining
DROP FUNCTION IF EXISTS get_user_show_table(UUID);

CREATE FUNCTION get_user_show_table(uid UUID)
RETURNS TABLE (
  user_id UUID,
  created_at TIMESTAMPTZ,
  rating INT,
  notes TEXT,
  show_id UUID,
  show_name TEXT,
  date DATE,
  is_festival BOOLEAN,
  venue_name TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  artist_name TEXT,
  sort_order INT
)
LANGUAGE sql STABLE
AS $$
  -- Non-festival: one row per show
  SELECT
    us.user_id,
    us.created_at,
    us.rating,
    us.notes,
    s.show_id,
    s.name AS show_name,
    s.date,
    s.is_festival,
    v.name AS venue_name,
    v.city,
    v.state,
    v.country,
    string_agg(a.name, ' + ' ORDER BY sa.performance_order DESC) AS artist_name,
    MIN(sa.performance_order) AS sort_order
  FROM user_shows us
  JOIN shows s ON us.show_id = s.show_id
  JOIN venues v ON s.venue_id = v.venue_id
  JOIN show_artists sa ON sa.show_id = s.show_id
  JOIN artists a ON sa.artist_id = a.artist_id
  WHERE us.user_id = uid AND NOT s.is_festival
  GROUP BY us.user_id, us.created_at, us.rating, us.notes,
           s.show_id, s.name, s.date, s.is_festival,
           v.name, v.city, v.state, v.country

  UNION ALL

  -- Festival: one row per artist
  SELECT
    us.user_id,
    us.created_at,
    us.rating,
    us.notes,
    s.show_id,
    s.name AS show_name,
    s.date,
    s.is_festival,
    v.name AS venue_name,
    v.city,
    v.state,
    v.country,
    a.name AS artist_name,
    sa.performance_order AS sort_order
  FROM user_shows us
  JOIN shows s ON us.show_id = s.show_id
  JOIN venues v ON s.venue_id = v.venue_id
  JOIN show_artists sa ON sa.show_id = s.show_id
  JOIN artists a ON sa.artist_id = a.artist_id
  WHERE us.user_id = uid AND s.is_festival

  ORDER BY date, sort_order;
$$;
