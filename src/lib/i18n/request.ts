import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing, type Locale } from "./routing";

// Static imports — Turbopack must resolve every module statically (no
// template-literal dynamic import).
const messageModules = {
  en: async () => (await import("../../../messages/en.json")).default,
  ar: async () => (await import("../../../messages/ar.json")).default,
} satisfies Record<Locale, () => Promise<object>>;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: await messageModules[locale](),
  };
});
