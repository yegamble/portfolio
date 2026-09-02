import type { NextConfig } from 'next';
// Relative, not `@/lib/...`: Next's config loader does not apply tsconfig paths.
import { SECURITY_HEADERS } from './src/lib/security-headers';

// Icons change only when `scripts/process-images.mjs` is re-run, and Next links
// them with a content hash in the query, so a day of caching costs nothing and
// saves a request on every repeat visit. `/favicon.ico` is a Workers asset
// rather than a route, so its rule lives in `public/_headers`.
const ICON_ROUTES = ['/icon.svg', '/apple-icon.png'];
const ICON_CACHE_CONTROL = 'public, max-age=86400, stale-while-revalidate=604800';

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
  // `SECURITY_HEADERS` is the single source of truth and is shared with
  // `src/proxy.ts`, which re-applies it to the bare-domain redirect this layer
  // never sees. Verified with `wrangler dev` against a populated cache: `/en`
  // returns the full set on the `x-opennext-cache: HIT` response. Static assets
  // are served by the ASSETS binding before the Worker runs, so their headers
  // live in `public/_headers`.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [...SECURITY_HEADERS],
      },
      ...ICON_ROUTES.map((source) => ({
        source,
        headers: [{ key: 'Cache-Control', value: ICON_CACHE_CONTROL }],
      })),
    ];
  },
};

export default nextConfig;
