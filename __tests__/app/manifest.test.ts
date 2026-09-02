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

  it('keeps a stable id so changing start_url cannot register a second app', () => {
    expect(manifest().id).toBe('/');
  });

  it('offers the scalable icon plus the raster sizes Chrome installs from', () => {
    expect(manifest().icons).toEqual([
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ]);
  });

  // Without one, Android letterboxes the "any" icon inside a white circle.
  it('includes a maskable icon for adaptive launcher shapes', () => {
    expect(manifest().icons?.some((icon) => icon.purpose === 'maskable')).toBe(true);
  });
});
