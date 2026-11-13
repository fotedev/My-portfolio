import { describe, expect, it } from "vitest";
import { buildSwarm, swarmBounds, type LatticeNode } from "./lattice";
import { computeLinks, createLinkBuffer } from "./links";
import { createRandom } from "./random";

const SWARM = {
  nodeCount: 64,
  clusterCount: 3,
  clusterSpread: 1,
  ambientRatio: 0.24,
  fieldExtent: 5,
  zJitter: 0.5,
  seed: 0x5eed1234,
};

/** Median nearest-neighbour distance, the clumping signature of the field. */
function medianNearestNeighbour(nodes: LatticeNode[]): number {
  const distances: number[] = [];
  for (const node of nodes) {
    let nearest = Infinity;
    for (const other of nodes) {
      if (other.index === node.index) continue;
      const distance = Math.hypot(node.x - other.x, node.y - other.y);
      if (distance < nearest) nearest = distance;
    }
    distances.push(nearest);
  }
  distances.sort((a, b) => a - b);
  return distances[Math.floor(distances.length / 2)] ?? Infinity;
}

describe("buildSwarm", () => {
  it("is deterministic for a given seed", () => {
    expect(buildSwarm(SWARM)).toEqual(buildSwarm(SWARM));
  });

  it("differs for a different seed", () => {
    expect(buildSwarm(SWARM)).not.toEqual(buildSwarm({ ...SWARM, seed: SWARM.seed + 1 }));
  });

  it("produces exactly the requested node count, in order", () => {
    const nodes = buildSwarm(SWARM);
    expect(nodes).toHaveLength(SWARM.nodeCount);
    expect(nodes.map((node) => node.index)).toEqual(nodes.map((_, index) => index));
  });

  it("keeps every coordinate finite", () => {
    for (const node of buildSwarm(SWARM)) {
      expect(Number.isFinite(node.x)).toBe(true);
      expect(Number.isFinite(node.y)).toBe(true);
      expect(Number.isFinite(node.z)).toBe(true);
    }
  });

  it("keeps the depth jitter within the requested band", () => {
    for (const node of buildSwarm(SWARM)) {
      expect(Math.abs(node.z)).toBeLessThanOrEqual(SWARM.zJitter / 2 + 1e-9);
    }
  });

  it("keeps every node inside the field plus cluster slack", () => {
    // Cluster clouds are gaussian, so a node can sit a few sigmas outside its
    // centre; three sigmas past the extent is already extraordinary.
    const slack = SWARM.clusterSpread * 3;
    for (const node of buildSwarm(SWARM)) {
      expect(Math.abs(node.x)).toBeLessThanOrEqual(SWARM.fieldExtent + slack);
      expect(Math.abs(node.y)).toBeLessThanOrEqual(SWARM.fieldExtent + slack);
    }
  });

  it("clusters the field instead of spreading it uniformly", () => {
    // The signature of the reference technique is contrast: dense clumps and
    // empty voids. A uniform scatter of this many nodes over this area would
    // put the median nearest-neighbour distance near the mean spacing; a
    // clustered field packs many nodes far closer together.
    const nodes = buildSwarm(SWARM);
    const median = medianNearestNeighbour(nodes);
    const meanSpacing = (SWARM.fieldExtent * 2) / Math.sqrt(nodes.length);
    expect(median).toBeLessThan(meanSpacing * 0.5);
  });
});

describe("swarmBounds", () => {
  it("reports the extent of the field", () => {
    const nodes = buildSwarm(SWARM);
    const bounds = swarmBounds(nodes);
    expect(bounds.width).toBeGreaterThan(0);
    expect(bounds.height).toBeGreaterThan(0);
    expect(bounds.maxX - bounds.minX).toBeCloseTo(bounds.width, 10);
    expect(bounds.maxY - bounds.minY).toBeCloseTo(bounds.height, 10);
  });
});

describe("computeLinks", () => {
  function positionsOf(points: Array<[number, number, number]>): Float32Array {
    const array = new Float32Array(points.length * 3);
    points.forEach((point, index) => {
      array[index * 3] = point[0];
      array[index * 3 + 1] = point[1];
      array[index * 3 + 2] = point[2];
    });
    return array;
  }

  it("links two nodes that are close together", () => {
    const buffer = createLinkBuffer(2, 5);
    computeLinks(
      positionsOf([
        [0, 0, 0],
        [1, 0, 0],
      ]),
      2,
      { maxDistance: 2, maxPerNode: 5 },
      buffer,
    );
    expect(buffer.count).toBe(1);
    expect(buffer.indices[0]).toBe(0);
    expect(buffer.indices[1]).toBe(1);
  });

  it("does not link nodes that are far apart", () => {
    const buffer = createLinkBuffer(2, 5);
    computeLinks(
      positionsOf([
        [0, 0, 0],
        [10, 0, 0],
      ]),
      2,
      { maxDistance: 2, maxPerNode: 5 },
      buffer,
    );
    expect(buffer.count).toBe(0);
  });

  it("never links a node to itself", () => {
    const buffer = createLinkBuffer(6, 5);
    const positions = positionsOf([
      [0, 0, 0],
      [0.5, 0, 0],
      [0.25, 0.5, 0],
      [-0.5, 0.2, 0],
      [3, 3, 0],
      [3.2, 3, 0],
    ]);
    computeLinks(positions, 6, { maxDistance: 2, maxPerNode: 5 }, buffer);
    for (let i = 0; i < buffer.count; i += 1) {
      expect(buffer.indices[i * 2]).not.toBe(buffer.indices[i * 2 + 1]);
    }
  });

  it("emits each pair only once", () => {
    const buffer = createLinkBuffer(6, 5);
    const positions = positionsOf([
      [0, 0, 0],
      [0.5, 0, 0],
      [0.25, 0.5, 0],
      [-0.5, 0.2, 0],
      [3, 3, 0],
      [3.2, 3, 0],
    ]);
    computeLinks(positions, 6, { maxDistance: 2, maxPerNode: 5 }, buffer);

    const seen = new Set<string>();
    for (let i = 0; i < buffer.count; i += 1) {
      const a = buffer.indices[i * 2] ?? 0;
      const b = buffer.indices[i * 2 + 1] ?? 0;
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  it("respects the per-node cap", () => {
    const buffer = createLinkBuffer(7, 2);
    // Every node sits inside the link radius of every other node.
    const positions = positionsOf([
      [0, 0, 0],
      [0.1, 0, 0],
      [0.2, 0, 0],
      [0.3, 0, 0],
      [0.4, 0, 0],
      [0.5, 0, 0],
      [0.6, 0, 0],
    ]);
    computeLinks(positions, 7, { maxDistance: 10, maxPerNode: 2 }, buffer);
    expect(buffer.count).toBeLessThanOrEqual(7 * 2);
  });

  it("gives every node at least one link in an even field", () => {
    // A row of evenly spaced nodes: picking neighbours from one side only
    // would starve the low-indexed nodes and leave them as stray dots.
    const points: Array<[number, number, number]> = [];
    for (let i = 0; i < 12; i += 1) {
      points.push([i * 0.5, 0, 0]);
    }
    const positions = positionsOf(points);
    const buffer = createLinkBuffer(points.length, 2);
    computeLinks(positions, points.length, { maxDistance: 1, maxPerNode: 2 }, buffer);

    const degree = new Map<number, number>();
    for (let i = 0; i < buffer.count; i += 1) {
      const a = buffer.indices[i * 2];
      const b = buffer.indices[i * 2 + 1];
      if (a === undefined || b === undefined) continue;
      degree.set(a, (degree.get(a) ?? 0) + 1);
      degree.set(b, (degree.get(b) ?? 0) + 1);
    }
    for (const node of points.keys()) {
      expect(degree.get(node) ?? 0).toBeGreaterThan(0);
    }
  });

  it("handles an empty field", () => {
    const buffer = createLinkBuffer(0, 5);
    computeLinks(new Float32Array(0), 0, { maxDistance: 2, maxPerNode: 5 }, buffer);
    expect(buffer.count).toBe(0);
  });
});

describe("createRandom", () => {
  it("is deterministic for a given seed", () => {
    const a = createRandom(42);
    const b = createRandom(42);
    expect(a.next()).toBe(b.next());
  });

  it("stays inside [0, 1)", () => {
    const random = createRandom(9);
    for (let i = 0; i < 500; i += 1) {
      const value = random.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("respects the requested range", () => {
    const random = createRandom(3);
    for (let i = 0; i < 100; i += 1) {
      const value = random.range(-2, 5);
      expect(value).toBeGreaterThanOrEqual(-2);
      expect(value).toBeLessThan(5);
    }
  });

  it("picks elements from the given array", () => {
    const random = createRandom(11);
    const items = ["a", "b", "c"];
    for (let i = 0; i < 50; i += 1) {
      expect(items).toContain(random.pick(items));
    }
  });

  it("throws when picking from an empty array", () => {
    expect(() => createRandom(1).pick([])).toThrow();
  });
});
