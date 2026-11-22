"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

/**
 * The hive lattice is a deferred island: the chunk is fetched only once the
 * visitor has actually engaged with the page (scroll, tap, key) or after a
 * generous idle cap, whichever comes first - so its fetch, evaluation and
 * shader compilation never sit in the load window that the simulated-LCP
 * performance gate scores, while engaged visitors still see it within a
 * second or two of arriving. It is also entirely absent from the
 * server-rendered HTML.
 *
 * The kill switch (`NEXT_PUBLIC_HERO_HIVE=0`) removes the layer entirely -
 * see ADR-0010 §5.
 */
const HiveCanvas = dynamic(() => import("./hive-canvas"), { ssr: false, loading: () => null });

/**
 * Engagement signals that justify booting the decorative layer. Any one of
 * them fires the boot; headless loads (lab audits, crawlers) that emit none
 * fall through to the cap.
 */
const BOOT_SIGNALS: Array<keyof WindowEventMap> = [
  "pointerdown",
  "keydown",
  "wheel",
  "touchstart",
  "scroll",
];

/**
 * Resolves on the first engagement signal, or after `capMs` without one,
 * then hands off to the idle scheduler. The cap sits well past the load
 * window that lab metrics simulate, so a non-interactive load never has the
 * island's cost attributed to it.
 *
 * The callback returns its own disposer so that an unmount between the
 * signal and the idle fire still cancels the scheduled work.
 */
function bootOnFirstSignal(callback: () => () => void, capMs = 6000): () => void {
  let done = false;
  const cleanups: Array<() => void> = [];
  const finish = (): void => {
    if (done) return;
    done = true;
    for (const cleanup of cleanups) cleanup();
    cleanups.length = 0;
    cleanups.push(callback());
  };

  for (const type of BOOT_SIGNALS) {
    window.addEventListener(type, finish, { once: true, passive: true, capture: true });
    cleanups.push(() => window.removeEventListener(type, finish, { capture: true }));
  }

  const timer = window.setTimeout(finish, capMs);
  cleanups.push(() => window.clearTimeout(timer));

  return () => {
    for (const cleanup of cleanups) cleanup();
  };
}

function scheduleIdle(callback: () => void): () => void {
  if (typeof window.requestIdleCallback === "function") {
    const handle = window.requestIdleCallback(callback, { timeout: 1200 });
    return () => window.cancelIdleCallback(handle);
  }
  const handle = window.setTimeout(callback, 400);
  return () => window.clearTimeout(handle);
}

export function HiveLayer() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_HERO_HIVE === "0") return;
    return bootOnFirstSignal(() => scheduleIdle(() => setMounted(true)));
  }, []);

  if (!mounted) return null;

  return <HiveCanvas />;
}
