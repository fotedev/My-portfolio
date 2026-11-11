/**
 * Deterministic pseudo-random number generation (mulberry32).
 *
 * The hero lattice is generated from a fixed seed so that renders are
 * reproducible, screenshots are stable across runs, and the geometry can be
 * asserted in unit tests. Bare Math.random() would give none of that.
 *
 * ADR-0010 §8 (clean-room method).
 */

export interface Random {
  /** Returns a float in [0, 1). */
  next(): number;
  /** Returns a float in [min, max). */
  range(min: number, max: number): number;
  /** Returns an integer in [min, max). */
  int(min: number, max: number): number;
  /** Picks one element of a non-empty array. */
  pick<T>(items: readonly T[]): T;
}

/**
 * Creates a seeded generator. The same seed always yields the same sequence,
 * which is what makes the lattice testable.
 */
export function createRandom(seed: number): Random {
  // mulberry32: 32-bit state, uniform enough for geometry, and stable across
  // engines (unlike Math.sin-hash tricks, whose results can vary by platform).
  let state = seed >>> 0;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    range: (min, max) => min + next() * (max - min),
    int: (min, max) => Math.floor(min + next() * (max - min)),
    pick: (items) => {
      if (items.length === 0) {
        throw new Error("createRandom().pick() called with an empty array");
      }
      const item = items[Math.floor(next() * items.length)];
      if (item === undefined) {
        throw new Error("createRandom().pick() produced an out-of-range index");
      }
      return item;
    },
  };
}
