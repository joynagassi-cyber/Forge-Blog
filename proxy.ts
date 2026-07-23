import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  resolveLocale,
  SUPPORTED_LOCALES,
  type Locale,
} from "@/lib/locale/resolve";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_FILE = /\.(.*)$/;

function isLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/**
 * Next.js 16 proxy — replaces middleware.ts.
 * Handles locale prefix routing for public pages.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/auth") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];

  // Already locale-prefixed
  if (first && isLocale(first)) {
    const response = NextResponse.next();
    // Refresh cookie from URL signal so it sticks
    response.cookies.set(LOCALE_COOKIE, first, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return response;
  }

  // Resolve locale server-side (section 8.2)
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const acceptLanguage = request.headers.get("accept-language");
  const geoCountry =
    request.headers.get("cf-ipcountry");

  const { locale } = resolveLocale({
    explicitChoice: cookieLocale,
    urlLocale: null,
    acceptLanguage,
    geoCountry,
  });

  const url = request.nextUrl.clone();
  url.pathname =
    pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;

  const response = NextResponse.redirect(url);
  response.cookies.set(LOCALE_COOKIE, locale ?? DEFAULT_LOCALE, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
