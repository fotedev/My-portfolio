"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/**
 * Global motion config (DESIGN §6): honors prefers-reduced-motion — with
 * "user", Motion renders final state (no transforms) when reduced motion is on.
 *
 * Section reveals were removed in ADR-0009: scattered fade-up entrances read
 * as template motion and left sections invisible until JS scrolled them into
 * view. The only entrance now is the hero's CSS `rise-in` (globals.css), which
 * runs once on page load and works without JavaScript.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
