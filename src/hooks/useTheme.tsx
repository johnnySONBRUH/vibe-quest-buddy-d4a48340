import { useEffect, useState, useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'questup_theme';
const listeners = new Set<() => void>();

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'dark';
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

let currentTheme: Theme = getInitialTheme();

const applyTheme = (theme: Theme) => {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
};

const setThemeGlobal = (theme: Theme) => {
  currentTheme = theme;
  localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
  listeners.forEach((l) => l());
};

// Apply on module load so theme is set immediately on app start
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
    toggleTheme: () => setThemeGlobal(currentTheme === 'dark' ? 'light' : 'dark'),
    setTheme: setThemeGlobal,
  };
};
