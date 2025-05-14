"use client";

import { useEffect, useRef, memo } from "react";
import { usePerformanceOptimization } from "@/hooks/usePerformanceOptimization";

interface AnimatedGridPatternProps {
  gridSize?: number;
  lineColor?: string;
  lineOpacity?: number;
  lineWidth?: number;
  animationDuration?: number;
  className?: string;
}

// Memoize the component to prevent unnecessary re-renders
export const AnimatedGridPattern = memo(function AnimatedGridPattern({
  gridSize = 40,
  lineColor = "#000000",
  lineOpacity = 0.1,
  lineWidth = 1,
  animationDuration = 20,
  className = "",
}: AnimatedGridPatternProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const offsetRef = useRef<number>(0);
  const speedRef = useRef<number>(0.5); // pixels per frame

  // Use our performance optimization hook
  const { isVisibleRef, isInViewportRef, isLowEndDevice, observeElement } = usePerformanceOptimization();

  // Adjust grid size and animation speed based on device capability
  const effectiveGridSize = isLowEndDevice ? gridSize * 2 : gridSize;
  const effectiveAnimationDuration = isLowEndDevice ? animationDuration * 2 : animationDuration;

  useEffect(() => {
    // Calculate speed based on animation duration to make it consistent
    speedRef.current = effectiveGridSize / (effectiveAnimationDuration * 60); // Assuming 60fps
  }, [effectiveGridSize, effectiveAnimationDuration]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Observe the canvas element for viewport visibility
    observeElement(canvas);

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // Set canvas dimensions to match parent container
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      const { width, height } = parent.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      // Set display size (css pixels)
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      // Set actual size in memory (scaled for retina)
      canvas.width = width * dpr;
      canvas.height = height * dpr;

      // Scale context to match dpr
      ctx.scale(dpr, dpr);
    };

    // Initial resize
    resizeCanvas();

    // Add resize listener with debounce
    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resizeCanvas, 200); // Increased debounce time
    };
    window.addEventListener("resize", handleResize);

    // Track last animation time for throttling
    const lastDrawTimeRef = useRef<number>(0);
    // Lower frame rate for better performance, especially on low-end devices
    const frameRateRef = useRef<number>(isLowEndDevice ? 10 : 15);

    // Draw the grid pattern with throttling
    const drawGrid = (timestamp: number) => {
      if (!ctx || !canvas) {
        animationRef.current = requestAnimationFrame(drawGrid);
        return;
      }

      // Skip rendering if tab is not visible or element is not in viewport
      if (!isVisibleRef.current || !isInViewportRef.current) {
        animationRef.current = requestAnimationFrame(drawGrid);
        return;
      }

      // Throttle animation based on frame rate
      const elapsed = timestamp - lastDrawTimeRef.current;
      const frameInterval = 1000 / frameRateRef.current;

      if (elapsed < frameInterval) {
        animationRef.current = requestAnimationFrame(drawGrid);
        return;
      }

      // Update last draw time, accounting for the time that passed
      lastDrawTimeRef.current = timestamp - (elapsed % frameInterval);

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);

      // Set line style
      ctx.strokeStyle = lineColor;
      ctx.globalAlpha = lineOpacity;
      ctx.lineWidth = lineWidth;

      // Calculate the number of lines needed
      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;
      const numHorizontalLines = Math.ceil(height / effectiveGridSize) + 1;
      const numVerticalLines = Math.ceil(width / effectiveGridSize) + 1;

      // Determine line skip factor based on device capability
      const skipFactor = isLowEndDevice ? 3 : 2;

      // Draw horizontal lines with animation - reduce number of lines for performance
      for (let i = 0; i < numHorizontalLines; i += skipFactor) {
        const y = (i * effectiveGridSize + offsetRef.current) % (effectiveGridSize * numHorizontalLines);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw vertical lines with animation - reduce number of lines for performance
      for (let i = 0; i < numVerticalLines; i += skipFactor) {
        const x = (i * effectiveGridSize + offsetRef.current) % (effectiveGridSize * numVerticalLines);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Update offset for animation - slow down the animation
      offsetRef.current = (offsetRef.current + (speedRef.current * 0.25)) % effectiveGridSize;

      // Continue animation
      animationRef.current = requestAnimationFrame(drawGrid);
    };

    // Start animation with timestamp
    animationRef.current = requestAnimationFrame(drawGrid);

    // Clean up
    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      clearTimeout(resizeTimer);
    };
  }, [effectiveGridSize, isLowEndDevice, observeElement, isVisibleRef, isInViewportRef]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
});
