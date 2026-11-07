import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-border-subtle">
      <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-muted-foreground">
        <p>{t("rights")}</p>
        <p className="mt-1">{t("builtWith")}</p>
      </div>
    </footer>
  );
}
