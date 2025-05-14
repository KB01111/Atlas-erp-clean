"use client";

import { useEffect, useState, useRef } from "react";
import { usePerformanceOptimization } from "@/hooks/usePerformanceOptimization";

interface PerformanceMetrics {
  fps: number;
  memory: {
    jsHeapSizeLimit: number;
    totalJSHeapSize: number;
    usedJSHeapSize: number;
  } | null;
  deviceType: string;
  viewport: {
    width: number;
    height: number;
  };
}

/**
 * A component that monitors and displays performance metrics.
 * This is useful for development and debugging.
 *
 * @returns A component that displays performance metrics
 */
export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    memory: null,
    deviceType: "unknown",
    viewport: { width: 0, height: 0 },
  });

  const [isVisible, setIsVisible] = useState(false);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  // Initialize lastTimeRef in useEffect to avoid SSR issues
  useEffect(() => {
    if (typeof performance !== 'undefined') {
      lastTimeRef.current = performance.now();
    }
  }, []);

  // Use our performance optimization hook
  const { isLowEndDevice } = usePerformanceOptimization();

  // Check if we're in the browser environment
  const isBrowser = typeof window !== 'undefined';

  // Calculate FPS
  useEffect(() => {
    // Only run in browser environment
    if (!isBrowser) return;

    const calculateFPS = (time: number) => {
      frameCountRef.current++;

      const elapsed = time - lastTimeRef.current;

      // Update FPS every second
      if (elapsed >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / elapsed);

        // Get memory info if available
        let memory = null;
        if (performance && 'memory' in performance) {
          memory = {
            jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
            totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
            usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          };
        }

        // Get viewport dimensions
        const viewport = {
          width: window.innerWidth,
          height: window.innerHeight,
        };

        // Determine device type
        const deviceType = isLowEndDevice
          ? "low-end"
          : (window.innerWidth <= 768 ? "mobile" : "desktop");

        setMetrics({
          fps,
          memory,
          deviceType,
          viewport,
        });

        // Reset counters
        frameCountRef.current = 0;
        lastTimeRef.current = time;
      }

      // Continue the loop
      rafRef.current = requestAnimationFrame(calculateFPS);
    };

    // Start the loop
    rafRef.current = requestAnimationFrame(calculateFPS);

    // Clean up
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isLowEndDevice, isBrowser]);

  // Format bytes to human-readable format
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Toggle visibility
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={toggleVisibility}
        className="fixed bottom-4 right-4 z-50 rounded-full bg-gray-800 p-2 text-white opacity-50 hover:opacity-100"
        title="Toggle Performance Monitor"
      >
        {isVisible ? "Hide" : "FPS"}
      </button>

      {/* Metrics panel */}
      {isVisible && (
        <div className="fixed bottom-16 right-4 z-50 w-64 rounded-lg bg-gray-800 p-4 text-white opacity-80">
          <h3 className="mb-2 text-lg font-bold">Performance Metrics</h3>

          <div className="mb-1 flex justify-between">
            <span>FPS:</span>
            <span className={metrics.fps < 30 ? "text-red-400" : metrics.fps < 50 ? "text-yellow-400" : "text-green-400"}>
              {metrics.fps}
            </span>
          </div>

          <div className="mb-1 flex justify-between">
            <span>Device:</span>
            <span>{metrics.deviceType}</span>
          </div>

          <div className="mb-1 flex justify-between">
            <span>Viewport:</span>
            <span>{metrics.viewport.width} x {metrics.viewport.height}</span>
          </div>

          {metrics.memory && (
            <>
              <div className="mb-1 flex justify-between">
                <span>Memory Used:</span>
                <span>{formatBytes(metrics.memory.usedJSHeapSize)}</span>
              </div>

              <div className="mb-1 flex justify-between">
                <span>Memory Total:</span>
                <span>{formatBytes(metrics.memory.totalJSHeapSize)}</span>
              </div>

              <div className="mb-1 flex justify-between">
                <span>Memory Limit:</span>
                <span>{formatBytes(metrics.memory.jsHeapSizeLimit)}</span>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
