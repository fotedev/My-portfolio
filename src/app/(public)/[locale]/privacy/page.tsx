import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isLocale, toLocale, type Locale } from "@/lib/i18n/routing";
import { routeMetadata } from "@/lib/seo";

// On-demand ISR (prompt-6 §4 / ARCHITECTURE §5.1): no time-based revalidation —
// admin publishes revalidate these paths explicitly via revalidatePath.
export const revalidate = false;

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "privacy" });
  return routeMetadata({
    locale: toLocale(locale),
    path: "/privacy",
    title: t("title"),
    description: t("introBody"),
  });
}

const SECTIONS = [
  { titleKey: "introTitle", bodyKey: "introBody" },
  { titleKey: "currentTitle", bodyKey: "currentBody" },
  { titleKey: "hostingTitle", bodyKey: "hostingBody" },
  { titleKey: "formTitle", bodyKey: "formBody" },
  { titleKey: "deletionTitle", bodyKey: "deletionBody" },
  { titleKey: "questionsTitle", bodyKey: "questionsBody" },
] as const;

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) {
    notFound();
  }
  const locale: Locale = rawLocale;
  setRequestLocale(locale);
  const t = await getTranslations("privacy");

  return (
    <div className="container-site py-16 md:py-20">
      <div className="container-reading">
        <h1 className="type-h1">{t("title")}</h1>
        <p className="mt-2 type-caption text-muted-foreground">{t("updated")}</p>

        {SECTIONS.map((section) => (
          <section key={section.titleKey} className="mt-8">
            <h2 className="type-h3">{t(section.titleKey)}</h2>
            <p className="mt-2 type-body">{t(section.bodyKey)}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
