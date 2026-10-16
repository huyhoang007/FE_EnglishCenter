/**
 * useLocalStorage — hook đồng bộ state với localStorage
 * -----------------------------------------------------------
 * Tách ra từ hooks/index.ts cũ để cho phép nhiều file dùng
 * cùng key mà không bị đè value.
 */

import { useCallback, useEffect, useState } from 'react';

export function useLocalStorageState<T>(
  key: string,
  initial: T,
): [T, (next: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [key, state]);

  // Stable setter that always reads latest
  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      setState((prev) =>
        typeof next === 'function'
          ? (next as (prev: T) => T)(prev)
          : next,
      );
    },
    [],
  );

  return [state, setValue];
}
