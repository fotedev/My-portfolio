import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CaseStudyCard } from "@/components/case-study-card";
import { JsonLd } from "@/components/json-ld";
import { webPageJsonLd } from "@/lib/content/jsonld";
import { getPublishedProjects } from "@/lib/content/queries";
import { isLocale, toLocale, type Locale } from "@/lib/i18n/routing";
import { routeMetadata } from "@/lib/seo";

// On-demand ISR (prompt-6 §4 / ARCHITECTURE §5.1): no time-based revalidation —
// admin publishes revalidate these paths explicitly via revalidatePath.
export const revalidate = false;

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "projects" });
  return routeMetadata({
    locale: toLocale(locale),
    path: "/projects",
    title: t("title"),
    description: t("subtitle"),
  });
}

export default async function ProjectsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) {
    notFound();
  }
  const locale: Locale = rawLocale;
  setRequestLocale(locale);
  const t = await getTranslations("projects");
  const projects = await getPublishedProjects(locale);

  return (
    <div className="container-site py-16 md:py-24">
      <JsonLd
        data={webPageJsonLd({
          locale,
          path: "/projects",
          title: t("title"),
          description: t("subtitle"),
        })}
      />
      <h1 className="type-h1">{t("title")}</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">{t("subtitle")}</p>

      {/* The anchor case study leads, full row; the rest follow in the grid. */}
      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        {projects.map((project, index) => (
          <CaseStudyCard
            key={project.slug}
            project={project}
            featured={index === 0}
            labels={{
              caseStudy: t("caseStudy"),
              liveDemo: t("liveDemo"),
              sourceCode: t("sourceCode"),
              privateRepo: t("privateRepo"),
              stack: t("stack"),
            }}
          />
        ))}
      </div>
    </div>
  );
}
