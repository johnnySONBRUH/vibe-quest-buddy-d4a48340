import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface ProgressRingProps {
  percent: number;
  completed: number;
  total: number;
}

const ProgressRing = ({ percent, completed, total }: ProgressRingProps) => {
  const { t } = useTranslation();
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="glass-card rounded-2xl p-6 flex items-center gap-6">
      <div className="relative w-32 h-32 flex-shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
          <motion.circle cx="60" cy="60" r={radius} fill="none" stroke="url(#progressGradient)" strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset }} transition={{ duration: 1, ease: 'easeOut' }} />
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--secondary))" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground">{Math.round(percent)}%</span>
          <span className="text-xs text-muted-foreground">{t('progressRing.done')}</span>
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-foreground text-lg">{t('progressRing.todaysProgress')}</h3>
        <p className="text-muted-foreground text-sm mt-1">{t('progressRing.missionsComplete', { completed, total })}</p>
        {percent === 100 && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-success font-semibold text-sm mt-2">{t('progressRing.allDone')}</motion.p>
        )}
      </div>
    </div>
  );
};

export default ProgressRing;
