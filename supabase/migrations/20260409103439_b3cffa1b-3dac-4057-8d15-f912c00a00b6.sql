
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_completion_date DATE,
  current_day INTEGER NOT NULL DEFAULT 1,
  total_xp INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Create missions table (template missions)
CREATE TABLE public.missions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('study', 'exercise', 'social', 'creative', 'wellness')),
  base_difficulty INTEGER NOT NULL DEFAULT 1 CHECK (base_difficulty BETWEEN 1 AND 10),
  xp_reward INTEGER NOT NULL DEFAULT 10,
  icon TEXT NOT NULL DEFAULT 'star',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read missions" ON public.missions FOR SELECT TO authenticated USING (true);

-- Create daily_missions table (assigned to users each day)
CREATE TABLE public.daily_missions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mission_id UUID REFERENCES public.missions(id) ON DELETE CASCADE NOT NULL,
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  difficulty_level INTEGER NOT NULL DEFAULT 1,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, mission_id, assigned_date)
);

ALTER TABLE public.daily_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own daily missions" ON public.daily_missions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own daily missions" ON public.daily_missions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own daily missions" ON public.daily_missions FOR UPDATE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed mission templates
INSERT INTO public.missions (title, description, category, base_difficulty, xp_reward, icon) VALUES
('Study Session', 'Focus on studying for your courses', 'study', 1, 20, 'book-open'),
('Read a Chapter', 'Read a chapter from a textbook or book', 'study', 2, 25, 'book'),
('Practice Problems', 'Solve practice problems or exercises', 'study', 3, 30, 'brain'),
('Quick Workout', 'Do a short exercise routine', 'exercise', 1, 15, 'dumbbell'),
('Go for a Walk', 'Take a 20-minute walk outside', 'exercise', 1, 10, 'footprints'),
('Stretch Break', 'Do a 10-minute stretching routine', 'exercise', 1, 10, 'heart'),
('Call a Friend', 'Catch up with a friend or family member', 'social', 1, 15, 'phone'),
('Join a Study Group', 'Study with classmates', 'social', 2, 20, 'users'),
('Journal Entry', 'Write in your journal for 10 minutes', 'creative', 1, 15, 'pen-tool'),
('Learn Something New', 'Watch an educational video or tutorial', 'creative', 2, 20, 'lightbulb'),
('Meditate', 'Practice mindfulness for 10 minutes', 'wellness', 1, 15, 'sparkles'),
('Drink Water', 'Drink at least 8 glasses of water today', 'wellness', 1, 10, 'droplets'),
('Sleep Early', 'Get to bed before 11 PM', 'wellness', 2, 20, 'moon');
