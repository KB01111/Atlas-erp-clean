"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import React, { useEffect, useId, useRef, useState, memo, useMemo } from "react";
import { usePerformanceOptimization } from "@/hooks/usePerformanceOptimization";

interface DotPatternProps extends React.SVGProps<SVGSVGElement> {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  cx?: number;
  cy?: number;
  cr?: number;
  className?: string;
  glow?: boolean;
  [key: string]: unknown;
}

// Optimized DotPattern component with performance enhancements
export const DotPattern = memo(function DotPattern({
  width = 16,
  height = 16,
  x = 0,
  y = 0,
  cx = 1,
  cy = 1,
  cr = 1,
  className,
  glow = false,
  ...props
}: DotPatternProps) {
  const id = useId();
  const containerRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Use our performance optimization hook
  const {
    isVisibleRef,
    isInViewportRef,
    isLowEndDevice,
    observeElement
  } = usePerformanceOptimization();

  // Memoize dots to prevent recalculation on every render
  const dots = useMemo(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return [];

    // Calculate number of dots with reduced density for better performance
    // Increase spacing more on low-end devices
    const dotSpacingMultiplier = isLowEndDevice ? 5 : 3;
    const effectiveWidth = width * dotSpacingMultiplier;
    const effectiveHeight = height * dotSpacingMultiplier;

    const numCols = Math.ceil(dimensions.width / effectiveWidth);
    const numRows = Math.ceil(dimensions.height / effectiveHeight);

    const newDots = [];

    // Generate a reduced set of dots
    // Use a maximum limit to prevent too many dots on large screens
    const maxDots = isLowEndDevice ? 50 : 100;
    const totalDots = numCols * numRows;
    const skipFactor = Math.max(1, Math.floor(totalDots / maxDots));

    let dotCount = 0;
    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        // Skip dots based on the calculated factor
        if (dotCount % skipFactor === 0) {
          newDots.push({
            x: col * effectiveWidth + cx,
            y: row * effectiveHeight + cy,
            delay: Math.random() * 3,
            // Slower animation on low-end devices
            duration: Math.random() * 2 + (isLowEndDevice ? 5 : 3),
          });
        }
        dotCount++;
      }
    }

    return newDots;
  }, [dimensions.width, dimensions.height, width, height, cx, cy, isLowEndDevice]);

  // Handle resize and visibility
  useEffect(() => {
    if (!containerRef.current) return;

    // Observe the SVG element for viewport visibility
    observeElement(containerRef.current);

    let resizeTimer: NodeJS.Timeout;

    // Debounced resize handler with increased timeout
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Only update dimensions if there's a significant change (>10px)
        if (
          Math.abs(rect.width - dimensions.width) > 10 ||
          Math.abs(rect.height - dimensions.height) > 10
        ) {
          setDimensions({ width: rect.width, height: rect.height });
        }
      }
    };

    const handleResize = () => {
      clearTimeout(resizeTimer);
      // Longer debounce time for better performance
      resizeTimer = setTimeout(updateDimensions, 300);
    };

    // Initial dimensions
    updateDimensions();

    // Add event listeners
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimer);
    };
  }, [dimensions.width, dimensions.height, observeElement]);

  // Don't render anything if not visible or not in viewport
  const shouldRender = isVisibleRef.current && isInViewportRef.current;

  return (
    <svg
      ref={containerRef}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full",
        className,
      )}
      {...props}
    >
      <defs>
        <radialGradient id={`${id}-gradient`}>
          <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>

      {shouldRender && dots.map((dot, index) => (
        <motion.circle
          key={`dot-${index}`}
          cx={dot.x}
          cy={dot.y}
          r={cr}
          fill={glow ? `url(#${id}-gradient)` : "currentColor"}
          className="text-neutral-400/80"
          initial={glow ? { opacity: 0.4, scale: 1 } : {}}
          animate={
            glow
              ? {
                  opacity: [0.4, 0.7, 0.4], // Reduced animation range
                  scale: [1, 1.2, 1],       // Reduced scale change
                }
              : {}
          }
          transition={
            glow
              ? {
                  duration: dot.duration,
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: dot.delay,
                  ease: "easeInOut",
                }
              : {}
          }
        />
      ))}
    </svg>
  );
});
