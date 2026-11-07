import { describe, expect, it } from "vitest";
import { evaluateRateLimits, type LimitSpec } from "./rate-limit";

const net: LimitSpec = { key: "net:abc", windowSeconds: 600, max: 3 };
const email: LimitSpec = { key: "email:x@y.z", windowSeconds: 86400, max: 5 };
const global: LimitSpec = { key: "global:daily", windowSeconds: 86400, max: 50 };
const specs = [net, email, global];

describe("evaluateRateLimits — fail-closed decision (Rule R12)", () => {
  it("allows when every limit passes", () => {
    expect(evaluateRateLimits(specs, [true, true, true])).toEqual({
      allowed: true,
      retryAfterSeconds: null,
      blockedBy: null,
    });
  });

  it("blocks on the first failing limit with its window as Retry-After", () => {
    const decision = evaluateRateLimits(specs, [true, false, true]);
    expect(decision).toEqual({
      allowed: false,
      retryAfterSeconds: 86400,
      blockedBy: "email:x@y.z",
    });
  });

  it("blocks on the net limit", () => {
    const decision = evaluateRateLimits(specs, [false, true, true]);
    expect(decision.allowed).toBe(false);
    expect(decision.retryAfterSeconds).toBe(600);
    expect(decision.blockedBy).toBe("net:abc");
  });

  it("treats a missing result as blocked (RPC error path)", () => {
    expect(evaluateRateLimits(specs, [true, true]).allowed).toBe(false);
    expect(evaluateRateLimits(specs, [true, true, undefined]).allowed).toBe(false);
    expect(evaluateRateLimits(specs, []).allowed).toBe(false);
  });

  it("stays fail-closed with an empty spec list", () => {
    // No limits configured = nothing allows a write.
    expect(evaluateRateLimits([], []).allowed).toBe(false);
  });
});
