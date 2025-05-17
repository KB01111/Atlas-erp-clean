import { useState, useEffect, useCallback } from 'react';

interface PerformanceOptimizationOptions {
  lowEndThreshold?: number; // CPU benchmark score threshold for low-end devices
  memoryThreshold?: number; // Memory threshold in MB for low-end devices
  batteryThreshold?: number; // Battery threshold percentage for power saving mode
  enablePowerSaving?: boolean; // Whether to enable power saving mode
  enableReducedMotion?: boolean; // Whether to respect reduced motion preferences
}

interface PerformanceOptimizationResult {
  isLowEndDevice: boolean;
  isPowerSavingMode: boolean;
  shouldReduceMotion: boolean;
  deviceCapabilityScore: number;
  optimizeAnimation: (complexity: 'low' | 'medium' | 'high') => boolean;
  optimizeRendering: (elements: number) => boolean;
  optimizePolling: (defaultInterval: number) => number;
}

/**
 * Hook for optimizing performance based on device capabilities
 */
export function usePerformanceOptimization(
  options: PerformanceOptimizationOptions = {}
): PerformanceOptimizationResult {
  const {
    lowEndThreshold = 50,
    memoryThreshold = 4096, // 4GB
    batteryThreshold = 20,
    enablePowerSaving = true,
    enableReducedMotion = true,
  } = options;

  const [isLowEndDevice, setIsLowEndDevice] = useState(false);
  const [isPowerSavingMode, setIsPowerSavingMode] = useState(false);
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);
  const [deviceCapabilityScore, setDeviceCapabilityScore] = useState(100);

  // Detect device capabilities on mount
  useEffect(() => {
    // Check for reduced motion preference
    if (enableReducedMotion && window.matchMedia) {
      const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setShouldReduceMotion(motionQuery.matches);

      // Listen for changes
      const handleMotionChange = (event: MediaQueryListEvent) => {
        setShouldReduceMotion(event.matches);
      };

      // Modern browsers
      if (motionQuery.addEventListener) {
        motionQuery.addEventListener('change', handleMotionChange);
        return () => {
          motionQuery.removeEventListener('change', handleMotionChange);
        };
      }
      // Older browsers
      else if ('addListener' in motionQuery) {
        // @ts-ignore - For older browsers
        motionQuery.addListener(handleMotionChange);
        return () => {
          // @ts-ignore - For older browsers
          motionQuery.removeListener(handleMotionChange);
        };
      }
    }
  }, [enableReducedMotion]);

  // Detect device performance capabilities
  useEffect(() => {
    // Simple benchmark to estimate device performance
    const startTime = performance.now();
    let result = 0;
    
    // Simple computation benchmark
    for (let i = 0; i < 1000000; i++) {
      result += Math.sqrt(i);
    }
    
    const endTime = performance.now();
    const benchmarkTime = endTime - startTime;
    
    // Calculate a score (lower time = higher score)
    // Normalize to a 0-100 scale where 100 is very fast
    const performanceScore = Math.min(100, Math.max(0, 100 - (benchmarkTime / 50)));
    
    // Check for memory constraints
    let memoryScore = 100;
    if (navigator.deviceMemory) {
      // deviceMemory is in GB
      memoryScore = Math.min(100, (navigator.deviceMemory * 1024 / memoryThreshold) * 100);
    }
    
    // Check for hardware concurrency (CPU cores)
    let concurrencyScore = 100;
    if (navigator.hardwareConcurrency) {
      concurrencyScore = Math.min(100, (navigator.hardwareConcurrency / 8) * 100);
    }
    
    // Calculate overall score
    const overallScore = (performanceScore * 0.5) + (memoryScore * 0.3) + (concurrencyScore * 0.2);
    setDeviceCapabilityScore(Math.round(overallScore));
    
    // Determine if this is a low-end device
    setIsLowEndDevice(overallScore < lowEndThreshold);
    
    // Check for battery status if available
    if (enablePowerSaving && 'getBattery' in navigator) {
      // @ts-ignore - Not all browsers have this API typed
      navigator.getBattery().then((battery: any) => {
        const checkBatteryStatus = () => {
          setIsPowerSavingMode(
            battery.charging === false && battery.level * 100 < batteryThreshold
          );
        };
        
        // Initial check
        checkBatteryStatus();
        
        // Listen for changes
        battery.addEventListener('levelchange', checkBatteryStatus);
        battery.addEventListener('chargingchange', checkBatteryStatus);
        
        return () => {
          battery.removeEventListener('levelchange', checkBatteryStatus);
          battery.removeEventListener('chargingchange', checkBatteryStatus);
        };
      }).catch(() => {
        // Battery API not available or permission denied
        setIsPowerSavingMode(false);
      });
    }
  }, [lowEndThreshold, memoryThreshold, batteryThreshold, enablePowerSaving]);

  // Function to determine if a specific animation should be shown based on complexity
  const optimizeAnimation = useCallback(
    (complexity: 'low' | 'medium' | 'high'): boolean => {
      if (shouldReduceMotion) {
        return complexity === 'low';
      }
      
      if (isPowerSavingMode) {
        return complexity === 'low';
      }
      
      if (isLowEndDevice) {
        return complexity !== 'high';
      }
      
      return true;
    },
    [isLowEndDevice, isPowerSavingMode, shouldReduceMotion]
  );

  // Function to determine if rendering should be optimized based on number of elements
  const optimizeRendering = useCallback(
    (elements: number): boolean => {
      if (isLowEndDevice) {
        return elements <= 50;
      }
      
      if (isPowerSavingMode) {
        return elements <= 100;
      }
      
      return elements <= 500;
    },
    [isLowEndDevice, isPowerSavingMode]
  );

  // Function to adjust polling intervals based on device capabilities
  const optimizePolling = useCallback(
    (defaultInterval: number): number => {
      if (isLowEndDevice) {
        return defaultInterval * 2; // Double the interval for low-end devices
      }
      
      if (isPowerSavingMode) {
        return defaultInterval * 1.5; // Increase by 50% for power saving
      }
      
      return defaultInterval;
    },
    [isLowEndDevice, isPowerSavingMode]
  );

  return {
    isLowEndDevice,
    isPowerSavingMode,
    shouldReduceMotion,
    deviceCapabilityScore,
    optimizeAnimation,
    optimizeRendering,
    optimizePolling,
  };
}
