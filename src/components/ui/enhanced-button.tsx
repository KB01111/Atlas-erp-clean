"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button, ButtonProps } from "@/components/ui/button";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

const enhancedButtonVariants = cva(
  "relative overflow-hidden transition-all",
  {
    variants: {
      effect: {
        none: "",
        shadow: "hover:shadow-md",
      },
    },
    defaultVariants: {
      effect: "none",
    },
  }
);

interface EnhancedButtonProps
  extends ButtonProps,
    VariantProps<typeof enhancedButtonVariants> {
  asChild?: boolean;
}

/**
 * EnhancedButton - A clean, standardized button component
 *
 * This component wraps the shadcn Button component with minimal enhancements
 * for a clean, professional look.
 *
 * @example
 * <EnhancedButton effect="shadow">
 *   Click me
 * </EnhancedButton>
 */
const EnhancedButton = React.forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({
    className,
    effect,
    variant = "default",
    size = "default",
    asChild = false,
    ...props
  }, ref) => {
    const Comp = asChild ? Slot : Button;

    return (
      <Comp
        ref={ref}
        variant={variant}
        size={size}
        className={cn(
          enhancedButtonVariants({ effect }),
          className
        )}
        {...props}
      />
    );
  }
);

EnhancedButton.displayName = "EnhancedButton";

export { EnhancedButton };
