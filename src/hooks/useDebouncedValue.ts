import { useEffect, useState } from 'react';

/**
 * Returns a debounced value: only updates after `value` has not changed
 * for `delay` milliseconds. Useful for search inputs to avoid hammering
 * the API / filtering the list on every keystroke.
 *
 * @param value  The value to debounce (usually TextInput state).
 * @param delay  Wait time in milliseconds. Defaults to 300ms.
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
