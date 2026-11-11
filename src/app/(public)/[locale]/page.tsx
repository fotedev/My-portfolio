import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CaseStudyCard } from "@/components/case-study-card";
import { CopyEmailButton } from "@/components/copy-email-button";
import { CredentialCard } from "@/components/credential-card";
import { JsonLd } from "@/components/json-ld";
import { OssContributionItem } from "@/components/oss-contributions";
import { StatusPill } from "@/components/status-pill";
import { ForwardArrow } from "@/components/ui/arrows";
import { btnPrimary, btnSecondary, externalLink } from "@/components/ui/cta";
import { personJsonLd, professionalServiceJsonLd } from "@/lib/content/jsonld";
import {
  getContributions,
  getFeaturedProjects,
  getPublishedCredential,
  getServices,
  getSiteSettings,
} from "@/lib/content/queries";
import { Link } from "@/lib/i18n/navigation";
import { isLocale, toLocale, type Locale } from "@/lib/i18n/routing";
import { routeMetadata } from "@/lib/seo";

// On-demand ISR (prompt-6 §4 / ARCHITECTURE §5.1): no time-based revalidation —
// admin publishes revalidate these paths explicitly via revalidatePath.
export const revalidate = false;

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return routeMetadata({
    locale: toLocale(locale),
    path: "",
    absoluteTitle: true,
    title: t("siteName"),
    description: t("description"),
  });
}

const HOW_STEPS = [
  { titleKey: "s1Title", bodyKey: "s1Body" },
  { titleKey: "s2Title", bodyKey: "s2Body" },
  { titleKey: "s3Title", bodyKey: "s3Body" },
  { titleKey: "s4Title", bodyKey: "s4Body" },
  { titleKey: "s5Title", bodyKey: "s5Body" },
] as const;

/**
 * Section header, "working document" style (ADR-0009): the title carries the
 * section, the meta line on the inline-end carries real data (entry counts),
 * and a full-width rule above separates chapters of the page.
 */
function SectionHeader({
  title,
  subtitle,
  meta,
  titleId,
}: {
  title: string;
  subtitle?: string;
  meta?: string;
  titleId: string;
}) {
  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-1">
        <h2 id={titleId} className="type-h2">
          {title}
        </h2>
        {meta && <p className="type-mono-sm text-muted-foreground tabular-nums">{meta}</p>}
      </div>
      {subtitle && (
        <p className="mt-2 max-w-2xl text-muted-foreground">{subtitle}</p>
      )}
    </>
  );
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) {
    notFound();
  }
  const locale: Locale = rawLocale;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const howT = await getTranslations("how");
  const projectsT = await getTranslations("projects");
  const ossT = await getTranslations("oss");
  const credT = await getTranslations("credential");
  const contactT = await getTranslations("contact");

  const [settings, projects, services, contributions, credential] = await Promise.all([
    getSiteSettings(locale),
    getFeaturedProjects(locale),
    getServices(locale),
    getContributions(locale),
    getPublishedCredential(locale),
  ]);

  // Proof claims double as navigation into their evidence sections.
  const proof = [
    { label: t("proofAi"), href: "/projects" },
    { label: t("proofOss"), href: "#home-oss" },
    { label: t("proofSecurity"), href: "#home-oss" },
    { label: t("proofCert"), href: "#home-credentials" },
  ];
  const email = settings?.contactEmail;

  return (
    <>
      <JsonLd data={personJsonLd({ sameAs: settings?.socials.map((s) => s.url) ?? [], locale })} />
      {settings && (
        <JsonLd
          data={professionalServiceJsonLd({ description: settings.heroOffer, email: settings.contactEmail, locale })}
        />
      )}

      {/* Hero — the offer is the thesis (DESIGN §1); wash is the only gradient.
          One orchestrated entrance (rise-in), then the page is still. */}
      <section className="hero-wash border-b border-border-subtle">
        <div className="container-site py-20 md:py-32">
          {settings && (
            <span className="rise-in inline-block">
              <StatusPill kind={settings.availabilityStatus === "available" ? "success" : "warning"}>
                {settings.availabilityText}
              </StatusPill>
            </span>
          )}
          <h1 className="rise-in rise-in-1 mt-7 max-w-4xl type-display">{settings?.heroOffer}</h1>
          <p className="rise-in rise-in-2 mt-6 text-muted-foreground type-body-lg">
            <bdi>{settings?.heroName}</bdi>. <bdi>{settings?.heroRole}</bdi>
          </p>
          <ul className="rise-in rise-in-3 mt-8 flex flex-wrap gap-x-6 gap-y-2">
            {proof.map((item) => (
              <li key={item.label}>
                {item.href.startsWith("/") ? (
                  <Link
                    href={item.href}
                    className="type-mono-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    href={item.href}
                    className="type-mono-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
                  >
                    {item.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
          <div className="rise-in rise-in-4 mt-9 flex flex-wrap gap-3">
            <Link href="/contact" className={btnPrimary}>
              {t("ctaPrimary")}
            </Link>
            <Link href="/projects" className={btnSecondary}>
              {t("ctaSecondary")}
            </Link>
          </div>
        </div>
      </section>

      {/* Selected work — the anchor case study leads, full row. */}
      <section className="border-t border-border-subtle" aria-labelledby="home-work">
        <div className="container-site py-16 md:py-24">
          <SectionHeader
            titleId="home-work"
            title={t("workTitle")}
            subtitle={t("workSubtitle")}
            meta={t("workMeta", { count: projects.length })}
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {projects.map((project, index) => (
              <CaseStudyCard
                key={project.slug}
                project={project}
                featured={index === 0}
                labels={{
                  caseStudy: projectsT("caseStudy"),
                  liveDemo: projectsT("liveDemo"),
                  sourceCode: projectsT("sourceCode"),
                  privateRepo: projectsT("privateRepo"),
                  stack: projectsT("stack"),
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Services — an index of engagements, not a card grid (ADR-0009). */}
      <section className="border-t border-border-subtle bg-surface" aria-labelledby="home-services">
        <div className="container-site py-16 md:py-24">
          <SectionHeader
            titleId="home-services"
            title={t("servicesTitle")}
            subtitle={t("servicesSubtitle")}
            meta={t("servicesMeta", { count: services.length })}
          />
          <ul className="mt-10 border-t border-border-subtle">
            {services.map((service) => (
              <li
                key={service.key}
                className="grid gap-3 border-b border-border-subtle py-8 md:grid-cols-[1fr_1.75fr] md:gap-10"
              >
                <h3 className="type-h3">{service.title}</h3>
                <div>
                  <p className="max-w-2xl text-muted-foreground">{service.summary}</p>
                  <Link href="/services" className={`mt-4 inline-flex ${externalLink} font-medium`}>
                    {t("servicesCta")}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How I work — a real sequence, set as a numbered process ledger. */}
      <section className="border-t border-border-subtle" aria-labelledby="home-how">
        <div className="container-site py-16 md:py-24">
          <SectionHeader titleId="home-how" title={t("howTitle")} subtitle={t("howSubtitle")} meta={t("howMeta")} />
          <ol className="mt-10 border-t border-border-subtle">
            {HOW_STEPS.map((step, index) => (
              <li
                key={step.titleKey}
                className="grid gap-1.5 border-b border-border-subtle py-7 md:grid-cols-[3rem_1fr_1.75fr] md:gap-10"
              >
                <span aria-hidden="true" className="type-mono-sm tabular-nums text-muted-foreground md:pt-1">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="type-h3">{howT(step.titleKey)}</h3>
                <p className="max-w-2xl text-muted-foreground type-body-sm md:pt-1">{howT(step.bodyKey)}</p>
              </li>
            ))}
          </ol>
          {/* Process transparency, never a quality promise (PRODUCT §7.4.1). */}
          <p className="mt-7 max-w-2xl text-muted-foreground type-body-sm">{howT("aiNote")}</p>
        </div>
      </section>

      {/* Open-source & security engineering — the honesty record, as a ledger. */}
      <section className="border-t border-border-subtle" aria-labelledby="home-oss">
        <div className="container-site py-16 md:py-24">
          <SectionHeader
            titleId="home-oss"
            title={t("credTitle")}
            subtitle={t("credSubtitle")}
            meta={t("ossMeta", { count: contributions.length })}
          />
          <ul className="mt-10 border-t border-border-subtle">
            {contributions.map((contribution) => (
              <OssContributionItem
                key={`${contribution.repo}-${contribution.number}`}
                contribution={contribution}
                labels={{
                  statusOf: (status) => {
                    if (status === "merged") return ossT("merged");
                    if (status === "acknowledged") return ossT("acknowledged");
                    return ossT("open");
                  },
                  verifiedOn: (date) => ossT("verifiedOn", { date }),
                }}
              />
            ))}
          </ul>
        </div>
      </section>

      {/* Verified credentials */}
      {credential && (
        <section className="border-t border-border-subtle" aria-labelledby="home-credentials">
          <div className="container-site py-16 md:py-24">
            <SectionHeader titleId="home-credentials" title={t("credentialsTitle")} />
            <div className="mt-10">
              <CredentialCard
                credential={credential}
                labels={{
                  recipient: credT("recipient"),
                  viewPdf: credT("viewPdf"),
                  downloadPdf: credT("downloadPdf"),
                  pdfNote: credT("pdfLinkNote"),
                }}
              />
            </div>
          </div>
        </section>
      )}

      {/* About preview */}
      <section className="border-t border-border-subtle" aria-labelledby="home-about">
        <div className="container-site py-16 md:py-24">
          <SectionHeader titleId="home-about" title={t("aboutTitle")} />
          <p className="mt-6 max-w-2xl type-body-lg">{t("aboutPreview")}</p>
          <Link href="/about" className={`mt-7 inline-flex font-medium ${externalLink}`}>
            {t("aboutCta")}
            <ForwardArrow />
          </Link>
        </div>
      </section>

      {/* Contact strip — the ending carries display weight, on a surface band. */}
      <section className="border-t border-border-subtle bg-surface" aria-labelledby="home-contact">
        <div className="container-site py-16 md:py-24">
          <h2 id="home-contact" className="max-w-3xl type-h1">
            {t("contactTitle")}
          </h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">{t("contactBody")}</p>
          {email && (
            <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3">
              <a href={`mailto:${email}`} className={btnPrimary}>
                {t("contactCta")}
              </a>
              <CopyEmailButton
                email={email}
                label={contactT("copyEmail")}
                copiedLabel={contactT("copied")}
                hintLabel={contactT("copyHint")}
                className="inline-flex min-h-11 items-center font-mono text-sm text-accent underline-offset-4 hover:underline"
              />
            </div>
          )}
        </div>
      </section>
    </>
  );
}
