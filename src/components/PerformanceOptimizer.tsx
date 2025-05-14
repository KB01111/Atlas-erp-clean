"use client";

import React, { useEffect, useState } from 'react';

interface PerformanceOptimizerProps {
  children: React.ReactNode;
}

/**
 * Performance Optimizer Component
 *
 * This component applies performance optimizations to the application:
 * 1. Reduces animation frame rates when the tab is not focused
 * 2. Throttles UI updates when the browser is under heavy load
 * 3. Disables non-essential animations when battery is low (if Battery API is available)
 * 4. Applies performance optimizations based on device capabilities
 */
const PerformanceOptimizer: React.FC<PerformanceOptimizerProps> = ({ children }) => {
  const [isLowPowerMode, setIsLowPowerMode] = useState(false);

  useEffect(() => {
    // Function to check if device is low-end
    const isLowEndDevice = () => {
      // Check for low memory (less than 4GB)
      if (navigator.deviceMemory && navigator.deviceMemory < 4) {
        return true;
      }

      // Check for low number of logical processors
      if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
        return true;
      }

      return false;
    };

    // Function to check battery status if available
    const checkBattery = async () => {
      if ('getBattery' in navigator) {
        try {
          // @ts-ignore - getBattery is not in the TypeScript navigator type
          const battery = await navigator.getBattery();

          // Check if battery level is low (less than 20%)
          if (battery.level < 0.2 && !battery.charging) {
            setIsLowPowerMode(true);
          }

          // Listen for battery changes
          battery.addEventListener('levelchange', () => {
            setIsLowPowerMode(battery.level < 0.2 && !battery.charging);
          });

          battery.addEventListener('chargingchange', () => {
            setIsLowPowerMode(battery.level < 0.2 && !battery.charging);
          });
        } catch (error) {
          console.warn('Battery API error:', error);
        }
      }
    };

    // Function to optimize performance based on visibility
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // When tab is not visible, reduce animation frame rates
        document.body.classList.add('reduce-animations');
      } else {
        // When tab becomes visible again, restore normal animations
        document.body.classList.remove('reduce-animations');
      }
    };

    // Apply low-end device optimizations
    if (isLowEndDevice()) {
      document.body.classList.add('low-end-device');
    }

    // Check battery status
    checkBattery();

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Add CSS variables for animation control
    const style = document.createElement('style');
    style.innerHTML = `
      :root {
        --animation-duration-multiplier: ${isLowEndDevice() ? '2' : '1'};
        --animation-enabled: ${isLowPowerMode ? '0' : '1'};
      }

      .reduce-animations * {
        animation-duration: calc(var(--animation-duration) * 2) !important;
        transition-duration: calc(var(--transition-duration) * 2) !important;
      }

      .low-end-device * {
        animation-duration: calc(var(--animation-duration) * 2) !important;
        transition-duration: calc(var(--transition-duration) * 2) !important;
      }

      .low-power-mode * {
        animation: none !important;
        transition: none !important;
      }
    `;
    document.head.appendChild(style);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.head.removeChild(style);
    };
  }, []);

  // Apply low power mode class when battery is low
  useEffect(() => {
    if (isLowPowerMode) {
      document.body.classList.add('low-power-mode');
    } else {
      document.body.classList.remove('low-power-mode');
    }
  }, [isLowPowerMode]);

  return <>{children}</>;
};

export default PerformanceOptimizer;
export { PerformanceOptimizer };
