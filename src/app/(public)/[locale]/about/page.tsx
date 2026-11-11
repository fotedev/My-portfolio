import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CredentialCard } from "@/components/credential-card";
import { JsonLd } from "@/components/json-ld";
import { OssContributionItem } from "@/components/oss-contributions";
import { btnPrimary } from "@/components/ui/cta";
import { personJsonLd } from "@/lib/content/jsonld";
import { getContributions, getPublishedCredential, getSiteSettings } from "@/lib/content/queries";
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
  const t = await getTranslations({ locale, namespace: "about" });
  return routeMetadata({
    locale: toLocale(locale),
    path: "/about",
    title: t("title"),
    description: t("intro1"),
  });
}

const ARSENAL = [
  { labelKey: "arsenalAiLabel", itemsKey: "arsenalAiItems" },
  { labelKey: "arsenalFrontendLabel", itemsKey: "arsenalFrontendItems" },
  { labelKey: "arsenalBackendLabel", itemsKey: "arsenalBackendItems" },
  { labelKey: "arsenalDevopsLabel", itemsKey: "arsenalDevopsItems" },
] as const;

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) {
    notFound();
  }
  const locale: Locale = rawLocale;
  setRequestLocale(locale);
  const t = await getTranslations("about");
  const ossT = await getTranslations("oss");
  const credT = await getTranslations("credential");
  const contactT = await getTranslations("contact");

  const [settings, contributions, credential] = await Promise.all([
    getSiteSettings(locale),
    getContributions(locale),
    getPublishedCredential(locale),
  ]);

  return (
    <>
      <JsonLd data={personJsonLd({ sameAs: settings?.socials.map((s) => s.url) ?? [], locale })} />

      <div className="container-site py-16 md:py-24">
        <div className="container-reading">
          <h1 className="type-h1">{t("title")}</h1>
          <p className="mt-6 type-body-lg">{t("intro1")}</p>
          <p className="mt-4 type-body">{t("intro2")}</p>

          <section className="mt-14" aria-labelledby="about-factory">
            <h2 id="about-factory" className="type-h2">
              {t("factoryTitle")}
            </h2>
            <p className="mt-3 type-body">{t("factoryBody")}</p>
          </section>

          <section className="mt-14" aria-labelledby="about-arsenal">
            <h2 id="about-arsenal" className="type-h2">
              {t("arsenalTitle")}
            </h2>
            <dl className="mt-6 border-t border-border-subtle">
              {ARSENAL.map((group) => (
                <div
                  key={group.labelKey}
                  className="grid gap-1 border-b border-border-subtle py-5 md:grid-cols-[10rem_1fr] md:gap-6"
                >
                  <dt className="text-sm font-medium">{t(group.labelKey)}</dt>
                  <dd className="text-muted-foreground type-body-sm">{t(group.itemsKey)}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <section className="mt-14" aria-labelledby="about-oss">
          <div className="container-reading">
            <h2 id="about-oss" className="type-h2">
              {t("ossTitle")}
            </h2>
            <p className="mt-3 type-body">{t("ossBody")}</p>
          </div>
          <ul className="mt-8 border-t border-border-subtle">
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
        </section>

        {credential && (
          <section className="mt-14" aria-labelledby="about-cert">
            <div className="container-reading">
              <h2 id="about-cert" className="type-h2">
                {t("certTitle")}
              </h2>
              <p className="mt-3 type-body">{t("certBody")}</p>
            </div>
            <div className="container-reading mt-8">
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
          </section>
        )}

        <div className="container-reading mt-14 border-t border-border-subtle pt-10">
          {settings && (
            <Link href="/contact" className={btnPrimary}>
              {contactT("title")}
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
