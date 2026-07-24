import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  resolveLocale,
  SUPPORTED_LOCALES,
  type Locale,
} from "@/lib/locale/resolve";
import { NextResponse, type NextRequest } from "next/server";

function isLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/**
 * Single middleware — handles BOTH locale routing AND admin auth.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── ADMIN AUTH ──────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    // Allow /admin/login without session check
    if (pathname === "/admin/login" || pathname.startsWith("/admin/login?")) {
      return NextResponse.next();
    }
    // Check session cookie for all other /admin/* routes
    const sessionToken = request.cookies.get("admin_session")?.value;
    if (!sessionToken) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  // Skip API, auth, static files — NO locale prefix
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/auth") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const segments = pathname.split("/").filter(Boolean);

  // Already locale-prefixed — just refresh cookie
  if (segments.length > 0 && isLocale(segments[0])) {
    const response = NextResponse.next();
    response.cookies.set(LOCALE_COOKIE, segments[0], {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return response;
  }

  // Root path → redirect to default locale
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = `/${DEFAULT_LOCALE}`;
    const response = NextResponse.redirect(url);
    response.cookies.set(LOCALE_COOKIE, DEFAULT_LOCALE, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return response;
  }

  // Other non-locale paths → no redirect, let it pass through
  // (e.g., /robots.txt, /sitemap.xml, etc.)
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
