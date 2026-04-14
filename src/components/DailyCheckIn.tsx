import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Zap, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

interface DailyCheckInProps {
  currentStreak: number;
  onXpEarned: (xp: number) => void;
}

const DailyCheckIn = ({ currentStreak, onXpEarned }: DailyCheckInProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [bonusXp, setBonusXp] = useState(0);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!user) return;
    supabase
      .from('check_ins')
      .select('id')
      .eq('user_id', user.id)
      .eq('check_in_date', today)
      .then(({ data }) => {
        if (!data || data.length === 0) {
          const xp = 10 + Math.min(currentStreak * 2, 40); // 10-50 XP based on streak
          setBonusXp(xp);
          setShow(true);
        }
      });
  }, [user, today, currentStreak]);

  const handleClaim = async () => {
    if (!user) return;
    await supabase.from('check_ins').insert({
      user_id: user.id,
      check_in_date: today,
      bonus_xp: bonusXp,
      streak_at_check_in: currentStreak,
    });
    await supabase.from('profiles').update({
      total_xp: undefined, // we'll use rpc or raw increment
    }).eq('user_id', user.id);
    // Increment XP via select + update
    const { data: profile } = await supabase.from('profiles').select('total_xp').eq('user_id', user.id).single();
    if (profile) {
      await supabase.from('profiles').update({ total_xp: profile.total_xp + bonusXp }).eq('user_id', user.id);
    }
    setClaimed(true);
    onXpEarned(bonusXp);
    setTimeout(() => setShow(false), 2000);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          className="glass-card rounded-2xl p-5 relative overflow-hidden border-2 border-accent/30"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-primary/10" />
          <button onClick={() => setShow(false)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
          <div className="relative flex items-center gap-4">
            <motion.div
              className="w-14 h-14 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-lg"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 1, repeat: claimed ? 0 : Infinity, repeatDelay: 2 }}
            >
              <Gift className="text-primary-foreground" size={28} />
            </motion.div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">{t('checkIn.title')}</p>
              {claimed ? (
                <motion.p initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-lg font-bold text-accent flex items-center gap-1">
                  <Zap size={18} /> +{bonusXp} XP {t('checkIn.claimed')}
                </motion.p>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">{t('checkIn.description', { xp: bonusXp })}</p>
                  <Button size="sm" className="mt-2 gap-1" onClick={handleClaim}>
                    <Gift size={14} /> {t('checkIn.claim')}
                  </Button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DailyCheckIn;
