import { useState, useEffect } from 'react';

/**
 * Hook to debounce a value.
 * Useful for delaying API calls until user stops typing.
 *
 * @param {T} value - The value to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {T} - The debounced value
 *
 * @example
 * const [searchQuery, setSearchQuery] = useState('');
 * const debouncedSearch = useDebounce(searchQuery, 300);
 *
 * useEffect(() => {
 *   fetchResults(debouncedSearch);
 * }, [debouncedSearch]);
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook to throttle a callback function.
 * Ensures the callback is called at most once per interval.
 *
 * @param {Function} callback - Function to throttle
 * @param {number} delay - Minimum time between calls in ms
 * @returns {Function} - Throttled function
 */
export function useThrottle(callback, delay = 1000) {
  const [lastCall, setLastCall] = useState(0);

  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      setLastCall(now);
      callback(...args);
    }
  };
}

export default useDebounce;
