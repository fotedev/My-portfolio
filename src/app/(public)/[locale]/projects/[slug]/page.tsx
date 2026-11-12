import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { JsonLd } from "@/components/json-ld";
import { CaseStudyView } from "@/components/public/case-study-view";
import { breadcrumbJsonLd, webPageJsonLd } from "@/lib/content/jsonld";
import { formatDate } from "@/lib/content/localize";
import { getCaseStudy, getPublishedSlugs } from "@/lib/content/queries";
import { isLocale, locales, toLocale, type Locale } from "@/lib/i18n/routing";
import { routeMetadata } from "@/lib/seo";

// On-demand ISR (prompt-6 §4 / ARCHITECTURE §5.1): no time-based revalidation —
// admin publishes revalidate these paths explicitly via revalidatePath.
export const revalidate = false;

export async function generateStaticParams(): Promise<Array<{ locale: string; slug: string }>> {
  const slugs = await getPublishedSlugs();
  return locales.flatMap((locale) => slugs.map(({ slug }) => ({ locale, slug })));
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await props.params;
  const study = await getCaseStudy(toLocale(locale), slug);
  if (!study) {
    return {};
  }
  return routeMetadata({
    locale: toLocale(locale),
    path: `/projects/${slug}`,
    title: study.title,
    description: study.summary,
  });
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) {
    notFound();
  }
  const locale: Locale = rawLocale;
  setRequestLocale(locale);
  const study = await getCaseStudy(locale, slug);
  // Drafts/unpublished slugs 404 for anon reads (RLS: status = 'published'
  // only) — draft content is previewable only behind /admin/preview.
  if (!study) {
    notFound();
  }
  const t = await getTranslations("projects");

  return (
    <div className="container-site py-16 md:py-20">
      <JsonLd
        data={webPageJsonLd({
          locale,
          path: `/projects/${slug}`,
          title: study.title,
          description: study.summary,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd({
          locale,
          items: [
            { name: "fotedev", path: "" },
            { name: t("title"), path: "/projects" },
            { name: study.title, path: `/projects/${slug}` },
          ],
        })}
      />
      <CaseStudyView
        study={study}
        labels={{
          backToProjects: t("backToProjects"),
          caseStudy: t("caseStudy"),
          liveDemo: t("liveDemo"),
          sourceCode: t("sourceCode"),
          privateRepo: t("privateRepo"),
          stack: t("stack"),
          problem: t("problem"),
          solution: t("solution"),
          results: t("results"),
          lastUpdated: t("lastUpdated", { date: formatDate(study.updatedAt.slice(0, 10), locale) }),
        }}
      />
    </div>
  );
}
