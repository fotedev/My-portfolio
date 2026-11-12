/**
 * Tunables for the hero lattice (ADR-0010).
 *
 * Everything the renderer needs is derived from these, so the effect can be
 * re-tuned without touching the render loop.
 *
 * Composition note (2026-11-13): the reference site has since redesigned its
 * landing page — its live effect is a clustered, irregular plexus of glowing
 * nodes with bright clusters and empty voids, not the uniform hex field this
 * layer shipped with. These values are tuned against captures of the live
 * reference; the assembly form (hexagonal rosette) remains our own.
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

/** Number of cluster centres the field is built around. */
export const CLUSTER_COUNT = 6;

/** Spread of each cluster's cloud, in lattice units (one sigma). */
export const CLUSTER_SPREAD = 1.5;

/** Share of nodes that float outside any cluster as ambient scatter. */
export const AMBIENT_RATIO = 0.18;

/** Half-extent of the field (cluster centres and ambient scatter), in lattice units. */
export const FIELD_EXTENT = 5.5;

/** Depth jitter, in lattice units, so the field reads as a volume. */
export const Z_JITTER = 0.15;

/**
 * Share of nodes that are visible before any scroll. The reference rests
 * with a minority of the mesh on screen and grows the rest in on scroll, so
 * the hero never opens on a fully drawn field.
 */
export const IMMEDIATE_RATIO = 0.16;

/**
 * Scroll story: the reveal-and-assemble completes over this fraction of the
 * hero's scroll height, and the first `GROWTH_SHARE` of it grows the mesh in
 * before the assembly begins.
 */
export const SCROLL_RANGE = 0.85;
export const GROWTH_SHARE = 0.6;

/**
 * The assembly form: a hexagonal rosette with exactly as many slots as the
 * field has nodes, so the collapse is a one-to-one correspondence and the
 * field folds into a crisp honeycomb core rather than into clumps.
 */
export const ASSEMBLY_RINGS = 9;
export const ASSEMBLY_GAP = 0.45;

/** Jitter applied to each node's assembly target, in lattice units. */
export const ASSEMBLY_JITTER = 0.06;

/** Duration of the entrance, in milliseconds. */
export const ENTRANCE_MS = 1800;

/**
 * Node radius in world units, at the start and at the end of the entrance.
 *
 * The fitted field spans roughly 23 world units across at 1440 px, so one
 * world unit is about 62 px on a desktop: these radii read as 2-4 px glowing
 * points at rest, matching the reference's node scale. Additive blending and
 * the bloom pass do the rest of the brightening.
 */
export const NODE_RADIUS_MIN = 0.03;
export const NODE_RADIUS_MAX = 0.07;

/** Width of the window in which a node grows to full size, in reveal units. */
export const NODE_APPEAR_WIDTH = 0.14;

/** Link reach while the field is scattered, in lattice units. */
export const LINK_DISTANCE_REST = 2.2;

/** Link reach once the field has assembled, in lattice units. */
export const LINK_DISTANCE_ASSEMBLED = 0.75;

/** Maximum links kept per node, so the mesh stays legible. */
export const LINK_MAX_PER_NODE = 5;

/** Frames between link recomputations. */
export const LINK_RECOMPUTE_FRAMES = 2;

/** Peak pointer tilt, in radians. */
export const POINTER_TILT_X = 0.12;
export const POINTER_TILT_Y = 0.08;

/** How quickly the group follows the pointer. */
export const POINTER_LERP = 0.05;

/** Idle drift amplitude, in lattice units. */
export const DRIFT_AMPLITUDE = 0.3;

/** Maximum device pixel ratio the canvas renders at. */
export const MAX_PIXEL_RATIO = 1.5;

/**
 * Bloom pass, dark theme only. Stronger than the reference's documented
 * 0.6/0.4/0.65 because the nodes here are smaller on screen; without the
 * extra intensity the mesh reads as noise instead of embers.
 */
export const BLOOM_THRESHOLD = 0.4;
export const BLOOM_SMOOTHING = 0.4;
export const BLOOM_INTENSITY = 1.35;
export const BLOOM_RADIUS = 0.65;

/** Seed for the whole field. Fixed so renders are reproducible. */
export const HIVE_SEED = 0x5eed1234;
