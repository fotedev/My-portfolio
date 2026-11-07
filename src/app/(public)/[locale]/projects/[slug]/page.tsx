import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { isLocale, locales } from "@/lib/i18n/routing";

/**
 * Case-study detail placeholder (M2). Slugs go live in M3 from Supabase
 * (generateStaticParams over published projects); an unknown slug 404s.
 */
export async function generateStaticParams(): Promise<Array<{ locale: string; slug: string }>> {
  return locales.map((locale) => ({ locale, slug: "placeholder" }));
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale) || slug !== "placeholder") {
    notFound();
  }
  setRequestLocale(locale);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold">Placeholder case study</h1>
      <p className="mt-4 text-muted-foreground">Real case studies publish in M3.</p>
    </div>
  );
}
