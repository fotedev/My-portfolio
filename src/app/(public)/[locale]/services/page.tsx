import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Reveal } from "@/components/motion";
import { btnSecondary } from "@/components/ui/cta";
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
    <div className="container-site py-16 md:py-20">
      <h1 className="type-h1">{t("title")}</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">{t("subtitle")}</p>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {services.map((service, index) => (
          <Reveal key={service.key} delay={Math.min(index, 2) * 0.04}>
            <article className="flex h-full flex-col rounded-xl border border-border-subtle bg-surface p-6">
              <h2 className="type-h3">{service.title}</h2>
              <p className="mt-2 text-muted-foreground type-body-sm">{service.summary}</p>
              <h3 className="mt-6 type-caption text-muted-foreground">{t("deliverables")}</h3>
              <ul className="mt-3 space-y-2">
                {service.deliverables.map((item) => (
                  <li key={item} className="flex gap-2 type-body-sm">
                    <CheckIcon />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/contact" className={`mt-auto pt-6 ${btnSecondary}`}>
                {t("cta")}
              </Link>
            </article>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
