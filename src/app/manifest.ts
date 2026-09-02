import type { MetadataRoute } from 'next';

// Served at /manifest.webmanifest. Deliberately not localized: a manifest is
// one document per origin, and the locale routes each link to this same file.
// `start_url: '/'` lets the proxy pick the language the way a first visit does,
// rather than pinning an installed shortcut to English forever.
export default function manifest(): MetadataRoute.Manifest {
  return {
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
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
