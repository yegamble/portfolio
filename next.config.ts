import type { NextConfig } from 'next';
// Relative, not `@/lib/...`: Next's config loader does not apply tsconfig paths.
import { SECURITY_HEADERS } from './src/lib/security-headers';

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
    ];
  },
};

export default nextConfig;
