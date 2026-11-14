/**
 * Hive lattice geometry - the node field the canvas draws.
 *
 * Pure functions, no three.js: everything here is deterministic from a seed
 * and therefore unit-testable (see lattice.test.ts).
 *
 * The field is a wing-biased peripheral constellation: gaussian clusters and
 * ambient scatter sit primarily along the left and right flanks so the central
 * reading corridor behind hero copy stays calm and legible at rest, while
 * matching the left/right hemisphere balance of the split honeycomb core
 * (ADR-0010).
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

/** Builds the wing-biased node field. */
export function buildSwarm(options: SwarmOptions): LatticeNode[] {
  const { nodeCount, clusterCount, clusterSpread, ambientRatio, fieldExtent, zJitter, seed } =
    options;

  const random = createRandom(seed);

  // Place cluster centres symmetrically along the left and right flanks so the
  // constellation frames the central reading column rather than crowding it.
  const leftCentres: Array<{ x: number; y: number }> = [];
  const rightCentres: Array<{ x: number; y: number }> = [];
  const totalClusters = Math.max(2, clusterCount);

  for (let c = 0; c < totalClusters; c += 1) {
    const isLeft = c % 2 === 0;
    const sign = isLeft ? -1 : 1;
    const centre = {
      x: sign * fieldExtent * (0.42 + random.next() * 0.44),
      y: random.range(-fieldExtent * 0.78, fieldExtent * 0.78),
    };
    if (isLeft) {
      leftCentres.push(centre);
    } else {
      rightCentres.push(centre);
    }
  }

  return Array.from({ length: nodeCount }, (_, index) => {
    const isLeft = index < nodeCount / 2;
    const hemisphereSign = isLeft ? -1 : 1;
    const wingCentres = isLeft ? leftCentres : rightCentres;
    const clustered = random.next() >= ambientRatio;

    let x: number;
    let y: number;
    if (clustered) {
      const centre = random.pick(wingCentres);
      x = centre.x + gaussian(random) * clusterSpread;
      y = centre.y + gaussian(random) * clusterSpread;
    } else {
      x = hemisphereSign * random.range(0.35, fieldExtent);
      y = random.range(-fieldExtent * 0.88, fieldExtent * 0.88);
    }

    // Keep each node within its assigned hemisphere so wing counts stay
    // balanced 1-to-1 with the left/right honeycomb hemispheres.
    if (x * hemisphereSign <= 0) {
      x = hemisphereSign * Math.max(0.35, Math.abs(x));
    }

    // Smooth central reading-corridor clearance behind the hero headline/copy.
    if (Math.abs(x) < 1.9 && Math.abs(y) < 2.2) {
      x = hemisphereSign * (1.9 + Math.abs(x) * 0.35);
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
export function swarmBounds(nodes: ReadonlyArray<{ x: number; y: number }>): {
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
