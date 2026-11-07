import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/lib/i18n/routing";

const intlMiddleware = createMiddleware(routing);

const CANONICAL_HOSTS = new Set(["fotedev.me", "www.fotedev.me"]);

/**
 * Noindex rules (docs/SEO-I18N.md §7.3, extended per the GATE 2 review):
 * 1. /admin/* — always noindex (every environment).
 * 2. Non-production Vercel environments — every response.
 * 3. Non-canonical hosts — every response (preview deployments AND the
 *    interim fotedev-portfolio.vercel.app production URL, so nothing is
 *    indexable before the fotedev.me launch in M6).
 */
function needsNoIndex(request: NextRequest): boolean {
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv && vercelEnv !== "production") {
    return true;
  }
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "")
    .split(":")[0]
    ?.toLowerCase();
  return host !== undefined && !CANONICAL_HOSTS.has(host);
}

/**
 * Root proxy (Next 16 — former middleware.ts): next-intl locale
 * negotiation/redirects for public routes, plus Supabase Auth session refresh
 * and gating for /admin (English-only backoffice). Unauthenticated /admin/*
 * requests redirect to /admin/login.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    const response = NextResponse.next({ request });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            for (const { name, value } of cookiesToSet) {
              response.cookies.set(name, value);
            }
          },
        },
      },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && pathname !== "/admin/login") {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      return NextResponse.redirect(loginUrl);
    }

    // Belt and braces (SEO-I18N §7.3): header + admin layout meta.
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }

  const response = intlMiddleware(request);
  if (needsNoIndex(request)) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

export const config = {
  // Skip static assets, metadata routes (robots/sitemap), and the Supabase
  // auth callback; everything else passes through.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|auth|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)",
  ],
};
