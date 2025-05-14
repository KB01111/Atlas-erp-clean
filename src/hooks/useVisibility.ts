"use client";

import { useEffect, useRef } from 'react';

/**
 * A custom hook that tracks document visibility state.
 * 
 * This hook is useful for pausing animations, timers, or other resource-intensive
 * operations when the page is not visible to the user (e.g., when the tab is in the background).
 * 
 * @returns {React.MutableRefObject<boolean>} A ref object containing the current visibility state
 */
export function useVisibility() {
  const isVisibleRef = useRef<boolean>(true);

  useEffect(() => {
    // Set initial state based on current document visibility
    isVisibleRef.current = document.visibilityState === 'visible';

    // Handler for visibility change events
    const handleVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === 'visible';
    };

    // Add event listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Clean up
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisibleRef;
}

/**
 * A custom hook that provides a throttled version of a function using requestAnimationFrame.
 * 
 * This is useful for performance-intensive operations like mouse movement tracking.
 * 
 * @returns {Object} An object containing the RAF reference and a throttle function
 */
export function useRafThrottle() {
  const rafRef = useRef<number | null>(null);

  // Clean up any pending animation frames on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // Throttle function that uses requestAnimationFrame
  const throttle = (callback: () => void) => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      callback();
      rafRef.current = null;
    });
  };

  return { rafRef, throttle };
}
