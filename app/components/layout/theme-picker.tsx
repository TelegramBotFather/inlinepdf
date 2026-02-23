import { useEffect, useState } from 'react';

import { Button } from '~/components/ui/button';
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
      <div className="inline-flex items-center rounded-full border border-border bg-muted/40 p-0.5">
      {themePreferences.map((value) => (
        <Button
          key={value}
          type="button"
          size="xs"
          variant={theme === value ? 'default' : 'ghost'}
          aria-pressed={theme === value}
          onClick={() => {
            handleThemeSelect(value);
          }}
          className={cn(
            'h-7 rounded-full px-2 text-xs',
            theme === value
              ? 'shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {themeOptionLabels[value]}
        </Button>
      ))}
    </div>
  );
}
