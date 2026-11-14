"use client";

import { BloomEffect, EffectComposer, EffectPass, KernelSize, RenderPass } from "postprocessing";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CircleGeometry,
  DynamicDrawUsage,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  MeshBasicMaterial,
  NormalBlending,
  Object3D,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "three";
import {
  assignTargets,
  buildHoneycomb,
  honeycombNodeCount,
  type AssemblyTarget,
} from "./assembly";
import {
  AMBIENT_RATIO,
  ASSEMBLY_GAP,
  ASSEMBLY_INNER_RINGS,
  ASSEMBLY_RINGS,
  ASSEMBLY_SPLIT_GAP,
  BLOOM_INTENSITY,
  BLOOM_RADIUS,
  BLOOM_SMOOTHING,
  BLOOM_THRESHOLD,
  CAMERA_FAR,
  CAMERA_FOV,
  CAMERA_NEAR,
  CAMERA_Z_LANDSCAPE,
  CAMERA_Z_PORTRAIT,
  CLUSTER_COUNT,
  CLUSTER_SPREAD,
  DRIFT_AMPLITUDE,
  ENTRANCE_MS,
  FIELD_EXTENT,
  HIVE_SEED,
  LINK_DISTANCE_ASSEMBLED,
  LINK_DISTANCE_MAX,
  LINK_DISTANCE_REST,
  LINK_MAX_PER_NODE,
  LINK_OPACITY_ASSEMBLED,
  LINK_OPACITY_MIN,
  LINK_RECOMPUTE_FRAMES,
  MAX_PIXEL_RATIO,
  NODE_RADIUS_ASSEMBLED,
  NODE_RADIUS_MAX,
  NODE_RADIUS_MIN,
  POINTER_LERP,
  POINTER_TILT_X,
  POINTER_TILT_Y,
  SCROLL_LERP,
  Z_JITTER,
} from "./config";
import { buildSwarm, swarmBounds, type LatticeNode } from "./lattice";
import { computeLinks, createLinkBuffer, type LinkBuffer } from "./links";
import type { HivePalette } from "./palette";

/** Linear interpolation between `a` and `b`. */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Hermite smoothstep clamped to `[0, 1]`. */
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** Ease-out cubic, used for the initial node entrance. */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/** Ease-in-out cubic, used for the honeycomb convergence. */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export interface HiveRendererOptions {
  /** Render a single static frame instead of animating. */
  reducedMotion: boolean;
  palette: HivePalette;
}

export interface HiveRendererState {
  /** Pointer position, normalized to -1..1 on both axes. */
  pointerX: number;
  pointerY: number;
  /** Document scroll progress, 0 = top of page, 1 = bottom of page. */
  scrollProgress: number;
}

/**
 * The hive lattice renderer.
 *
 * Imperative three.js rather than React Three Fiber: this is one fixed
 * background canvas with one pointer input and no scene graph driven by
 * application state, and the reconciler costs ~107 KB gzip for no visual
 * benefit (ADR-0010 §2).
 *
 * Drives a 3-act scroll choreography from a single instanced pointy-topped
 * hexagon mesh:
 * - Act I (top): wing-biased peripheral constellation framing hero copy.
 * - Act II (mid-page): energised plexus behind frosted-glass bands/cards.
 * - Act III (bottom): tiles expand and converge into a split honeycomb core.
 */
export class HiveRenderer {
  private readonly renderer: WebGLRenderer;
  private readonly canvas: HTMLCanvasElement;
  private readonly scene = new Scene();
  private readonly camera: PerspectiveCamera;
  private readonly group = new Object3D();
  private readonly mesh: InstancedMesh;
  private readonly lines: LineSegments;
  private readonly linePositions: Float32Array;
  private readonly lineGeometry: BufferGeometry;
  private readonly dummy = new Object3D();
  private readonly composer: EffectComposer;
  private readonly bloom: BloomEffect;

  private nodes: LatticeNode[] = [];
  private targets: AssemblyTarget[] = [];
  private readonly positions: Float32Array;
  private readonly linkBuffer: LinkBuffer;

  private palette: HivePalette;
  private readonly reducedMotion: boolean;

  private width = 1;
  private height = 1;
  private pixelRatio = 1;
  /** Scale that fits the honeycomb core isotropically into the viewport. */
  private worldScale = 1;
  private swarmScaleX = 1;
  private swarmScaleY = 1;
  private visibleWidth = 10;
  private visibleHeight = 10;

  private pointerX = 0;
  private pointerY = 0;
  private targetPointerX = 0;
  private targetPointerY = 0;
  private scrollProgress = 0;
  private targetProgress = 0;

  private startedAt = 0;
  private started = false;
  private frameHandle: number | null = null;
  private frameCount = 0;
  // Negative infinity, not 0: the throttle below would otherwise swallow the
  // first publish whenever start() runs within 500 ms of page navigation,
  // which under reduced motion (no loop to republish) leaves data-hive-frames
  // permanently unset.
  private lastFramePublish = Number.NEGATIVE_INFINITY;
  private running = false;
  private disposed = false;

  constructor(canvas: HTMLCanvasElement, options: HiveRendererOptions) {
    this.palette = options.palette;
    this.reducedMotion = options.reducedMotion;

    this.renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: "high-performance",
    });
    this.renderer.setClearColor(0x000000, 0);
    this.canvas = canvas;

    this.camera = new PerspectiveCamera(CAMERA_FOV, 1, CAMERA_NEAR, CAMERA_FAR);

    this.buildField();

    const nodeCount = this.nodes.length;
    this.positions = new Float32Array(nodeCount * 3);
    this.linkBuffer = createLinkBuffer(nodeCount, LINK_MAX_PER_NODE);
    // Sized to match the link buffer: two vertices per pair, three floats per
    // vertex.
    this.linePositions = new Float32Array(nodeCount * LINK_MAX_PER_NODE * 4 * 3);

    // --- nodes -------------------------------------------------------------
    // Pointy-topped hexagons: 6 segments rotated +30 deg so top/bottom peaks
    // align vertically while side edges sit parallel to the vertical cleft.
    const nodeGeometry = new CircleGeometry(1, 6);
    nodeGeometry.rotateZ(Math.PI / 6);
    const nodeMaterial = new MeshBasicMaterial({
      color: this.palette.node,
      toneMapped: false,
      transparent: true,
      opacity: this.palette.nodeOpacity,
      blending: this.palette.additive ? AdditiveBlending : NormalBlending,
      depthWrite: false,
    });
    this.mesh = new InstancedMesh(nodeGeometry, nodeMaterial, nodeCount);
    this.mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    // The instances move every frame; a cached bounding sphere would cull the
    // whole field the moment it drifted out of its original bounds.
    this.mesh.frustumCulled = false;

    // --- links -------------------------------------------------------------
    this.lineGeometry = new BufferGeometry();
    this.lineGeometry.setAttribute("position", new BufferAttribute(this.linePositions, 3));
    this.lineGeometry.setDrawRange(0, 0);
    const lineMaterial = new LineBasicMaterial({
      color: this.palette.link,
      transparent: true,
      opacity: this.palette.linkOpacity,
      depthWrite: false,
      blending: this.palette.additive ? AdditiveBlending : NormalBlending,
    });
    this.lines = new LineSegments(this.lineGeometry, lineMaterial);
    this.lines.frustumCulled = false;

    this.group.add(this.mesh);
    this.group.add(this.lines);
    this.scene.add(this.group);

    // --- bloom -------------------------------------------------------------
    // The composer is always created so that switching from the light theme
    // (no bloom) to the dark theme (bloom) works without a rebuild. When the
    // palette has bloom disabled the composer is simply bypassed at render
    // time, so it costs nothing but one unused render target.
    const composer = new EffectComposer(this.renderer, { multisampling: 0 });
    composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new BloomEffect({
      luminanceThreshold: BLOOM_THRESHOLD,
      luminanceSmoothing: BLOOM_SMOOTHING,
      mipmapBlur: true,
      intensity: BLOOM_INTENSITY,
      radius: BLOOM_RADIUS,
      kernelSize: KernelSize.LARGE,
    });
    composer.addPass(new EffectPass(this.camera, this.bloom));
    this.composer = composer;
  }

  /** Builds the scattered wing constellation and its paired honeycomb core. */
  private buildField(): void {
    const honeycomb = buildHoneycomb({
      rings: ASSEMBLY_RINGS,
      innerRings: ASSEMBLY_INNER_RINGS,
      ringGap: ASSEMBLY_GAP,
      splitGap: ASSEMBLY_SPLIT_GAP,
    });

    this.nodes = buildSwarm({
      nodeCount: honeycombNodeCount(ASSEMBLY_RINGS, ASSEMBLY_INNER_RINGS),
      clusterCount: CLUSTER_COUNT,
      clusterSpread: CLUSTER_SPREAD,
      ambientRatio: AMBIENT_RATIO,
      fieldExtent: FIELD_EXTENT,
      zJitter: Z_JITTER,
      seed: HIVE_SEED,
    });

    this.targets = assignTargets(this.nodes, honeycomb);
  }

  /** Sizes the canvas and refits the field to the viewport. */
  resize(width: number, height: number): void {
    if (this.disposed || width <= 0 || height <= 0) return;

    this.width = width;
    this.height = height;
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);

    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.setSize(width, height, false);
    this.composer.setSize(width, height, false);

    const aspect = width / height;
    this.camera.aspect = aspect;
    this.camera.position.set(0, 0, aspect >= 1 ? CAMERA_Z_LANDSCAPE : CAMERA_Z_PORTRAIT);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix();

    // Fit the scattered plexus across the full viewport dimensions while keeping
    // the converged honeycomb core isotropically scaled inside safe margins.
    const swarm = swarmBounds(this.nodes);
    const honeycomb = swarmBounds(this.targets);

    const visibleHeight = 2 * this.camera.position.z * Math.tan(((CAMERA_FOV / 2) * Math.PI) / 180);
    const visibleWidth = visibleHeight * aspect;

    this.visibleHeight = visibleHeight;
    this.visibleWidth = visibleWidth;
    this.swarmScaleX = (visibleWidth * 0.94) / Math.max(1, swarm.width);
    this.swarmScaleY = (visibleHeight * 0.92) / Math.max(1, swarm.height);
    this.worldScale = Math.min(
      visibleWidth / Math.max(1, honeycomb.width * 1.15),
      visibleHeight / Math.max(1, honeycomb.height * 1.22),
    );
  }

  /** Applies a new palette (used when the theme changes). */
  setPalette(palette: HivePalette): void {
    this.palette = palette;
    const nodeMaterial = this.mesh.material as MeshBasicMaterial;
    nodeMaterial.color.setHex(palette.node);
    nodeMaterial.opacity = palette.nodeOpacity;
    nodeMaterial.blending = palette.additive ? AdditiveBlending : NormalBlending;
    nodeMaterial.needsUpdate = true;

    const lineMaterial = this.lines.material as LineBasicMaterial;
    lineMaterial.color.setHex(palette.link);
    lineMaterial.opacity = palette.linkOpacity;
    lineMaterial.blending = palette.additive ? AdditiveBlending : NormalBlending;
    lineMaterial.needsUpdate = true;

    // Reduced motion has no loop to repaint with the new palette: re-render
    // the static frame here, or the theme switch would leave a stale image.
    if (this.reducedMotion && this.started && !this.running) {
      this.updateField(1, 0);
      this.renderFrame(0);
      this.publishFrameCount(performance.now());
    }
  }

  /** Updates the pointer target, in -1..1 on both axes. */
  setPointer(x: number, y: number): void {
    this.targetPointerX = x;
    this.targetPointerY = y;
  }

  /** Updates the document scroll progress, 0 (top) .. 1 (bottom). */
  setScrollProgress(progress: number): void {
    this.targetProgress = Math.min(1, Math.max(0, progress));
  }

  /** Starts the animation loop, or renders a single static frame. */
  start(): void {
    if (this.disposed || this.running) return;

    // The entrance clock is set once, on the first start.
    if (!this.started) {
      this.started = true;
      this.startedAt = performance.now();
    }

    if (this.reducedMotion) {
      // Static frame honors the current scroll position without starting the
      // loop, resting as the calm wing-framed constellation at scroll = 0.
      this.scrollProgress = this.targetProgress;
      this.updateField(1, 0);
      this.renderFrame(0);
      this.publishFrameCount(performance.now());
      return;
    }

    this.running = true;
    let previous = performance.now();
    const loop = (): void => {
      if (this.disposed || !this.running) return;
      this.frameHandle = requestAnimationFrame(loop);

      const now = performance.now();
      // Delta time, clamped so a background tab or a stalled frame cannot
      // hand the postprocessing pass a huge step.
      const delta = Math.min(0.1, (now - previous) / 1000);
      previous = now;

      const elapsed = now - this.startedAt;
      const entrance = easeOutCubic(Math.min(1, elapsed / ENTRANCE_MS));

      this.updateField(entrance, elapsed / 1000);
      this.renderFrame(delta);
      this.publishFrameCount(now);
    };
    this.frameHandle = requestAnimationFrame(loop);
  }

  /**
   * Publishes the frame count on the canvas, at most twice a second.
   *
   * It makes the render loop observable from outside, which is how the E2E
   * suite proves that the loop is not running under `prefers-reduced-motion`.
   * Comparing rendered pixels instead would be unreliable: GPU rasterisation
   * is not bit-identical between frames.
   */
  private publishFrameCount(now: number): void {
    if (now - this.lastFramePublish < 500) return;
    this.lastFramePublish = now;
    this.canvas.dataset.hiveFrames = String(this.frameCount);
  }

  /** Stops the animation loop. */
  stop(): void {
    this.running = false;
    if (this.frameHandle !== null) {
      cancelAnimationFrame(this.frameHandle);
      this.frameHandle = null;
    }
  }

  /** Advances the field and writes the instance and line buffers. */
  private updateField(entrance: number, time: number): void {
    const nodes = this.nodes;
    const targets = this.targets;
    const worldScale = this.worldScale;

    this.scrollProgress = this.reducedMotion
      ? this.targetProgress
      : this.scrollProgress + (this.targetProgress - this.scrollProgress) * SCROLL_LERP;

    const p = this.scrollProgress;
    const heroSpread = 1 - smoothstep(0.0, 0.28, p);
    const energy = smoothstep(0.0, 0.38, p);
    const tileScale = smoothstep(0.48, 0.84, p);
    const assembly = easeInOutCubic(smoothstep(0.58, 0.92, p));

    // Idle drift dampens as tiles lock into the honeycomb core.
    const driftDamping = 1 - assembly * 0.92;
    const hexTileRadius = NODE_RADIUS_ASSEMBLED * worldScale;
    const corridorHalfW =
      this.visibleWidth * (this.visibleWidth < this.visibleHeight ? 0.41 : 0.36) * heroSpread;
    const corridorHalfH = this.visibleHeight * 0.36 * heroSpread;

    for (let i = 0; i < nodes.length; i += 1) {
      const node = nodes[i];
      const target = targets[i];
      if (!node || !target) continue;

      const driftX =
        DRIFT_AMPLITUDE * 0.5 * Math.cos(time * node.driftSpeed * 0.6 + node.driftPhase);
      const driftY =
        DRIFT_AMPLITUDE * Math.sin(time * node.driftSpeed + node.driftPhase) * node.driftAmplitude;

      let swarmX = (node.x + driftX * driftDamping) * this.swarmScaleX;
      const swarmY = (node.y + driftY * driftDamping) * this.swarmScaleY;
      if (Math.abs(swarmY) < corridorHalfH && Math.abs(swarmX) < corridorHalfW) {
        const signX = swarmX < 0 ? -1 : 1;
        swarmX = signX * (corridorHalfW + Math.abs(swarmX) * 0.2);
      }

      const coreX = (target.x + driftX * driftDamping * 0.25) * worldScale;
      const coreY = (target.y + driftY * driftDamping * 0.25) * worldScale;
      const x = lerp(swarmX, coreX, assembly);
      const y = lerp(swarmY, coreY, assembly);
      const z = lerp(node.z, target.z, assembly) * worldScale;

      this.positions[i * 3] = x;
      this.positions[i * 3 + 1] = y;
      this.positions[i * 3 + 2] = z;

      const plexusRadius =
        (NODE_RADIUS_MIN + (NODE_RADIUS_MAX - NODE_RADIUS_MIN) * entrance) * node.driftAmplitude;
      const radius = lerp(plexusRadius, hexTileRadius, tileScale);

      this.dummy.position.set(x, y, z);
      this.dummy.scale.setScalar(radius);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }

    this.mesh.instanceMatrix.needsUpdate = true;

    // --- links -------------------------------------------------------------
    this.frameCount += 1;
    if (this.frameCount % LINK_RECOMPUTE_FRAMES === 0 || this.linkBuffer.count === 0) {
      const meanSwarmScale = (this.swarmScaleX + this.swarmScaleY) * 0.5;
      const linkDistance = lerp(
        meanSwarmScale * lerp(LINK_DISTANCE_REST, LINK_DISTANCE_MAX, energy),
        worldScale * LINK_DISTANCE_ASSEMBLED,
        assembly,
      );

      computeLinks(
        this.positions,
        nodes.length,
        { maxDistance: linkDistance, maxPerNode: LINK_MAX_PER_NODE },
        this.linkBuffer,
      );

      const { indices, count } = this.linkBuffer;
      let drawn = 0;
      for (let i = 0; i < count; i += 1) {
        const a = indices[i * 2];
        const b = indices[i * 2 + 1];
        if (a === undefined || b === undefined) continue;
        this.linePositions[drawn * 6] = this.positions[a * 3] ?? 0;
        this.linePositions[drawn * 6 + 1] = this.positions[a * 3 + 1] ?? 0;
        this.linePositions[drawn * 6 + 2] = this.positions[a * 3 + 2] ?? 0;
        this.linePositions[drawn * 6 + 3] = this.positions[b * 3] ?? 0;
        this.linePositions[drawn * 6 + 4] = this.positions[b * 3 + 1] ?? 0;
        this.linePositions[drawn * 6 + 5] = this.positions[b * 3 + 2] ?? 0;
        drawn += 1;
      }

      this.lineGeometry.setDrawRange(0, drawn * 2);
      const attribute = this.lineGeometry.getAttribute("position") as BufferAttribute;
      attribute.needsUpdate = true;
    }

    const lineMaterial = this.lines.material as LineBasicMaterial;
    lineMaterial.opacity =
      this.palette.linkOpacity *
      lerp(LINK_OPACITY_MIN + (1 - LINK_OPACITY_MIN) * energy, LINK_OPACITY_ASSEMBLED, assembly);

    // Dial down bloom as hexagon tiles grow so the mortar gaps stay razor-sharp.
    this.bloom.intensity = BLOOM_INTENSITY * (1 - tileScale * 0.45);

    // --- pointer tilt ------------------------------------------------------
    this.pointerX += (this.targetPointerX - this.pointerX) * POINTER_LERP;
    this.pointerY += (this.targetPointerY - this.pointerY) * POINTER_LERP;
    this.group.rotation.y = this.pointerX * POINTER_TILT_X;
    this.group.rotation.x = -this.pointerY * POINTER_TILT_Y;
  }

  private renderFrame(deltaTime: number): void {
    if (this.palette.bloom) {
      this.composer.render(deltaTime);
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /** Releases every GPU resource. */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.stop();

    this.mesh.geometry.dispose();
    (this.mesh.material as MeshBasicMaterial).dispose();
    this.lineGeometry.dispose();
    (this.lines.material as LineBasicMaterial).dispose();
    this.composer.dispose();
    this.renderer.dispose();
  }
}
