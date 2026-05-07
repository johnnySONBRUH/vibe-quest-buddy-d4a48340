import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Target, Trophy, Sparkles, ChevronRight, ChevronLeft, Crown, CheckCircle, Calendar, Users, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

const WelcomeTutorial = ({ onComplete }: { onComplete: () => void }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);

  const steps = [
    { icon: Flame, title: t('tutorial.welcome'), description: t('tutorial.welcomeDesc') },
    { icon: Target, title: t('tutorial.missions'), description: t('tutorial.missionsDesc') },
    { icon: CheckCircle, title: t('tutorial.customMissions'), description: t('tutorial.customMissionsDesc') },
    { icon: Calendar, title: t('tutorial.checkIn'), description: t('tutorial.checkInDesc') },
    { icon: Trophy, title: t('tutorial.streaks'), description: t('tutorial.streaksDesc') },
    { icon: BarChart3, title: t('tutorial.progress'), description: t('tutorial.progressDesc') },
    { icon: Crown, title: t('tutorial.leaderboard'), description: t('tutorial.leaderboardDesc') },
    { icon: Users, title: t('tutorial.friends'), description: t('tutorial.friendsDesc') },
    { icon: Sparkles, title: t('tutorial.ai'), description: t('tutorial.aiDesc') },
  ];

  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  const finish = () => {
    localStorage.setItem('questup_onboarding_complete', 'true');
    onComplete();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md glass-card rounded-2xl p-8 shadow-2xl">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.25 }} className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4">
              <Icon className="text-primary-foreground" size={32} />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">{current.title}</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">{current.description}</p>
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-center gap-2 mt-6">
          {steps.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === step ? 'bg-primary w-6' : 'bg-muted-foreground/30'}`} />
          ))}
        </div>

        <div className="flex items-center justify-between mt-6">
          <Button variant="ghost" size="sm" onClick={() => setStep(s => s - 1)} disabled={step === 0} className="text-muted-foreground">
            <ChevronLeft size={16} /> {t('tutorial.back')}
          </Button>
          {isLast ? (
            <Button onClick={finish} className="gradient-primary border-0 text-primary-foreground font-semibold px-6">{t('tutorial.getStarted')}</Button>
          ) : (
            <Button onClick={() => setStep(s => s + 1)} className="gradient-primary border-0 text-primary-foreground font-semibold">{t('tutorial.next')} <ChevronRight size={16} /></Button>
          )}
        </div>

        <button onClick={finish} className="block mx-auto mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors">{t('tutorial.skip')}</button>
      </motion.div>
    </motion.div>
  );
};

export default WelcomeTutorial;
