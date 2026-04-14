import { motion } from 'framer-motion';
import { BookOpen, Dumbbell, Users, Palette, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const categoryConfig = [
  { key: 'all', icon: null },
  { key: 'study', icon: BookOpen },
  { key: 'exercise', icon: Dumbbell },
  { key: 'social', icon: Users },
  { key: 'creative', icon: Palette },
  { key: 'wellness', icon: Heart },
];

interface CategoryFilterProps {
  selected: string;
  onSelect: (cat: string) => void;
}

const CategoryFilter = ({ selected, onSelect }: CategoryFilterProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {categoryConfig.map(({ key, icon: Icon }) => (
        <motion.button
          key={key}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(key)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
            selected === key
              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
              : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
          }`}
        >
          {Icon && <Icon size={13} />}
          {key === 'all' ? t('history.all') : t(`categories.${key}`)}
        </motion.button>
      ))}
    </div>
  );
};

export default CategoryFilter;
