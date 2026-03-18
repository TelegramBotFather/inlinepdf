import { cn } from '~/lib/utils';
import { startNativeViewTransition } from '~/lib/view-transition';
import { setThemePreference, type ThemePreference } from '~/lib/theme';
import { useThemeState } from '~/hooks/use-theme-state';

const themeOptions = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'Auto', value: 'auto' },
] as const satisfies readonly {
  label: string;
  value: ThemePreference;
}[];

export function ThemePicker() {
  const { preference } = useThemeState();

  function handleThemeChange(nextTheme: ThemePreference) {
    if (nextTheme === preference) {
      return;
    }

    startNativeViewTransition(() => {
      setThemePreference(nextTheme);
    });
  }

  return (
    <div className="border-input flex h-6 items-center rounded-xl border p-0.5 sm:h-7">
      {themeOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => {
            handleThemeChange(option.value);
          }}
          className={cn(
            'min-w-[2.8rem] rounded-lg px-1 py-0.5 text-[10px] font-medium transition-all sm:min-w-12 sm:px-2 sm:text-xs',
            preference === option.value
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
