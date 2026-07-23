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
 * Locale routing middleware.
 * Handles prefixing locale (/en, /fr) for public pages.
 *
 * IMPORTANT: auth/* and admin/* routes are NEVER locale-prefixed.
 * They live at the root level (app/auth/, app/admin/).
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip ALL non-public routes — these are NOT locale-prefixed
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/auth") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const segments = pathname.split("/").filter(Boolean);

  // If already prefixed, just refresh cookie — do NOT double-prefix
  if (segments.length > 0 && isLocale(segments[0])) {
    return NextResponse.next();
  }

  // Resolve locale to redirect to
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const acceptLanguage = request.headers.get("accept-language");
  const geoCountry = request.headers.get("cf-ipcountry");

  const { locale } = resolveLocale({
    explicitChoice: cookieLocale,
    urlLocale: null,
    acceptLanguage,
    geoCountry,
  });

  // Only redirect root path to locale — skip everything else to avoid double-prefix
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}`;

    const response = NextResponse.redirect(url);
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return response;
  }

  // Not root and not prefixed — this shouldn't normally happen
  // but handle it gracefully: treat as if user hit a non-locale route
  // Actually we should redirect to locale-prefixed version
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname}`;

  const response = NextResponse.redirect(url);
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
