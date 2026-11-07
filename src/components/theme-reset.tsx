"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot(): string | null {
  try {
    return localStorage.getItem("fotedev-theme");
  } catch {
    return null;
  }
}

function getServerSnapshot(): string | null {
  return null;
}

/**
 * "Use system theme" (DESIGN §10.7) — rendered only while a manual override
 * exists. useSyncExternalStore reads the key without a setState-in-effect.
 */
export function ThemeReset({ label }: { label: string }) {
  const { setTheme } = useTheme();
  const override = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (override === null) {
    return null;
  }

  return (
    <button
      type="button"
      className="inline-flex min-h-11 items-center text-accent underline-offset-4 hover:underline"
      onClick={() => {
        try {
          localStorage.removeItem("fotedev-theme");
        } catch {
          // Storage blocked: setTheme("system") still restores system-following.
        }
        setTheme("system");
      }}
    >
      {label}
    </button>
  );
}
