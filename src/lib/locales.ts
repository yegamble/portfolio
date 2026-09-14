// Locale primitives with zero imports. `src/proxy.ts` runs in the edge bundle
// and only needs these helpers; keeping them out of `src/lib/i18n.ts` (which
// pulls in i18next, react-i18next and all four translation JSONs at module
// scope) keeps ~120 KB of unused translation payload out of the edge bundle.
// `src/lib/i18n.ts` re-exports everything here, so `@/lib/i18n` imports keep
// working.

/**
 * Canonical origin. Every absolute URL the site emits — canonical links,
 * hreflang alternates, Open Graph, JSON-LD, robots and the sitemap — is built
 * from this, so there is one place to change if the domain ever moves. No
 * trailing slash: callers concatenate paths that start with one.
 */
export const SITE_URL = 'https://yosefgamble.com';

export const LOCALES = ['en', 'he', 'ru', 'et'] as const;
export type AppLocale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = 'en';
export const LOCALE_COOKIE_NAME = 'locale';
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const RTL_LOCALES = new Set<AppLocale>(['he']);
const LOCALE_SET = new Set<AppLocale>(LOCALES);

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return value != null && LOCALE_SET.has(value as AppLocale);
}

export function getDirection(locale: AppLocale | string): 'ltr' | 'rtl' {
  return RTL_LOCALES.has(locale as AppLocale) ? 'rtl' : 'ltr';
}

export function getLocaleHref(locale: AppLocale) {
  return `/${locale}`;
}

export function getLocalizedPathname(pathname: string | null | undefined, locale: AppLocale) {
  const normalizedPathname =
    pathname == null || pathname === ''
      ? getLocaleHref(locale)
      : pathname.startsWith('/')
        ? pathname
        : `/${pathname}`;
  const segments = normalizedPathname.split('/');

  if (isAppLocale(segments[1])) {
    segments[1] = locale;
  } else {
    segments.splice(1, 0, locale);
  }

  return segments.join('/').replace(/\/{2,}/g, '/');
}

export function getPreferredLocale(cookieLocale?: string | null): AppLocale {
  return isAppLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;
}

/**
 * Pick the visitor's best supported language from an `Accept-Language` header.
 *
 * Highest q-value wins and ties keep header order, so a browser sending
 * `he-IL,he;q=0.9,en;q=0.5` lands on Hebrew rather than the default. Matching is
 * on the primary subtag (`ru-RU` -> `ru`). Per RFC 9110 a `q` of 0 means "not
 * acceptable", and a malformed `q` is treated the same way, so both drop the
 * entry. Returns `null` when nothing supported is requested — the caller decides
 * the fallback.
 */
export function negotiateLocale(acceptLanguage: string | null | undefined): AppLocale | null {
  if (acceptLanguage == null) return null;

  let best: AppLocale | null = null;
  let bestQuality = 0;

  for (const part of acceptLanguage.split(',')) {
    const [rawTag, ...parameters] = part.split(';');
    const tag = rawTag.trim().toLowerCase();
    if (tag === '' || tag === '*') continue;

    const primarySubtag = tag.split('-')[0];
    if (!isAppLocale(primarySubtag)) continue;

    let qualityParameter: string | undefined;
    for (const parameter of parameters) {
      const p = parameter.trim().toLowerCase();
      if (p.startsWith('q=')) {
        qualityParameter = p;
        break;
      }
    }
    const quality =
      qualityParameter == null ? 1 : Number.parseFloat(qualityParameter.slice('q='.length));

    if (!Number.isFinite(quality) || quality <= 0) continue;
    // Strictly greater keeps the first of equal-quality entries, which is the
    // order the browser listed them in.
    if (quality > bestQuality) {
      best = primarySubtag;
      bestQuality = quality;
    }
  }

  return best;
}
