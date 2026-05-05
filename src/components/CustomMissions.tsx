import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Check, Pencil, X, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { checkAction, recordAction } from '@/lib/antiCheat';

interface CustomMission {
  id: string;
  title: string;
  description: string;
  category: string;
  xp_reward: number;
  is_active: boolean;
  completed_today: boolean;
  last_reset_date: string | null;
}

interface CustomMissionsProps {
  onXpEarned: (xp: number) => void;
}

const CustomMissions = ({ onXpEarned }: CustomMissionsProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [missions, setMissions] = useState<CustomMission[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('study');
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!user) return;
    fetchMissions();
  }, [user]);

  const fetchMissions = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('custom_missions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (data) {
      // Reset completed_today if last_reset_date is not today
      const updated = data.map(m => ({
        ...m,
        completed_today: m.last_reset_date === today ? m.completed_today : false,
      }));
      setMissions(updated as CustomMission[]);
    }
  };

  const handleCreate = async () => {
    if (!user || !title.trim()) return;
    const activeMissions = missions.filter(m => m.is_active);
    if (activeMissions.length >= 3) {
      toast.error(t('customMissions.maxReached'));
      return;
    }
    await supabase.from('custom_missions').insert({
      user_id: user.id,
      title: title.trim(),
      description: description.trim(),
      category,
    });
    setTitle('');
    setDescription('');
    setShowForm(false);
    fetchMissions();
    toast.success(t('customMissions.created'));
  };

  const handleComplete = async (mission: CustomMission) => {
    if (!user || mission.completed_today) return;
    const guard = checkAction('mission_complete');
    if (!guard.ok) { toast.error(guard.reason); return; }
    recordAction('mission_complete');
    await supabase.from('custom_missions').update({
      completed_today: true,
      last_reset_date: today,
    }).eq('id', mission.id);

    // Add XP
    const { data: profile } = await supabase.from('profiles').select('total_xp').eq('user_id', user.id).single();
    if (profile) {
      await supabase.from('profiles').update({ total_xp: profile.total_xp + mission.xp_reward }).eq('user_id', user.id);
    }

    onXpEarned(mission.xp_reward);
    toast.success(`+${mission.xp_reward} XP!`);
    fetchMissions();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('custom_missions').delete().eq('id', id);
    fetchMissions();
  };

  const categories = ['study', 'exercise', 'social', 'creative', 'wellness'];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="text-accent" size={18} />
          <h3 className="text-base font-bold text-foreground">{t('customMissions.title')}</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowForm(!showForm)} className="text-primary gap-1">
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? t('customMissions.cancel') : t('customMissions.add')}
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="glass-card rounded-xl p-4 space-y-3 overflow-hidden"
          >
            <Input placeholder={t('customMissions.titlePlaceholder')} value={title} onChange={e => setTitle(e.target.value)} maxLength={60} className="bg-background" />
            <Input placeholder={t('customMissions.descPlaceholder')} value={description} onChange={e => setDescription(e.target.value)} maxLength={120} className="bg-background" />
            <div className="flex gap-2 flex-wrap">
              {categories.map(c => (
                <button key={c} onClick={() => setCategory(c)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${category === c ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border'}`}>
                  {t(`categories.${c}`)}
                </button>
              ))}
            </div>
            <Button size="sm" onClick={handleCreate} disabled={!title.trim()} className="w-full">{t('customMissions.create')}</Button>
          </motion.div>
        )}
      </AnimatePresence>

      {missions.map((m, i) => (
        <motion.div key={m.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
          className={`glass-card rounded-xl p-4 flex items-center gap-3 ${m.completed_today ? 'opacity-60' : ''}`}>
          <button onClick={() => handleComplete(m)} disabled={m.completed_today}
            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${m.completed_today ? 'bg-success border-success' : 'border-muted-foreground/30 hover:border-primary'}`}>
            {m.completed_today && <Check size={14} className="text-primary-foreground" />}
          </button>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${m.completed_today ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{m.title}</p>
            {m.description && <p className="text-xs text-muted-foreground truncate">{m.description}</p>}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{t(`categories.${m.category}`)}</span>
              <span className="text-[10px] text-primary font-medium">+{m.xp_reward} XP</span>
            </div>
          </div>
          <button onClick={() => handleDelete(m.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={14} /></button>
        </motion.div>
      ))}

      {missions.length === 0 && !showForm && (
        <p className="text-xs text-muted-foreground text-center py-2">{t('customMissions.empty')}</p>
      )}
    </div>
  );
};

export default CustomMissions;
