import { useCallback, useState } from 'react';

const STORAGE_KEY = 'palette-pick-theme';

export type Theme = 'light' | 'dark';

export function themeColor(theme: Theme): string {
  return theme === 'dark' ? '#131210' : '#f3efe6';
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor(theme));
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage can throw in private mode. The in-memory theme still applies.
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
  );

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      return next;
    });
  }, []);

  return { theme, toggle };
}
