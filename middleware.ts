import { NextResponse, type NextRequest } from 'next/server';
import {
  getLocaleHref,
  getPreferredLocale,
  isAppLocale,
  LOCALE_COOKIE_NAME,
  type AppLocale,
} from '@/lib/i18n';

const PUBLIC_FILE = /\.[^/]+$/;
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

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
    const locale = getPreferredLocale(request.cookies.get(LOCALE_COOKIE_NAME)?.value);
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = pathname === '/' ? getLocaleHref(locale) : `${getLocaleHref(locale)}${pathname}`;

    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set(LOCALE_COOKIE_NAME, locale, {
      maxAge: ONE_YEAR_IN_SECONDS,
      path: '/',
      sameSite: 'lax',
    });

    return response;
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-locale', pathnameLocale);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.cookies.set(LOCALE_COOKIE_NAME, pathnameLocale, {
    maxAge: ONE_YEAR_IN_SECONDS,
    path: '/',
    sameSite: 'lax',
  });

  return response;
}

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
};
