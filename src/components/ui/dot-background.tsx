"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface DotBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  dotSize?: number;
  dotSpacing?: number;
  dotColor?: string;
  dotOpacity?: number;
}

/**
 * DotBackground - A clean dot pattern background component
 * 
 * This component creates a background with a pattern of dots.
 * It replaces the DotPattern component with a simpler, non-animated version.
 * 
 * @example
 * <DotBackground 
 *   dotSize={2} 
 *   dotSpacing={20} 
 *   dotColor="currentColor" 
 *   dotOpacity={0.2} 
 * />
 */
export function DotBackground({
  className,
  dotSize = 2,
  dotSpacing = 20,
  dotColor = "currentColor",
  dotOpacity = 0.2,
  ...props
}: DotBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions to match parent
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.target === canvas) {
          const { width, height } = entry.contentRect;
          canvas.width = width;
          canvas.height = height;
          drawDots();
        }
      }
    });

    resizeObserver.observe(canvas);

    // Draw the dots
    function drawDots() {
      if (!ctx || !canvas) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Set dot style
      ctx.fillStyle = dotColor;
      ctx.globalAlpha = dotOpacity;

      // Calculate grid
      const numCols = Math.ceil(canvas.width / dotSpacing);
      const numRows = Math.ceil(canvas.height / dotSpacing);

      // Draw dots
      for (let i = 0; i <= numCols; i++) {
        for (let j = 0; j <= numRows; j++) {
          const x = i * dotSpacing;
          const y = j * dotSpacing;
          
          ctx.beginPath();
          ctx.arc(x, y, dotSize / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Initial draw
    drawDots();

    // Clean up
    return () => {
      resizeObserver.disconnect();
    };
  }, [dotSize, dotSpacing, dotColor, dotOpacity]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("absolute inset-0 w-full h-full", className)}
      {...props}
    />
  );
}

// For backward compatibility
interface DotPatternProps extends React.ComponentPropsWithoutRef<"svg"> {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  cx?: number;
  cy?: number;
  cr?: number;
  glow?: boolean;
}

export function DotPattern({
  width = 16,
  height = 16,
  cx = 1,
  cy = 1,
  cr = 1,
  className,
  glow = false,
  ...props
}: DotPatternProps) {
  return (
    <DotBackground
      dotSize={cr * 2}
      dotSpacing={Math.max(width, height)}
      dotOpacity={glow ? 0.3 : 0.2}
      className={className}
      {...props}
    />
  );
}
