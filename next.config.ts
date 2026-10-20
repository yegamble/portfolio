import type { NextConfig } from 'next';
// Relative, not `@/lib/...`: Next's config loader does not apply tsconfig paths.
import { SECURITY_HEADERS } from './src/lib/security-headers';

// Icons change only when `scripts/process-images.mjs` is re-run, and Next links
// them with a content hash in the query, so a day of caching costs nothing and
// saves a request on every repeat visit. `/favicon.ico` is a Workers asset
// rather than a route, so its rule lives in `public/_headers`.
const ICON_ROUTES = ['/icon.svg', '/apple-icon.png'];
const ICON_CACHE_CONTROL = 'public, max-age=86400, stale-while-revalidate=604800';

// The two generated metadata documents. Both are routes rather than assets, and
// both otherwise go out under the framework default of
// `public, max-age=0, must-revalidate`, so every visit re-fetches a file that
// changes when the locale list or `LAST_MODIFIED` does — i.e. rarely. An hour is
// short enough that a crawler sees a real edit the same day, and the day of
// stale-while-revalidate keeps the refetch off the request that noticed.
const METADATA_ROUTES = ['/manifest.webmanifest', '/sitemap.xml'];
const METADATA_CACHE_CONTROL = 'public, max-age=3600, stale-while-revalidate=86400';

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
  // Every app-router page loads Next's polyfill module: `app-globals.js`
  // requires `../build/polyfills/polyfill-module`. Nine of its ten polyfills
  // are for built-ins that every browser Next 16 compiles for already has (the
  // default targets are Chrome/Edge 111, Firefox 111 and Safari 16.4, and this
  // repo sets no browserslist), so they ship 1.4 KB that never runs and get the
  // runtime chunk flagged as legacy JavaScript by Lighthouse. The stand-in keeps
  // the tenth, `URL.canParse`, which those targets predate.
  //
  // The key is the request exactly as Next writes it. Turbopack matches aliases
  // against the request string: `next/dist/build/polyfills/polyfill-module` and
  // the file's absolute path both match nothing, and an alias that matches
  // nothing is ignored without a word. `__tests__/config/next-config.test.ts`
  // therefore pins the import, the module's contents and the targets, and the CI
  // `build` job greps the emitted chunks. When a Next upgrade trips one of
  // those, re-check every polyfill in the new module against the targets before
  // touching the expectations.
  turbopack: {
    resolveAlias: {
      '../build/polyfills/polyfill-module': './src/lib/polyfill-module.ts',
    },
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
    // `inlineCss` was measured and left off (2026-10-20). It removes the
    // render-blocking <link>, but Next also serializes the CSS into the RSC
    // payload, so /en goes from 11.6 to 29.3 KB gzip, the [locale] layout's
    // prefetch segment outgrows prefetch inlining's 2 KB cap into a request of
    // its own, repeat visits lose the immutable stylesheet, and Lighthouse's
    // simulated FCP/LCP did not improve (the bigger document costs a round trip).
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
      ...METADATA_ROUTES.map((source) => ({
        source,
        headers: [{ key: 'Cache-Control', value: METADATA_CACHE_CONTROL }],
      })),
    ];
  },
};

export default nextConfig;
