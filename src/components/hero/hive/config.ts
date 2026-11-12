/**
 * Tunables for the hero lattice (ADR-0010).
 *
 * Everything the renderer needs is derived from these, so the effect can be
 * re-tuned without touching the render loop.
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

/** Hex distance from the centre to the outermost ring of the field. */
export const RINGS_LANDSCAPE = 7;
export const RINGS_PORTRAIT = 7;

/** Size of one hexagonal cell, in lattice units. The field is scaled to fit. */
export const CELL_SIZE = 1;

/** Depth jitter, in lattice units. */
export const Z_JITTER = 0.15;

/** Share of nodes that are already present on the first frame. */
export const IMMEDIATE_RATIO = 0.18;

/**
 * The assembly form is a scaled-down copy of the field's own hexagon: the
 * same ring count, but with the ring gap tightened from the lattice's cell
 * spacing to this value. The field therefore collapses into a crisp
 * honeycomb core rather than into clumps.
 */
export const ASSEMBLY_GAP = 0.6;

/** Jitter applied to each node's assembly target, in lattice units. */
export const ASSEMBLY_JITTER = 0.05;

/** Duration of the entrance, in milliseconds. */
export const ENTRANCE_MS = 1800;

/**
 * Node radius in world units, at the start and at the end of the entrance.
 * The field is scaled to the viewport width, so world units are directly
 * comparable to screen size. These are deliberately small: the layer is
 * texture behind the hero copy, not a graphic competing with it.
 */
export const NODE_RADIUS_MIN = 0.022;
export const NODE_RADIUS_MAX = 0.075;

/** Width of the window in which a node grows to full size, in entrance units. */
export const NODE_APPEAR_WIDTH = 0.14;

/** Maximum link distance, in cell spacings. */
export const LINK_DISTANCE_CELLS = 1.5;

/** Maximum links kept per node, so the mesh stays legible. */
export const LINK_MAX_PER_NODE = 3;

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

/** Seed for the whole field. Fixed so renders are reproducible. */
export const HIVE_SEED = 0x5eed1234;
