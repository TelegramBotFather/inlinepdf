import { ToggleGroup, ToggleGroupItem } from '~/components/ui/toggle-group';
import {
  setThemePreference,
  themePreferences,
  type ThemePreference,
} from '~/lib/theme';
import { useThemeState } from '~/hooks/use-theme-state';

const themeOptionLabels: Record<ThemePreference, string> = {
  light: 'Light',
  dark: 'Dark',
  auto: 'Auto',
};

export function ThemePicker() {
  const { preference: theme } = useThemeState();

  function handleThemeSelect(nextTheme: ThemePreference) {
    if (nextTheme === theme) {
      return;
    }

    setThemePreference(nextTheme);
  }

  return (
    <ToggleGroup
      aria-label="Theme Preference"
      value={[theme]}
      onValueChange={(nextValue) => {
        const nextTheme = nextValue[0];
        if (
          nextTheme &&
          themePreferences.includes(nextTheme as ThemePreference)
        ) {
          handleThemeSelect(nextTheme as ThemePreference);
        }
      }}
      variant="outline"
      size="sm"
      spacing={0}
      className="rounded-md border border-input bg-background/50 p-0.5 supports-[backdrop-filter]:bg-background/40"
    >
      {themePreferences.map((value) => (
        <ToggleGroupItem key={value} value={value}>
          {themeOptionLabels[value]}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
