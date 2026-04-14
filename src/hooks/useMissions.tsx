import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Mission = Tables<'missions'>;
type DailyMission = Tables<'daily_missions'> & { missions: Mission };

export const useMissions = () => {
  const { user } = useAuth();
  const [dailyMissions, setDailyMissions] = useState<DailyMission[]>([]);
  const [profile, setProfile] = useState<Tables<'profiles'> | null>(null);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    if (data) setProfile(data);
  }, [user]);

  const generateDailyMissions = useCallback(async () => {
    if (!user || !profile) return;

    // Check if already generated today
    const { data: existing } = await supabase
      .from('daily_missions')
      .select('*, missions(*)')
      .eq('user_id', user.id)
      .eq('assigned_date', today);

    if (existing && existing.length > 0) {
      setDailyMissions(existing as DailyMission[]);
      setLoading(false);
      return;
    }

    // Get all missions
    const { data: allMissions } = await supabase.from('missions').select('*');
    if (!allMissions || allMissions.length === 0) return;

    // Pick 5 random missions from different categories
    const categories = ['study', 'exercise', 'social', 'creative', 'wellness'];
    const selected: Mission[] = [];

    for (const cat of categories) {
      const catMissions = allMissions.filter(m => m.category === cat);
      if (catMissions.length > 0) {
        selected.push(catMissions[Math.floor(Math.random() * catMissions.length)]);
      }
    }

    // Calculate difficulty based on current_day (gradual increase)
    const dayLevel = profile.current_day;
    const difficultyMultiplier = 1 + Math.floor(dayLevel / 7) * 0.15; // +15% every week

    const inserts = selected.map(m => ({
      user_id: user.id,
      mission_id: m.id,
      assigned_date: today,
      difficulty_level: Math.min(10, Math.round(m.base_difficulty * difficultyMultiplier)),
      xp_earned: 0,
    }));

    const { data: inserted } = await supabase
      .from('daily_missions')
      .insert(inserts)
      .select('*, missions(*)');

    if (inserted) setDailyMissions(inserted as DailyMission[]);
    setLoading(false);
  }, [user, profile, today]);

  const completeMission = async (missionId: string) => {
    if (!user || !profile) return;

    const mission = dailyMissions.find(m => m.id === missionId);
    if (!mission || mission.completed) return;

    const xpEarned = Math.round(mission.missions.xp_reward * (1 + mission.difficulty_level * 0.1));

    // Update daily mission
    await supabase
      .from('daily_missions')
      .update({ completed: true, completed_at: new Date().toISOString(), xp_earned: xpEarned })
      .eq('id', missionId);

    // Check if all missions completed today
    const updatedMissions = dailyMissions.map(m =>
      m.id === missionId ? { ...m, completed: true, xp_earned: xpEarned } : m
    );
    setDailyMissions(updatedMissions);

    const allDone = updatedMissions.every(m => m.completed);

    // Update profile
    const newXp = profile.total_xp + xpEarned;
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const wasYesterday = profile.last_completion_date === yesterdayStr;
    const alreadyCompletedToday = profile.last_completion_date === today;
    let newStreak = profile.current_streak;
    if (allDone && !alreadyCompletedToday) {
      newStreak = wasYesterday ? profile.current_streak + 1 : 1;
    }

    const updates = allDone
      ? {
          total_xp: newXp,
          current_streak: newStreak,
          longest_streak: Math.max(newStreak, profile.longest_streak),
          last_completion_date: today,
          current_day: profile.current_day + 1,
        }
      : { total_xp: newXp };

    if (allDone) {
      toast.success('🔥 All missions complete! Streak updated!');
    } else {
      toast.success(`+${xpEarned} XP earned!`);
    }

    await supabase.from('profiles').update(updates).eq('user_id', user.id);
    setProfile(prev => prev ? { ...prev, ...updates } as Tables<'profiles'> : null);
  };

  useEffect(() => {
    if (user) fetchProfile();
  }, [user, fetchProfile]);

  useEffect(() => {
    if (profile) generateDailyMissions();
  }, [profile, generateDailyMissions]);

  const completedCount = dailyMissions.filter(m => m.completed).length;
  const totalCount = dailyMissions.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return { dailyMissions, profile, loading, completeMission, completedCount, totalCount, progressPercent, fetchProfile };
};
