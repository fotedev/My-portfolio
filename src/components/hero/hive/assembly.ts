/**
 * The assembly form - what the scattered field converges into.
 *
 * The hero starts as a wide hexagonal field and collapses into a tight
 * "hex core": concentric hexagonal rings of nodes, one ring per step, each
 * ring rotated against the previous one so the result reads as a rosette
 * rather than as nested outlines.
 *
 * The form is original to this project. It is deliberately not the reference
 * site's logo outline and not its brain target - see ADR-0010 §8.
 *
 * Pure geometry, no three.js.
 */

/** A point the field converges toward. */
export interface AssemblyTarget {
  x: number;
  y: number;
  z: number;
  /** Distance from the centre, used to map nodes onto rings coherently. */
  radius: number;
}

export interface RosetteOptions {
  /** Number of concentric rings. Ring k holds 6k nodes. */
  rings: number;
  /** Radial distance between consecutive rings. */
  ringGap: number;
  /** Depth of the form along z. */
  depth: number;
  seed: number;
}

/** A vertex of a regular hexagon of the given circumradius, flat-topped. */
function hexagonVertex(index: number, radius: number): { x: number; y: number } {
  const angle = (Math.PI / 3) * index;
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
}

/** Number of nodes on a hexagon ring of the given index (1-based). */
export function ringNodeCount(ring: number): number {
  return 6 * ring;
}

/**
 * Total node count of a rosette with the given number of rings.
 *
 * The rosette has the same topology as the lattice it collapses from: one
 * centre point plus `6k` points on each of `k` rings. That one-to-one
 * correspondence is what makes the collapse read as the field folding
 * inward rather than as nodes scrambling into clumps.
 */
export function rosetteNodeCount(rings: number): number {
  let total = 1;
  for (let ring = 1; ring <= rings; ring += 1) {
    total += ringNodeCount(ring);
  }
  return total;
}

/**
 * Builds the concentric rings. Ring k is a hexagon of circumradius
 * `k * ringGap` with 6k evenly spaced points along its perimeter. Alternate
 * rings are rotated by 30 degrees so consecutive rings interleave.
 */
export function buildRosette(options: RosetteOptions): AssemblyTarget[] {
  const { rings, ringGap, depth, seed } = options;

  let state = seed >>> 0;
  const random = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const targets: AssemblyTarget[] = [{ x: 0, y: 0, z: (random() - 0.5) * depth, radius: 0 }];

  for (let ring = 1; ring <= rings; ring += 1) {
    const radius = ring * ringGap;
    const count = ringNodeCount(ring);
    const rotation = ring % 2 === 0 ? Math.PI / 6 : 0;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    for (let i = 0; i < count; i += 1) {
      const edge = Math.floor(i / ring);
      const step = i % ring;
      const from = hexagonVertex(edge, radius);
      const to = hexagonVertex((edge + 1) % 6, radius);
      const t = step / ring;

      const px = from.x + (to.x - from.x) * t;
      const py = from.y + (to.y - from.y) * t;

      const x = px * cos - py * sin;
      const y = px * sin + py * cos;

      targets.push({
        x,
        y,
        z: (random() - 0.5) * depth * (1 - (ring - 1) / (rings + 1)),
        radius: Math.hypot(x, y),
      });
    }
  }

  return targets;
}

/**
 * Maps every node of the field onto a target.
 *
 * The mapping is by radius, not random: the node closest to the centre of the
 * field converges onto the centre of the rosette, the next ring of nodes onto
 * the first rosette ring, and so on. A random mapping makes the collapse
 * look like a shuffle; a radial mapping makes it look like the field is
 * folding inward, which is the intent.
 *
 * When the rosette has the same node count as the field - which it does,
 * because it is a scaled-down copy of the same hexagon - this is an exact
 * one-to-one correspondence and the collapsed form is a crisp honeycomb.
 */
export function assignTargets(
  nodePositions: ReadonlyArray<{ x: number; y: number }>,
  targets: readonly AssemblyTarget[],
  jitter: number,
  seed: number,
): AssemblyTarget[] {
  let state = seed >>> 0;
  const random = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const first = targets[0];
  if (!first) {
    return nodePositions.map((position) => ({ x: position.x, y: position.y, z: 0, radius: 0 }));
  }

  const order = nodePositions
    .map((position, index) => ({
      index,
      radius: Math.hypot(position.x, position.y),
    }))
    .sort((a, b) => a.radius - b.radius || a.index - b.index);

  const assigned: AssemblyTarget[] = new Array(nodePositions.length);

  order.forEach((entry, rank) => {
    // Nodes are spread across the targets in proportion to their rank, so
    // many nodes share a slot and the rosette reads as a dense core.
    const slot = Math.min(targets.length - 1, Math.floor((rank * targets.length) / order.length));
    const target = targets[slot] ?? first;

    assigned[entry.index] = {
      x: target.x + (random() - 0.5) * jitter,
      y: target.y + (random() - 0.5) * jitter,
      z: target.z + (random() - 0.5) * jitter * 0.5,
      radius: target.radius,
    };
  });

  return assigned;
}
