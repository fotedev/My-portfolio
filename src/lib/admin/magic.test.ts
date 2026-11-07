import { describe, expect, it } from "vitest";
import { classifyUpload, detectUploadKind } from "./magic";

const bytes = (...vals: number[]) => new Uint8Array(vals);
const ascii = (text: string) => new Uint8Array(Array.from(text, (c) => c.charCodeAt(0)));

describe("detectUploadKind (magic bytes)", () => {
  it("recognizes PNG by its 8-byte signature", () => {
    expect(detectUploadKind(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13))).toBe("png");
  });

  it("recognizes JPEG even at minimum length", () => {
    expect(detectUploadKind(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("jpeg");
    expect(detectUploadKind(bytes(0xff, 0xd8, 0xff))).toBe("jpeg");
  });

  it("recognizes WEBP (RIFF…WEBP)", () => {
    const file = new Uint8Array(12);
    file.set(ascii("RIFF"), 0);
    file.set(bytes(0x24, 0x08, 0x00, 0x00), 4);
    file.set(ascii("WEBP"), 8);
    expect(detectUploadKind(file)).toBe("webp");
  });

  it("recognizes AVIF (ftyp box with avif/avis brand)", () => {
    const file = new Uint8Array(20);
    file.set(ascii("****ftypavif"), 0);
    expect(detectUploadKind(file)).toBe("avif");
  });

  it("recognizes PDF", () => {
    expect(detectUploadKind(ascii("%PDF-1.7 more bytes here than twelve"))).toBe("pdf");
  });

  it("rejects spoofed content: HTML renamed .png, plaintext, empty", () => {
    expect(detectUploadKind(ascii("<html><body>evil</body></html> padding"))).toBeNull();
    expect(detectUploadKind(ascii("GIF89a gif is not allowed"))).toBeNull();
    expect(detectUploadKind(new Uint8Array(0))).toBeNull();
  });
});

describe("classifyUpload", () => {
  it("maps detected kinds to the bucket MIME whitelist", () => {
    expect(classifyUpload(ascii("%PDF-1.7 ..."))).toEqual({ kind: "pdf", mime: "application/pdf" });
    expect(classifyUpload(ascii("<script>alert(1)</script>"))).toEqual({ kind: null, mime: null });
  });
});
