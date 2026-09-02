import { afterEach, describe, it, expect } from 'vitest';
import {
  DEFAULT_LOCALE,
  getDirection,
  getLocaleHref,
  getLocalizedPathname,
  getPreferredLocale,
  isAppLocale,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_COOKIE_NAME,
  LOCALES,
  negotiateLocale,
  readCookieLocale,
} from '@/lib/locales';

describe('locale constants', () => {
  it('lists every supported locale with English as the default', () => {
    expect(LOCALES).toEqual(['en', 'he', 'ru', 'et']);
    expect(DEFAULT_LOCALE).toBe('en');
  });

  it('names the locale cookie and gives it a one-year lifetime', () => {
    expect(LOCALE_COOKIE_NAME).toBe('locale');
    expect(LOCALE_COOKIE_MAX_AGE).toBe(60 * 60 * 24 * 365);
  });
});

describe('isAppLocale', () => {
  it('returns true for valid locales', () => {
    expect(isAppLocale('en')).toBe(true);
    expect(isAppLocale('he')).toBe(true);
    expect(isAppLocale('ru')).toBe(true);
    expect(isAppLocale('et')).toBe(true);
  });

  it('returns false for invalid strings', () => {
    expect(isAppLocale('fr')).toBe(false);
    expect(isAppLocale('es')).toBe(false);
    expect(isAppLocale('')).toBe(false);
    expect(isAppLocale('EN')).toBe(false); // Case sensitive
  });

  it('returns false for null or undefined', () => {
    expect(isAppLocale(null)).toBe(false);
    expect(isAppLocale(undefined)).toBe(false);
  });
});

describe('getDirection', () => {
  it('returns rtl for Hebrew (he)', () => {
    expect(getDirection('he')).toBe('rtl');
  });

  it('returns ltr for other supported locales', () => {
    expect(getDirection('en')).toBe('ltr');
    expect(getDirection('ru')).toBe('ltr');
    expect(getDirection('et')).toBe('ltr');
  });

  it('returns ltr for unsupported string inputs', () => {
    expect(getDirection('fr')).toBe('ltr');
    expect(getDirection('ar')).toBe('ltr'); // Although Arabic is RTL, it's not supported so it defaults to ltr
    expect(getDirection('')).toBe('ltr');
  });
});

describe('getLocaleHref', () => {
  it('prepends a slash to valid AppLocale inputs', () => {
    expect(getLocaleHref('en')).toBe('/en');
    expect(getLocaleHref('he')).toBe('/he');
    expect(getLocaleHref('ru')).toBe('/ru');
    expect(getLocaleHref('et')).toBe('/et');
  });
});

describe('getLocalizedPathname', () => {
  it('swaps an existing locale segment for the requested one', () => {
    expect(getLocalizedPathname('/en/about', 'he')).toBe('/he/about');
    expect(getLocalizedPathname('/ru', 'et')).toBe('/et');
  });

  it('inserts the locale when the path has none', () => {
    expect(getLocalizedPathname('/about', 'ru')).toBe('/ru/about');
    expect(getLocalizedPathname('about', 'ru')).toBe('/ru/about');
  });

  it('falls back to the bare locale href for empty input', () => {
    expect(getLocalizedPathname(null, 'he')).toBe('/he');
    expect(getLocalizedPathname(undefined, 'he')).toBe('/he');
    expect(getLocalizedPathname('', 'he')).toBe('/he');
  });

  it('keeps a lone slash as a trailing slash after the locale', () => {
    // The root path never reaches the selector (the proxy redirects it), so
    // the trailing slash is harmless — pinned here so the behaviour is explicit.
    expect(getLocalizedPathname('/', 'he')).toBe('/he/');
  });

  it('collapses repeated slashes', () => {
    expect(getLocalizedPathname('//about', 'en')).toBe('/en/about');
  });
});

describe('getPreferredLocale', () => {
  it('returns the cookie locale when it is supported', () => {
    expect(getPreferredLocale('he')).toBe('he');
  });

  it('falls back to the default locale for anything else', () => {
    expect(getPreferredLocale('fr')).toBe('en');
    expect(getPreferredLocale(null)).toBe('en');
    expect(getPreferredLocale(undefined)).toBe('en');
  });
});

describe('readCookieLocale', () => {
  afterEach(() => {
    document.cookie = `${LOCALE_COOKIE_NAME}=; Path=/; Max-Age=0`;
  });

  it('reads a stored locale from document.cookie', () => {
    document.cookie = `${LOCALE_COOKIE_NAME}=ru; Path=/`;
    expect(readCookieLocale()).toBe('ru');
  });

  it('falls back to the default locale when the cookie is absent', () => {
    expect(readCookieLocale()).toBe('en');
  });

  it('falls back to the default locale when the cookie is unsupported', () => {
    document.cookie = `${LOCALE_COOKIE_NAME}=fr; Path=/`;
    expect(readCookieLocale()).toBe('en');
  });
});

describe('negotiateLocale', () => {
  it('picks the highest-quality supported language', () => {
    expect(negotiateLocale('he-IL,he;q=0.9,en;q=0.5')).toBe('he');
    expect(negotiateLocale('en;q=0.3,et;q=0.8')).toBe('et');
  });

  it('matches on the primary subtag of a region-qualified tag', () => {
    expect(negotiateLocale('ru-RU')).toBe('ru');
    expect(negotiateLocale('en-GB,en-US;q=0.9')).toBe('en');
  });

  it('ignores unsupported languages', () => {
    expect(negotiateLocale('fr')).toBeNull();
    expect(negotiateLocale('fr-FR,de;q=0.9,*;q=0.1')).toBeNull();
  });

  it('returns null for an empty or missing header', () => {
    expect(negotiateLocale('')).toBeNull();
    expect(negotiateLocale('   ')).toBeNull();
    expect(negotiateLocale(null)).toBeNull();
    expect(negotiateLocale(undefined)).toBeNull();
  });

  it('treats a malformed or zero quality value as unacceptable', () => {
    expect(negotiateLocale('he;q=abc,en;q=0.5')).toBe('en');
    expect(negotiateLocale('he;q=0')).toBeNull();
    expect(negotiateLocale('he;q=abc')).toBeNull();
  });

  it('breaks quality ties by header order', () => {
    expect(negotiateLocale('ru,et')).toBe('ru');
    expect(negotiateLocale('et;q=0.8,ru;q=0.8')).toBe('et');
  });

  it('tolerates whitespace and casing', () => {
    expect(negotiateLocale(' HE-il , en ; q=0.4 ')).toBe('he');
  });
});
