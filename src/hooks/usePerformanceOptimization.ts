"use client";

import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for performance optimization in React components.
 *
 * This hook provides:
 * 1. Visibility detection (document visibility API)
 * 2. Viewport detection (IntersectionObserver)
 * 3. RAF-based throttling for expensive operations
 * 4. Device capability detection
 *
 * @returns An object with optimization utilities
 */
export function usePerformanceOptimization() {
  // Track if the document is visible (tab is active)
  const isVisibleRef = useRef<boolean>(true);

  // Track if the component is in viewport
  const isInViewportRef = useRef<boolean>(false);

  // Reference for requestAnimationFrame
  const rafRef = useRef<number | null>(null);

  // Reference for the observer
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Detect if the device is low-end
  const isLowEndDevice = useRef<boolean>(false);

  // Initialize isLowEndDevice in useEffect to avoid SSR issues
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      isLowEndDevice.current = (
        (navigator.deviceMemory && navigator.deviceMemory < 4) ||
        (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      );
    }
  }, []);

  // Set up visibility detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === 'visible';
    };

    // Set initial value
    isVisibleRef.current = document.visibilityState === 'visible';

    // Add event listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Clean up
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Function to observe an element for viewport visibility
  const observeElement = useCallback((element: Element | null) => {
    if (!element) return;

    // Clean up previous observer if it exists
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create new observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        isInViewportRef.current = entries[0]?.isIntersecting ?? false;
      },
      { threshold: 0.1 }
    );

    // Start observing
    observerRef.current.observe(element);
  }, []);

  // Throttle function using requestAnimationFrame
  const throttle = useCallback((callback: () => void) => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      callback();
      rafRef.current = null;
    });
  }, []);

  // Clean up RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, []);

  return {
    isVisibleRef,
    isInViewportRef,
    isLowEndDevice: isLowEndDevice.current,
    observeElement,
    throttle
  };
}
