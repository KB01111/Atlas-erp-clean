"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { cva, type VariantProps } from "class-variance-authority";
import { EnhancedButton } from "@/components/ui/enhanced-button";

const actionButtonVariants = cva(
  "relative font-medium transition-all",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
        accent: "bg-accent text-accent-foreground hover:bg-accent/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-md",
        md: "h-9 px-4 py-2 text-sm rounded-md",
        lg: "h-10 px-6 py-2 text-base rounded-md",
        xl: "h-12 px-8 py-3 text-lg rounded-md",
      },
      rounded: {
        none: "rounded-none",
        sm: "rounded-sm",
        md: "rounded-md",
        lg: "rounded-lg",
        xl: "rounded-xl",
        full: "rounded-full",
      },
      shadow: {
        none: "shadow-none",
        sm: "shadow-sm",
        md: "shadow",
        lg: "shadow-md",
        xl: "shadow-lg",
      },
      hover: {
        none: "",
        lift: "hover:-translate-y-1",
        scale: "hover:scale-105",
        shadow: "hover:shadow-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      rounded: "md",
      shadow: "sm",
      hover: "none",
    },
  }
);

interface EnhancedActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof actionButtonVariants> {
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

/**
 * EnhancedActionButton - A versatile button component
 * 
 * This component provides a clean, customizable button with various styling options.
 * It can include an icon on either side of the text.
 * 
 * @example
 * <EnhancedActionButton 
 *   variant="primary" 
 *   size="lg" 
 *   rounded="full" 
 *   shadow="lg" 
 *   hover="lift"
 *   icon={<PlusIcon />}
 * >
 *   Create New
 * </EnhancedActionButton>
 */
export function EnhancedActionButton({
  children,
  className,
  variant,
  size,
  rounded,
  shadow,
  hover,
  icon,
  iconPosition = "left",
  ...props
}: EnhancedActionButtonProps) {
  return (
    <button
      className={cn(
        actionButtonVariants({ variant, size, rounded, shadow, hover }),
        "inline-flex items-center justify-center gap-2 transition-all",
        className
      )}
      {...props}
    >
      {icon && iconPosition === "left" && (
        <span className="flex-shrink-0">{icon}</span>
      )}
      {children}
      {icon && iconPosition === "right" && (
        <span className="flex-shrink-0">{icon}</span>
      )}
    </button>
  );
}

// For backward compatibility with ShimmerButton
interface ShimmerButtonProps extends React.ComponentPropsWithoutRef<"button"> {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
  className?: string;
  children?: React.ReactNode;
}

export function ShimmerButton({
  children,
  className,
  borderRadius,
  ...props
}: ShimmerButtonProps) {
  // Apply inline style for borderRadius if provided (for backward compatibility)
  const style = borderRadius ? { borderRadius } : undefined;

  return (
    <EnhancedActionButton
      variant="default"
      size="md"
      shadow="md"
      hover="lift"
      className={className}
      style={style}
      {...props}
    >
      {children}
    </EnhancedActionButton>
  );
}
