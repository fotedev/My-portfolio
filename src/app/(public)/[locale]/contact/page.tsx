import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="mt-4 text-muted-foreground">{t("body")}</p>
      <p className="mt-6">
        <span className="font-medium">{t("emailLabel")}: </span>
        <a href="mailto:fote.engineer@gmail.com" className="text-accent underline">
          fote.engineer@gmail.com
        </a>
      </p>
    </div>
  );
}
