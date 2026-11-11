"use client";

import { useEffect, useRef } from "react";
import { RINGS_LANDSCAPE, RINGS_PORTRAIT } from "./config";
import { HiveRenderer } from "./hive-renderer";
import { readPalette } from "./palette";

/** Matches the `md` breakpoint in DESIGN.md §14.5. */
const PORTRAIT_QUERY = "(max-width: 767px)";

/** Matches the global `prefers-reduced-motion` rule in DESIGN.md §6. */
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * The hero lattice canvas.
 *
 * Decorative only: `aria-hidden`, `pointer-events: none`, and it carries no
 * text. It sits behind the hero content and fades out as the hero leaves the
 * viewport (ADR-0010 §1).
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
    const rings = window.matchMedia(PORTRAIT_QUERY).matches ? RINGS_PORTRAIT : RINGS_LANDSCAPE;

    let renderer: HiveRenderer;
    try {
      renderer = new HiveRenderer(canvas, {
        reducedMotion,
        rings,
        palette: readPalette(document.documentElement),
      });
    } catch {
      // No WebGL context, or the context failed to be created. The canvas is
      // removed and the hero renders exactly as it does without this layer.
      canvas.remove();
      return;
    }

    rendererRef.current = renderer;

    const hero = document.querySelector<HTMLElement>("[data-hive-hero]");

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
      if (!hero) return;
      const rect = hero.getBoundingClientRect();

      // Convergence: 0 while the hero is in place, 1 once the reader has
      // scrolled a short way into it. The page itself scrolls normally - this
      // only reads position. The range is deliberately short (a fifth of the
      // hero's height) so the form completes while the hero is still on
      // screen and the reader can actually see it settle.
      renderer.setAssembly(-rect.top / Math.max(1, rect.height * 0.2));

      // Fade out over the last third of the hero's exit.
      const overlap = Math.min(window.innerHeight, rect.bottom) - Math.max(0, rect.top);
      const visibility = Math.min(1, Math.max(0, overlap / (window.innerHeight * 0.35)));
      container.style.opacity = String(visibility);

      if (visibility <= 0) {
        renderer.stop();
      } else {
        renderer.start();
      }
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
    <div ref={containerRef} className="hero-hive" aria-hidden="true">
      <canvas ref={canvasRef} className="hero-hive__canvas" />
    </div>
  );
}
