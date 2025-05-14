"use client";

import { AnimatePresence, motion, MotionProps } from "motion/react";
import { useEffect, useState, useRef, memo } from "react";

import { cn } from "@/lib/utils";
import { usePerformanceOptimization } from "@/hooks/usePerformanceOptimization";

interface WordRotateProps {
  words: string[];
  duration?: number;
  motionProps?: MotionProps;
  className?: string;
}

// Optimized WordRotate component with performance enhancements
const WordRotate = memo(function WordRotate({
  words,
  duration = 2500,
  motionProps = {
    initial: { opacity: 0, y: -50 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 50 },
    transition: { duration: 0.25, ease: "easeOut" },
  },
  className,
}: WordRotateProps) {
  const [index, setIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use our performance optimization hook
  const {
    isVisibleRef,
    isInViewportRef,
    isLowEndDevice,
    observeElement
  } = usePerformanceOptimization();

  // Adjust duration based on device capability
  const effectiveDuration = isLowEndDevice ? duration * 1.5 : duration;

  // Adjust motion props for low-end devices
  const effectiveMotionProps = isLowEndDevice
    ? {
        ...motionProps,
        transition: {
          ...motionProps.transition,
          duration: typeof motionProps.transition === 'object' && 'duration' in motionProps.transition
            ? (motionProps.transition.duration as number) * 1.5
            : 0.4
        }
      }
    : motionProps;

  // Set up viewport detection
  useEffect(() => {
    if (containerRef.current) {
      observeElement(containerRef.current);
    }
  }, [observeElement]);

  // Set up rotation interval with visibility and viewport detection
  useEffect(() => {
    // Start the interval
    const startInterval = () => {
      // Clear any existing interval first
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(() => {
        // Only rotate words when document is visible and component is in viewport
        if (isVisibleRef.current && isInViewportRef.current) {
          setIndex(prevIndex => (prevIndex + 1) % words.length);
        }
      }, effectiveDuration);
    };

    // Initial setup
    startInterval();

    // Create a check interval to monitor visibility and viewport status
    const checkInterval = setInterval(() => {
      const shouldBeActive = isVisibleRef.current && isInViewportRef.current;

      if (shouldBeActive && !intervalRef.current) {
        startInterval();
      } else if (!shouldBeActive && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, 1000); // Check every second

    // Clean up
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      clearInterval(checkInterval);
    };
  }, [words.length, effectiveDuration, isVisibleRef, isInViewportRef]);

  return (
    <div ref={containerRef} className="overflow-hidden py-2">
      <AnimatePresence mode="wait">
        <motion.h1
          key={words[index]}
          className={cn(className)}
          {...effectiveMotionProps}
        >
          {words[index]}
        </motion.h1>
      </AnimatePresence>
    </div>
  );
});

// Add display name for debugging
WordRotate.displayName = 'WordRotate';

export { WordRotate };
