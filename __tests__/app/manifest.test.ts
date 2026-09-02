import { describe, it, expect } from 'vitest';
import manifest from '@/app/manifest';

const THEME = '#0f172a';

describe('manifest', () => {
  it('names the app for the installed-shortcut label', () => {
    const result = manifest();

    expect(result.name).toBe('Yosef Gamble');
    expect(result.short_name).toBe('Y. Gamble');
  });

  it('installs as a standalone app on the dark theme colour', () => {
    const result = manifest();

    expect(result.display).toBe('standalone');
    expect(result.background_color).toBe(THEME);
    expect(result.theme_color).toBe(THEME);
  });

  it('starts at the root so the proxy still negotiates the language', () => {
    expect(manifest().start_url).toBe('/');
  });

  it('offers a scalable icon and the Apple touch icon', () => {
    expect(manifest().icons).toEqual([
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ]);
  });
});
