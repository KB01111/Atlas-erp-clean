"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Card } from "@/components/ui/card";

const containerVariants = cva(
  "relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-background",
        primary: "bg-primary/5",
        secondary: "bg-secondary/5",
        accent: "bg-accent/5",
        destructive: "bg-destructive/5",
        card: "bg-card",
        muted: "bg-muted",
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
      shadow: {
        none: "shadow-none",
        sm: "shadow-sm",
        md: "shadow",
        lg: "shadow-md",
        xl: "shadow-lg",
      },
      border: {
        none: "border-0",
        thin: "border",
        medium: "border-2",
        thick: "border-4",
      },
      borderColor: {
        default: "border-border",
        primary: "border-primary/50",
        secondary: "border-secondary/50",
        accent: "border-accent/50",
        destructive: "border-destructive/50",
      },
      hover: {
        none: "",
        lift: "transition-transform duration-200 hover:-translate-y-1",
        scale: "transition-transform duration-200 hover:scale-[1.02]",
        shadow: "transition-shadow duration-200 hover:shadow-lg",
        border: "transition-colors duration-200 hover:border-primary/50",
      },
    },
    defaultVariants: {
      variant: "default",
      rounded: "lg",
      shadow: "md",
      border: "thin",
      borderColor: "default",
      hover: "none",
    },
  }
);

interface EnhancedContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {
  children: React.ReactNode;
  asCard?: boolean;
}

/**
 * EnhancedContainer - A versatile container component
 * 
 * This component provides a clean, customizable container with various styling options.
 * It can be used as a standalone container or as a Card component.
 * 
 * @example
 * <EnhancedContainer variant="primary" rounded="xl" shadow="lg" hover="lift">
 *   <div>Content</div>
 * </EnhancedContainer>
 */
export function EnhancedContainer({
  children,
  className,
  variant,
  rounded,
  shadow,
  border,
  borderColor,
  hover,
  asCard = false,
  ...props
}: EnhancedContainerProps) {
  const containerClasses = cn(
    containerVariants({ variant, rounded, shadow, border, borderColor, hover }),
    className
  );

  if (asCard) {
    return (
      <Card className={containerClasses} {...props}>
        {children}
      </Card>
    );
  }

  return (
    <div className={containerClasses} {...props}>
      {children}
    </div>
  );
}

// For backward compatibility with MagicCard
interface MagicCardProps {
  children?: React.ReactNode;
  className?: string;
  gradientSize?: number;
  gradientColor?: string;
  gradientOpacity?: number;
  gradientFrom?: string;
  gradientTo?: string;
  focus?: boolean;
  glare?: boolean;
  glareSize?: number;
  glareOpacity?: number;
  glarePosition?: "top" | "bottom" | "left" | "right" | "all";
  glareColor?: string;
  glareBorderRadius?: string;
  disabled?: boolean;
}

export function MagicCard({
  children,
  className,
  focus,
  disabled,
  ...props
}: MagicCardProps) {
  return (
    <EnhancedContainer
      variant="card"
      rounded="xl"
      shadow="md"
      hover={focus ? "lift" : "none"}
      className={cn(
        className,
        disabled && "opacity-70 pointer-events-none"
      )}
      {...props}
    >
      {children}
    </EnhancedContainer>
  );
}
