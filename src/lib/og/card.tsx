import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const ogAlt = "fotedev — Ahmed Aboalayoun, Full-Stack AI Engineer";
export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

/**
 * Per-locale OG card (docs/SEO-I18N.md §6.1): 1200×630, dark brand surface,
 * one accent bar, localized text rendered with the committed OFL fonts in
 * public/og-fonts (Satori needs real font files; Arabic needs IBM Plex Sans
 * Arabic or the joined script breaks).
 *
 * Rendered by the stable route [locale]/og-image/route.ts — the
 * file-convention opengraph-image.tsx was replaced because its Next-internal
 * hashed route path cannot be referenced from routeMetadata (M6 audit).
 */
const COPY = {
  en: {
    name: "Ahmed Aboalayoun",
    role: "Full-Stack AI Engineer",
    offer: "Web applications and AI tools built around your business.",
    domain: "fotedev.me",
    dir: "ltr" as const,
    align: "flex-start" as const,
    font: "Inter",
  },
  ar: {
    name: "أحمد أبو العيون",
    role: "مهندس ذكاء اصطناعي متكامل",
    offer: "تطبيقات ويب وأدوات ذكاء اصطناعي مبنية حول عملك.",
    domain: "fotedev.me",
    dir: "rtl" as const,
    align: "flex-end" as const,
    font: "PlexArabic",
  },
} as const;

export async function renderBrandCard(locale: string): Promise<ImageResponse> {
  const copy = COPY[locale as keyof typeof COPY] ?? COPY.en;

  const fontsDir = path.join(process.cwd(), "public", "og-fonts");
  const [inter, plex] = await Promise.all([
    readFile(path.join(fontsDir, "og-inter-700.ttf")),
    readFile(path.join(fontsDir, "og-plex-arabic-700.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: copy.align,
          backgroundColor: "#0A0E1A",
          color: "#F8FAFC",
          padding: 72,
          direction: copy.dir,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 8,
              borderRadius: 4,
              background: "linear-gradient(90deg, #22D3EE, #3B82F6)",
              display: "flex",
            }}
          />
          <div style={{ fontSize: 30, color: "#22D3EE", fontFamily: copy.font }}>fotedev</div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            alignItems: copy.align,
          }}
        >
          <div style={{ fontSize: 68, fontFamily: copy.font }}>{copy.name}</div>
          <div style={{ fontSize: 34, color: "#94A3B8", fontFamily: copy.font }}>{copy.role}</div>
          <div style={{ fontSize: 30, color: "#CBD5E1", fontFamily: copy.font }}>{copy.offer}</div>
        </div>

        <div style={{ fontSize: 26, color: "#475569", fontFamily: copy.font }}>{copy.domain}</div>
      </div>
    ),
    {
      ...ogSize,
      fonts: [
        { name: "Inter", data: inter, weight: 700, style: "normal" },
        { name: "PlexArabic", data: plex, weight: 700, style: "normal" },
      ],
    },
  );
}
