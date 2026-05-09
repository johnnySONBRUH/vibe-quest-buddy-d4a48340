import { useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark' | 'ocean' | 'forest' | 'sunset' | 'midnight' | 'sakura';

export const THEMES: { id: Theme; label: string; isDark: boolean; swatch: string[] }[] = [
  { id: 'light', label: 'Coral Light', isDark: false, swatch: ['#F5F6F8', '#F26A3A', '#7A6BE6'] },
  { id: 'dark', label: 'Coral Dark', isDark: true, swatch: ['#0F1620', '#F26A3A', '#7A6BE6'] },
  { id: 'ocean', label: 'Ocean', isDark: true, swatch: ['#0A1F2E', '#1FC3E6', '#3D7BE6'] },
  { id: 'forest', label: 'Forest', isDark: true, swatch: ['#0F1F15', '#3DCC52', '#A6D633'] },
  { id: 'sunset', label: 'Sunset', isDark: false, swatch: ['#FCEEDB', '#F25C25', '#E63D85'] },
  { id: 'midnight', label: 'Midnight', isDark: true, swatch: ['#0E0A1A', '#B547F0', '#4D8CF0'] },
  { id: 'sakura', label: 'Sakura', isDark: false, swatch: ['#FCEAF1', '#E63D75', '#B963D9'] },
];

const STORAGE_KEY = 'questup_theme';
const VALID_THEMES: Theme[] = THEMES.map(t => t.id);
const listeners = new Set<() => void>();

const isDarkTheme = (theme: Theme) => THEMES.find(t => t.id === theme)?.isDark ?? false;

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'dark';
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored && VALID_THEMES.includes(stored)) return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

let currentTheme: Theme = getInitialTheme();

const applyTheme = (theme: Theme) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  root.classList.toggle('dark', isDarkTheme(theme));
};

const setThemeGlobal = (theme: Theme) => {
  currentTheme = theme;
  localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
  listeners.forEach((l) => l());
};

applyTheme(currentTheme);

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export const useTheme = () => {
  const theme = useSyncExternalStore(
    subscribe,
    () => currentTheme,
    () => currentTheme,
  );
  return {
    theme,
    setTheme: setThemeGlobal,
    toggleTheme: () => setThemeGlobal(isDarkTheme(currentTheme) ? 'light' : 'dark'),
  };
};
