"use client";

import React, { useState, useEffect } from 'react';

interface AnimatedCircularProgressBarProps {
  value: number;
  maxValue?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showValue?: boolean;
  valueSize?: number;
  valueFontWeight?: string;
  valueColor?: string;
  className?: string;
}

export function AnimatedCircularProgressBar({
  value,
  maxValue = 100,
  size = 40,
  strokeWidth = 4,
  color = 'text-primary',
  backgroundColor = 'text-gray-200',
  showValue = false,
  valueSize = 12,
  valueFontWeight = 'font-semibold',
  valueColor = 'text-gray-700',
  className = '',
}: AnimatedCircularProgressBarProps) {
  const [progress, setProgress] = useState(0);

  // Normalize value to be between 0 and maxValue
  const normalizedValue = Math.min(Math.max(0, value), maxValue);

  // Calculate percentage
  const percentage = (normalizedValue / maxValue) * 100;

  // Calculate radius and center point
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  // Calculate circumference
  const circumference = 2 * Math.PI * radius;

  // Calculate stroke dash offset
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Easing function for smoother animation
  const easeOutCubic = (x: number): number => {
    return 1 - Math.pow(1 - x, 3);
  };

  // Animate progress when value changes
  useEffect(() => {
    // Start from current progress and animate to new value
    const startValue = progress;
    const endValue = percentage;
    const duration = 500; // Animation duration in ms
    const startTime = performance.now();

    const animateProgress = (timestamp: number) => {
      const elapsed = timestamp - startTime;
      const progressRatio = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progressRatio);

      const currentValue = startValue + (endValue - startValue) * easedProgress;
      setProgress(currentValue);

      if (progressRatio < 1) {
        requestAnimationFrame(animateProgress);
      }
    };

    requestAnimationFrame(animateProgress);
  }, [percentage, progress]);



  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={backgroundColor}
        />

        {/* Progress circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`transition-all duration-300 ease-out ${color}`}
        />
      </svg>

      {/* Value text */}
      {showValue && (
        <div
          className={`absolute inset-0 flex items-center justify-center ${valueColor} ${valueFontWeight}`}
          style={{ fontSize: valueSize }}
        >
          {Math.round(normalizedValue)}
        </div>
      )}
    </div>
  );
}
