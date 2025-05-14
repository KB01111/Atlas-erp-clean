"use client";

import { cn } from "@/lib/utils";
import { motion, MotionStyle, Transition } from "motion/react";

interface BorderBeamProps {
  /**
   * The size of the border beam.
   */
  size?: number;
  /**
   * The duration of the border beam.
   */
  duration?: number;
  /**
   * The delay of the border beam.
   */
  delay?: number;
  /**
   * The color of the border beam from.
   */
  colorFrom?: string;
  /**
   * The color of the border beam to.
   */
  colorTo?: string;
  /**
   * The motion transition of the border beam.
   */
  transition?: Transition;
  /**
   * The class name of the border beam.
   */
  className?: string;
  /**
   * The style of the border beam.
   */
  style?: React.CSSProperties;
  /**
   * Whether to reverse the animation direction.
   */
  reverse?: boolean;
  /**
   * The initial offset position (0-100).
   */
  initialOffset?: number;
  /**
   * The beam color (shorthand for colorFrom and colorTo)
   */
  beamColor?: string;
  /**
   * The beam duration (shorthand for duration)
   */
  beamDuration?: number;
  /**
   * The beam size (shorthand for size)
   */
  beamSize?: number;
  /**
   * The children to render inside the border beam container
   */
  children?: React.ReactNode;
}

export const BorderBeam = ({
  className,
  size = 50,
  delay = 0,
  duration = 6,
  colorFrom = "#ffaa40",
  colorTo = "#9c40ff",
  transition,
  style,
  reverse = false,
  initialOffset = 0,
  beamColor,
  beamDuration,
  beamSize,
  children,
}: BorderBeamProps) => {
  // Use shorthand props if provided
  const finalSize = beamSize || size;
  const finalDuration = beamDuration || duration;
  const finalColorFrom = beamColor || colorFrom;
  const finalColorTo = beamColor || colorTo;

  return (
    <div className={cn("relative", className)}>
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] border border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]">
        <motion.div
          className={cn(
            "absolute aspect-square",
            "bg-gradient-to-l from-[var(--color-from)] via-[var(--color-to)] to-transparent",
          )}
          style={
            {
              width: finalSize,
              offsetPath: `rect(0 auto auto 0 round ${finalSize}px)`,
              "--color-from": finalColorFrom,
              "--color-to": finalColorTo,
              ...style,
            } as MotionStyle
          }
          initial={{ offsetDistance: `${initialOffset}%` }}
          animate={{
            offsetDistance: reverse
              ? [`${100 - initialOffset}%`, `${-initialOffset}%`]
              : [`${initialOffset}%`, `${100 + initialOffset}%`],
          }}
          transition={{
            repeat: Infinity,
            ease: "linear",
            duration: finalDuration,
            delay: -delay,
            ...transition,
          }}
        />
      </div>
      {children}
    </div>
  );
};
