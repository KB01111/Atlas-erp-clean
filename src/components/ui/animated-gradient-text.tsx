"use client";

import { useEffect, useRef, memo, useCallback } from "react";
import { usePerformanceOptimization } from "@/hooks/usePerformanceOptimization";

interface AnimatedGradientTextProps {
  text: string;
  className?: string;
  gradient?: string;
  duration?: number;
}

// Add global keyframes style only once with slower animation
if (typeof document !== 'undefined' && !document.querySelector("#gradient-animation-keyframes")) {
  const style = document.createElement("style");
  style.id = "gradient-animation-keyframes";
  style.textContent = `
    @keyframes gradient-animation {
      0% {
        background-position: 0% center;
      }
      100% {
        background-position: 200% center;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .animated-gradient-text {
        animation: none !important;
      }
    }
  `;
  document.head.appendChild(style);
}

// Memoize the component to prevent unnecessary re-renders
export const AnimatedGradientText = memo(function AnimatedGradientText({
  text,
  className = "",
  gradient = "linear-gradient(to right, #3b82f6, #8b5cf6)",
  duration = 8,
}: AnimatedGradientTextProps) {
  const textRef = useRef<HTMLDivElement>(null);
  const animationEnabledRef = useRef<boolean>(true);

  // Use our performance optimization hook
  const {
    isVisibleRef,
    isInViewportRef,
    isLowEndDevice,
    observeElement
  } = usePerformanceOptimization();

  // Adjust animation duration based on device capability
  const effectiveDuration = isLowEndDevice ? duration * 2.5 : duration * 1.5;

  // Check if user prefers reduced motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    animationEnabledRef.current = !mediaQuery.matches;

    const handleChange = () => {
      animationEnabledRef.current = !mediaQuery.matches;
      updateAnimation();
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Set up viewport detection
  useEffect(() => {
    const element = textRef.current;
    if (!element) return;

    // Use our performance hook's observer
    observeElement(element);

  }, [observeElement]);

  // Update animation based on visibility, viewport, and user preferences
  const updateAnimation = useCallback(() => {
    const element = textRef.current;
    if (!element) return;

    // Set up the base styles
    element.style.backgroundImage = gradient;
    element.style.backgroundSize = "200% auto";
    element.style.backgroundClip = "text";
    element.style.webkitBackgroundClip = "text";
    element.style.color = "transparent";

    // Only animate if all conditions are met
    const shouldAnimate = isVisibleRef.current &&
                          isInViewportRef.current &&
                          animationEnabledRef.current;

    if (shouldAnimate) {
      element.style.animation = `gradient-animation ${effectiveDuration}s linear infinite`;
    } else {
      element.style.animation = 'none';
    }
  }, [gradient, effectiveDuration, isVisibleRef, isInViewportRef]);

  // Update animation when visibility or viewport status changes
  useEffect(() => {
    // Initial setup
    updateAnimation();

    // Create a MutationObserver to watch for changes to isVisibleRef and isInViewportRef
    const checkInterval = setInterval(() => {
      updateAnimation();
    }, 1000); // Check every second

    return () => {
      clearInterval(checkInterval);
    };
  }, [updateAnimation]);

  // Update animation when props change
  useEffect(() => {
    updateAnimation();
  }, [gradient, duration, updateAnimation]);

  return (
    <div
      ref={textRef}
      className={`animated-gradient-text ${className}`}
      style={{
        display: "inline-block",
      }}
    >
      {text}
    </div>
  );
});
