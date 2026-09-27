import { useState, useEffect } from 'react';

export type ThemeMode = 'dark' | 'light';
export type UIMode = 'standard' | 'low';

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('convertiq_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark'; // Default sleek dark theme
  });

  const [uiMode, setUiMode] = useState<UIMode>(() => {
    const saved = localStorage.getItem('convertiq_uimode');
    if (saved === 'low' || saved === 'standard') return saved;
    return 'standard';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('convertiq_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('convertiq_uimode', uiMode);
  }, [uiMode]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const toggleUiMode = () => {
    setUiMode((prev) => (prev === 'standard' ? 'low' : 'standard'));
  };

  return {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
    uiMode,
    isLowUi: uiMode === 'low',
    toggleUiMode,
  };
}
