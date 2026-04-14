
-- Check-ins table for daily login rewards
CREATE TABLE public.check_ins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  check_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
  bonus_xp INTEGER NOT NULL DEFAULT 0,
  streak_at_check_in INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, check_in_date)
);

ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own check-ins" ON public.check_ins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own check-ins" ON public.check_ins FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Custom missions table
CREATE TABLE public.custom_missions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'study',
  xp_reward INTEGER NOT NULL DEFAULT 15,
  is_active BOOLEAN NOT NULL DEFAULT true,
  completed_today BOOLEAN NOT NULL DEFAULT false,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own custom missions" ON public.custom_missions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own custom missions" ON public.custom_missions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own custom missions" ON public.custom_missions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own custom missions" ON public.custom_missions FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_custom_missions_updated_at BEFORE UPDATE ON public.custom_missions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Friendships table
CREATE TABLE public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL,
  addressee_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(requester_id, addressee_id)
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own friendships" ON public.friendships FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "Users can create friend requests" ON public.friendships FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update friendships addressed to them" ON public.friendships FOR UPDATE USING (auth.uid() = addressee_id);

CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON public.friendships FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to search users by display name for friend adding
CREATE OR REPLACE FUNCTION public.search_users(search_term TEXT, current_user_id UUID)
RETURNS TABLE(user_id UUID, display_name TEXT, avatar_url TEXT, total_xp INTEGER, current_streak INTEGER)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.user_id, p.display_name, p.avatar_url, p.total_xp, p.current_streak
  FROM public.profiles p
  WHERE p.display_name ILIKE '%' || search_term || '%'
    AND p.user_id != current_user_id
  LIMIT 20;
$$;
