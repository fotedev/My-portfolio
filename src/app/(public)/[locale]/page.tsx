import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CaseStudyCard } from "@/components/case-study-card";
import { CopyEmailButton } from "@/components/copy-email-button";
import { CredentialCard } from "@/components/credential-card";
import { JsonLd } from "@/components/json-ld";
import { Reveal } from "@/components/motion";
import { OssContributionItem } from "@/components/oss-contributions";
import { StatusPill } from "@/components/status-pill";
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

export const revalidate = 3600;

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
] as const;

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
  const aboutT = await getTranslations("about");
  const contactT = await getTranslations("contact");

  const [settings, projects, services, contributions, credential] = await Promise.all([
    getSiteSettings(locale),
    getFeaturedProjects(locale),
    getServices(locale),
    getContributions(locale),
    getPublishedCredential(locale),
  ]);

  const proof = [t("proofAi"), t("proofOss"), t("proofSecurity"), t("proofCert")];
  const email = settings?.contactEmail;

  return (
    <>
      <JsonLd data={personJsonLd({ sameAs: settings?.socials.map((s) => s.url) ?? [], locale })} />
      {settings && (
        <JsonLd
          data={professionalServiceJsonLd({ description: settings.heroOffer, email: settings.contactEmail })}
        />
      )}

      {/* Hero — the offer is the thesis (DESIGN §1); wash is the only gradient */}
      <section className="hero-wash border-b border-border-subtle">
        <div className="container-site py-20 md:py-28">
          {settings && (
            <StatusPill kind={settings.availabilityStatus === "available" ? "success" : "warning"}>
              {settings.availabilityText}
            </StatusPill>
          )}
          <h1 className="mt-6 max-w-3xl type-display">{settings?.heroOffer}</h1>
          <p className="mt-4 text-muted-foreground type-body-lg">
            <bdi>{settings?.heroName}</bdi> · <bdi>{settings?.heroRole}</bdi>
          </p>
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
            {proof.map((line) => (
              <li key={line} className="text-muted-foreground type-body-sm">
                {line}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/contact" className={btnPrimary}>
              {t("ctaPrimary")}
            </Link>
            <Link href="/projects" className={btnSecondary}>
              {t("ctaSecondary")}
            </Link>
          </div>
        </div>
      </section>

      {/* Selected work */}
      <section className="container-site py-16 md:py-20" aria-labelledby="home-work">
        <Reveal>
          <h2 id="home-work" className="type-h2">
            {t("workTitle")}
          </h2>
          <p className="mt-2 text-muted-foreground">{t("workSubtitle")}</p>
        </Reveal>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => (
            <Reveal key={project.slug} delay={Math.min(index, 2) * 0.04}>
              <CaseStudyCard
                project={project}
                labels={{
                  caseStudy: projectsT("caseStudy"),
                  liveDemo: projectsT("liveDemo"),
                  sourceCode: projectsT("sourceCode"),
                  privateRepo: projectsT("privateRepo"),
                  stack: projectsT("stack"),
                }}
              />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="container-site py-16 md:py-20" aria-labelledby="home-services">
        <Reveal>
          <h2 id="home-services" className="type-h2">
            {t("servicesTitle")}
          </h2>
          <p className="mt-2 text-muted-foreground">{t("servicesSubtitle")}</p>
        </Reveal>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {services.map((service, index) => (
            <Reveal key={service.key} delay={Math.min(index, 2) * 0.04}>
              <article className="flex h-full flex-col rounded-xl border border-border-subtle bg-surface p-6 transition-colors duration-150 hover:border-accent/45">
                <h3 className="type-h3">{service.title}</h3>
                <p className="mt-2 text-muted-foreground type-body-sm">{service.summary}</p>
                <Link
                  href="/services"
                  className={`mt-auto pt-4 ${externalLink}`}
                >
                  {t("servicesCta")}
                </Link>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How I work — numbered: it is a real sequence (spec → slices → gates → handover) */}
      <section className="container-site py-16 md:py-20" aria-labelledby="home-how">
        <Reveal>
          <h2 id="home-how" className="type-h2">
            {t("howTitle")}
          </h2>
          <p className="mt-2 text-muted-foreground">{t("howSubtitle")}</p>
        </Reveal>
        <ol className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {HOW_STEPS.map((step, index) => (
            <li key={step.titleKey} className="rounded-xl border border-border-subtle bg-surface p-6">
              <span
                aria-hidden="true"
                className="flex size-8 items-center justify-center rounded-full bg-accent-subtle font-mono text-sm text-accent"
              >
                {index + 1}
              </span>
              <h3 className="mt-3 type-h3">{howT(step.titleKey)}</h3>
              <p className="mt-2 text-muted-foreground type-body-sm">{howT(step.bodyKey)}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Open-source & security engineering — the honesty record */}
      <section className="container-site py-16 md:py-20" aria-labelledby="home-oss">
        <Reveal>
          <h2 id="home-oss" className="type-h2">
            {t("credTitle")}
          </h2>
          <p className="mt-2 max-w-3xl text-muted-foreground">{t("credSubtitle")}</p>
        </Reveal>
        <ul className="mt-8 grid gap-6 lg:grid-cols-2">
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
                viewOnGithub: ossT("viewOnGithub"),
                verifiedOn: (date) => ossT("verifiedOn", { date }),
              }}
            />
          ))}
        </ul>
      </section>

      {/* Verified credentials */}
      {credential && (
        <section className="container-site py-16 md:py-20" aria-labelledby="home-credentials">
          <Reveal>
            <h2 id="home-credentials" className="type-h2">
              {t("credentialsTitle")}
            </h2>
          </Reveal>
          <div className="mt-8">
            <CredentialCard
              credential={credential}
              labels={{
                eyebrow: aboutT("certTitle"),
                recipient: credT("recipient"),
                viewPdf: credT("viewPdf"),
                downloadPdf: credT("downloadPdf"),
                pdfNote: credT("pdfLinkNote"),
              }}
            />
          </div>
        </section>
      )}

      {/* About preview */}
      <section className="container-site py-16 md:py-20" aria-labelledby="home-about">
        <Reveal>
          <h2 id="home-about" className="type-h2">
            {t("aboutTitle")}
          </h2>
          <p className="mt-4 max-w-3xl type-body-lg">{t("aboutPreview")}</p>
          <Link href="/about" className={`mt-6 inline-flex ${externalLink} font-medium`}>
            {t("aboutCta")}
            <span aria-hidden="true">→</span>
          </Link>
        </Reveal>
      </section>

      {/* Contact strip — direct email is always visible */}
      <section className="border-t border-border-subtle" aria-labelledby="home-contact">
        <div className="container-site py-16 md:py-20">
          <Reveal>
            <h2 id="home-contact" className="type-h2">
              {t("contactTitle")}
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">{t("contactBody")}</p>
            {email && (
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a href={`mailto:${email}`} className={btnPrimary}>
                  {t("contactCta")}
                </a>
                <a
                  href={`mailto:${email}`}
                  dir="ltr"
                  className="inline-flex min-h-11 items-center font-mono text-sm text-accent underline-offset-4 hover:underline"
                >
                  {email}
                </a>
                <CopyEmailButton
                  email={email}
                  label={contactT("copyEmail")}
                  copiedLabel={contactT("copied")}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-border-strong px-4 text-muted-foreground transition-colors duration-150 hover:text-foreground"
                />
              </div>
            )}
          </Reveal>
        </div>
      </section>
    </>
  );
}
