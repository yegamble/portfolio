import type { NextConfig } from 'next';

const isDevelopment = process.env.NODE_ENV === 'development';

// `'wasm-unsafe-eval'` is what openpgp's argon2 WASM needs; it does not permit
// `eval()`. Only the dev overlay and Fast Refresh need the full `'unsafe-eval'`,
// so production never ships it.
//
// The Cloudflare Web Analytics beacon is injected by the zone, not by this app,
// which is why its origin has to be allow-listed: `static.cloudflareinsights.com`
// serves `beacon.min.js` and the RUM payload is posted to `/cdn-cgi/rum` on this
// origin, with `cloudflareinsights.com` as the cross-origin fallback.
const scriptSrc = [
  "'self'",
  "'unsafe-inline'",
  "'wasm-unsafe-eval'",
  'https://static.cloudflareinsights.com',
  ...(isDevelopment ? ["'unsafe-eval'"] : []),
];

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src ${scriptSrc.join(' ')}`,
  "style-src 'self' 'unsafe-inline'",
  // Every image this site renders is same-origin; `data:`/`blob:` cover inline
  // SVG placeholders and canvas output.
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://cloudflareinsights.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  poweredByHeader: false,
  reactStrictMode: true,
  // `next dev` otherwise writes AGENTS.md and CLAUDE.md into the project root,
  // where a root CLAUDE.md silently becomes agent instructions for this repo.
  agentRules: false,
  // There is no IMAGES binding on this deployment, so `/_next/image` is a
  // pass-through: it returns the source bytes with no Cache-Control after an
  // extra Worker hop. Serving the files directly is strictly better.
  images: {
    unoptimized: true,
  },
  compiler: {
    removeConsole: {
      exclude: ['error', 'warn'],
    },
  },
  experimental: {
    optimizePackageImports: ['react-i18next', 'i18next'],
    // Serves `app/global-not-found.tsx` for unmatched paths, which renders its
    // own <html lang/dir> and <title> instead of Next's __next_error__ shell.
    globalNotFound: true,
  },
  // These are the single source of truth for HTML response headers. They do
  // survive the Cloudflare deployment: verified with `wrangler dev` against a
  // populated cache, `/en` returns them on the `x-opennext-cache: HIT`
  // response, so the proxy does not need to re-apply them. Static assets are
  // served by the ASSETS binding before the Worker runs and are covered by
  // `public/_headers` instead.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: contentSecurityPolicy,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
