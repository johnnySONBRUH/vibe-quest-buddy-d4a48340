import { motion } from 'framer-motion';
import { Award, Lock, Star, Flame, Crown, Rocket, Target, Gem, Sparkles } from 'lucide-react';
import ShareButton from '@/components/ShareButton';

interface Milestone {
  days: number;
  label: string;
  icon: React.ElementType;
  color: string;
  glow: string;
}

const milestones: Milestone[] = [
  { days: 3, label: 'Starter', icon: Rocket, color: 'hsl(var(--success))', glow: 'hsl(var(--success) / 0.4)' },
  { days: 7, label: 'Week Warrior', icon: Target, color: 'hsl(var(--primary))', glow: 'hsl(var(--primary) / 0.4)' },
  { days: 14, label: 'Committed', icon: Star, color: 'hsl(var(--accent))', glow: 'hsl(var(--accent) / 0.4)' },
  { days: 30, label: 'Monthly Master', icon: Flame, color: 'hsl(var(--streak))', glow: 'hsl(var(--streak) / 0.4)' },
  { days: 60, label: 'Unstoppable', icon: Gem, color: 'hsl(var(--secondary))', glow: 'hsl(var(--secondary) / 0.4)' },
  { days: 100, label: 'Centurion', icon: Crown, color: 'hsl(var(--primary))', glow: 'hsl(var(--primary) / 0.4)' },
  { days: 365, label: 'Legend', icon: Sparkles, color: 'hsl(var(--accent))', glow: 'hsl(var(--accent) / 0.4)' },
];

interface AchievementBadgesProps {
  longestStreak: number;
  currentStreak: number;
}

const AchievementBadges = ({ longestStreak, currentStreak }: AchievementBadgesProps) => {
  const unlockedCount = milestones.filter(m => longestStreak >= m.days).length;
  const unlockedNames = milestones.filter(m => longestStreak >= m.days).map(m => m.label);
  const shareText = unlockedCount > 0
    ? `🎖️ I've unlocked ${unlockedCount}/${milestones.length} achievements on QuestUp: ${unlockedNames.join(', ')}! My streak: ${currentStreak} days 🔥`
    : `🎯 Starting my QuestUp journey! ${milestones.length} achievements to unlock. Let's go!`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card rounded-2xl p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <Award className="text-accent" size={20} />
        <h3 className="text-base font-bold text-foreground">Achievements</h3>
        <span className="ml-auto text-xs font-medium text-muted-foreground">
          {unlockedCount}/{milestones.length} unlocked
        </span>
        <ShareButton text={shareText} title="My QuestUp Achievements" />
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
        {milestones.map((milestone, i) => {
          const unlocked = longestStreak >= milestone.days;
          const justUnlocked = currentStreak === milestone.days;
          const Icon = milestone.icon;

          return (
            <motion.div
              key={milestone.days}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.05 * i }}
              className="flex flex-col items-center gap-1.5 group relative"
            >
              {/* Badge circle */}
              <motion.div
                className={`relative w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  unlocked
                    ? 'border-transparent shadow-lg'
                    : 'border-dashed border-muted-foreground/30 bg-muted/50'
                }`}
                style={unlocked ? {
                  background: `linear-gradient(135deg, ${milestone.color}, ${milestone.color}dd)`,
                  boxShadow: `0 4px 15px ${milestone.glow}`,
                } : {}}
                animate={justUnlocked ? {
                  scale: [1, 1.15, 1],
                  boxShadow: [
                    `0 0 0px ${milestone.glow}`,
                    `0 0 25px ${milestone.glow}`,
                    `0 0 10px ${milestone.glow}`,
                  ],
                } : {}}
                transition={justUnlocked ? { duration: 1.5, repeat: Infinity } : {}}
                whileHover={unlocked ? { scale: 1.1 } : {}}
              >
                {unlocked ? (
                  <Icon size={20} className="text-primary-foreground" />
                ) : (
                  <Lock size={16} className="text-muted-foreground/50" />
                )}
              </motion.div>

              {/* Label */}
              <div className="text-center">
                <p className={`text-[10px] font-semibold leading-tight ${
                  unlocked ? 'text-foreground' : 'text-muted-foreground/60'
                }`}>
                  {milestone.label}
                </p>
                <p className={`text-[9px] ${
                  unlocked ? 'text-muted-foreground' : 'text-muted-foreground/40'
                }`}>
                  {milestone.days}d
                </p>
              </div>

              {/* Tooltip on hover */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {unlocked ? '✅ Unlocked!' : `${milestone.days - longestStreak} days to go`}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default AchievementBadges;
