import { beforeEach, describe, it, expect } from 'vitest';
import i18n from '@/lib/i18n';

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

  it('registers English and Hebrew translation resources', () => {
    expect(i18n.hasResourceBundle('en', 'translation')).toBe(true);
    expect(i18n.hasResourceBundle('he', 'translation')).toBe(true);
  });

  it('escapes HTML special characters in interpolated values', () => {
    // i18next by default uses {{ }} for interpolation
    // We add a temporary resource for testing
    i18n.addResource('en', 'translation', 'security_test', 'Hello {{name}}');

    const result = i18n.t('security_test', { name: '<script>alert("xss")</script>' });
    expect(result).toBe('Hello &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });
});
