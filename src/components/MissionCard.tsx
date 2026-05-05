import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, BookOpen, Brain, Dumbbell, Footprints, Heart, Phone, Users, PenTool, Lightbulb, Sparkles, Droplets, Moon, Star, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Tables } from '@/integrations/supabase/types';

type Mission = Tables<'missions'>;
type DailyMission = Tables<'daily_missions'> & { missions: Mission };

const iconMap: Record<string, React.ElementType> = {
  'book-open': BookOpen, 'book': BookOpen, 'brain': Brain, 'dumbbell': Dumbbell, 'footprints': Footprints,
  'heart': Heart, 'phone': Phone, 'users': Users, 'pen-tool': PenTool, 'lightbulb': Lightbulb,
  'sparkles': Sparkles, 'droplets': Droplets, 'moon': Moon, 'star': Star,
};

const categoryColors: Record<string, string> = {
  study: 'mission-study', exercise: 'mission-exercise', social: 'mission-social', creative: 'mission-creative', wellness: 'mission-wellness',
};

const categoryTextColors: Record<string, string> = {
  study: 'text-study', exercise: 'text-exercise', social: 'text-social', creative: 'text-creative', wellness: 'text-wellness',
};

interface MissionCardProps {
  dailyMission: DailyMission;
  onComplete: (id: string) => void;
  index: number;
}

const MissionCard = ({ dailyMission, onComplete, index }: MissionCardProps) => {
  const { t } = useTranslation();
  const { missions: mission, completed, difficulty_level, xp_earned } = dailyMission;
  const Icon = iconMap[mission.icon] || Star;
  const cat = mission.category;
  const xpValue = completed ? xp_earned : Math.round(mission.xp_reward * (1 + difficulty_level * 0.1));

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }}
      className={`rounded-xl border p-4 ${categoryColors[cat]} transition-all ${completed ? 'opacity-70' : 'hover:shadow-md cursor-pointer'}`}
      onClick={() => !completed && onComplete(dailyMission.id)}
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${completed ? 'bg-success/20' : categoryColors[cat]}`}>
          {completed ? (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
              <Check className="text-success" size={24} />
            </motion.div>
          ) : (
            <Icon className={categoryTextColors[cat]} size={24} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold ${completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{mission.title}</h3>
          <p className="text-sm text-muted-foreground truncate">{mission.description}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryColors[cat]} ${categoryTextColors[cat]}`}>
              {t(`categories.${cat}`)}
            </span>
            <span className="text-xs text-muted-foreground">{t('mission.level', { level: difficulty_level })}</span>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-lg font-bold ${completed ? 'text-success' : 'text-accent-foreground'}`}>+{xpValue}</span>
          <p className="text-xs text-muted-foreground">{t('mission.xp')}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default MissionCard;
