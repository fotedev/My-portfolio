import { describe, expect, it } from "vitest";
import { assignTargets, buildRosette, ringNodeCount, rosetteNodeCount } from "./assembly";
import { buildSwarm, hexDistance, hexRingCoordinates, swarmBounds } from "./lattice";
import { computeLinks, createLinkBuffer } from "./links";
import { createRandom } from "./random";

const SWARM = {
  rings: 6,
  cellSize: 1,
  zJitter: 0.15,
  immediateRatio: 0.18,
  seed: 0x5eed1234,
};

describe("hexDistance", () => {
  it("is zero at the origin", () => {
    expect(hexDistance(0, 0)).toBe(0);
  });

  it("counts steps along a straight line", () => {
    expect(hexDistance(3, 0)).toBe(3);
    expect(hexDistance(0, -4)).toBe(4);
  });

  it("is symmetric", () => {
    expect(hexDistance(2, -3)).toBe(hexDistance(-2, 3));
  });
});

describe("hexRingCoordinates", () => {
  it("enumerates a full hexagon of cells", () => {
    for (const rings of [1, 2, 3, 6, 9]) {
      const cells = hexRingCoordinates(rings);
      expect(cells).toHaveLength(1 + 3 * rings * (rings + 1));
    }
  });

  it("keeps every cell within the ring distance", () => {
    const rings = 5;
    for (const cell of hexRingCoordinates(rings)) {
      expect(hexDistance(cell.q, cell.r)).toBeLessThanOrEqual(rings);
    }
  });

  it("produces a stable order for a given ring count", () => {
    expect(hexRingCoordinates(3)).toEqual(hexRingCoordinates(3));
  });
});

describe("buildSwarm", () => {
  it("is deterministic for a given seed", () => {
    expect(buildSwarm(SWARM)).toEqual(buildSwarm(SWARM));
  });

  it("differs for a different seed", () => {
    expect(buildSwarm(SWARM)).not.toEqual(buildSwarm({ ...SWARM, seed: SWARM.seed + 1 }));
  });

  it("produces one node per cell, in order", () => {
    const nodes = buildSwarm(SWARM);
    expect(nodes).toHaveLength(1 + 3 * SWARM.rings * (SWARM.rings + 1));
    expect(nodes.map((node) => node.index)).toEqual(nodes.map((_, index) => index));
  });

  it("keeps every coordinate finite", () => {
    for (const node of buildSwarm(SWARM)) {
      expect(Number.isFinite(node.x)).toBe(true);
      expect(Number.isFinite(node.y)).toBe(true);
      expect(Number.isFinite(node.z)).toBe(true);
      expect(Number.isFinite(node.threshold)).toBe(true);
    }
  });

  it("marks roughly the requested share of nodes as already present", () => {
    const nodes = buildSwarm({ ...SWARM, immediateRatio: 0.25 });
    const immediate = nodes.filter((node) => node.threshold < 0);
    // The share is a probability, so it is checked as a band rather than an
    // exact count.
    const share = immediate.length / nodes.length;
    expect(share).toBeGreaterThan(0.15);
    expect(share).toBeLessThan(0.4);
  });

  it("keeps the remaining thresholds inside the entrance window", () => {
    const nodes = buildSwarm(SWARM);
    const waiting = nodes.filter((node) => node.threshold >= 0);
    expect(waiting.length).toBeGreaterThan(0);
    for (const node of waiting) {
      expect(node.threshold).toBeGreaterThanOrEqual(0);
      expect(node.threshold).toBeLessThanOrEqual(0.85);
    }
  });

  it("keeps the depth jitter within the requested band", () => {
    for (const node of buildSwarm(SWARM)) {
      expect(Math.abs(node.z)).toBeLessThanOrEqual(SWARM.zJitter / 2 + 1e-9);
    }
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

  it("is centred on the origin", () => {
    const bounds = swarmBounds(buildSwarm(SWARM));
    expect((bounds.minX + bounds.maxX) / 2).toBeCloseTo(0, 6);
    expect((bounds.minY + bounds.maxY) / 2).toBeCloseTo(0, 6);
  });
});

describe("buildRosette", () => {
  it("counts 6k nodes on ring k", () => {
    expect(ringNodeCount(1)).toBe(6);
    expect(ringNodeCount(4)).toBe(24);
    // A centre point plus the rings.
    expect(rosetteNodeCount(4)).toBe(1 + 6 + 12 + 18 + 24);
  });

  it("has the same node count as the lattice it collapses from", () => {
    for (const rings of [3, 5, 7]) {
      expect(rosetteNodeCount(rings)).toBe(1 + 3 * rings * (rings + 1));
    }
  });

  it("places each ring on its own hexagon outline", () => {
    const gap = 2;
    const targets = buildRosette({ rings: 3, ringGap: gap, depth: 0.6, seed: 1 });
    const radii = targets.map((target) => target.radius);

    // A hexagon's vertices sit at the circumradius; the points along an edge
    // are closer in, at the apothem (circumradius * cos 30 degrees).
    const inner = gap * Math.cos(Math.PI / 6);
    const centre = radii[0];
    expect(centre).toBeCloseTo(0, 9);

    const rings = [radii.slice(1, 7), radii.slice(7, 19), radii.slice(19)];

    rings.forEach((ring, index) => {
      const outer = gap * (index + 1);
      for (const radius of ring) {
        expect(radius).toBeGreaterThanOrEqual(inner - 1e-9);
        expect(radius).toBeLessThanOrEqual(outer + 1e-9);
      }
      // Every ring touches its own circumradius at the vertices.
      expect(Math.max(...ring)).toBeCloseTo(outer, 6);
    });
  });

  it("is deterministic for a given seed", () => {
    const options = { rings: 3, ringGap: 2, depth: 0.6, seed: 7 };
    expect(buildRosette(options)).toEqual(buildRosette(options));
  });

  it("returns one target per node of the ring count", () => {
    const targets = buildRosette({ rings: 4, ringGap: 2, depth: 0.6, seed: 1 });
    expect(targets).toHaveLength(rosetteNodeCount(4));
  });
});

describe("assignTargets", () => {
  const positions = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 2 },
    { x: 5, y: 5 },
    { x: -5, y: 5 },
  ];

  it("returns one target per node", () => {
    const targets = buildRosette({ rings: 2, ringGap: 2, depth: 0.6, seed: 1 });
    const assigned = assignTargets(positions, targets, 0.1, 1);
    expect(assigned).toHaveLength(positions.length);
  });

  it("sends the innermost node to the innermost target", () => {
    const targets = buildRosette({ rings: 2, ringGap: 2, depth: 0.6, seed: 1 });
    const assigned = assignTargets(positions, targets, 0, 1);
    const centre = assigned[0];
    expect(centre?.radius).toBeLessThanOrEqual(Math.min(...targets.map((t) => t.radius)));
  });

  it("keeps every assigned target finite", () => {
    const targets = buildRosette({ rings: 3, ringGap: 2, depth: 0.6, seed: 1 });
    for (const target of assignTargets(positions, targets, 0.35, 1)) {
      expect(Number.isFinite(target.x)).toBe(true);
      expect(Number.isFinite(target.y)).toBe(true);
    }
  });

  it("copes with an empty target list", () => {
    const assigned = assignTargets(positions, [], 0.35, 1);
    expect(assigned).toHaveLength(positions.length);
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
