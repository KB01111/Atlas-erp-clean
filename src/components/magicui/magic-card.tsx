"use client";

import { motion, useMotionTemplate, useMotionValue } from "motion/react";
import React, { useCallback, useEffect, useRef, useState, memo, useMemo } from "react";

import { cn } from "@/lib/utils";
import { usePerformanceOptimization } from "@/hooks/usePerformanceOptimization";

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

export const MagicCard = memo(function MagicCard({
  children,
  className,
  gradientSize = 200,
  gradientColor = "#262626",
  gradientOpacity = 0.8,
  gradientFrom = "#9E7AFF",
  gradientTo = "#FE8BBB",
  focus = false,
  glare = false,
  glareSize = 0.4,
  glareOpacity = 0.2,
  glarePosition = "all",
  glareColor = "rgba(255, 255, 255, 0.5)",
  glareBorderRadius = "0.5rem",
  disabled = false,
}: MagicCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(-gradientSize);
  const mouseY = useMotionValue(-gradientSize);
  const [isHovering, setIsHovering] = useState(false);
  const rafRef = useRef<number | null>(null);

  // Use our performance optimization hook
  const {
    isVisibleRef,
    isInViewportRef,
    isLowEndDevice,
    observeElement,
    throttle
  } = usePerformanceOptimization();

  // Adjust gradient size based on device capability
  const effectiveGradientSize = isLowEndDevice ? gradientSize * 0.7 : gradientSize;

  // Set up viewport detection
  useEffect(() => {
    if (cardRef.current) {
      observeElement(cardRef.current);
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [observeElement]);

  // Only track mouse movement when hovering over the card and when visible/in viewport
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (
        cardRef.current &&
        !disabled &&
        isVisibleRef.current &&
        isInViewportRef.current
      ) {
        // Use our throttle function to limit updates
        throttle(() => {
          const { left, top } = cardRef.current!.getBoundingClientRect();
          mouseX.set(e.clientX - left);
          mouseY.set(e.clientY - top);
        });
      }
    },
    [mouseX, mouseY, disabled, isVisibleRef, isInViewportRef, throttle],
  );

  const handleMouseEnter = useCallback(() => {
    if (!disabled && isVisibleRef.current && isInViewportRef.current) {
      setIsHovering(true);
    }
  }, [disabled, isVisibleRef, isInViewportRef]);

  const handleMouseLeave = useCallback(() => {
    if (!disabled) {
      setIsHovering(false);
      mouseX.set(-effectiveGradientSize);
      mouseY.set(-effectiveGradientSize);
    }
  }, [effectiveGradientSize, mouseX, mouseY, disabled]);

  // Reset position when gradient size changes
  useEffect(() => {
    if (!isHovering) {
      mouseX.set(-effectiveGradientSize);
      mouseY.set(-effectiveGradientSize);
    }
  }, [effectiveGradientSize, mouseX, mouseY, isHovering]);

  // Memoize glare styles to prevent recalculation on every render
  const glareStyles = useMemo(() => {
    if (!glare) return {};

    let background = "";

    switch (glarePosition) {
      case "top":
        background = `linear-gradient(to bottom, ${glareColor}, transparent)`;
        break;
      case "bottom":
        background = `linear-gradient(to top, ${glareColor}, transparent)`;
        break;
      case "left":
        background = `linear-gradient(to right, ${glareColor}, transparent)`;
        break;
      case "right":
        background = `linear-gradient(to left, ${glareColor}, transparent)`;
        break;
      case "all":
      default:
        background = `radial-gradient(circle, ${glareColor}, transparent)`;
        break;
    }

    return {
      background,
      opacity: glareOpacity,
      borderRadius: glareBorderRadius,
    };
  }, [glare, glarePosition, glareColor, glareOpacity, glareBorderRadius]);

  // Don't render effects if not visible or not in viewport
  const shouldRenderEffects = isVisibleRef.current && isInViewportRef.current && !disabled;

  return (
    <div
      ref={cardRef}
      className={cn(
        "group relative rounded-[inherit]",
        { "cursor-default": disabled },
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Border gradient */}
      {focus && shouldRenderEffects && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-[inherit] bg-border opacity-0 duration-300 group-hover:opacity-100"
          style={{
            background: useMotionTemplate`
            radial-gradient(${effectiveGradientSize}px circle at ${mouseX}px ${mouseY}px,
            ${gradientFrom},
            ${gradientTo},
            var(--border) 100%
            )
            `,
          }}
        />
      )}

      {/* Background */}
      <div className="absolute inset-px rounded-[inherit] bg-background" />

      {/* Inner gradient */}
      {focus && shouldRenderEffects && (
        <motion.div
          className="pointer-events-none absolute inset-px rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: useMotionTemplate`
              radial-gradient(${effectiveGradientSize}px circle at ${mouseX}px ${mouseY}px, ${gradientColor}, transparent 100%)
            `,
            opacity: gradientOpacity,
          }}
        />
      )}

      {/* Glare effect */}
      {glare && shouldRenderEffects && (
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={glareStyles}
        />
      )}

      {/* Content */}
      <div className="relative">{children}</div>
    </div>
  );
});
