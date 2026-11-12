import { renderBrandCard } from "@/lib/og/card";

/**
 * Stable OG image route: /en/og-image and /ar/og-image. This replaces the
 * file-convention opengraph-image.tsx, whose Next-internal hashed route path
 * cannot be referenced from routeMetadata (M6 SEO audit). Unknown locales
 * fall back to the EN card.
 */
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string }> },
): Promise<Response> {
  const { locale } = await params;
  return renderBrandCard(locale === "ar" ? "ar" : "en");
}
