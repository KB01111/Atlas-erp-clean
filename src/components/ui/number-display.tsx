"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const numberDisplayVariants = cva(
  "inline-block transition-all duration-300",
  {
    variants: {
      variant: {
        default: "text-foreground",
        primary: "text-primary",
        secondary: "text-secondary",
        accent: "text-accent",
        destructive: "text-destructive",
        muted: "text-muted-foreground",
      },
      weight: {
        normal: "font-normal",
        medium: "font-medium",
        semibold: "font-semibold",
        bold: "font-bold",
      },
      size: {
        xs: "text-xs",
        sm: "text-sm",
        md: "text-base",
        lg: "text-lg",
        xl: "text-xl",
        "2xl": "text-2xl",
        "3xl": "text-3xl",
      },
    },
    defaultVariants: {
      variant: "primary",
      weight: "bold",
      size: "lg",
    },
  }
);

interface NumberDisplayProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof numberDisplayVariants> {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

/**
 * NumberDisplay - A clean number display component
 * 
 * This component displays a number with a smooth transition when it changes.
 * It replaces the NumberTicker component with a simpler, cleaner version.
 * 
 * @example
 * <NumberDisplay 
 *   value={1234} 
 *   variant="primary" 
 *   weight="bold" 
 *   size="xl" 
 *   prefix="$" 
 *   decimals={2} 
 * />
 */
export function NumberDisplay({
  className,
  variant,
  weight,
  size,
  value,
  duration = 1000,
  prefix = "",
  suffix = "",
  decimals = 0,
  ...props
}: NumberDisplayProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (value === displayValue) return;
    
    setIsAnimating(true);
    
    // Calculate step size based on the difference and duration
    const diff = value - displayValue;
    const steps = Math.min(30, Math.abs(diff)); // Max 30 steps for performance
    const stepValue = diff / steps;
    const stepDuration = duration / steps;
    
    let currentStep = 0;
    let currentValue = displayValue;
    
    const interval = setInterval(() => {
      currentStep++;
      
      if (currentStep >= steps) {
        setDisplayValue(value);
        setIsAnimating(false);
        clearInterval(interval);
      } else {
        currentValue += stepValue;
        setDisplayValue(currentValue);
      }
    }, stepDuration);
    
    return () => clearInterval(interval);
  }, [value, displayValue, duration]);

  // Format the number with the specified number of decimal places
  const formattedValue = displayValue.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span
      className={cn(
        numberDisplayVariants({ variant, weight, size }),
        isAnimating ? "opacity-100" : "opacity-100", // Always visible, but could add subtle effects
        className
      )}
      {...props}
    >
      {prefix}{formattedValue}{suffix}
    </span>
  );
}

// For backward compatibility
interface NumberTickerProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export function NumberTicker({
  value,
  duration = 1000,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
  ...props
}: NumberTickerProps) {
  return (
    <NumberDisplay
      value={value}
      duration={duration}
      prefix={prefix}
      suffix={suffix}
      decimals={decimals}
      className={className}
      {...props}
    />
  );
}
