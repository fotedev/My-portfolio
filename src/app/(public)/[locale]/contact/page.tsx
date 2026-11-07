import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CopyEmailButton } from "@/components/copy-email-button";
import { JsonLd } from "@/components/json-ld";
import { btnPrimary, btnSecondary } from "@/components/ui/cta";
import { professionalServiceJsonLd } from "@/lib/content/jsonld";
import { getSiteSettings } from "@/lib/content/queries";
import { isLocale, toLocale, type Locale } from "@/lib/i18n/routing";
import { routeMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return routeMetadata({
    locale: toLocale(locale),
    path: "/contact",
    title: t("title"),
    description: t("body"),
  });
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) {
    notFound();
  }
  const locale: Locale = rawLocale;
  setRequestLocale(locale);
  const t = await getTranslations("contact");
  const settings = await getSiteSettings(locale);
  const email = settings?.contactEmail;

  return (
    <>
      {settings && (
        <JsonLd
          data={professionalServiceJsonLd({ description: settings.heroOffer, email: settings.contactEmail })}
        />
      )}

      <div className="container-site py-16 md:py-20">
        <div className="container-reading">
          <h1 className="type-h1">{t("title")}</h1>
          <p className="mt-4 type-body-lg">{t("body")}</p>

          {email && (
            <div className="mt-8 rounded-xl border border-border-subtle bg-surface p-6">
              <p className="type-caption text-muted-foreground">{t("emailLabel")}</p>
              <a
                href={`mailto:${email}`}
                dir="ltr"
                className="mt-2 inline-flex min-h-11 items-center font-mono text-lg text-accent underline-offset-4 hover:underline"
              >
                {email}
              </a>
              <div className="mt-4 flex flex-wrap gap-3">
                <a href={`mailto:${email}`} className={btnPrimary}>
                  {t("mailto")}
                </a>
                <CopyEmailButton
                  email={email}
                  label={t("copyEmail")}
                  copiedLabel={t("copied")}
                  className={btnSecondary}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
