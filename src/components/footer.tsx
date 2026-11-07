import { useTranslations } from "next-intl";
import { CopyEmailButton } from "@/components/copy-email-button";
import { ThemeReset } from "@/components/theme-reset";
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
 * copy-email button and verified socials. No badge walls, no stat widgets.
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
          <p className="font-semibold text-foreground">fotedev</p>
          <p className="mt-2 max-w-xs text-muted-foreground type-body-sm">{t("tagline")}</p>
        </div>

        <nav aria-label={t("navLabel")}>
          <h2 className="type-caption text-muted-foreground">{t("pagesLabel")}</h2>
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
          <h2 className="type-caption text-muted-foreground">{t("connectLabel")}</h2>
          {email && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <a
                href={`mailto:${email}`}
                dir="ltr"
                className="inline-flex min-h-11 items-center font-mono text-xs text-accent underline-offset-4 hover:underline"
              >
                {email}
              </a>
              <CopyEmailButton
                email={email}
                label={t("copyEmail")}
                copiedLabel={t("copied")}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-border-subtle bg-surface px-3 text-muted-foreground transition-colors duration-150 hover:text-foreground"
              />
            </div>
          )}
          {settings && settings.socials.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              {settings.socials.map((social) => (
                <li key={social.platform}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center text-muted-foreground transition-colors duration-150 hover:text-foreground type-body-sm"
                  >
                    {socialLabels[social.platform] ?? social.platform}
                    <span aria-hidden="true" className="ms-1 text-xs">
                      ↗
                    </span>
                  </a>
                </li>
              ))}
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
