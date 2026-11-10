import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Footer } from "@/components/footer";
import { MotionProvider } from "@/components/motion";
import { Navbar } from "@/components/navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { getSiteSettings } from "@/lib/content/queries";
import { fontVariables } from "@/lib/fonts";
import { routing, toLocale } from "@/lib/i18n/routing";
import { routeMetadata } from "@/lib/seo";
import "../../globals.css";

export function generateStaticParams(): Array<{ locale: string }> {
  return routing.locales.map((locale) => ({ locale }));
}

// Unknown locale prefixes (e.g. /fr) must 404 immediately — without this they
// fell into generateMetadata with an invalid locale and returned HTTP 500
// (observed as /favicon.ico → 500 before the app favicon existed; M6 SEO audit).
export const dynamicParams = false;

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://fotedev.me"),
    // Home uses absolute titles; all other routes use the localized template.
    title: {
      default: t("siteName"),
      template: t("titleTemplate", { title: "%s" }),
    },
    description: t("description"),
    ...routeMetadata({ locale: toLocale(locale), path: "", description: t("description") }),
  };
}

/**
 * Root layout of the public site (route-group root). Renders <html lang dir>
 * per locale — EN LTR default, AR full RTL. Static per locale; footer socials
 * and contact email come from site_settings (ISR-cached).
 */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const dir = locale === "ar" ? "rtl" : "ltr";
  const settings = await getSiteSettings(locale);

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className={fontVariables}>
        <ThemeProvider>
          <NextIntlClientProvider>
            <MotionProvider>
              <a href="#content" className="skip-link">
                {locale === "ar" ? "تخطَّ إلى المحتوى" : "Skip to content"}
              </a>
              <Navbar />
              <main id="content" className="min-h-dvh">
                {children}
              </main>
              <Footer settings={settings} />
            </MotionProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
