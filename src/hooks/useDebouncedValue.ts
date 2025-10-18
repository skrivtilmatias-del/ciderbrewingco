import { useState, useEffect } from 'react';

/**
 * Debounces a value by delaying updates until the value stops changing
 * for the specified delay period.
 * 
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns The debounced value
 * 
 * @example
 * const searchQuery = useDebouncedValue(inputValue, 300);
 * // searchQuery only updates 300ms after inputValue stops changing
 */
export const useDebouncedValue = <T,>(value: T, delay: number = 300): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};
