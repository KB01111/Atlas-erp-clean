"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface EnhancedCardProps extends React.ComponentProps<typeof Card> {
  interactive?: boolean;
  hoverEffect?: "lift" | "shadow" | "border" | "none";
  children: React.ReactNode;
}

/**
 * EnhancedCard - A clean, standardized card component with subtle hover effects
 *
 * This component wraps the shadcn Card component and adds optional hover effects:
 * - Hover lift effect
 * - Shadow effect
 * - Border highlight effect
 *
 * @example
 * <EnhancedCard interactive hoverEffect="lift">
 *   <CardHeader>
 *     <CardTitle>Card Title</CardTitle>
 *     <CardDescription>Card Description</CardDescription>
 *   </CardHeader>
 *   <CardContent>
 *     Card Content
 *   </CardContent>
 *   <CardFooter>
 *     Card Footer
 *   </CardFooter>
 * </EnhancedCard>
 */
export function EnhancedCard({
  className,
  interactive = false,
  hoverEffect = "none",
  children,
  ...props
}: EnhancedCardProps) {
  // Determine the hover effect classes
  const hoverClasses = interactive
    ? {
        lift: "transition-all duration-200 hover:-translate-y-1 hover:shadow-md",
        shadow: "transition-all duration-200 hover:shadow-lg",
        border: "transition-all duration-200 hover:border-primary/50",
        none: "",
      }[hoverEffect]
    : "";

  return (
    <Card
      className={cn(
        hoverClasses,
        interactive && "cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </Card>
  );
}

// Export the original Card components for convenience
export { CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
