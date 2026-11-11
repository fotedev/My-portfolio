import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { JsonLd } from "@/components/json-ld";
import { ForwardArrow } from "@/components/ui/arrows";
import { externalLink } from "@/components/ui/cta";
import { webPageJsonLd } from "@/lib/content/jsonld";
import { getServices } from "@/lib/content/queries";
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
  const t = await getTranslations({ locale, namespace: "services" });
  return routeMetadata({
    locale: toLocale(locale),
    path: "/services",
    title: t("title"),
    description: t("subtitle"),
  });
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-0.5 size-4 shrink-0 text-success"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) {
    notFound();
  }
  const locale: Locale = rawLocale;
  setRequestLocale(locale);
  const t = await getTranslations("services");
  const services = await getServices(locale);

  return (
    <div className="container-site py-16 md:py-24">
      <JsonLd
        data={webPageJsonLd({
          locale,
          path: "/services",
          title: t("title"),
          description: t("subtitle"),
        })}
      />
      <h1 className="type-h1">{t("title")}</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">{t("subtitle")}</p>

      {/* Deliverables-first index rows (ADR-0009): one engagement per row,
          what you get on the inline-end column. */}
      <ul className="mt-12 border-t border-border-subtle">
        {services.map((service) => (
          <li
            key={service.key}
            className="grid gap-4 border-b border-border-subtle py-10 md:grid-cols-[1fr_1.75fr] md:gap-10"
          >
            <h2 className="type-h3 md:pt-1">{service.title}</h2>
            <div>
              <p className="max-w-2xl text-muted-foreground">{service.summary}</p>
              <h3 className="mt-7 text-sm font-medium text-foreground">{t("deliverables")}</h3>
              <ul className="mt-3 max-w-2xl space-y-2">
                {service.deliverables.map((item) => (
                  <li key={item} className="flex gap-2 type-body-sm">
                    <CheckIcon />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/contact" className={`mt-8 inline-flex font-medium ${externalLink}`}>
                {t("cta")}
                <ForwardArrow />
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
