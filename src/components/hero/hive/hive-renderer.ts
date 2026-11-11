"use client";

import { BloomEffect, EffectComposer, EffectPass, KernelSize, RenderPass } from "postprocessing";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  DynamicDrawUsage,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  MeshBasicMaterial,
  NormalBlending,
  Object3D,
  PerspectiveCamera,
  Scene,
  Shape,
  ShapeGeometry,
  WebGLRenderer,
} from "three";
import { assignTargets, buildRosette, type AssemblyTarget } from "./assembly";
import {
  ASSEMBLY_GAP,
  ASSEMBLY_JITTER,
  CAMERA_FAR,
  CAMERA_FOV,
  CAMERA_NEAR,
  CAMERA_Z_LANDSCAPE,
  CAMERA_Z_PORTRAIT,
  CELL_SIZE,
  DRIFT_AMPLITUDE,
  ENTRANCE_MS,
  HIVE_SEED,
  IMMEDIATE_RATIO,
  LINK_DISTANCE_CELLS,
  LINK_MAX_PER_NODE,
  LINK_RECOMPUTE_FRAMES,
  MAX_PIXEL_RATIO,
  NODE_APPEAR_WIDTH,
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

/** Smoothstep, used for the per-node grow-in. */
function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** Ease-out cubic, used for the entrance. */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Ease-in-out cubic, used for the convergence.
 *
 * A linear convergence reads as a scramble: the nodes cross each other on
 * their way in and the field looks like it is thrashing. Easing it means the
 * field holds, then tightens, then settles.
 */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** A regular hexagonal outline, used as the instanced node shape. */
function hexagonShape(radius: number): Shape {
  const shape = new Shape();
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI / 3) * i + Math.PI / 6;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  }
  shape.closePath();
  return shape;
}

export interface HiveRendererOptions {
  /** Render a single static frame instead of animating. */
  reducedMotion: boolean;
  /** Number of hex rings in the field. */
  rings: number;
  palette: HivePalette;
}

export interface HiveRendererState {
  /** Pointer position, normalized to -1..1 on both axes. */
  pointerX: number;
  pointerY: number;
  /** Convergence progress, 0 = scattered field, 1 = fully assembled. */
  assembly: number;
}

/**
 * The hero lattice renderer.
 *
 * Imperative three.js rather than React Three Fiber: this is one fixed
 * background canvas with one pointer input and no scene graph driven by
 * application state, and the reconciler costs ~107 KB gzip for no visual
 * benefit (ADR-0010 §2).
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
  private targets: AssemblyTarget[] = [];
  private readonly positions: Float32Array;
  private readonly linkBuffer: LinkBuffer;

  private palette: HivePalette;
  private readonly reducedMotion: boolean;
  private readonly rings: number;

  private width = 1;
  private height = 1;
  private pixelRatio = 1;
  /** Scale that fits the field to the viewport width. */
  private worldScale = 1;
  /** World-space spacing between adjacent nodes of the field. */
  private cellSpacing = 1;

  private pointerX = 0;
  private pointerY = 0;
  private targetPointerX = 0;
  private targetPointerY = 0;
  private assembly = 0;

  private startedAt = 0;
  private started = false;
  private frameHandle: number | null = null;
  private frameCount = 0;
  private lastFramePublish = 0;
  private running = false;
  private disposed = false;

  constructor(canvas: HTMLCanvasElement, options: HiveRendererOptions) {
    this.palette = options.palette;
    this.reducedMotion = options.reducedMotion;
    this.rings = options.rings;

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
    const nodeGeometry = new ShapeGeometry(hexagonShape(1));
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
      luminanceThreshold: 0.65,
      luminanceSmoothing: 0.5,
      mipmapBlur: true,
      intensity: 0.6,
      radius: 0.4,
      kernelSize: KernelSize.LARGE,
    });
    composer.addPass(new EffectPass(this.camera, bloom));
    this.composer = composer;
  }

  /** Builds the field: the node lattice and the assembly targets. */
  private buildField(): void {
    this.nodes = buildSwarm({
      rings: this.rings,
      cellSize: CELL_SIZE,
      zJitter: Z_JITTER,
      immediateRatio: IMMEDIATE_RATIO,
      seed: HIVE_SEED,
    });

    const rosette = buildRosette({
      rings: this.rings,
      ringGap: ASSEMBLY_GAP,
      depth: 0.4,
      seed: HIVE_SEED ^ 0x9e3779b9,
    });

    this.targets = assignTargets(
      this.nodes.map((node) => ({ x: node.x, y: node.y })),
      rosette,
      ASSEMBLY_JITTER,
      HIVE_SEED ^ 0x85ebca6b,
    );
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

    // Fit the field to the viewport. The field is a hexagon, so it is always
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
    this.cellSpacing = Math.sqrt(3) * CELL_SIZE * this.worldScale;
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
  }

  /** Updates the pointer target, in -1..1 on both axes. */
  setPointer(x: number, y: number): void {
    this.targetPointerX = x;
    this.targetPointerY = y;
  }

  /** Updates the convergence progress, 0..1. */
  setAssembly(progress: number): void {
    this.assembly = Math.min(1, Math.max(0, progress));
  }

  /** Starts the animation loop, or renders a single static frame. */
  start(): void {
    if (this.disposed || this.running) return;

    // The entrance clock is set once, on the first start. Restarting the loop
    // (because the hero scrolled back into view, say) must not replay the
    // entrance from the beginning.
    if (!this.started) {
      this.started = true;
      this.startedAt = performance.now();
    }

    if (this.reducedMotion) {
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
    const targets = this.targets;
    const assembly = easeInOutCubic(this.assembly);
    const worldScale = this.worldScale;

    for (let i = 0; i < nodes.length; i += 1) {
      const node = nodes[i];
      const target = targets[i];
      if (!node || !target) continue;

      // Converge from the scattered field toward the assembly form.
      const baseX = node.x + (target.x - node.x) * assembly;
      const baseY = node.y + (target.y - node.y) * assembly;
      const baseZ = node.z + (target.z - node.z) * assembly;

      // Idle drift, damped as the form assembles so the mark holds still.
      const damping = 1 - assembly * 0.85;
      const driftX =
        DRIFT_AMPLITUDE * 0.5 * Math.cos(time * node.driftSpeed * 0.6 + node.driftPhase);
      const driftY =
        DRIFT_AMPLITUDE * Math.sin(time * node.driftSpeed + node.driftPhase) * node.driftAmplitude;

      const x = (baseX + driftX * damping) * worldScale;
      const y = (baseY + driftY * damping) * worldScale;
      const z = baseZ * worldScale;

      this.positions[i * 3] = x;
      this.positions[i * 3 + 1] = y;
      this.positions[i * 3 + 2] = z;
      // Grow-in: a node appears once the entrance passes its threshold.
      const progress = Math.min(1, Math.max(0, (entrance - node.threshold) / NODE_APPEAR_WIDTH));
      const appear = smoothstep(0, 1, progress);
      const radius = (NODE_RADIUS_MIN + (NODE_RADIUS_MAX - NODE_RADIUS_MIN) * entrance) * appear;

      this.dummy.position.set(x, y, z);
      this.dummy.scale.setScalar(radius);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }

    this.mesh.instanceMatrix.needsUpdate = true;

    // --- links -------------------------------------------------------------
    this.frameCount += 1;
    if (this.frameCount % LINK_RECOMPUTE_FRAMES === 0 || this.linkBuffer.count === 0) {
      // The link range tightens as the field collapses: the scattered field
      // links across a few cell spacings, the collapsed honeycomb links only
      // to its immediate neighbours.
      const linkDistance =
        this.worldScale *
        (Math.sqrt(3) * LINK_DISTANCE_CELLS +
          (ASSEMBLY_GAP * 1.7 - Math.sqrt(3) * LINK_DISTANCE_CELLS) * assembly);

      computeLinks(
        this.positions,
        nodes.length,
        { maxDistance: linkDistance, maxPerNode: LINK_MAX_PER_NODE },
        this.linkBuffer,
      );

      const { indices, count } = this.linkBuffer;
      for (let i = 0; i < count; i += 1) {
        const a = indices[i * 2];
        const b = indices[i * 2 + 1];
        if (a === undefined || b === undefined) continue;
        this.linePositions[i * 6] = this.positions[a * 3] ?? 0;
        this.linePositions[i * 6 + 1] = this.positions[a * 3 + 1] ?? 0;
        this.linePositions[i * 6 + 2] = this.positions[a * 3 + 2] ?? 0;
        this.linePositions[i * 6 + 3] = this.positions[b * 3] ?? 0;
        this.linePositions[i * 6 + 4] = this.positions[b * 3 + 1] ?? 0;
        this.linePositions[i * 6 + 5] = this.positions[b * 3 + 2] ?? 0;
      }

      this.lineGeometry.setDrawRange(0, count * 2);
      const attribute = this.lineGeometry.getAttribute("position") as BufferAttribute;
      attribute.needsUpdate = true;
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
