/**
 * The assembly form - the split two-hemisphere hexagonal honeycomb core the
 * scattered plexus converges into as the reader reaches the lower portion of
 * the page (ADR-0010).
 *
 * Pure geometry, no three.js: deterministic and unit-testable.
 */

/** A point in the converged honeycomb core. */
export interface AssemblyTarget {
  x: number;
  y: number;
  z: number;
  /** Radial distance from the origin, used for coherent hemisphere mapping. */
  radius: number;
  /** Polar angle around the origin, in radians. */
  angle: number;
}

export interface HoneycombOptions {
  /** Outer ring radius in hex cells. */
  rings: number;
  /** Inner ring radius excluded to form the central hexagonal chamber. */
  innerRings: number;
  /** Center-to-ring spacing, in lattice units. */
  ringGap: number;
  /** Horizontal half-gap separating the left and right hemispheres. */
  splitGap: number;
}

/** Axial hex distance from the origin. */
export function hexDistance(q: number, r: number): number {
  return (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2;
}

/**
 * Generates every axial coordinate belonging to the split hollow honeycomb.
 *
 * Removing the inner chamber (`hexDistance <= innerRings`) and the vertical
 * central column (`|q + r / 2| < 0.45`, i.e., `2q + r === 0`) splits the
 * lattice into two mirror-symmetric hemispheres.
 */
function honeycombCoordinates(rings: number, innerRings: number): Array<{ q: number; r: number }> {
  const cells: Array<{ q: number; r: number }> = [];

  for (let r = -rings; r <= rings; r += 1) {
    const qMin = Math.max(-rings, -r - rings);
    const qMax = Math.min(rings, -r + rings);

    for (let q = qMin; q <= qMax; q += 1) {
      if (hexDistance(q, r) <= innerRings) continue;
      if (Math.abs(q + r / 2) < 0.45) continue;
      cells.push({ q, r });
    }
  }

  return cells;
}

/** Exact node count of the split honeycomb for the given ring parameters. */
export function honeycombNodeCount(rings: number, innerRings: number): number {
  return honeycombCoordinates(rings, innerRings).length;
}

/**
 * Builds the split two-hemisphere hexagonal honeycomb core in pointy-topped
 * axial coordinates.
 */
export function buildHoneycomb(options: HoneycombOptions): AssemblyTarget[] {
  const { rings, innerRings, ringGap, splitGap } = options;
  const cells = honeycombCoordinates(rings, innerRings);

  return cells.map(({ q, r }) => {
    const rawX = ringGap * Math.sqrt(3) * (q + r / 2);
    const x = rawX + Math.sign(rawX) * splitGap;
    const y = ringGap * 1.5 * r;
    const z = 0;

    return {
      x,
      y,
      z,
      radius: Math.hypot(x, y),
      angle: Math.atan2(y, x),
    };
  });
}

/**
 * Continuous vertical-to-horizontal hemisphere angle in `[-PI/2, PI/2]`.
 *
 * Measuring against `|x|` avoids the `+-PI` branch cut on the negative X axis,
 * so the left hemisphere sorts just as smoothly bottom-to-top as the right.
 */
function hemisphereAngle(x: number, y: number): number {
  return Math.atan2(y, Math.abs(x));
}

function sortHemisphere<T extends { x: number; y: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const angleA = hemisphereAngle(a.x, a.y);
    const angleB = hemisphereAngle(b.x, b.y);
    const sectorA = Math.floor(((angleA + Math.PI / 2) / Math.PI) * 8);
    const sectorB = Math.floor(((angleB + Math.PI / 2) / Math.PI) * 8);
    if (sectorA !== sectorB) return sectorA - sectorB;

    const radiusDiff = Math.hypot(a.x, a.y) - Math.hypot(b.x, b.y);
    if (Math.abs(radiusDiff) > 1e-9) return radiusDiff;

    return angleA - angleB;
  });
}

/**
 * Maps each scattered lattice node 1-to-1 onto a honeycomb slot within its own
 * hemisphere so left-wing and right-wing nodes fold inward smoothly without
 * crossing the central cleft.
 */
export function assignTargets(
  nodePositions: ReadonlyArray<{ x: number; y: number }>,
  targets: ReadonlyArray<AssemblyTarget>,
): AssemblyTarget[] {
  if (nodePositions.length === 0 || targets.length === 0) {
    return [];
  }

  const leftNodes = sortHemisphere(
    nodePositions
      .map((node, index) => ({ ...node, index }))
      .filter((node) => node.x < 0),
  );
  const rightNodes = sortHemisphere(
    nodePositions
      .map((node, index) => ({ ...node, index }))
      .filter((node) => node.x >= 0),
  );

  const leftTargets = sortHemisphere(targets.filter((target) => target.x < 0));
  const rightTargets = sortHemisphere(targets.filter((target) => target.x >= 0));

  const assigned: AssemblyTarget[] = new Array(nodePositions.length);
  const fallback = targets[0];

  const assignGroup = (
    nodes: Array<{ x: number; y: number; index: number }>,
    groupTargets: AssemblyTarget[],
    otherTargets: AssemblyTarget[],
  ): void => {
    const pool = groupTargets.length > 0 ? groupTargets : otherTargets;
    nodes.forEach((node, rank) => {
      const target =
        pool[rank] ?? pool[pool.length - 1] ?? fallback;
      if (target) {
        assigned[node.index] = target;
      }
    });
  };

  assignGroup(leftNodes, leftTargets, rightTargets);
  assignGroup(rightNodes, rightTargets, leftTargets);

  return assigned;
}
