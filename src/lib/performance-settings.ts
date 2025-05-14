"use client";

/**
 * Global performance settings for the application.
 * These settings can be adjusted based on the device performance.
 */

// Detect if the device is a low-end device
const isLowEndDevice = () => {
  if (typeof window === 'undefined') return false;
  
  // Check for low memory (less than 4GB)
  const lowMemory = navigator.deviceMemory && navigator.deviceMemory < 4;
  
  // Check for slow CPU (less than 4 cores)
  const slowCPU = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
  
  // Check for mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  return lowMemory || slowCPU || isMobile;
};

// Animation settings
export const ANIMATION_SETTINGS = {
  // Whether animations are enabled
  ENABLED: typeof window !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  
  // Frame rate for animations (lower for better performance)
  FRAME_RATE: isLowEndDevice() ? 10 : 30,
  
  // Animation duration multiplier (higher for slower animations)
  DURATION_MULTIPLIER: isLowEndDevice() ? 2 : 1,
  
  // Whether to use IntersectionObserver to disable animations when not in viewport
  USE_INTERSECTION_OBSERVER: true,
  
  // Whether to disable animations when the tab is not visible
  DISABLE_WHEN_HIDDEN: true,
  
  // Whether to reduce the number of animated elements
  REDUCE_ELEMENTS: isLowEndDevice(),
  
  // Element reduction factor (higher means fewer elements)
  ELEMENT_REDUCTION_FACTOR: isLowEndDevice() ? 4 : 2,
};

// Create a global event to notify components when performance settings change
export const PERFORMANCE_SETTINGS_CHANGED_EVENT = 'performance-settings-changed';

// Function to notify components that performance settings have changed
export const notifyPerformanceSettingsChanged = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PERFORMANCE_SETTINGS_CHANGED_EVENT));
  }
};

// Function to toggle animations globally
export const toggleAnimations = (enabled: boolean) => {
  ANIMATION_SETTINGS.ENABLED = enabled;
  notifyPerformanceSettingsChanged();
};

// Function to set frame rate
export const setFrameRate = (frameRate: number) => {
  ANIMATION_SETTINGS.FRAME_RATE = frameRate;
  notifyPerformanceSettingsChanged();
};

// Function to set duration multiplier
export const setDurationMultiplier = (multiplier: number) => {
  ANIMATION_SETTINGS.DURATION_MULTIPLIER = multiplier;
  notifyPerformanceSettingsChanged();
};

// Hook to listen for performance settings changes
export const usePerformanceSettingsChanged = (callback: () => void) => {
  if (typeof window === 'undefined') return;
  
  window.addEventListener(PERFORMANCE_SETTINGS_CHANGED_EVENT, callback);
  return () => window.removeEventListener(PERFORMANCE_SETTINGS_CHANGED_EVENT, callback);
};
