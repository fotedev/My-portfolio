/**
 * Tunables for the hive lattice (ADR-0010).
 *
 * Everything the renderer needs is derived from these, so the effect can be
 * re-tuned without touching the render loop.
 *
 * Composition note (2026-11-13, revision 2): per the owner's directive the
 * layer is now a fixed, page-wide backdrop matching the live reference — a
 * clustered, irregular plexus of small glowing dots that rests sparse at the
 * top of the page and energises (denser reach, brighter links) as the reader
 * scrolls. The scroll-gated reveal and the hex-rosette assembly are retired;
 * what remains is ambient drift, scroll energy and pointer parallax.
 */

/** Vertical field of view, in degrees. */
export const CAMERA_FOV = 55;

/**
 * Camera distance from the lattice plane, per orientation.
 *
 * The field is fitted to the viewport by its tighter axis, so on a portrait
 * screen it fills the height and overflows the width. Pulling the camera in
 * for portrait keeps the nodes large enough to read on a phone.
 */
export const CAMERA_Z_LANDSCAPE = 14;
export const CAMERA_Z_PORTRAIT = 13;
export const CAMERA_NEAR = 0.1;
export const CAMERA_FAR = 120;

/** Total node count of the field. */
export const NODE_COUNT = 260;

/** Number of cluster centres the field is built around. */
export const CLUSTER_COUNT = 8;

/** Spread of each cluster's cloud, in lattice units (one sigma). */
export const CLUSTER_SPREAD = 1.3;

/** Share of nodes that float outside any cluster as ambient scatter. */
export const AMBIENT_RATIO = 0.24;

/** Half-extent of the field (cluster centres and ambient scatter), in lattice units. */
export const FIELD_EXTENT = 5.5;

/** Depth jitter, in lattice units, so the field reads as a volume. */
export const Z_JITTER = 0.5;

/** Duration of the entrance grow-in, in milliseconds. */
export const ENTRANCE_MS = 1200;

/**
 * Node radius in world units, at the start and at the end of the entrance.
 *
 * The fitted field spans roughly 23 world units across at 1440 px, so one
 * world unit is about 62 px on a desktop: these radii read as 2-4 px glowing
 * points, matching the reference's node scale. Additive blending and the
 * bloom pass do the rest of the brightening.
 */
export const NODE_RADIUS_MIN = 0.036;
export const NODE_RADIUS_MAX = 0.07;

/**
 * Scroll energy: how far, in viewport heights, the reader must scroll for the
 * plexus to reach full reach and brightness. The reference rests sparse at
 * the top of the page and is dense further down.
 */
export const ENERGY_RANGE = 1.4;

/** How quickly the layer's energy follows the scroll target (per frame). */
export const ENERGY_LERP = 0.06;

/**
 * Link reach, in lattice units. At rest the plexus is loose and faint; at
 * full energy the reach widens and the web thickens.
 */
export const LINK_DISTANCE_REST = 1.25;
export const LINK_DISTANCE_MAX = 2.45;

/** Maximum links kept per node. The reference's dense regions run ~6. */
export const LINK_MAX_PER_NODE = 6;

/** Link opacity multiplier at rest; full energy uses the palette value. */
export const LINK_OPACITY_MIN = 0.7;

/** Frames between link recomputations. */
export const LINK_RECOMPUTE_FRAMES = 2;

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
 * Bloom pass, dark theme only. Strong enough that every dot carries the hot
 * core + glow halo the reference shows; the owner found the previous settings
 * washed the web out to near-invisible.
 */
export const BLOOM_THRESHOLD = 0.25;
export const BLOOM_SMOOTHING = 0.45;
export const BLOOM_INTENSITY = 1.85;
export const BLOOM_RADIUS = 0.8;

/** Seed for the whole field. Fixed so renders are reproducible. */
export const HIVE_SEED = 0x5eed1234;
