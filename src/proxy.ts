import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/lib/i18n/routing";

const intlMiddleware = createMiddleware(routing);

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

    return response;
  }

  return intlMiddleware(request);
}

export const config = {
  // Skip static assets, metadata routes (robots/sitemap), and the Supabase
  // auth callback; everything else passes through.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|auth|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)",
  ],
};
