import { beforeEach, describe, it, expect } from 'vitest';
import i18n, { getLocaleMessages, isAppLocale, LOCALES } from '@/lib/i18n';

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

    const result = i18n.t('security_test', {
      name: '<script>alert("xss")</script>',
    });
    expect(result).toBe('Hello <script>alert("xss")</script>');
  });
});

describe('getLocaleMessages', () => {
  it('returns the bundled messages for every locale', () => {
    LOCALES.forEach((locale) => {
      const messages = getLocaleMessages(locale);
      expect(typeof messages.meta.title).toBe('string');
      expect(typeof messages.notFound.title).toBe('string');
      expect(typeof messages.error.title).toBe('string');
    });
  });
});

describe('locale helper re-exports', () => {
  it('keeps the @/lib/i18n import path working for the shared helpers', () => {
    expect(isAppLocale('he')).toBe(true);
    expect(LOCALES).toEqual(['en', 'he', 'ru', 'et']);
  });
});
