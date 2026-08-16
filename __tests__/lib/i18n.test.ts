import { beforeEach, describe, it, expect } from 'vitest';
import i18n, { isAppLocale, getDirection, getLocaleHref } from '@/lib/i18n';

describe('i18n initialization', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('exports an initialized i18next instance', () => {
    expect(i18n.isInitialized).toBe(true);
  });

  it('uses English as the default language', () => {
    expect(i18n.options.lng).toBe('en');
    expect(i18n.language).toBe('en');
  });

  it('uses English as the fallback language', () => {
    const fallbackLng = i18n.options.fallbackLng;
    if (Array.isArray(fallbackLng)) {
      expect(fallbackLng).toContain('en');
      return;
    }
    expect(fallbackLng).toBe('en');
  });

  it('registers English, Hebrew, Russian, and Estonian translation resources', () => {
    expect(i18n.hasResourceBundle('en', 'translation')).toBe(true);
    expect(i18n.hasResourceBundle('he', 'translation')).toBe(true);
    expect(i18n.hasResourceBundle('ru', 'translation')).toBe(true);
    expect(i18n.hasResourceBundle('et', 'translation')).toBe(true);
  });

  it('leaves interpolation unescaped so React can handle escaping at render time', () => {
    // i18next by default uses {{ }} for interpolation
    // We add a temporary resource for testing
    i18n.addResource('en', 'translation', 'security_test', 'Hello {{name}}');

    const result = i18n.t('security_test', { name: '<script>alert("xss")</script>' });
    expect(result).toBe('Hello <script>alert("xss")</script>');
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
