import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, LogOut, Trophy, Zap, Sun, Moon, BarChart3, History } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMissions } from '@/hooks/useMissions';
import { useTheme } from '@/hooks/useTheme';
import StreakBadge from '@/components/StreakBadge';
import ProgressRing from '@/components/ProgressRing';
import MissionCard from '@/components/MissionCard';
import AIMotivator from '@/components/AIMotivator';
import AchievementBadges from '@/components/AchievementBadges';
import WelcomeTutorial from '@/components/WelcomeTutorial';
import Progress from '@/pages/Progress';
import MissionHistory from '@/pages/MissionHistory';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { dailyMissions, profile, loading, completeMission, completedCount, totalCount, progressPercent } = useMissions();
  const { theme, toggleTheme } = useTheme();
  const [showTutorial, setShowTutorial] = useState(
    () => !localStorage.getItem('questup_onboarding_complete')
  );
  const [showProgress, setShowProgress] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  if (showHistory) {
    return <MissionHistory onBack={() => setShowHistory(false)} />;
  }
  if (showProgress) {
    return <Progress onBack={() => setShowProgress(false)} />;
  }
  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background p-6 max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  const level = Math.floor(profile.total_xp / 100) + 1;
  const xpInLevel = profile.total_xp % 100;

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence>
        {showTutorial && <WelcomeTutorial onComplete={() => setShowTutorial(false)} />}
      </AnimatePresence>

      <div className="max-w-2xl mx-auto p-4 sm:p-6 pb-24 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Flame className="text-primary-foreground" size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Hey, {profile.display_name || 'Student'}! 👋
              </h1>
              <p className="text-sm text-muted-foreground">Day {profile.current_day} of your journey</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setShowHistory(true)} className="text-muted-foreground">
              <History size={20} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShowProgress(true)} className="text-muted-foreground">
              <BarChart3 size={20} />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut} className="text-muted-foreground">
              <LogOut size={20} />
            </Button>
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3"
        >
          <div className="glass-card rounded-xl p-4 text-center">
            <Trophy className="mx-auto text-accent mb-1" size={20} />
            <p className="text-xl font-bold text-foreground">Lvl {level}</p>
            <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full gradient-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${xpInLevel}%` }}
              />
            </div>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <Zap className="mx-auto text-primary mb-1" size={20} />
            <p className="text-xl font-bold text-foreground">{profile.total_xp}</p>
            <p className="text-xs text-muted-foreground">Total XP</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <Flame className="mx-auto text-streak mb-1" size={20} />
            <p className="text-xl font-bold text-foreground">{profile.current_streak}</p>
            <p className="text-xs text-muted-foreground">Streak</p>
          </div>
        </motion.div>

        <StreakBadge streak={profile.current_streak} longestStreak={profile.longest_streak} />
        <AchievementBadges longestStreak={profile.longest_streak} currentStreak={profile.current_streak} />
        <ProgressRing percent={progressPercent} completed={completedCount} total={totalCount} />

        {/* Daily Missions */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-3">Today's Missions</h2>
          <div className="space-y-3">
            {dailyMissions.map((dm, i) => (
              <MissionCard key={dm.id} dailyMission={dm} onComplete={completeMission} index={i} />
            ))}
          </div>
        </div>
      </div>

      <AIMotivator
        streak={profile.current_streak}
        completedMissions={completedCount}
        totalMissions={totalCount}
        totalXp={profile.total_xp}
      />
    </div>
  );
};

export default Dashboard;
