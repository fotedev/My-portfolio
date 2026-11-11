/**
 * Proximity links - the faint lines that join nearby nodes.
 *
 * Recomputed from the nodes' current animated positions, so the mesh stays
 * attached to the field while it drifts and while it converges. A uniform
 * spatial hash keeps the neighbour search linear in the node count instead
 * of quadratic.
 *
 * Pure geometry, no three.js.
 */

/** Pairs of node indices to draw a line between, interleaved (i, j, i, j...). */
export interface LinkBuffer {
  indices: Int32Array;
  /** Number of valid pairs (indices.length / 2). */
  count: number;
}

export interface LinkOptions {
  /** Maximum distance between two linked nodes. */
  maxDistance: number;
  /** Maximum links kept per node. */
  maxPerNode: number;
}

/** Reads a component of a position buffer. */
function at(positions: Float32Array, index: number): number {
  return positions[index] ?? 0;
}

/**
 * Builds the link set for the given positions.
 *
 * The result is written into a reusable buffer so the render loop does not
 * allocate a new typed array on every recomputation.
 */
export function computeLinks(
  positions: Float32Array,
  nodeCount: number,
  options: LinkOptions,
  buffer: LinkBuffer,
): LinkBuffer {
  const { maxDistance, maxPerNode } = options;
  buffer.count = 0;

  if (nodeCount < 2 || maxDistance <= 0) {
    return buffer;
  }

  // --- spatial hash -------------------------------------------------------
  const cellSize = maxDistance;
  const inverseCell = 1 / cellSize;

  // Map the node cloud into a grid keyed by cell. Keys are packed into a
  // string because the coordinate range is unbounded; the node count is small
  // enough that this is comfortably fast and avoids a sparse-array index.
  const buckets = new Map<string, number[]>();

  const keyOf = (cx: number, cy: number, cz: number): string => `${cx},${cy},${cz}`;

  for (let i = 0; i < nodeCount; i += 1) {
    const cx = Math.floor(at(positions, i * 3) * inverseCell);
    const cy = Math.floor(at(positions, i * 3 + 1) * inverseCell);
    const cz = Math.floor(at(positions, i * 3 + 2) * inverseCell);
    const key = keyOf(cx, cy, cz);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.push(i);
    } else {
      buckets.set(key, [i]);
    }
  }

  // --- neighbour search ----------------------------------------------------
  const maxDistanceSquared = maxDistance * maxDistance;
  const candidates: number[] = [];
  const distances: number[] = [];
  const pairs = new Set<string>();

  for (let i = 0; i < nodeCount; i += 1) {
    const ix = at(positions, i * 3);
    const iy = at(positions, i * 3 + 1);
    const iz = at(positions, i * 3 + 2);

    const cx = Math.floor(ix * inverseCell);
    const cy = Math.floor(iy * inverseCell);
    const cz = Math.floor(iz * inverseCell);

    candidates.length = 0;
    distances.length = 0;

    for (let dx = -1; dx <= 1; dx += 1) {
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dz = -1; dz <= 1; dz += 1) {
          const bucket = buckets.get(keyOf(cx + dx, cy + dy, cz + dz));
          if (!bucket) continue;

          for (const j of bucket) {
            if (j === i) continue;
            const ddx = at(positions, j * 3) - ix;
            const ddy = at(positions, j * 3 + 1) - iy;
            const ddz = at(positions, j * 3 + 2) - iz;
            const distanceSquared = ddx * ddx + ddy * ddy + ddz * ddz;
            if (distanceSquared < maxDistanceSquared) {
              candidates.push(j);
              distances.push(distanceSquared);
            }
          }
        }
      }
    }

    if (candidates.length === 0) continue;

    // Keep the nearest few, so the mesh stays legible instead of collapsing
    // into a solid block of lines once the field is dense.
    const chosen =
      candidates.length > maxPerNode
        ? distances
            .map((distance, index) => ({ index, distance }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, maxPerNode)
            .map((entry) => candidates[entry.index])
        : candidates;

    // Every node picks its own nearest neighbours, and the union of those
    // choices is deduplicated. Picking from one side only leaves the nodes
    // with lower indices starved of links, which shows up as stray dots
    // scattered through an otherwise even mesh.
    for (const j of chosen) {
      if (j === undefined) continue;
      pairs.add(i < j ? `${i},${j}` : `${j},${i}`);
    }
  }

  for (const key of pairs) {
    if (buffer.count * 2 + 1 >= buffer.indices.length) break;
    const [a, b] = key.split(",");
    const first = Number(a);
    const second = Number(b);
    if (!Number.isFinite(first) || !Number.isFinite(second)) continue;
    buffer.indices[buffer.count * 2] = first;
    buffer.indices[buffer.count * 2 + 1] = second;
    buffer.count += 1;
  }

  return buffer;
}

/** Allocates a link buffer large enough for the given node count. */
export function createLinkBuffer(nodeCount: number, maxPerNode: number): LinkBuffer {
  return {
    indices: new Int32Array(nodeCount * maxPerNode * 2),
    count: 0,
  };
}
