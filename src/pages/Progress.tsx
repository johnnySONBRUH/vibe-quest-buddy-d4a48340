import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, Zap, Flame, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from '@/components/ui/chart';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, AreaChart, Area } from 'recharts';

interface DayData { day: string; label: string; completed: number; total: number; xp: number; }

const completionsConfig: ChartConfig = {
  completed: { label: 'Completed', color: 'hsl(var(--success))' },
  total: { label: 'Total', color: 'hsl(var(--muted))' },
};
const xpConfig: ChartConfig = { xp: { label: 'XP Earned', color: 'hsl(var(--primary))' } };
const streakConfig: ChartConfig = { streak: { label: 'Streak', color: 'hsl(var(--streak))' } };

const Progress = ({ onBack }: { onBack: () => void }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [weekData, setWeekData] = useState<DayData[]>([]);
  const [streakData, setStreakData] = useState<{ day: string; label: string; streak: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchWeekData = async () => {
      const days: DayData[] = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayLabel = i === 0 ? t('progress.today') : i === 1 ? t('progress.yesterday') : date.toLocaleDateString('en', { weekday: 'short' });
        const { data } = await supabase.from('daily_missions').select('completed, xp_earned').eq('user_id', user.id).eq('assigned_date', dateStr);
        const missions = data || [];
        days.push({ day: dateStr, label: dayLabel, completed: missions.filter(m => m.completed).length, total: missions.length, xp: missions.reduce((sum, m) => sum + (m.xp_earned || 0), 0) });
      }
      setWeekData(days);
      const { data: profile } = await supabase.from('profiles').select('current_streak, longest_streak').eq('user_id', user.id).single();
      const currentStreak = profile?.current_streak || 0;
      const sData = days.map((d, idx) => {
        const allDone = d.total > 0 && d.completed === d.total;
        const daysFromToday = 6 - idx;
        const streakAtDay = allDone ? Math.max(1, currentStreak - daysFromToday) : 0;
        return { day: d.day, label: d.label, streak: streakAtDay };
      });
      setStreakData(sData);
      setLoading(false);
    };
    fetchWeekData();
  }, [user, t]);

  const totalXpWeek = weekData.reduce((s, d) => s + d.xp, 0);
  const totalCompleted = weekData.reduce((s, d) => s + d.completed, 0);
  const totalMissions = weekData.reduce((s, d) => s + d.total, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-10 w-32" /><Skeleton className="h-48 w-full rounded-2xl" /><Skeleton className="h-48 w-full rounded-2xl" /><Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-4 sm:p-6 pb-24 space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft size={20} /></Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{t('progress.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('progress.subtitle')}</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="grid grid-cols-3 gap-3">
          <div className="glass-card rounded-xl p-4 text-center">
            <CheckCircle2 className="mx-auto text-success mb-1" size={20} />
            <p className="text-xl font-bold text-foreground">{totalCompleted}/{totalMissions}</p>
            <p className="text-xs text-muted-foreground">{t('progress.missions')}</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <Zap className="mx-auto text-primary mb-1" size={20} />
            <p className="text-xl font-bold text-foreground">{totalXpWeek}</p>
            <p className="text-xs text-muted-foreground">{t('progress.xpEarned')}</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <TrendingUp className="mx-auto text-accent mb-1" size={20} />
            <p className="text-xl font-bold text-foreground">{totalMissions > 0 ? Math.round((totalCompleted / totalMissions) * 100) : 0}%</p>
            <p className="text-xs text-muted-foreground">{t('progress.completion')}</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-2xl p-4">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><CheckCircle2 size={18} className="text-success" />{t('progress.missionCompletions')}</h3>
          <ChartContainer config={completionsConfig} className="h-[200px] w-full">
            <BarChart data={weekData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="total" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completed" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-2xl p-4">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Zap size={18} className="text-primary" />{t('progress.xpEarned')}</h3>
          <ChartContainer config={xpConfig} className="h-[200px] w-full">
            <AreaChart data={weekData}>
              <defs><linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="xp" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#xpGradient)" />
            </AreaChart>
          </ChartContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card rounded-2xl p-4">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Flame size={18} className="text-streak" />{t('progress.streakHistory')}</h3>
          <ChartContainer config={streakConfig} className="h-[200px] w-full">
            <LineChart data={streakData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="streak" stroke="hsl(var(--streak))" strokeWidth={2} dot={{ fill: 'hsl(var(--streak))', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ChartContainer>
        </motion.div>
      </div>
    </div>
  );
};

export default Progress;
