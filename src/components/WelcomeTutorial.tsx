import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Target, Trophy, Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const steps = [
  {
    icon: Flame,
    title: 'Welcome to QuestUp! 🎮',
    description: 'Your student life is about to level up. Complete daily missions, earn XP, and build streaks to become the best version of yourself.',
    color: 'text-primary',
  },
  {
    icon: Target,
    title: 'Daily Missions 🎯',
    description: 'Every day you get fresh missions across Study, Exercise, Social, Creative, and Wellness categories. Difficulty scales gently as you grow stronger.',
    color: 'text-secondary',
  },
  {
    icon: Trophy,
    title: 'Streaks & Achievements 🏆',
    description: 'Complete missions daily to build your streak. Hit milestones at 7, 30, and 100 days to unlock achievement badges and bragging rights!',
    color: 'text-accent',
  },
  {
    icon: Sparkles,
    title: 'Your AI Companion 🤖',
    description: 'QuestUp AI is your personal coach, study helper, planner, and cheerleader. Ask it anything — from study tips to workout ideas!',
    color: 'text-primary',
  },
];

const WelcomeTutorial = ({ onComplete }: { onComplete: () => void }) => {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  const finish = () => {
    localStorage.setItem('questup_onboarding_complete', 'true');
    onComplete();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md glass-card rounded-2xl p-8 shadow-2xl"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className="text-center"
          >
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4`}>
              <Icon className="text-primary-foreground" size={32} />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">{current.title}</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">{current.description}</p>
          </motion.div>
        </AnimatePresence>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${i === step ? 'bg-primary w-6' : 'bg-muted-foreground/30'}`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className="text-muted-foreground"
          >
            <ChevronLeft size={16} /> Back
          </Button>

          {isLast ? (
            <Button onClick={finish} className="gradient-primary border-0 text-primary-foreground font-semibold px-6">
              Get Started! 🚀
            </Button>
          ) : (
            <Button onClick={() => setStep(s => s + 1)} className="gradient-primary border-0 text-primary-foreground font-semibold">
              Next <ChevronRight size={16} />
            </Button>
          )}
        </div>

        <button onClick={finish} className="block mx-auto mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors">
          Skip tutorial
        </button>
      </motion.div>
    </motion.div>
  );
};

export default WelcomeTutorial;
