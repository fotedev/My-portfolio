/**
 * Hive lattice geometry - the node field the canvas draws.
 *
 * Pure functions, no three.js: everything here is deterministic from a seed
 * and therefore unit-testable (see lattice.test.ts).
 *
 * The field is a clustered scatter, not a uniform grid: a handful of gaussian
 * clouds with ambient singles between them. Clumps of dense mesh and
 * stretches of empty space are what make the layer read as a living network
 * rather than as flat texture - that contrast is the reference technique's
 * signature. Every node is present from the first frame; the scroll story is
 * carried by link reach and brightness (ADR-0010 §9), not by reveal.
 *
 * ADR-0010.
 */

import { createRandom } from "./random";

/** One node of the lattice. */
export interface LatticeNode {
  /** Index in the node array; also the instance id. */
  index: number;
  /** Resting position in lattice units (before the viewport fit scale). */
  x: number;
  y: number;
  /** Depth jitter, so the field reads as a volume rather than a flat sheet. */
  z: number;
  /** Per-node drift phase, so the idle motion is not synchronized. */
  driftPhase: number;
  /** Per-node drift speed. */
  driftSpeed: number;
  /** Per-node drift amplitude. */
  driftAmplitude: number;
}

export interface SwarmOptions {
  /** Total node count. */
  nodeCount: number;
  /** Number of cluster centres. */
  clusterCount: number;
  /** Cluster spread, in lattice units (one standard deviation). */
  clusterSpread: number;
  /** Share of nodes placed as ambient scatter outside the clusters. */
  ambientRatio: number;
  /** Half-extent of the field, in lattice units. */
  fieldExtent: number;
  /** Depth jitter, in lattice units. */
  zJitter: number;
  seed: number;
}

/** Standard normal sample via the Box-Muller transform. */
function gaussian(random: { next(): number }): number {
  // next() returns [0, 1); log(0) would be -Infinity, so clamp away from zero.
  const u1 = Math.max(random.next(), Number.EPSILON);
  const u2 = random.next();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/** Builds the node field. */
export function buildSwarm(options: SwarmOptions): LatticeNode[] {
  const { nodeCount, clusterCount, clusterSpread, ambientRatio, fieldExtent, zJitter, seed } =
    options;

  const random = createRandom(seed);

  // Cluster centres sit inside a margin of the field, so no cloud is centred
  // exactly on the edge and every cluster keeps room to breathe.
  const centres = Array.from({ length: Math.max(1, clusterCount) }, () => ({
    x: random.range(-fieldExtent, fieldExtent) * 0.7,
    y: random.range(-fieldExtent, fieldExtent) * 0.7,
  }));

  return Array.from({ length: nodeCount }, (_, index) => {
    const clustered = random.next() >= ambientRatio;
    let x: number;
    let y: number;
    if (clustered) {
      const centre = random.pick(centres);
      x = centre.x + gaussian(random) * clusterSpread;
      y = centre.y + gaussian(random) * clusterSpread;
    } else {
      x = random.range(-fieldExtent, fieldExtent);
      y = random.range(-fieldExtent, fieldExtent);
    }

    return {
      index,
      x,
      y,
      z: (random.next() - 0.5) * zJitter,
      driftPhase: random.next() * Math.PI * 2,
      driftSpeed: 0.15 + random.next() * 0.25,
      driftAmplitude: 0.6 + random.next() * 0.8,
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
