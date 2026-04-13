import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Flame, Zap, Crown, Medal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import ShareButton from '@/components/ShareButton';

interface LeaderboardEntry {
  display_name: string; total_xp: number; current_streak: number; longest_streak: number; avatar_url: string | null; user_id: string;
}

const rankIcons = [
  <Crown className="text-yellow-500" size={20} />,
  <Medal className="text-gray-400" size={20} />,
  <Medal className="text-amber-600" size={20} />,
];

const Leaderboard = ({ onBack }: { onBack: () => void }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data, error } = await supabase.rpc('get_leaderboard', { limit_count: 50 });
      if (!error && data) setEntries(data as LeaderboardEntry[]);
      setLoading(false);
    };
    fetchLeaderboard();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-4 sm:p-6 pb-24 space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft size={20} /></Button>
          <div className="flex items-center gap-2">
            <Trophy className="text-primary" size={24} />
            <h1 className="text-xl font-bold text-foreground">{t('leaderboard.title')}</h1>
          </div>
        </motion.div>

        {loading ? (
          <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
        ) : entries.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No students yet. Be the first!</p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, i) => {
              const isMe = entry.user_id === user?.id;
              const shareText = isMe ? `🏆 I'm ranked #${i + 1} on QuestUp with ${entry.total_xp} XP and a ${entry.current_streak}-day streak! Can you beat me?` : '';
              return (
                <motion.div key={entry.user_id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className={`glass-card rounded-xl p-4 flex items-center gap-4 ${isMe ? 'ring-2 ring-primary' : ''}`}>
                  <div className="w-8 text-center font-bold text-muted-foreground">{i < 3 ? rankIcons[i] : <span>{i + 1}</span>}</div>
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-foreground">{(entry.display_name || '?')[0].toUpperCase()}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">
                      {entry.display_name || 'Student'}
                      {isMe && <span className="text-xs text-primary ml-2">({t('leaderboard.you')})</span>}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Zap size={12} /> {entry.total_xp} {t('leaderboard.xp')}</span>
                      <span className="flex items-center gap-1"><Flame size={12} /> {t('leaderboard.streakDays', { count: entry.current_streak })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isMe && <ShareButton text={shareText} title="My QuestUp Rank" />}
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">{entry.total_xp}</p>
                      <p className="text-xs text-muted-foreground">{t('leaderboard.xp')}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
