import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 md:py-24">
      <p className="mb-4 inline-block rounded-full border border-border-subtle px-3 py-1 text-sm text-muted-foreground">
        {t("badge")}
      </p>
      <h1 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">{t("title")}</h1>
      <p className="mt-4 text-base text-muted-foreground md:text-lg">{t("subtitle")}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/contact"
          className="min-h-11 rounded-md bg-accent-strong px-5 py-2.5 font-medium text-white transition-colors duration-200 hover:opacity-90"
        >
          {t("ctaPrimary")}
        </Link>
        <Link
          href="/projects"
          className="min-h-11 rounded-md border border-border-subtle px-5 py-2.5 font-medium transition-colors duration-200 hover:bg-surface"
        >
          {t("ctaSecondary")}
        </Link>
      </div>
      <section className="mt-16 rounded-lg border border-border-subtle bg-surface p-6">
        <h2 className="text-lg font-semibold">{t("placeholderTitle")}</h2>
        <p className="mt-2 text-muted-foreground">{t("placeholderBody")}</p>
      </section>
    </div>
  );
}
