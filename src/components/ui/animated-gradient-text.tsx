"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const gradientTextVariants = cva(
  "bg-clip-text text-transparent bg-gradient-to-r font-bold",
  {
    variants: {
      variant: {
        primary: "from-primary to-primary/70",
        secondary: "from-secondary to-secondary/70",
        accent: "from-accent to-accent/70",
        destructive: "from-destructive to-destructive/70",
        blue: "from-blue-600 to-blue-400",
        purple: "from-purple-600 to-purple-400",
        green: "from-green-600 to-green-400",
        amber: "from-amber-600 to-amber-400",
        pink: "from-pink-600 to-pink-400",
      },
      size: {
        xs: "text-xs",
        sm: "text-sm",
        md: "text-base",
        lg: "text-lg",
        xl: "text-xl",
        "2xl": "text-2xl",
        "3xl": "text-3xl",
        "4xl": "text-4xl",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

interface GradientTextProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof gradientTextVariants> {
  text: string;
}

/**
 * GradientText - A clean text component with gradient styling
 *
 * This component replaces the AnimatedGradientText with a simpler,
 * non-animated version that still provides visual appeal through gradients.
 *
 * @example
 * <GradientText text="Hello World" variant="primary" size="2xl" />
 */
export function GradientText({
  text,
  className,
  variant,
  size,
  ...props
}: GradientTextProps) {
  return (
    <span
      className={cn(gradientTextVariants({ variant, size }), className)}
      {...props}
    >
      {text}
    </span>
  );
}

// For backward compatibility
export const AnimatedGradientText = GradientText;
