import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Clock, Filter, BookOpen, Dumbbell, Users, Palette, Heart, Star } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import type { Tables } from '@/integrations/supabase/types';

type Mission = Tables<'missions'>;
type DailyMission = Tables<'daily_missions'> & { missions: Mission };

const categoryIcons: Record<string, React.ReactNode> = {
  study: <BookOpen size={16} />, exercise: <Dumbbell size={16} />, social: <Users size={16} />, creative: <Palette size={16} />, wellness: <Heart size={16} />,
};
const categoryColors: Record<string, string> = {
  study: 'bg-blue-500/15 text-blue-400 border-blue-500/30', exercise: 'bg-green-500/15 text-green-400 border-green-500/30',
  social: 'bg-purple-500/15 text-purple-400 border-purple-500/30', creative: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  wellness: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
};

const MissionHistory = ({ onBack }: { onBack: () => void }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [missions, setMissions] = useState<DailyMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase.from('daily_missions').select('*, missions(*)').eq('user_id', user.id).eq('completed', true).order('completed_at', { ascending: false });
      if (data) setMissions(data as DailyMission[]);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const filtered = useMemo(() => filter === 'all' ? missions : missions.filter(m => m.missions.category === filter), [missions, filter]);
  const totalXp = missions.reduce((s, m) => s + m.xp_earned, 0);
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    missions.forEach(m => { counts[m.missions.category] = (counts[m.missions.category] || 0) + 1; });
    return counts;
  }, [missions]);
  const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0];

  const grouped = useMemo(() => {
    const groups: Record<string, DailyMission[]> = {};
    filtered.forEach(m => { const date = m.assigned_date; if (!groups[date]) groups[date] = []; groups[date].push(m); });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (dateStr === today) return t('progress.today');
    if (dateStr === yesterday) return t('progress.yesterday');
    return date.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-10 w-40" /><Skeleton className="h-24 w-full rounded-2xl" />
        <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-4 sm:p-6 pb-24 space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft size={20} /></Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{t('history.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('history.missionsCompleted', { count: missions.length })}</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="grid grid-cols-3 gap-3">
          <div className="glass-card rounded-xl p-4 text-center">
            <CheckCircle2 className="mx-auto text-success mb-1" size={20} />
            <p className="text-xl font-bold text-foreground">{missions.length}</p>
            <p className="text-xs text-muted-foreground">{t('history.completed')}</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <Star className="mx-auto text-primary mb-1" size={20} />
            <p className="text-xl font-bold text-foreground">{totalXp}</p>
            <p className="text-xs text-muted-foreground">{t('history.xpEarned')}</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            {topCategory ? categoryIcons[topCategory[0]] || <Star size={20} /> : <Star size={20} />}
            <p className="text-lg font-bold text-foreground capitalize mt-1">{topCategory ? t(`categories.${topCategory[0]}`) : '—'}</p>
            <p className="text-xs text-muted-foreground">{t('history.topCategory')}</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter size={16} className="text-muted-foreground shrink-0" />
          {['all', 'study', 'exercise', 'social', 'creative', 'wellness'].map(cat => (
            <button key={cat} onClick={() => setFilter(cat)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border whitespace-nowrap ${filter === cat ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'}`}>
              {cat === 'all' ? t('history.all') : t(`categories.${cat}`)}
              {cat !== 'all' && categoryCounts[cat] ? ` (${categoryCounts[cat]})` : ''}
            </button>
          ))}
        </motion.div>

        {grouped.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Clock size={40} className="mx-auto mb-3 opacity-50" />
            <p className="font-medium">{t('history.noMissions')}</p>
            <p className="text-sm">{t('history.noMissionsDesc')}</p>
          </div>
        ) : (
          grouped.map(([date, items], gi) => (
            <motion.div key={date} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + gi * 0.05 }}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">{formatDate(date)}</h3>
              <div className="space-y-2">
                {items.map(m => (
                  <div key={m.id} className="glass-card rounded-xl p-3 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${categoryColors[m.missions.category] || 'bg-muted'}`}>
                      {categoryIcons[m.missions.category] || <Star size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{m.missions.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{m.missions.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant="secondary" className="text-xs">+{m.xp_earned} XP</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default MissionHistory;
