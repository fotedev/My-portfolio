import type { Locale } from "@/lib/i18n/routing";
import { localeUrl } from "@/lib/seo";

/**
 * JSON-LD builders (docs/SEO-I18N.md §8) — serialized facts only, all
 * cross-checked against docs/CONTENT-EVIDENCE.md. Nothing unverified.
 */

/** Verbatim program names as printed on the certificate PDF (bilingual print). */
const CERT_NAME_EN = "1 MILLION PROMPTERS";
const CERT_NAME_AR = "مليون خيّر لأوامر الذكاء الاصطناعي";
const CERT_PROOF_URL = "https://dub.ai/omp";

export function personJsonLd(opts: { sameAs: string[]; locale: Locale }): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Ahmed Aboalayoun",
    alternateName: "fotedev",
    url: localeUrl("en"),
    jobTitle: "Full-Stack AI Engineer",
    knowsLanguage: ["en", "ar"],
    sameAs: opts.sameAs,
    hasCredential: {
      "@type": "EducationalOccupationalCredential",
      name: opts.locale === "ar" ? CERT_NAME_AR : CERT_NAME_EN,
      url: CERT_PROOF_URL,
      credentialCategory: "certification",
    },
  };
}

export function professionalServiceJsonLd(opts: {
  description: string;
  email: string;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "fotedev",
    url: localeUrl("en"),
    description: opts.description,
    email: opts.email,
    areaServed: ["Egypt", "Gulf states", "International"],
    knowsLanguage: ["en", "ar"],
    founder: { "@type": "Person", name: "Ahmed Aboalayoun" },
  };
}
