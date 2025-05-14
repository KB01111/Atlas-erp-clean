"use client";

import { useEffect, useRef, ReactNode } from "react";

interface ShineBorderProps {
  children: ReactNode;
  borderColor?: string;
  shineBorderColor?: string;
  borderRadius?: string;
  className?: string;
  duration?: number;
}

export function ShineBorder({
  children,
  borderColor = "rgba(59, 130, 246, 0.2)",
  shineBorderColor = "rgba(59, 130, 246, 0.6)",
  borderRadius = "0.5rem",
  className = "",
  duration = 3,
}: ShineBorderProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Add the keyframes animation if it doesn't exist
    if (!document.querySelector("#shine-border-keyframes")) {
      const style = document.createElement("style");
      style.id = "shine-border-keyframes";
      style.textContent = `
        @keyframes shine-border {
          0% {
            background-position: 0% 0%;
          }
          100% {
            background-position: 200% 0%;
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Clean up
    return () => {
      // No cleanup needed for this effect
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "relative",
        borderRadius,
        background: `linear-gradient(90deg, ${borderColor} 0%, ${shineBorderColor} 50%, ${borderColor} 100%)`,
        backgroundSize: "200% 100%",
        animation: `shine-border ${duration}s linear infinite`,
      }}
    >
      <div
        style={{
          borderRadius: `calc(${borderRadius} - 1px)`,
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}
