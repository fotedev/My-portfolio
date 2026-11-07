/**
 * JSON-LD script tag. Content comes exclusively from the builder functions in
 * src/lib/content/jsonld.ts (static, developer-authored facts) — no user input
 * is ever serialized here.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
