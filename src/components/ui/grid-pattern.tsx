"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface GridPatternProps extends React.HTMLAttributes<HTMLDivElement> {
  gridSize?: number;
  lineColor?: string;
  lineOpacity?: number;
  lineWidth?: number;
  className?: string;
}

/**
 * GridPattern - A clean grid pattern background component
 * 
 * This component replaces the AnimatedGridPattern with a simpler,
 * non-animated version that still provides visual appeal.
 * 
 * @example
 * <GridPattern 
 *   gridSize={40} 
 *   lineColor="#000000" 
 *   lineOpacity={0.1} 
 *   lineWidth={1} 
 * />
 */
export function GridPattern({
  gridSize = 40,
  lineColor = "currentColor",
  lineOpacity = 0.1,
  lineWidth = 1,
  className,
  ...props
}: GridPatternProps) {
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
          drawGrid();
        }
      }
    });

    resizeObserver.observe(canvas);

    // Draw the grid
    function drawGrid() {
      if (!ctx || !canvas) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Set line style
      ctx.strokeStyle = lineColor;
      ctx.globalAlpha = lineOpacity;
      ctx.lineWidth = lineWidth;

      // Calculate grid
      const numCols = Math.ceil(canvas.width / gridSize);
      const numRows = Math.ceil(canvas.height / gridSize);

      // Draw vertical lines
      for (let i = 0; i <= numCols; i++) {
        const x = i * gridSize;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // Draw horizontal lines
      for (let i = 0; i <= numRows; i++) {
        const y = i * gridSize;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }

    // Initial draw
    drawGrid();

    // Clean up
    return () => {
      resizeObserver.disconnect();
    };
  }, [gridSize, lineColor, lineOpacity, lineWidth]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("absolute inset-0 w-full h-full", className)}
      {...props}
    />
  );
}

// For backward compatibility
export const AnimatedGridPattern = GridPattern;
