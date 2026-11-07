import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { fontVariables } from "@/lib/fonts";
import { routing } from "@/lib/i18n/routing";
import "../../globals.css";

export function generateStaticParams(): Array<{ locale: string }> {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const titleTemplate = t("titleTemplate", { title: "%s" });

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://fotedev.me"),
    title: {
      default: t("siteName"),
      // e.g. "Projects · fotedev"
      template: titleTemplate.replace("%s", "%s"),
    },
    description: t("description"),
  };
}

/**
 * Root layout of the public site (route-group root). Renders <html lang dir>
 * per locale — EN LTR default, AR full RTL (prompt-3 §4). Static per locale.
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

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className={fontVariables}>
        <ThemeProvider>
          <NextIntlClientProvider>
            <a href="#content" className="skip-link">
              {locale === "ar" ? "تخطَّ إلى المحتوى" : "Skip to content"}
            </a>
            <Navbar />
            <main id="content" className="min-h-dvh">
              {children}
            </main>
            <Footer />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
