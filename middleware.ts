import { NextResponse, type NextRequest } from 'next/server';
import {
  DEFAULT_LOCALE,
  getLocaleHref,
  isAppLocale,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_COOKIE_NAME,
  negotiateLocale,
  type AppLocale,
} from '@/lib/locales';

const PUBLIC_FILE = /\.[^/]+$/;

function getPathLocale(pathname: string): AppLocale | null {
  const localeSegment = pathname.split('/')[1];

  return isAppLocale(localeSegment) ? localeSegment : null;
}

function persistLocale(response: NextResponse, locale: AppLocale, request: NextRequest) {
  response.cookies.set(LOCALE_COOKIE_NAME, locale, {
    maxAge: LOCALE_COOKIE_MAX_AGE,
    path: '/',
    sameSite: 'lax',
    secure: request.nextUrl.protocol === 'https:',
  });
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/_next') || PUBLIC_FILE.test(pathname)) {
    return NextResponse.next();
  }

  const cookieLocale = request.cookies.get(LOCALE_COOKIE_NAME)?.value;
  const pathnameLocale = getPathLocale(pathname);

  if (pathnameLocale == null) {
    // A stored choice outranks the browser's list; without one, honour
    // Accept-Language before falling back to English, so a first-time Hebrew,
    // Russian or Estonian visitor is not pinned to `/en` for a year.
    const locale =
      (isAppLocale(cookieLocale) ? cookieLocale : null) ??
      negotiateLocale(request.headers.get('accept-language')) ??
      DEFAULT_LOCALE;
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname =
      pathname === '/' ? getLocaleHref(locale) : `${getLocaleHref(locale)}${pathname}`;

    const response = NextResponse.redirect(redirectUrl);
    persistLocale(response, locale, request);

    return response;
  }

  const response = NextResponse.next();

  // The URL is the source of truth, so a disagreeing cookie is corrected — but
  // only then. Re-setting an already-correct cookie puts a Set-Cookie on every
  // HTML response, which keeps a CDN from caching the prerendered page.
  if (cookieLocale !== pathnameLocale) {
    persistLocale(response, pathnameLocale, request);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
};
