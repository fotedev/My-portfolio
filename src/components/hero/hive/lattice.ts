/**
 * Hero lattice geometry - the hexagonal field the canvas draws.
 *
 * Pure functions, no three.js: everything here is deterministic from a seed
 * and therefore unit-testable (see lattice.test.ts).
 *
 * The field is a pointy-top hexagonal grid laid out in axial coordinates
 * (q, r). Cells whose hex distance is within `rings` form a large hexagon -
 * a hive - and each cell becomes one instanced node.
 *
 * ADR-0010.
 */

/** One node of the lattice. */
export interface LatticeNode {
  /** Index in the node array; also the instance id. */
  index: number;
  /** Resting position in lattice units (before the viewport fit scale). */
  x: number;
  y: number;
  /** Depth jitter, so the field reads as a volume rather than a flat sheet. */
  z: number;
  /**
   * Entrance threshold. The node stays invisible until the entrance progress
   * passes this value, so the field fills in progressively. A negative value
   * means "already present" - those nodes are on screen from the first frame.
   */
  threshold: number;
  /** Per-node drift phase, so the idle motion is not synchronized. */
  driftPhase: number;
  /** Per-node drift speed. */
  driftSpeed: number;
  /** Per-node drift amplitude. */
  driftAmplitude: number;
}

export interface SwarmOptions {
  /** Hex distance from the centre to the outermost ring. */
  rings: number;
  /** Size of one hexagonal cell in lattice units. */
  cellSize: number;
  /** Maximum depth jitter, in lattice units. */
  zJitter: number;
  /** Fraction of nodes that are visible from the very first frame. */
  immediateRatio: number;
  seed: number;
}

/** Hex distance between the origin and an axial coordinate. */
export function hexDistance(q: number, r: number): number {
  return (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2;
}

/**
 * Every axial coordinate whose hex distance is at most `rings`, in a stable
 * order (rings outer-to-inner, then by column) so the array index of a node
 * does not shift between runs.
 */
export function hexRingCoordinates(rings: number): Array<{ q: number; r: number }> {
  const cells: Array<{ q: number; r: number }> = [];

  for (let r = rings; r >= -rings; r -= 1) {
    // The q range for a given r is bounded so that -q-r also stays in range.
    const qMin = Math.max(-rings, -r - rings);
    const qMax = Math.min(rings, -r + rings);
    for (let q = qMin; q <= qMax; q += 1) {
      cells.push({ q, r });
    }
  }

  return cells;
}

/** Builds the node field. */
export function buildSwarm(options: SwarmOptions): LatticeNode[] {
  const { rings, cellSize, zJitter, immediateRatio, seed } = options;

  // Imported lazily to keep this module dependency-free for the geometry tests.
  let state = seed >>> 0;
  const random = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const cells = hexRingCoordinates(rings);
  const horizontal = Math.sqrt(3) * cellSize;
  const vertical = 1.5 * cellSize;

  return cells.map((cell, index) => {
    const x = horizontal * (cell.q + cell.r / 2);
    const y = vertical * cell.r;

    // Most nodes wait for the entrance to reach them; a minority are already
    // there on the first frame, so the field never starts completely empty.
    const threshold = random() < immediateRatio ? -1 : random() * 0.85;

    return {
      index,
      x,
      y,
      z: (random() - 0.5) * zJitter,
      threshold,
      driftPhase: random() * Math.PI * 2,
      driftSpeed: 0.15 + random() * 0.25,
      driftAmplitude: 0.6 + random() * 0.8,
    };
  });
}

/** The lattice's bounding box, in lattice units. */
export function swarmBounds(nodes: LatticeNode[]): {
  width: number;
  height: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    if (node.x < minX) minX = node.x;
    if (node.x > maxX) maxX = node.x;
    if (node.y < minY) minY = node.y;
    if (node.y > maxY) maxY = node.y;
  }

  return { width: maxX - minX, height: maxY - minY, minX, maxX, minY, maxY };
}
