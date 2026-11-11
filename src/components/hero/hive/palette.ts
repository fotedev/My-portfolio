/**
 * Theme-aware palette for the hero lattice.
 *
 * The colours are read from CSS custom properties defined in `globals.css`,
 * not hard-coded here - DESIGN.md §13.1 requires zero raw hex values in
 * component code, and the amber exception granted by ADR-0010 §3 is scoped to
 * the canvas layer, which is exactly what a token expresses.
 *
 * Bloom cannot survive a light ground - it washes the page out - so the light
 * theme uses normal blending, a deeper amber, and no bloom.
 */

export interface HivePalette {
  /** Colour of the hexagonal nodes. */
  node: number;
  /** Colour of the proximity links. */
  link: number;
  /** Additive blending in dark mode, normal in light mode. */
  additive: boolean;
  /** Whether the bloom pass is enabled. */
  bloom: boolean;
  /** Opacity of the link lines. */
  linkOpacity: number;
  /** Opacity of the nodes. */
  nodeOpacity: number;
}

/** Parses a CSS hex colour into the integer three.js expects. */
function parseHex(raw: string, fallback: number): number {
  const value = raw.trim().replace(/^#/, "");
  if (value.length === 3) {
    const expanded = value
      .split("")
      .map((char) => char + char)
      .join("");
    return Number.parseInt(expanded, 16);
  }
  const parsed = Number.parseInt(value, 16);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Reads a numeric token. */
function parseNumber(raw: string, fallback: number): number {
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Reads the palette for the theme currently applied to the document. */
export function readPalette(root: HTMLElement): HivePalette {
  const styles = getComputedStyle(root);
  const read = (name: string): string => styles.getPropertyValue(name);

  return {
    node: parseHex(read("--hive-node"), 0xff6b35),
    link: parseHex(read("--hive-link"), 0xff8c42),
    additive: parseNumber(read("--hive-additive"), 1) > 0.5,
    bloom: parseNumber(read("--hive-bloom"), 1) > 0.5,
    nodeOpacity: parseNumber(read("--hive-node-opacity"), 1),
    linkOpacity: parseNumber(read("--hive-link-opacity"), 0.28),
  };
}
