import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Reveal } from "@/components/motion";
import { StatusPill } from "@/components/status-pill";
import { TechPills } from "@/components/tech-pills";
import { externalLink } from "@/components/ui/cta";
import { formatDate } from "@/lib/content/localize";
import { getCaseStudy, getPublishedSlugs } from "@/lib/content/queries";
import { Link } from "@/lib/i18n/navigation";
import { isLocale, locales, toLocale, type Locale } from "@/lib/i18n/routing";
import { routeMetadata } from "@/lib/seo";

export const revalidate = 3600;
// Only prebuilt published slugs exist; anything else is a hard 404 —
// draft content is unreachable by construction (prompt-4 §6.4).
export const dynamicParams = false;

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
  if (!study) {
    notFound();
  }
  const t = await getTranslations("projects");

  return (
    <div className="container-site py-16 md:py-20">
      <div className="container-reading">
        <Link
          href="/projects"
          className={`inline-flex min-h-11 items-center gap-1 text-muted-foreground transition-colors duration-150 hover:text-foreground ${externalLink}`}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4 rtl:-scale-x-100"
          >
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
          {t("backToProjects")}
        </Link>

        <p className="mt-8 type-caption text-muted-foreground">{t("caseStudy")}</p>
        <h1 className="mt-1 type-h1">
          <bdi>{study.title}</bdi>
        </h1>
        <p className="mt-4 text-muted-foreground type-body-lg">{study.summary}</p>

        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
          {study.liveUrl && (
            <a href={study.liveUrl} target="_blank" rel="noopener noreferrer" className={externalLink}>
              {t("liveDemo")}
              <span aria-hidden="true" className="text-xs">
                ↗
              </span>
            </a>
          )}
          {study.repoUrl ? (
            <a href={study.repoUrl} target="_blank" rel="noopener noreferrer" className={externalLink}>
              {t("sourceCode")}
              <span aria-hidden="true" className="text-xs">
                ↗
              </span>
            </a>
          ) : (
            <StatusPill kind="neutral">{t("privateRepo")}</StatusPill>
          )}
        </div>

        <div className="mt-6">
          <TechPills items={study.techStack} label={t("stack")} />
        </div>

        <section className="mt-12" aria-labelledby="study-problem">
          <Reveal>
            <h2 id="study-problem" className="type-h2">
              {t("problem")}
            </h2>
            <p className="mt-3 type-body">{study.problem}</p>
          </Reveal>
        </section>

        <section className="mt-10" aria-labelledby="study-solution">
          <Reveal>
            <h2 id="study-solution" className="type-h2">
              {t("solution")}
            </h2>
            <p className="mt-3 type-body">{study.solution}</p>
          </Reveal>
        </section>

        {study.results && (
          <section className="mt-10" aria-labelledby="study-results">
            <Reveal>
              <h2 id="study-results" className="type-h2">
                {t("results")}
              </h2>
              <p className="mt-3 type-body">{study.results}</p>
            </Reveal>
          </section>
        )}

        <p className="mt-12 border-t border-border-subtle pt-6 type-caption text-muted-foreground">
          {t("lastUpdated", { date: formatDate(study.updatedAt.slice(0, 10), locale) })}
        </p>
      </div>
    </div>
  );
}
