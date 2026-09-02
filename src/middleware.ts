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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/_next') || PUBLIC_FILE.test(pathname)) {
    return NextResponse.next();
  }

  const pathnameLocale = getPathLocale(pathname);

  if (pathnameLocale == null) {
    // A stored choice outranks the browser's list; without one, honour
    // Accept-Language before falling back to English, so a first-time Hebrew,
    // Russian or Estonian visitor is not pinned to `/en` for a year.
    const cookieLocale = request.cookies.get(LOCALE_COOKIE_NAME)?.value;
    const locale =
      (isAppLocale(cookieLocale) ? cookieLocale : null) ??
      negotiateLocale(request.headers.get('accept-language')) ??
      DEFAULT_LOCALE;
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname =
      pathname === '/' ? getLocaleHref(locale) : `${getLocaleHref(locale)}${pathname}`;

    // This redirect is the ONLY place the middleware writes the cookie. The
    // other writer is an explicit language selection in the browser
    // (I18nProvider's languageChanged handler) — a locale in the URL is not a
    // choice, it is where a link happened to point.
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set(LOCALE_COOKIE_NAME, locale, {
      maxAge: LOCALE_COOKIE_MAX_AGE,
      path: '/',
      sameSite: 'lax',
      secure: request.nextUrl.protocol === 'https:',
    });
    // The target is derived from the cookie and the header, so a shared cache
    // must not hand one visitor's redirect to the next.
    response.headers.set('Vary', 'Accept-Language, Cookie');

    return response;
  }

  // A localized path is served as-is and gets no Set-Cookie: a visitor who
  // chose Hebrew and follows an `/en` link from a CV sees English without
  // losing their stored `he`. HTML responses therefore stay cacheable.
  //
  // The locale travels as a REQUEST header instead. Only `global-not-found.tsx`
  // reads it (a 404 has no `locale` route param to read); the prerendered
  // locale routes take their locale from `params` and never call `headers()`,
  // so injecting this does not make them dynamic.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-locale', pathnameLocale);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
};
