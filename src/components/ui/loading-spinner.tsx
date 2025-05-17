"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2, LoaderCircle } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

const spinnerVariants = cva(
  "animate-spin text-muted-foreground",
  {
    variants: {
      size: {
        sm: "h-4 w-4",
        md: "h-6 w-6",
        lg: "h-8 w-8",
        xl: "h-12 w-12",
      },
      variant: {
        default: "text-primary",
        muted: "text-muted-foreground",
        accent: "text-accent-foreground",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "default",
    },
  }
);

interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  type?: "circle" | "dots";
}

/**
 * LoadingSpinner - A standardized loading spinner component
 * 
 * @example
 * <LoadingSpinner size="md" variant="default" />
 */
export function LoadingSpinner({
  className,
  size,
  variant,
  type = "circle",
  ...props
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn("flex items-center justify-center", className)}
      {...props}
    >
      {type === "circle" ? (
        <Loader2 className={cn(spinnerVariants({ size, variant }))} />
      ) : (
        <LoaderCircle className={cn(spinnerVariants({ size, variant }))} />
      )}
    </div>
  );
}

const loadingStateVariants = cva(
  "flex flex-col items-center justify-center text-center",
  {
    variants: {
      size: {
        sm: "p-2 gap-2",
        md: "p-4 gap-3",
        lg: "p-6 gap-4",
        xl: "p-8 gap-5",
        full: "p-8 gap-5 h-full w-full",
      },
      variant: {
        default: "bg-transparent",
        card: "bg-card rounded-lg border shadow-sm",
        overlay: "bg-background/80 backdrop-blur-sm fixed inset-0 z-50",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "default",
    },
  }
);

interface LoadingStateProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loadingStateVariants> {
  message?: string;
  spinnerSize?: "sm" | "md" | "lg" | "xl";
  spinnerVariant?: "default" | "muted" | "accent";
  spinnerType?: "circle" | "dots";
}

/**
 * LoadingState - A standardized loading state component
 * 
 * @example
 * <LoadingState message="Loading data..." size="md" variant="card" />
 */
export function LoadingState({
  className,
  size,
  variant,
  message,
  spinnerSize,
  spinnerVariant,
  spinnerType = "circle",
  ...props
}: LoadingStateProps) {
  // Map the container size to an appropriate spinner size if not specified
  const mappedSpinnerSize = spinnerSize || 
    (size === "sm" ? "sm" : 
     size === "md" ? "md" : 
     size === "lg" ? "lg" : "xl");

  return (
    <div
      className={cn(
        loadingStateVariants({ size, variant }),
        className
      )}
      {...props}
    >
      <LoadingSpinner 
        size={mappedSpinnerSize} 
        variant={spinnerVariant || "default"} 
        type={spinnerType}
      />
      {message && (
        <p className="text-muted-foreground">
          {message}
        </p>
      )}
    </div>
  );
}
