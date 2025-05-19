DROP POLICY IF EXISTS "Users can manage their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can manage their own show attendance" ON user_shows;

CREATE POLICY "Users can manage their own profile" ON profiles FOR ALL
  USING ((SELECT auth.jwt()->>'sub') = (id)::text);

CREATE POLICY "Users can manage their own show attendance" ON user_shows FOR ALL
  USING ((SELECT auth.jwt()->>'sub') = (user_id)::text);
