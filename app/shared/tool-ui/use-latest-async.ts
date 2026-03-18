import { startTransition, useCallback, useMemo, useRef } from 'react';

export function useLatestAsyncId<T>() {
  const activeIdRef = useRef<T | null>(null);

  const activate = useCallback((id: T): T => {
    activeIdRef.current = id;
    return id;
  }, []);

  const clear = useCallback((): void => {
    activeIdRef.current = null;
  }, []);

  const isActive = useCallback((id: T): boolean => {
    return activeIdRef.current === id;
  }, []);

  return useMemo(
    () => ({
      activate,
      clear,
      isActive,
    }),
    [activate, clear, isActive],
  );
}

export function useLatestAsyncToken() {
  const tokenRef = useRef(0);

  const begin = useCallback((): number => {
    tokenRef.current += 1;
    return tokenRef.current;
  }, []);

  const invalidate = useCallback((): void => {
    tokenRef.current += 1;
  }, []);

  const isCurrent = useCallback((token: number): boolean => {
    return tokenRef.current === token;
  }, []);

  const current = useCallback((): number => {
    return tokenRef.current;
  }, []);

  return useMemo(
    () => ({
      begin,
      invalidate,
      isCurrent,
      current,
    }),
    [begin, invalidate, isCurrent, current],
  );
}

export function useDeferredDispatch<T>(dispatch: (action: T) => void) {
  return useCallback(
    (action: T) => {
      startTransition(() => {
        dispatch(action);
      });
    },
    [dispatch],
  );
}
