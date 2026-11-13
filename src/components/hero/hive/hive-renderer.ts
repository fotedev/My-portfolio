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
  AMBIENT_RATIO,
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
  ENERGY_LERP,
  ENTRANCE_MS,
  FIELD_EXTENT,
  HIVE_SEED,
  LINK_DISTANCE_MAX,
  LINK_DISTANCE_REST,
  LINK_MAX_PER_NODE,
  LINK_OPACITY_MIN,
  LINK_RECOMPUTE_FRAMES,
  MAX_PIXEL_RATIO,
  NODE_COUNT,
  NODE_RADIUS_MAX,
  NODE_RADIUS_MIN,
  POINTER_LERP,
  POINTER_TILT_X,
  POINTER_TILT_Y,
  Z_JITTER,
} from "./config";
import { buildSwarm, swarmBounds, type LatticeNode } from "./lattice";
import { computeLinks, createLinkBuffer, type LinkBuffer } from "./links";
import type { HivePalette } from "./palette";

/** Ease-out cubic, used for the entrance. */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
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
  /** Scroll energy, 0 = sparse rest state, 1 = fully energised plexus. */
  energy: number;
}

/**
 * The hive lattice renderer.
 *
 * Imperative three.js rather than React Three Fiber: this is one fixed
 * background canvas with one pointer input and no scene graph driven by
 * application state, and the reconciler costs ~107 KB gzip for no visual
 * benefit (ADR-0010 §2).
 *
 * The field is ambient: every node is present from the first frame and the
 * mesh drifts continuously. Scroll energy widens the link reach and brightens
 * the web (the reference's sparse-to-dense progression); the pointer tilts
 * the whole field slightly.
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

  private nodes: LatticeNode[] = [];
  private readonly positions: Float32Array;
  private readonly linkBuffer: LinkBuffer;

  private palette: HivePalette;
  private readonly reducedMotion: boolean;

  private width = 1;
  private height = 1;
  private pixelRatio = 1;
  /** Scale that fits the field to the viewport width. */
  private worldScale = 1;

  private pointerX = 0;
  private pointerY = 0;
  private targetPointerX = 0;
  private targetPointerY = 0;
  private energy = 0;
  private targetEnergy = 0;

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
    // Small round dots, matching the reference's node scale - not hexagons.
    const nodeGeometry = new CircleGeometry(1, 12);
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
    const bloom = new BloomEffect({
      luminanceThreshold: BLOOM_THRESHOLD,
      luminanceSmoothing: BLOOM_SMOOTHING,
      mipmapBlur: true,
      intensity: BLOOM_INTENSITY,
      radius: BLOOM_RADIUS,
      kernelSize: KernelSize.LARGE,
    });
    composer.addPass(new EffectPass(this.camera, bloom));
    this.composer = composer;
  }

  /** Builds the field: the node lattice. */
  private buildField(): void {
    this.nodes = buildSwarm({
      nodeCount: NODE_COUNT,
      clusterCount: CLUSTER_COUNT,
      clusterSpread: CLUSTER_SPREAD,
      ambientRatio: AMBIENT_RATIO,
      fieldExtent: FIELD_EXTENT,
      zJitter: Z_JITTER,
      seed: HIVE_SEED,
    });
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

    // Fit the field to the viewport. The field is a scatter, so it is always
    // wider than it is tall; on a landscape screen it is fitted by width and
    // overflows vertically, and on a portrait screen it is fitted by height
    // and overflows horizontally. Fitting by the tighter axis means the mesh
    // always covers the viewport instead of floating as a band in the middle
    // of a phone screen.
    const bounds = swarmBounds(this.nodes);
    const visibleWidth =
      2 * this.camera.position.z * Math.tan(((CAMERA_FOV / 2) * Math.PI) / 180) * aspect;
    const visibleHeight = 2 * this.camera.position.z * Math.tan(((CAMERA_FOV / 2) * Math.PI) / 180);

    this.worldScale = Math.max(visibleWidth / bounds.width, visibleHeight / bounds.height);
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

  /** Updates the scroll-energy target, 0 (sparse rest) .. 1 (fully energised). */
  setEnergy(value: number): void {
    this.targetEnergy = Math.min(1, Math.max(0, value));
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
      // The static frame shows the fully energised plexus: a sparse, half
      // empty mesh would read as a bug, not as reduced motion.
      this.energy = 1;
      this.targetEnergy = 1;
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

      this.frameCount += 1;
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
    const worldScale = this.worldScale;

    // The energy follows its scroll target smoothly, so wheel steps and
    // scrollbar drags read as one continuous swell.
    this.energy += (this.targetEnergy - this.energy) * ENERGY_LERP;

    for (let i = 0; i < nodes.length; i += 1) {
      const node = nodes[i];
      if (!node) continue;

      // Idle drift: the plexus is a living network, never a still image.
      const driftX =
        DRIFT_AMPLITUDE * 0.5 * Math.cos(time * node.driftSpeed * 0.6 + node.driftPhase);
      const driftY =
        DRIFT_AMPLITUDE * Math.sin(time * node.driftSpeed + node.driftPhase) * node.driftAmplitude;

      const x = (node.x + driftX) * worldScale;
      const y = (node.y + driftY) * worldScale;
      const z = node.z * worldScale;

      this.positions[i * 3] = x;
      this.positions[i * 3 + 1] = y;
      this.positions[i * 3 + 2] = z;

      // The per-node drift amplitude doubles as the size variation: the
      // reference's dots are not uniform, and reusing the existing random
      // per-node value keeps the field's randomness single-sourced.
      const radius =
        (NODE_RADIUS_MIN + (NODE_RADIUS_MAX - NODE_RADIUS_MIN) * entrance) * node.driftAmplitude;

      this.dummy.position.set(x, y, z);
      this.dummy.scale.setScalar(radius);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }

    this.mesh.instanceMatrix.needsUpdate = true;

    // --- links -------------------------------------------------------------
    this.frameCount += 1;
    if (this.frameCount % LINK_RECOMPUTE_FRAMES === 0 || this.linkBuffer.count === 0) {
      // The link reach widens with scroll energy: the rest state is a loose,
      // faint web; the energised state is the dense triangulated plexus the
      // reference shows deeper down the page.
      const linkDistance =
        this.worldScale *
        (LINK_DISTANCE_REST + (LINK_DISTANCE_MAX - LINK_DISTANCE_REST) * this.energy);

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

      // Brightness follows the energy too: the web is faint at rest and at
      // full strength once energised.
      const lineMaterial = this.lines.material as LineBasicMaterial;
      lineMaterial.opacity =
        this.palette.linkOpacity * (LINK_OPACITY_MIN + (1 - LINK_OPACITY_MIN) * this.energy);
    }

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
