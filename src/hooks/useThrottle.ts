import { useCallback, useRef } from 'react';

/**
 * Custom hook for throttling function calls
 * @param callback The function to throttle
 * @param delay The minimum time between function calls in milliseconds
 * @returns A throttled version of the callback function
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 3000
): (...args: Parameters<T>) => void {
  // Use a ref to track the last time the function was called
  const lastCallTimeRef = useRef<number>(0);
  // Use a ref to track if there's a pending call
  const isThrottledRef = useRef<boolean>(false);

  // Return a memoized version of the throttled function
  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallTimeRef.current;

      // If we're already throttled or it's too soon since the last call
      if (isThrottledRef.current || timeSinceLastCall < delay) {
        // Don't call the function
        console.log(`Function call throttled. Please wait ${delay - timeSinceLastCall}ms before trying again.`);
        return;
      }

      // Update the last call time
      lastCallTimeRef.current = now;
      // Set throttled state to true
      isThrottledRef.current = true;

      // Call the original function
      callback(...args);

      // Reset the throttled state after the delay
      setTimeout(() => {
        isThrottledRef.current = false;
      }, delay);
    },
    [callback, delay]
  );
}

/**
 * Custom hook for debouncing function calls
 * @param callback The function to debounce
 * @param delay The delay in milliseconds
 * @returns A debounced version of the callback function
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
): (...args: Parameters<T>) => void {
  // Use a ref to track the timeout ID
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Return a memoized version of the debounced function
  return useCallback(
    (...args: Parameters<T>) => {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set a new timeout
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
}

/**
 * Custom hook that provides both throttled and debounced versions of a callback
 * @param callback The function to throttle and debounce
 * @param throttleDelay The minimum time between throttled function calls in milliseconds
 * @param debounceDelay The delay for debounced function calls in milliseconds
 * @returns An object with throttled and debounced versions of the callback
 */
export function useRateLimited<T extends (...args: any[]) => any>(
  callback: T,
  throttleDelay: number = 3000,
  debounceDelay: number = 500
): {
  throttled: (...args: Parameters<T>) => void;
  debounced: (...args: Parameters<T>) => void;
} {
  const throttled = useThrottle(callback, throttleDelay);
  const debounced = useDebounce(callback, debounceDelay);

  return { throttled, debounced };
}

export default useThrottle;
