"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Debounce a value. Useful for search inputs to avoid firing on every keystroke.
 * @param value - The value to debounce
 * @param delayMs - Delay in milliseconds (e.g. 300)
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}

/**
 * Debounced callback. Returns a stable function that invokes the latest fn after delay.
 */
export function useDebouncedCallback<A extends unknown[]>(
  fn: (...args: A) => void,
  delayMs: number
): (...args: A) => void {
  const timeoutRef = { current: null as ReturnType<typeof setTimeout> | null };
  const fnRef = { current: fn };
  fnRef.current = fn;

  return useCallback(
    (...args: A) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        fnRef.current(...args);
        timeoutRef.current = null;
      }, delayMs);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refs are stable, fn updated via fnRef.current
    [delayMs]
  );
}
