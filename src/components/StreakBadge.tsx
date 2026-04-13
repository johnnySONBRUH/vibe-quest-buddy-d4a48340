import { Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface StreakBadgeProps {
  streak: number;
  longestStreak: number;
}

const StreakBadge = ({ streak, longestStreak }: StreakBadgeProps) => {
  const { t } = useTranslation();
  return (
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute inset-0 gradient-streak opacity-10" />
      <div className="relative flex items-center gap-4">
        <div className="relative">
          <motion.div
            className="w-16 h-16 rounded-full gradient-streak flex items-center justify-center shadow-lg"
            animate={streak > 0 ? { boxShadow: ['0 0 15px hsl(35 95% 55% / 0.3)', '0 0 30px hsl(35 95% 55% / 0.5)', '0 0 15px hsl(35 95% 55% / 0.3)'] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Flame className={`text-primary-foreground ${streak > 0 ? 'animate-flame' : ''}`} size={32} />
          </motion.div>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{t('streakBadge.currentStreak')}</p>
          <p className="text-3xl font-bold text-foreground">{streak} <span className="text-lg text-muted-foreground">{t('streakBadge.days')}</span></p>
          <p className="text-xs text-muted-foreground">{t('streakBadge.best', { count: longestStreak })}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default StreakBadge;
