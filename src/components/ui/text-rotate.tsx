"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const textRotateVariants = cva(
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

interface TextRotateProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof textRotateVariants> {
  words: string[];
  interval?: number;
}

/**
 * TextRotate - A clean text rotation component
 * 
 * This component cycles through a list of words with a clean transition.
 * It replaces the WordRotate component with a simpler, cleaner version.
 * 
 * @example
 * <TextRotate 
 *   words={["Developer", "Designer", "Creator"]} 
 *   variant="primary" 
 *   weight="bold" 
 *   size="xl" 
 *   interval={3000} 
 * />
 */
export function TextRotate({
  className,
  variant,
  weight,
  size,
  words,
  interval = 3000,
  ...props
}: TextRotateProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (words.length <= 1) return;

    const rotationInterval = setInterval(() => {
      setIsVisible(false);
      
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % words.length);
        setIsVisible(true);
      }, 300); // Match the transition duration
    }, interval);

    return () => clearInterval(rotationInterval);
  }, [words, interval]);

  return (
    <span
      className={cn(
        textRotateVariants({ variant, weight, size }),
        isVisible ? "opacity-100" : "opacity-0",
        "transform",
        isVisible ? "translate-y-0" : "translate-y-2",
        className
      )}
      {...props}
    >
      {words[currentIndex]}
    </span>
  );
}

// For backward compatibility
interface WordRotateProps {
  words: string[];
  duration?: number;
  motionProps?: any;
  className?: string;
}

export function WordRotate({
  words,
  duration = 2500,
  className,
  ...props
}: WordRotateProps) {
  return (
    <TextRotate
      words={words}
      interval={duration}
      className={className}
      {...props}
    />
  );
}
