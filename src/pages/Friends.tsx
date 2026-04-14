import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Search, UserPlus, Check, X, Flame, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface FriendProfile {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_xp: number;
  current_streak: number;
}

interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  created_at: string;
}

const Friends = ({ onBack }: { onBack: () => void }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [tab, setTab] = useState<'friends' | 'requests' | 'search'>('friends');
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<(Friendship & { profile: FriendProfile })[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<FriendProfile[]>([]);
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchFriends();
      fetchPendingRequests();
    }
  }, [user]);

  const fetchFriends = async () => {
    if (!user) return;
    const { data: friendships } = await supabase
      .from('friendships')
      .select('*')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

    if (!friendships) return;

    const friendUserIds = friendships.map(f =>
      f.requester_id === user.id ? f.addressee_id : f.requester_id
    );
    setFriendIds(new Set(friendUserIds));

    if (friendUserIds.length === 0) {
      setFriends([]);
      return;
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url, total_xp, current_streak')
      .in('user_id', friendUserIds);

    if (profiles) setFriends(profiles);
  };

  const fetchPendingRequests = async () => {
    if (!user) return;
    const { data: requests } = await supabase
      .from('friendships')
      .select('*')
      .eq('addressee_id', user.id)
      .eq('status', 'pending');

    if (!requests || requests.length === 0) {
      setPendingRequests([]);
      return;
    }

    const requesterIds = requests.map(r => r.requester_id);
    setPendingIds(new Set(requesterIds));

    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url, total_xp, current_streak')
      .in('user_id', requesterIds);

    const merged = requests.map(r => ({
      ...r,
      profile: profiles?.find(p => p.user_id === r.requester_id) || { user_id: r.requester_id, display_name: 'Unknown', avatar_url: null, total_xp: 0, current_streak: 0 },
    }));
    setPendingRequests(merged);
  };

  const handleSearch = async () => {
    if (!user || !searchTerm.trim()) return;
    const { data } = await supabase.rpc('search_users', { search_term: searchTerm.trim(), current_user_id: user.id });
    if (data) setSearchResults(data);
  };

  const sendRequest = async (targetId: string) => {
    if (!user) return;
    const { error } = await supabase.from('friendships').insert({ requester_id: user.id, addressee_id: targetId });
    if (error) {
      toast.error(t('friends.requestFailed'));
    } else {
      toast.success(t('friends.requestSent'));
      setPendingIds(prev => new Set([...prev, targetId]));
    }
  };

  const respondRequest = async (friendshipId: string, accept: boolean) => {
    await supabase.from('friendships').update({ status: accept ? 'accepted' : 'rejected' }).eq('id', friendshipId);
    toast.success(accept ? t('friends.accepted') : t('friends.rejected'));
    fetchFriends();
    fetchPendingRequests();
  };

  const tabs = [
    { key: 'friends' as const, label: t('friends.myFriends'), count: friends.length },
    { key: 'requests' as const, label: t('friends.requests'), count: pendingRequests.length },
    { key: 'search' as const, label: t('friends.findFriends') },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-4 sm:p-6 pb-24 space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft size={20} /></Button>
          <Users className="text-primary" size={24} />
          <h1 className="text-xl font-bold text-foreground">{t('friends.title')}</h1>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2">
          {tabs.map(tb => (
            <button key={tb.key} onClick={() => setTab(tb.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${tab === tb.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border'}`}>
              {tb.label} {tb.count !== undefined && tb.count > 0 && <span className="ml-1 text-xs">({tb.count})</span>}
            </button>
          ))}
        </div>

        {/* Friends list */}
        {tab === 'friends' && (
          <div className="space-y-3">
            {friends.length === 0 ? (
              <div className="text-center py-10">
                <Users className="mx-auto text-muted-foreground mb-2" size={40} />
                <p className="text-sm text-muted-foreground">{t('friends.noFriends')}</p>
              </div>
            ) : (
              friends.map((f, i) => (
                <motion.div key={f.user_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="glass-card rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {f.avatar_url ? <img src={f.avatar_url} alt="" className="w-full h-full object-cover" /> : <Users size={18} className="text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{f.display_name || 'Student'}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Zap size={12} className="text-primary" />{f.total_xp} XP</span>
                      <span className="flex items-center gap-1"><Flame size={12} className="text-streak" />{f.current_streak}d</span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Pending requests */}
        {tab === 'requests' && (
          <div className="space-y-3">
            {pendingRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">{t('friends.noRequests')}</p>
            ) : (
              pendingRequests.map(r => (
                <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {r.profile.avatar_url ? <img src={r.profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <Users size={18} className="text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{r.profile.display_name || 'Student'}</p>
                    <p className="text-xs text-muted-foreground">{t('friends.wantsToConnect')}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="text-success hover:bg-success/10" onClick={() => respondRequest(r.id, true)}><Check size={18} /></Button>
                    <Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => respondRequest(r.id, false)}><X size={18} /></Button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Search */}
        {tab === 'search' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder={t('friends.searchPlaceholder')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} className="bg-background" />
              <Button onClick={handleSearch} size="icon"><Search size={18} /></Button>
            </div>
            <div className="space-y-3">
              {searchResults.map(r => {
                const isFriend = friendIds.has(r.user_id);
                const isPending = pendingIds.has(r.user_id);
                return (
                  <motion.div key={r.user_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      {r.avatar_url ? <img src={r.avatar_url} alt="" className="w-full h-full object-cover" /> : <Users size={18} className="text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{r.display_name || 'Student'}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{r.total_xp} XP</span>
                        <span>{r.current_streak}d streak</span>
                      </div>
                    </div>
                    {isFriend ? (
                      <span className="text-xs text-success font-medium">{t('friends.alreadyFriends')}</span>
                    ) : isPending ? (
                      <span className="text-xs text-muted-foreground">{t('friends.pending')}</span>
                    ) : (
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => sendRequest(r.user_id)}>
                        <UserPlus size={14} /> {t('friends.addFriend')}
                      </Button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Friends;
