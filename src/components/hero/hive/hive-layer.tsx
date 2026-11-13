"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

/**
 * The hive lattice is a deferred island: the chunk is fetched only once the
 * page has painted, so it never competes with the LCP element. It is also
 * entirely absent from the server-rendered HTML.
 *
 * The kill switch (`NEXT_PUBLIC_HERO_HIVE=0`) removes the layer entirely -
 * see ADR-0010 §5.
 */
const HiveCanvas = dynamic(() => import("./hive-canvas"), { ssr: false, loading: () => null });

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
    return scheduleIdle(() => setMounted(true));
  }, []);

  if (!mounted) return null;

  return <HiveCanvas />;
}
