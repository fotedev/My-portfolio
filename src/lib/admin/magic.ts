/**
 * Content-based upload validation (prompt-6 §3/§6 security pass). Declared
 * Content-Type alone is insufficient — uploads are accepted only when the
 * magic bytes match the bucket whitelist (PNG/JPEG/WEBP/AVIF/PDF).
 */

export type UploadKind = "png" | "jpeg" | "webp" | "avif" | "pdf";

export const KIND_MIME: Record<UploadKind, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
  avif: "image/avif",
  pdf: "application/pdf",
};

/** Images ≤ 2 MB, PDF ≤ 10 MB (prompt-6 §3; bucket cap is 10 MB). */
export const IMAGE_MAX_BYTES = 2 * 1024 * 1024;
export const PDF_MAX_BYTES = 10 * 1024 * 1024;

export function maxBytesFor(kind: UploadKind): number {
  return kind === "pdf" ? PDF_MAX_BYTES : IMAGE_MAX_BYTES;
}

function startsWith(bytes: Uint8Array, offset: number, ascii: string): boolean {
  if (bytes.length < offset + ascii.length) return false;
  for (let i = 0; i < ascii.length; i += 1) {
    if (bytes[offset + i] !== ascii.charCodeAt(i)) return false;
  }
  return true;
}

/** Detect the true file kind from magic bytes; null = not an allowed type. */
export function detectUploadKind(bytes: Uint8Array): UploadKind | null {
  if (bytes.length < 3) return null;

  // JPEG: FF D8 FF (checked before the 12-byte formats — a 4-byte JPEG stub
  // should still classify rather than fall through to null)
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpeg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "png";
  }

  // JPEG check moved above (3-byte signature)

  // WEBP: "RIFF" + 4-byte size + "WEBP"
  if (startsWith(bytes, 0, "RIFF") && startsWith(bytes, 8, "WEBP")) {
    return "webp";
  }

  // AVIF/AVIS: ISO-BMFF box — "ftyp" at offset 4, brand avif/avis in the box
  if (startsWith(bytes, 4, "ftyp")) {
    const head = new TextDecoder("latin1").decode(bytes.slice(0, Math.min(bytes.length, 64)));
    if (head.includes("avif") || head.includes("avis")) {
      return "avif";
    }
  }

  // PDF: "%PDF-" (some producers pad the header — scan the first kilobyte)
  const pdfHead = new TextDecoder("latin1").decode(bytes.slice(0, Math.min(bytes.length, 1024)));
  if (pdfHead.includes("%PDF-")) {
    return "pdf";
  }

  return null;
}

/** Reject executables/HTML masquerading as images (prompt-6 §6). */
export function classifyUpload(bytes: Uint8Array): { kind: UploadKind; mime: string } | { kind: null; mime: null } {
  const kind = detectUploadKind(bytes);
  if (!kind) return { kind: null, mime: null };
  return { kind, mime: KIND_MIME[kind] };
}
