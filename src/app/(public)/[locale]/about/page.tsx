import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="mt-4 text-muted-foreground">{t("body")}</p>
    </div>
  );
}
