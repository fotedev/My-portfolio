import { useTranslations } from "next-intl";
import { btnPrimary } from "@/components/ui/cta";
import { Link } from "@/lib/i18n/navigation";

/** Localized 404 (rendered inside the [locale] layout, so the provider exists). */
export default function NotFound() {
  const t = useTranslations("notFound");

  return (
    <div className="container-site py-24">
      <div className="container-reading">
        <h1 className="type-h1">{t("title")}</h1>
        <p className="mt-3 text-muted-foreground type-body-lg">{t("body")}</p>
        <Link href="/" className={`mt-8 ${btnPrimary}`}>
          {t("backHome")}
        </Link>
      </div>
    </div>
  );
}
