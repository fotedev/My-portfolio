import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";

export default function NotFoundPage() {
  const t = useTranslations("notFound");

  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="mt-4 text-muted-foreground">{t("body")}</p>
      <Link href="/" className="mt-8 inline-block min-h-11 rounded-md border border-border-subtle px-5 py-2.5">
        {t("backHome")}
      </Link>
    </div>
  );
}
