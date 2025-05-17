"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const progressVariants = cva(
  "fixed top-0 left-0 right-0 h-1 bg-transparent",
  {
    variants: {
      variant: {
        default: "",
        primary: "",
        secondary: "",
        accent: "",
        destructive: "",
      },
      size: {
        sm: "h-0.5",
        md: "h-1",
        lg: "h-1.5",
        xl: "h-2",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

interface ScrollProgressProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressVariants> {
  color?: string;
  height?: number;
  zIndex?: number;
}

/**
 * ScrollProgress - A clean scroll progress indicator
 *
 * This component shows a progress bar at the top of the page
 * that indicates how far the user has scrolled.
 *
 * @example
 * <ScrollProgress variant="primary" size="md" />
 */
export function ScrollProgress({
  className,
  variant,
  size,
  color,
  height,
  zIndex = 50,
  ...props
}: ScrollProgressProps) {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
    };

    // Add scroll event listener
    window.addEventListener("scroll", handleScroll);

    // Initial calculation
    handleScroll();

    // Clean up
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Determine the color based on variant
  const getBarColor = () => {
    if (color) return color;

    switch (variant) {
      case "primary":
        return "var(--primary)";
      case "secondary":
        return "var(--secondary)";
      case "accent":
        return "var(--accent)";
      case "destructive":
        return "var(--destructive)";
      default:
        return "var(--primary)";
    }
  };

  // Determine the height based on size or height prop
  const getHeight = () => {
    if (height) return `${height}px`;
    return undefined; // Let the CSS classes handle it
  };

  return (
    <div
      className={cn(progressVariants({ variant, size }), className)}
      style={{
        zIndex,
        height: getHeight(),
      }}
      {...props}
    >
      <div
        className="h-full transition-all duration-200 ease-out"
        style={{
          width: `${scrollProgress}%`,
          backgroundColor: getBarColor(),
        }}
      />
    </div>
  );
}
