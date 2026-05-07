import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Flame, Medal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface LeaderboardEntry {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  total_xp: number;
  current_streak: number;
  longest_streak: number;
}

interface Props {
  onBack: () => void;
}

const rankColor = (rank: number) => {
  if (rank === 1) return 'text-yellow-500';
  if (rank === 2) return 'text-gray-400';
  if (rank === 3) return 'text-amber-600';
  return 'text-muted-foreground';
};

const Leaderboard = ({ onBack }: Props) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc('get_leaderboard', { limit_count: 50 });
      if (!error && data) setEntries(data as LeaderboardEntry[]);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-4 sm:p-6 pb-24 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft size={20} /></Button>
          <div className="flex items-center gap-2">
            <Trophy className="text-accent" size={24} />
            <h1 className="text-2xl font-bold text-foreground">{t('leaderboard.title')}</h1>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{t('leaderboard.subtitle')}</p>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((e, i) => {
              const rank = i + 1;
              const isMe = e.user_id === user?.id;
              return (
                <motion.div
                  key={e.user_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`glass-card rounded-xl p-3 flex items-center gap-3 ${isMe ? 'ring-2 ring-primary' : ''}`}
                >
                  <div className={`w-8 text-center font-bold ${rankColor(rank)}`}>
                    {rank <= 3 ? <Medal className="mx-auto" size={20} /> : `#${rank}`}
                  </div>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={e.avatar_url || undefined} />
                    <AvatarFallback>{(e.display_name || '?').charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">
                      {e.display_name || t('leaderboard.anonymous')}
                      {isMe && <span className="ml-2 text-xs text-primary">({t('leaderboard.you')})</span>}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      {e.user_id.slice(0, 8)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground flex items-center gap-1 justify-end">
                      <Trophy size={14} className="text-accent" />
                      {e.total_xp}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                      <Flame size={12} className="text-streak" />
                      {e.current_streak}
                    </p>
                  </div>
                </motion.div>
              );
            })}
            {entries.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">{t('leaderboard.empty')}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
