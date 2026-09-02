import type { MetadataRoute } from 'next';

// Served at /manifest.webmanifest. Deliberately not localized: a manifest is
// one document per origin, and the locale routes each link to this same file.
// `start_url: '/'` lets the proxy pick the language the way a first visit does,
// rather than pinning an installed shortcut to English forever.
export default function manifest(): MetadataRoute.Manifest {
  return {
    // A stable identity for the installed app: without it the id defaults to
    // start_url, so changing that would register a second, unrelated app.
    id: '/',
    name: 'Yosef Gamble',
    short_name: 'Y. Gamble',
    description: 'Yosef Gamble — Senior Software Engineer',
    start_url: '/',
    display: 'standalone',
    // `--color-bg-dark` in globals.css, matching the icon plate and the
    // themeColor the locale layout sets.
    background_color: '#0f172a',
    theme_color: '#0f172a',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      // Chrome's install prompt wants 192 and 512; the SVG alone is not enough.
      // These live in public/icons rather than beside src/app/icon.svg, because
      // Next turns every icon file in the app directory into another
      // <link rel="icon"> in the document head.
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      // Cropped to whatever shape the launcher wants, so the mark is drawn at
      // 60% on a full-bleed plate and cannot be clipped. Without a maskable
      // entry Android letterboxes the "any" icon inside a white circle.
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
