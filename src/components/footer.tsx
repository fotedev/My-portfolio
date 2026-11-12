import { useTranslations } from "next-intl";
import { CopyEmailButton } from "@/components/copy-email-button";
import { ThemeReset } from "@/components/theme-reset";
import { brandIcons } from "@/components/ui/brand-icons";
import type { SiteSettings } from "@/lib/content/queries";
import { Link } from "@/lib/i18n/navigation";

const footerPages = [
  { href: "/projects", key: "projects" },
  { href: "/services", key: "services" },
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
  { href: "/privacy", key: "privacy" },
] as const;

const socialLabels: Record<string, string> = {
  github: "GitHub",
  linkedin: "LinkedIn",
  x: "X (Twitter)",
  telegram: "Telegram",
  youtube: "YouTube",
  facebook: "Facebook",
  instagram: "Instagram",
};

/**
 * Footer (DESIGN §10.7): identity + offer, page links, connect column with the
 * click-to-copy email and brand-icon social links (owner request, 2026-11-11 —
 * icons replace the text list; aria-labels carry the names). No badge walls,
 * no stat widgets.
 */
export function Footer({ settings }: { settings: SiteSettings | null }) {
  const t = useTranslations("footer");
  const navT = useTranslations("nav");
  const year = new Date().getFullYear();
  const email = settings?.contactEmail;

  return (
    <footer className="border-t border-border-subtle">
      <div className="container-site grid gap-10 py-12 md:grid-cols-3">
        <div>
          <p className="font-mono font-medium text-foreground">fotedev</p>
          <p className="mt-2 max-w-xs text-muted-foreground type-body-sm">{t("tagline")}</p>
        </div>

        <nav aria-label={t("navLabel")}>
          <h2 className="text-sm font-medium text-foreground">{t("pagesLabel")}</h2>
          <ul className="mt-3 space-y-1">
            {footerPages.map((page) => (
              <li key={page.href}>
                <Link
                  href={page.href}
                  className="inline-flex min-h-11 items-center text-muted-foreground transition-colors duration-150 hover:text-foreground type-body-sm"
                >
                  {navT(page.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-medium text-foreground">{t("connectLabel")}</h2>
          {email && (
            <CopyEmailButton
              email={email}
              label={t("copyEmail")}
              copiedLabel={t("copied")}
              hintLabel={t("copyHint")}
              className="mt-3 inline-flex min-h-11 items-center font-mono text-sm text-accent underline-offset-4 transition-colors duration-150 hover:underline"
            />
          )}
          {settings && settings.socials.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-x-1 gap-y-1">
              {settings.socials.map((social) => {
                const name = socialLabels[social.platform] ?? social.platform;
                const icon = brandIcons[social.platform];
                return (
                  <li key={social.platform}>
                    <a
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={name}
                      title={name}
                      className={
                        icon
                          ? "inline-flex size-11 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-surface hover:text-foreground"
                          : "inline-flex min-h-11 items-center text-muted-foreground transition-colors duration-150 hover:text-foreground type-body-sm"
                      }
                    >
                      {icon ? (
                        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-current">
                          <path d={icon.path} />
                        </svg>
                      ) : (
                        <span className="type-body-sm">{name}</span>
                      )}
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mt-3">
            <ThemeReset label={t("useSystemTheme")} />
          </div>
        </div>
      </div>

      <div className="container-site border-t border-border-subtle py-6">
        <p className="text-muted-foreground type-body-sm">{t("rights", { year })}</p>
        <p className="mt-1 text-muted-foreground type-body-sm">{t("builtWith")}</p>
      </div>
    </footer>
  );
}
