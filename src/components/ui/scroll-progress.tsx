"use client";

import { useEffect, useState } from "react";

interface ScrollProgressProps {
  color?: string;
  height?: number;
  zIndex?: number;
}

export function ScrollProgress({
  color = "#3b82f6",
  height = 4,
  zIndex = 50,
}: ScrollProgressProps) {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
    };

    // Add scroll event listener
    window.addEventListener("scroll", handleScroll);

    // Initial calculation
    handleScroll();

    // Clean up
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: `${height}px`,
        backgroundColor: "transparent",
        zIndex,
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${scrollProgress}%`,
          backgroundColor: color,
          transition: "width 0.1s ease-out",
        }}
      />
    </div>
  );
}
