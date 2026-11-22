"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

/**
 * The hive lattice is a deferred island: the chunk is fetched only once the
 * browser has recorded the page's LCP element, so its fetch, evaluation and
 * shader compilation can never delay the paint the performance gate measures.
 * It is also entirely absent from the server-rendered HTML.
 *
 * The kill switch (`NEXT_PUBLIC_HERO_HIVE=0`) removes the layer entirely -
 * see ADR-0010 §5.
 */
const HiveCanvas = dynamic(() => import("./hive-canvas"), { ssr: false, loading: () => null });

/**
 * Resolves once the browser has settled on an LCP element, then hands off to
 * the idle scheduler. LCP is reported as a series of candidates, so the gate
 * waits for a quiet window (`settleMs`) after the LAST entry rather than
 * firing on the first one - booting on an early candidate would let the
 * island compete with the element that ultimately wins the metric. Entries
 * recorded before this effect runs are delivered via `buffered: true`. The
 * overall timeout covers browsers without LCP observability and loads where
 * the user interacts before any entry is emitted (interaction ends LCP
 * reporting).
 *
 * The callback returns its own disposer so that an unmount between the LCP
 * hand-off and the idle fire still cancels the scheduled work.
 */
function afterLcp(callback: () => () => void, timeoutMs = 4000, settleMs = 600): () => void {
  let done = false;
  let settleTimer: number | null = null;
  const cleanups: Array<() => void> = [];
  const finish = (): void => {
    if (done) return;
    done = true;
    for (const cleanup of cleanups) cleanup();
    cleanups.length = 0;
    cleanups.push(callback());
  };

  try {
    const observer = new PerformanceObserver((list) => {
      if (list.getEntries().length === 0) return;
      if (settleTimer !== null) window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(finish, settleMs);
    });
    observer.observe({ type: "largest-contentful-paint", buffered: true });
    cleanups.push(() => {
      observer.disconnect();
      if (settleTimer !== null) window.clearTimeout(settleTimer);
    });
  } catch {
    // No PerformanceObserver/LCP support on this browser: the timeout below
    // is the only trigger.
  }

  const timer = window.setTimeout(finish, timeoutMs);
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
    return afterLcp(() => scheduleIdle(() => setMounted(true)));
  }, []);

  if (!mounted) return null;

  return <HiveCanvas />;
}
