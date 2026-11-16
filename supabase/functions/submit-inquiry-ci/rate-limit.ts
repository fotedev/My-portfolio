/**
 * Rate-limit decision logic inside the Edge Function. Keep in sync with
 * src/lib/contact/rate-limit.ts (unit-tested reference implementation —
 * prompt-5 §7 tests the decision logic with mocked counters there).
 *
 * FAIL-CLOSED contract (Rule R12): a missing/false RPC result blocks.
 */
export type LimitSpec = {
  /** Counter key passed to the RPC, e.g. "net:<hash>", "email:<lowered>", "global:daily". */
  key: string;
  windowSeconds: number;
  max: number;
};

export type RateLimitDecision = {
  allowed: boolean;
  /** Upper bound for the Retry-After header (full window of the blocking spec). */
  retryAfterSeconds: number | null;
  /** Which limit blocked, for server logs only — never sent to visitors. */
  blockedBy: string | null;
};

export function evaluateRateLimits(
  specs: LimitSpec[],
  results: Array<boolean | undefined>,
): RateLimitDecision {
  // Fail-closed even when no limits are configured — an empty spec list is a
  // deployment bug, and "no limits" must never mean "allow".
  if (specs.length === 0) {
    return { allowed: false, retryAfterSeconds: 600, blockedBy: "no-limits-configured" };
  }
  for (let i = 0; i < specs.length; i++) {
    const spec = specs[i];
    // Undefined (RPC error / short results) counts as blocked — fail closed.
    if (!spec || results[i] !== true) {
      return {
        allowed: false,
        retryAfterSeconds: spec?.windowSeconds ?? 600,
        blockedBy: spec?.key ?? "rpc-error",
      };
    }
  }
  return { allowed: true, retryAfterSeconds: null, blockedBy: null };
}
