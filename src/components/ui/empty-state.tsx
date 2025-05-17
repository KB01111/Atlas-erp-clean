"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { cva, type VariantProps } from "class-variance-authority";
import { LucideIcon } from "lucide-react";
import { motion } from "motion/react";

const emptyStateVariants = cva(
  "flex flex-col items-center justify-center text-center",
  {
    variants: {
      size: {
        sm: "min-h-[100px] p-4",
        md: "min-h-[200px] p-6",
        lg: "min-h-[300px] p-8",
        xl: "min-h-[400px] p-10",
        full: "h-full w-full p-8",
      },
      variant: {
        default: "border border-dashed border-muted-foreground/30 rounded-lg",
        card: "",
        fancy: "",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "default",
    },
  }
);

interface EmptyStateProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof emptyStateVariants> {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
    effect?: "none" | "shimmer" | "glow" | "gradient";
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  };
  iconClassName?: string;
  animateIcon?: boolean;
}

export function EmptyState({
  className,
  size,
  variant,
  title,
  description,
  icon: Icon,
  action,
  secondaryAction,
  iconClassName,
  animateIcon = true,
  ...props
}: EmptyStateProps) {
  // Icon sizes based on container size
  const iconSizes = {
    sm: 32,
    md: 48,
    lg: 64,
    xl: 80,
    full: 64,
  };

  // Text sizes based on container size
  const titleSizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl",
    xl: "text-2xl",
    full: "text-xl",
  };

  const descriptionSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-base",
    xl: "text-lg",
    full: "text-base",
  };

  // Get the actual size value or default to "md"
  const actualSize = size || "md";

  // Content
  const content = (
    <div className="flex flex-col items-center justify-center text-center">
      {Icon && (
        <div className={cn("mb-4", iconClassName)}>
          {animateIcon ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="text-muted-foreground/40"
            >
              <Icon
                size={iconSizes[actualSize as keyof typeof iconSizes]}
                strokeWidth={1.5}
              />
            </motion.div>
          ) : (
            <Icon
              size={iconSizes[actualSize as keyof typeof iconSizes]}
              className="text-muted-foreground/40"
              strokeWidth={1.5}
            />
          )}
        </div>
      )}

      <h3 className={cn(
        "font-medium text-foreground",
        titleSizes[actualSize as keyof typeof titleSizes]
      )}>
        {title}
      </h3>

      {description && (
        <p className={cn(
          "text-muted-foreground mt-2 max-w-md",
          descriptionSizes[actualSize as keyof typeof descriptionSizes]
        )}>
          {description}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-3 justify-center">
        {action && (
          <EnhancedButton
            variant={action.variant || "default"}
            effect={action.effect || "shimmer"}
            onClick={action.onClick}
            size={actualSize === "sm" ? "sm" : "default"}
          >
            {action.label}
          </EnhancedButton>
        )}

        {secondaryAction && (
          <Button
            variant={secondaryAction.variant || "outline"}
            onClick={secondaryAction.onClick}
            size={actualSize === "sm" ? "sm" : "default"}
          >
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );

  // Fancy variant with EnhancedCard
  if (variant === "fancy") {
    return (
      <EnhancedCard
        className={cn(className)}
        gradient
        shine
        interactive
        hoverEffect="lift"
        {...props}
      >
        <div className="flex flex-col items-center justify-center p-6">
          {content}
        </div>
      </EnhancedCard>
    );
  }

  // Card variant
  if (variant === "card") {
    return (
      <EnhancedCard
        className={cn(className)}
        interactive
        hoverEffect="border"
        {...props}
      >
        <div className="flex flex-col items-center justify-center p-6">
          {content}
        </div>
      </EnhancedCard>
    );
  }

  // Default variant
  return (
    <div
      className={cn(emptyStateVariants({ size, variant }), className)}
      {...props}
    >
      {content}
    </div>
  );
}
