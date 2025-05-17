"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const borderVariants = cva(
  "relative border overflow-hidden",
  {
    variants: {
      variant: {
        default: "border-border",
        primary: "border-primary/50",
        secondary: "border-secondary/50",
        accent: "border-accent/50",
        destructive: "border-destructive/50",
      },
      rounded: {
        none: "rounded-none",
        sm: "rounded-sm",
        md: "rounded-md",
        lg: "rounded-lg",
        xl: "rounded-xl",
        "2xl": "rounded-2xl",
        full: "rounded-full",
      },
      borderWidth: {
        thin: "border",
        medium: "border-2",
        thick: "border-4",
      },
    },
    defaultVariants: {
      variant: "default",
      rounded: "lg",
      borderWidth: "thin",
    },
  }
);

interface BorderContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof borderVariants> {
  children: React.ReactNode;
  borderRadius?: string; // For backward compatibility
}

/**
 * BorderContainer - A clean border container component
 *
 * This component replaces the ShineBorder with a simpler,
 * non-animated version that still provides visual appeal through
 * clean borders with various styling options.
 *
 * @example
 * <BorderContainer variant="primary" rounded="xl" borderWidth="medium">
 *   <div>Content</div>
 * </BorderContainer>
 */
export function BorderContainer({
  children,
  className,
  variant,
  rounded,
  borderWidth,
  borderRadius,
  ...props
}: BorderContainerProps) {
  // Apply inline style for borderRadius if provided (for backward compatibility)
  const style = borderRadius ? { borderRadius } : undefined;

  return (
    <div
      className={cn(
        borderVariants({ variant, rounded, borderWidth }),
        className
      )}
      style={style}
      {...props}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// For backward compatibility
export function ShineBorder({
  children,
  borderColor,
  shineBorderColor,
  borderRadius = "0.5rem",
  className = "",
  duration,
  ...props
}: ShineBorderProps) {
  return (
    <BorderContainer
      variant="primary"
      borderRadius={borderRadius}
      className={className}
      {...props}
    >
      {children}
    </BorderContainer>
  );
}

// For backward compatibility
interface ShineBorderProps {
  children: React.ReactNode;
  borderColor?: string;
  shineBorderColor?: string;
  borderRadius?: string;
  className?: string;
  duration?: number;
}
