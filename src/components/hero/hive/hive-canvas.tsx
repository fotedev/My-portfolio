"use client";

import { useEffect, useRef } from "react";
import { ENERGY_RANGE } from "./config";
import { HiveRenderer } from "./hive-renderer";
import { readPalette } from "./palette";

/** Matches the global `prefers-reduced-motion` rule in DESIGN.md §6. */
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * The hive lattice canvas - the fixed, page-wide backdrop (ADR-0010 §9).
 *
 * Decorative only: `aria-hidden`, `pointer-events: none`, and it carries no
 * text. It sits at negative z-index, above the page's background token and
 * below every content element, so transparent sections let it through and
 * opaque surfaces cover it like any other background.
 *
 * Scroll energy: the plexus rests sparse at the top of the page and reaches
 * full density and brightness over the first ENERGY_RANGE viewport heights of
 * scroll, matching the reference's progression.
 *
 * The palette is read from CSS custom properties, so a theme switch is picked
 * up by observing the `class` attribute on the document element rather than
 * by subscribing to the theme provider.
 */
export default function HiveCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<HiveRenderer | null>(null);

  // --- create once --------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches;

    let renderer: HiveRenderer;
    try {
      renderer = new HiveRenderer(canvas, {
        reducedMotion,
        palette: readPalette(document.documentElement),
      });
    } catch {
      // No WebGL context, or the context failed to be created. The canvas is
      // removed and the page renders exactly as it does without this layer.
      canvas.remove();
      return;
    }

    rendererRef.current = renderer;

    const resize = (): void => {
      const rect = container.getBoundingClientRect();
      renderer.resize(rect.width, rect.height);
    };

    const onPointerMove = (event: PointerEvent): void => {
      renderer.setPointer(
        (event.clientX / window.innerWidth) * 2 - 1,
        (event.clientY / window.innerHeight) * 2 - 1,
      );
    };

    const onScroll = (): void => {
      // Scroll energy, over the first ENERGY_RANGE viewport heights. The page
      // itself scrolls normally - this only reads position.
      const range = window.innerHeight * ENERGY_RANGE;
      const target = Math.min(1, Math.max(0, window.scrollY / Math.max(1, range)));
      renderer.setEnergy(target);
    };

    const onVisibilityChange = (): void => {
      if (document.hidden) {
        renderer.stop();
      } else {
        renderer.start();
      }
    };

    const onThemeChange = (): void => {
      rendererRef.current?.setPalette(readPalette(document.documentElement));
    };

    const themeObserver = new MutationObserver(onThemeChange);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    resize();
    onScroll();
    renderer.start();

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      themeObserver.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      renderer.dispose();
      rendererRef.current = null;
    };
  }, []);

  return (
    <div ref={containerRef} className="hive-layer" aria-hidden="true" data-hive-layer>
      <canvas ref={canvasRef} className="hive-layer__canvas" />
    </div>
  );
}
