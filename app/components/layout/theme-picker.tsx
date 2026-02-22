import { useEffect, useState } from 'react';

import { cn } from '~/lib/utils';
import {
  applyThemePreference,
  getThemePreference,
  setThemePreference,
  subscribeToSystemThemeChanges,
  themePreferences,
  type ThemePreference,
} from '~/lib/theme';

const themeOptionLabels: Record<ThemePreference, string> = {
  light: 'Light',
  dark: 'Dark',
  auto: 'Auto',
};

export function ThemePicker() {
  const [theme, setTheme] = useState<ThemePreference>(() =>
    getThemePreference(),
  );

  useEffect(() => {
    applyThemePreference(theme);
  }, [theme]);

  useEffect(() => {
    return subscribeToSystemThemeChanges(() => {
      if (theme === 'auto') {
        applyThemePreference('auto');
      }
    });
  }, [theme]);

  function handleThemeSelect(nextTheme: ThemePreference) {
    setTheme(nextTheme);
    setThemePreference(nextTheme);
  }

  return (
    <div className="inline-flex items-center rounded-full border border-border bg-background/80 p-0.5 shadow-sm">
      {themePreferences.map((value) => (
        <button
          key={value}
          type="button"
          aria-pressed={theme === value}
          onClick={() => {
            handleThemeSelect(value);
          }}
          className={cn(
            'rounded-full px-3 py-1 text-sm font-medium transition-colors',
            theme === value
              ? 'bg-secondary text-secondary-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {themeOptionLabels[value]}
        </button>
      ))}
    </div>
  );
}
