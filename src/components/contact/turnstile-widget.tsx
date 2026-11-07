"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Cloudflare Turnstile widget (zero-dep, explicit render — turnstile-spin
 * canonical pattern). Tokens are SINGLE-USE: the parent bumps `resetSignal`
 * after every submission attempt so the next attempt gets a fresh token.
 *
 * The fallback sitekey is Cloudflare's published always-pass TEST key
 * (developers.cloudflare.com/turnstile/troubleshooting/testing); the real
 * widget key overrides it via NEXT_PUBLIC_TURNSTILE_SITE_KEY (M6).
 */
const TEST_SITEKEY = "1x00000000000000000000AA";

type TurnstileRenderParams = {
  sitekey: string;
  action?: string;
  theme?: "auto" | "light" | "dark";
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => boolean;
};

type TurnstileApi = {
  render: (el: HTMLElement, params: TurnstileRenderParams) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptLoader: Promise<void> | null = null;

function loadTurnstile(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("no window"));
  }
  if (window.turnstile) {
    return Promise.resolve();
  }
  scriptLoader ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptLoader = null;
      reject(new Error("turnstile script failed to load"));
    };
    document.head.appendChild(script);
  });
  return scriptLoader;
}

export function TurnstileWidget({
  onToken,
  onExpire,
  onError,
  resetSignal,
}: {
  onToken: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  resetSignal: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [failed, setFailed] = useState(false);
  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || TEST_SITEKEY;

  // Mount/unmount the widget once the API script is ready.
  useEffect(() => {
    let cancelled = false;
    void loadTurnstile()
      .then(() => {
        if (cancelled || !containerRef.current || widgetIdRef.current || !window.turnstile) {
          return;
        }
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey,
          action: "contact",
          theme: "auto",
          callback: onToken,
          "expired-callback": onExpire,
          "error-callback": () => {
            setFailed(true);
            onError?.();
            return true;
          },
        });
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
          onError?.();
        }
      });
    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [sitekey, onToken, onExpire, onError]);

  // Fresh token after each attempt (tokens are single-use).
  useEffect(() => {
    if (resetSignal > 0 && widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, [resetSignal]);

  if (failed) {
    // Silent in the UI — the form's error state shows the direct-email
    // fallback; the widget area just collapses.
    return null;
  }
  // No ARIA on the container: Turnstile's injected iframe carries its own
  // accessible name; a labeled role-less div is an axe violation.
  return <div ref={containerRef} />;
}
