"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const focusRingVariants = cva(
  "pointer-events-none absolute inset-0 select-none rounded-full",
  {
    variants: {
      variant: {
        default: "border border-border/50",
        primary: "border border-primary/50",
        secondary: "border border-secondary/50",
        accent: "border border-accent/50",
        destructive: "border border-destructive/50",
      },
      size: {
        sm: "w-24 h-24",
        md: "w-32 h-32",
        lg: "w-40 h-40",
        xl: "w-48 h-48",
        "2xl": "w-56 h-56",
      },
      opacity: {
        low: "opacity-10",
        medium: "opacity-20",
        high: "opacity-30",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "lg",
      opacity: "medium",
    },
  }
);

interface FocusRingProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof focusRingVariants> {
  numRings?: number;
}

/**
 * FocusRing - A clean focus ring component
 * 
 * This component provides a visual focus indicator with concentric rings.
 * It replaces the Ripple component with a cleaner, non-animated version.
 * 
 * @example
 * <FocusRing variant="primary" size="lg" opacity="medium" numRings={3} />
 */
export function FocusRing({
  className,
  variant,
  size,
  opacity,
  numRings = 3,
  ...props
}: FocusRingProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 select-none",
        className
      )}
      {...props}
    >
      {Array.from({ length: numRings }, (_, i) => {
        const scale = 1 + i * 0.2;
        
        return (
          <div
            key={i}
            className={cn(
              focusRingVariants({ variant, size, opacity }),
              "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            )}
            style={{
              transform: `translate(-50%, -50%) scale(${scale})`,
              opacity: 1 - i * 0.2,
              zIndex: numRings - i,
            }}
          />
        );
      })}
    </div>
  );
}

// For backward compatibility
interface RippleProps extends React.ComponentPropsWithoutRef<"div"> {
  mainCircleSize?: number;
  mainCircleOpacity?: number;
  numCircles?: number;
}

export function Ripple({
  mainCircleSize = 210,
  mainCircleOpacity = 0.24,
  numCircles = 8,
  className,
  ...props
}: RippleProps) {
  // Map the Ripple props to FocusRing props
  const size = mainCircleSize <= 150 ? "sm" : 
               mainCircleSize <= 200 ? "md" : 
               mainCircleSize <= 250 ? "lg" : 
               mainCircleSize <= 300 ? "xl" : "2xl";
               
  const opacity = mainCircleOpacity <= 0.15 ? "low" : 
                 mainCircleOpacity <= 0.25 ? "medium" : "high";
                 
  return (
    <FocusRing
      variant="primary"
      size={size}
      opacity={opacity}
      numRings={Math.min(numCircles, 5)}
      className={className}
      {...props}
    />
  );
}
