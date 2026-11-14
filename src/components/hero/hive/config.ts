/**
 * Tunables for the hive lattice (ADR-0010).
 *
 * Everything the renderer needs is derived from these, so the effect can be
 * re-tuned without touching the render loop.
 *
 * 3-act scroll choreography:
 * - Act I (top / hero): wing-biased peripheral constellation with a calm central
 *   reading corridor behind the hero headline.
 * - Act II (mid-page): energised triangulated plexus framed behind frosted-glass
 *   surface veils and cards.
 * - Act III (lower page): nodes scale into pointy-topped hexagon tiles and
 *   converge into a split two-hemisphere hexagonal honeycomb core.
 */

/** Vertical field of view, in degrees. */
export const CAMERA_FOV = 55;

/**
 * Camera distance from the lattice plane, per orientation.
 *
 * The field is fitted to the viewport so both the scattered field and the
 * converged honeycomb core sit comfortably on screen.
 */
export const CAMERA_Z_LANDSCAPE = 14;
export const CAMERA_Z_PORTRAIT = 13;
export const CAMERA_NEAR = 0.1;
export const CAMERA_FAR = 120;

/** Honeycomb assembly geometry (outer rings, hollow inner chamber, spacing). */
export const ASSEMBLY_RINGS = 9;
export const ASSEMBLY_INNER_RINGS = 2;
export const ASSEMBLY_GAP = 0.36;
export const ASSEMBLY_SPLIT_GAP = 0.14;

/** Number of cluster centres the field is built around (split across wings). */
export const CLUSTER_COUNT = 8;

/** Spread of each cluster's cloud, in lattice units (one sigma). */
export const CLUSTER_SPREAD = 1.15;

/** Share of nodes that float outside any cluster as ambient scatter. */
export const AMBIENT_RATIO = 0.22;

/** Half-extent of the field (cluster centres and ambient scatter), in lattice units. */
export const FIELD_EXTENT = 5.6;

/** Depth jitter, in lattice units, so the field reads as a volume. */
export const Z_JITTER = 0.45;

/** Duration of the entrance grow-in, in milliseconds. */
export const ENTRANCE_MS = 1200;

/**
 * Node radius in world units at rest (start/end of entrance) and in the
 * converged honeycomb state (in lattice units scaled by worldScale).
 */
export const NODE_RADIUS_MIN = 0.032;
export const NODE_RADIUS_MAX = 0.056;
export const NODE_RADIUS_ASSEMBLED = 0.27;

/** Link reach, in lattice units, across the 3-act scroll story. */
export const LINK_DISTANCE_REST = 1.65;
export const LINK_DISTANCE_MAX = 2.35;
export const LINK_DISTANCE_ASSEMBLED = 0.72;

/** Maximum links kept per node. */
export const LINK_MAX_PER_NODE = 5;

/** Link opacity multipliers at rest and in the assembled honeycomb state. */
export const LINK_OPACITY_MIN = 0.65;
export const LINK_OPACITY_ASSEMBLED = 0.42;

/** Frames between link recomputations. */
export const LINK_RECOMPUTE_FRAMES = 2;

/** How quickly the layer's scroll progress follows the target (per frame). */
export const SCROLL_LERP = 0.07;

/** Peak pointer tilt, in radians. */
export const POINTER_TILT_X = 0.1;
export const POINTER_TILT_Y = 0.07;

/** How quickly the group follows the pointer. */
export const POINTER_LERP = 0.05;

/** Idle drift amplitude, in lattice units. */
export const DRIFT_AMPLITUDE = 0.35;

/** Maximum device pixel ratio the canvas renders at. */
export const MAX_PIXEL_RATIO = 1.5;

/**
 * Bloom pass, dark theme only. Balanced so the plexus glows warmly without
 * washing out the dark mortar gaps between hexagon tiles when converged.
 */
export const BLOOM_THRESHOLD = 0.38;
export const BLOOM_SMOOTHING = 0.45;
export const BLOOM_INTENSITY = 1.15;
export const BLOOM_RADIUS = 0.6;

/** Seed for the whole field. Fixed so renders are reproducible. */
export const HIVE_SEED = 0x5eed1234;
