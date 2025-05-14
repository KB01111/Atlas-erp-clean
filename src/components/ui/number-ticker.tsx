"use client";

import { useEffect, useRef, useState } from "react";

interface NumberTickerProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  decimals?: number;
}

export function NumberTicker({
  value,
  duration = 1000,
  prefix = "",
  suffix = "",
  className = "",
  decimals = 0,
}: NumberTickerProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const startValueRef = useRef(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    // Store the current value as the starting value
    startValueRef.current = displayValue;
    
    // Reset the start time
    startTimeRef.current = null;
    
    // Start the animation
    const animate = (timestamp: number) => {
      // Initialize start time on first animation frame
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }
      
      // Calculate elapsed time
      const elapsed = timestamp - startTimeRef.current;
      
      // Calculate progress (0 to 1)
      const progress = Math.min(elapsed / duration, 1);
      
      // Calculate the current value using easeOutQuad easing function
      const easedProgress = 1 - (1 - progress) * (1 - progress);
      const currentValue = startValueRef.current + (value - startValueRef.current) * easedProgress;
      
      // Update the display value
      setDisplayValue(currentValue);
      
      // Continue the animation if not complete
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    
    // Start the animation
    frameRef.current = requestAnimationFrame(animate);
    
    // Clean up
    return () => {
      cancelAnimationFrame(frameRef.current);
    };
  }, [value, duration]);

  // Format the display value
  const formattedValue = displayValue.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span className={className}>
      {prefix}
      {formattedValue}
      {suffix}
    </span>
  );
}
