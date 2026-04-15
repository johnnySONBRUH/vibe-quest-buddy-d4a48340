import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, CheckCircle, Calendar, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Activity {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  activity_type: string;
  title: string;
  xp_earned: number;
  activity_date: string;
}

const FriendActivityFeed = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase.rpc('get_friend_activity', { current_user_id: user.id });
      if (data) setActivities(data as Activity[]);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  const getIcon = (type: string) => {
    if (type === 'check_in') return <Calendar size={14} className="text-accent" />;
    return <CheckCircle size={14} className="text-primary" />;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-14 rounded-xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-10">
        <Users className="mx-auto text-muted-foreground mb-2" size={36} />
        <p className="text-sm text-muted-foreground">{t('friends.noActivity')}</p>
      </div>
    );
  }

  return (
    <ScrollArea className="max-h-[60vh]">
      <div className="space-y-2">
        {activities.map((a, i) => (
          <motion.div
            key={`${a.user_id}-${a.activity_date}-${i}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className="glass-card rounded-xl px-4 py-3 flex items-center gap-3"
          >
            <Avatar className="h-8 w-8 shrink-0">
              {a.avatar_url ? <AvatarImage src={a.avatar_url} /> : null}
              <AvatarFallback className="text-xs">{(a.display_name || '?')[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground truncate">
                <span className="font-semibold">{a.display_name || 'Student'}</span>
                {' '}
                {a.activity_type === 'check_in' ? t('friends.checkedIn') : t('friends.completed')}
                {' '}
                {a.activity_type !== 'check_in' && <span className="text-muted-foreground">{a.title}</span>}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {getIcon(a.activity_type)}
                <span className="flex items-center gap-0.5"><Zap size={10} className="text-primary" />+{a.xp_earned} XP</span>
                <span>·</span>
                <span>{timeAgo(a.activity_date)}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default FriendActivityFeed;
