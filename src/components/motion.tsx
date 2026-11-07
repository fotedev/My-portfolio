"use client";

import { MotionConfig, motion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Global motion config (DESIGN §6): honors prefers-reduced-motion — with
 * "user", Motion renders final state (no transforms) when reduced motion is on.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

/**
 * One-shot section reveal: fade + 8px rise, 200ms ease-out, triggered once via
 * whileInView (DESIGN §6 allowed pattern). Stagger via `delay` in 40ms steps,
 * max 3 items (0 / 0.04 / 0.08).
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.2, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
