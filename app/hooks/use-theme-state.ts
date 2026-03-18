import { useSyncExternalStore } from 'react';
import { useRouteLoaderData } from 'react-router';

import type { loader as rootLoader } from '~/root';
import {
  applyThemePreference,
  defaultResolvedTheme,
  defaultThemePreference,
  getThemePreference,
  readThemeStateFromDocument,
  subscribeToSystemThemeChanges,
  subscribeToThemeChanges,
  type ThemeState,
} from '~/lib/theme';

let cachedSnapshot: ThemeState | null = null;

function getThemeSnapshot(): ThemeState {
  const nextSnapshot = readThemeStateFromDocument();
  const previousSnapshot = cachedSnapshot;

  if (previousSnapshot?.preference === nextSnapshot.preference) {
    if (previousSnapshot.resolvedTheme === nextSnapshot.resolvedTheme) {
      return previousSnapshot;
    }
  }

  cachedSnapshot = nextSnapshot;
  return nextSnapshot;
}

function subscribe(onStoreChange: () => void): () => void {
  const unsubscribeThemeChanges = subscribeToThemeChanges(() => {
    onStoreChange();
  });
  const unsubscribeSystemThemeChanges = subscribeToSystemThemeChanges(() => {
    if (getThemePreference() === 'auto') {
      applyThemePreference('auto');
    }
  });

  return () => {
    unsubscribeThemeChanges();
    unsubscribeSystemThemeChanges();
  };
}

export function useThemeState(): ThemeState {
  const rootData = useRouteLoaderData<typeof rootLoader>('root');

  return useSyncExternalStore(subscribe, getThemeSnapshot, () => ({
    preference: rootData?.preference ?? defaultThemePreference,
    resolvedTheme: rootData?.resolvedTheme ?? defaultResolvedTheme,
  }));
}
