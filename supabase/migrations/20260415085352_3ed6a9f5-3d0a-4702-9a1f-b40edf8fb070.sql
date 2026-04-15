
CREATE OR REPLACE FUNCTION public.get_friend_activity(current_user_id uuid, limit_count integer DEFAULT 30)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  avatar_url text,
  activity_type text,
  title text,
  xp_earned integer,
  activity_date timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  WITH friend_ids AS (
    SELECT CASE WHEN requester_id = current_user_id THEN addressee_id ELSE requester_id END AS fid
    FROM public.friendships
    WHERE status = 'accepted'
      AND (requester_id = current_user_id OR addressee_id = current_user_id)
  )
  -- Completed missions
  SELECT
    dm.user_id,
    p.display_name,
    p.avatar_url,
    'mission_complete' AS activity_type,
    m.title,
    dm.xp_earned,
    dm.completed_at AS activity_date
  FROM public.daily_missions dm
  JOIN public.missions m ON m.id = dm.mission_id
  JOIN public.profiles p ON p.user_id = dm.user_id
  WHERE dm.user_id IN (SELECT fid FROM friend_ids)
    AND dm.completed = true
    AND dm.completed_at >= now() - interval '7 days'

  UNION ALL

  -- Check-ins
  SELECT
    ci.user_id,
    p.display_name,
    p.avatar_url,
    'check_in' AS activity_type,
    'Daily Check-in' AS title,
    ci.bonus_xp AS xp_earned,
    ci.created_at AS activity_date
  FROM public.check_ins ci
  JOIN public.profiles p ON p.user_id = ci.user_id
  WHERE ci.user_id IN (SELECT fid FROM friend_ids)
    AND ci.created_at >= now() - interval '7 days'

  ORDER BY activity_date DESC
  LIMIT limit_count;
$$;
