
CREATE OR REPLACE FUNCTION public.get_leaderboard(limit_count integer DEFAULT 50)
RETURNS TABLE (
  display_name text,
  total_xp integer,
  current_streak integer,
  longest_streak integer,
  avatar_url text,
  user_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.display_name, p.total_xp, p.current_streak, p.longest_streak, p.avatar_url, p.user_id
  FROM public.profiles p
  ORDER BY p.total_xp DESC
  LIMIT limit_count;
$$;
