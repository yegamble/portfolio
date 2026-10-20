// Response security headers, in one place because they have two consumers with
// different reach:
//
//   * `next.config.ts` `headers()` covers every response the Next server
//     produces — including, verified on Cloudflare, the prerendered HTML that
//     OpenNext's cache interception serves without running the React render.
//   * `src/proxy.ts` runs BEFORE that layer and short-circuits the bare-domain
//     redirect, so `/` -> `/en` would otherwise go out with nothing but
//     Location, Set-Cookie and Vary. HSTS preload requires the redirect itself
//     to carry `Strict-Transport-Security`, so the proxy re-applies this list.
//
// Static assets are served by the Workers ASSETS binding before either of those
// run and are covered by `public/_headers` instead.
//
// Zero imports, like `@/lib/locales`: this is pulled into the edge bundle.

interface SecurityHeader {
  readonly key: string;
  readonly value: string;
}

const isDevelopment = process.env.NODE_ENV === 'development';

// `'wasm-unsafe-eval'` is what openpgp's argon2 WASM needs; it does not permit
// `eval()`. Only the dev overlay and Fast Refresh need the full `'unsafe-eval'`,
// so production never ships it.
//
// The Cloudflare Web Analytics beacon is injected by the zone, not by this app,
// which is why its origin has to be allow-listed: `static.cloudflareinsights.com`
// serves `beacon.min.js` and the RUM payload is posted to `/cdn-cgi/rum` on this
// origin, with `cloudflareinsights.com` as the cross-origin fallback.
//
// Google Analytics 4 (loaded by src/lib/analytics.ts after `load`) needs the
// hosts Google documents for Analytics without Ads features
// (https://developers.google.com/tag-platform/security/guides/csp): gtag.js
// from www.googletagmanager.com, hits to *.google-analytics.com (including the
// region1. endpoints) and *.google.com, and the image-pixel fallback. Ads
// features stay off in the tag config, so no doubleclick or per-TLD
// google.<tld> hosts are needed.
//
// `'unsafe-inline'` stays: the prerendered documents carry Next's inline
// bootstrap and the two JSON-LD blocks, and a nonce would have to be minted per
// request, which is exactly what makes a route dynamic.
const scriptSrc = [
  "'self'",
  "'unsafe-inline'",
  "'wasm-unsafe-eval'",
  'https://static.cloudflareinsights.com',
  'https://www.googletagmanager.com',
  ...(isDevelopment ? ["'unsafe-eval'"] : []),
];

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  `script-src ${scriptSrc.join(' ')}`,
  "style-src 'self' 'unsafe-inline'",
  // Every image this site renders is same-origin; `data:`/`blob:` cover inline
  // SVG placeholders and canvas output. The Google hosts are GA's pixel fallback.
  "img-src 'self' data: blob: https://www.googletagmanager.com https://*.google-analytics.com",
  "font-src 'self' data:",
  "connect-src 'self' https://cloudflareinsights.com https://www.googletagmanager.com https://*.google-analytics.com https://*.google.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

export const SECURITY_HEADERS: readonly SecurityHeader[] = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Content-Security-Policy', value: CONTENT_SECURITY_POLICY },
];

/** Copy the shared header set onto a response the proxy builds itself. */
export function applySecurityHeaders<T extends { headers: Headers }>(response: T): T {
  for (const { key, value } of SECURITY_HEADERS) {
    response.headers.set(key, value);
  }

  return response;
}
