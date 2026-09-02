import { afterEach, describe, expect, it, vi } from 'vitest';
import type { NextConfig } from 'next';
import nextConfig from '../../next.config';

const PRODUCTION_SCRIPT_SRC =
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://static.cloudflareinsights.com";

const EXPECTED_CSP = [
  "default-src 'self'",
  PRODUCTION_SCRIPT_SRC,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://cloudflareinsights.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

/** The complete set of security headers `next.config.ts` applies to `/:path*`. */
const EXPECTED_SECURITY_HEADERS: Readonly<Record<string, string>> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Content-Security-Policy': EXPECTED_CSP,
};

async function headerMap(config: NextConfig): Promise<Record<string, string>> {
  const routes = await config.headers!();
  const route = routes.find((entry) => entry.source === '/:path*');

  expect(route).toBeDefined();

  return Object.fromEntries(route!.headers.map((header) => [header.key, header.value]));
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('next.config security headers', () => {
  it('should apply exactly the expected security headers to every route', async () => {
    expect(nextConfig.headers).toBeTypeOf('function');
    expect(await headerMap(nextConfig)).toEqual(EXPECTED_SECURITY_HEADERS);
  });

  it('should apply the security set through one rule covering all paths', async () => {
    const routes = await nextConfig.headers!();

    expect(routes[0].source).toBe('/:path*');
  });

  it('should not send the deprecated X-XSS-Protection header', async () => {
    expect(await headerMap(nextConfig)).not.toHaveProperty('X-XSS-Protection');
  });

  it('should allow the Cloudflare Web Analytics beacon to load and report', async () => {
    const csp = (await headerMap(nextConfig))['Content-Security-Policy'];

    expect(csp).toContain('https://static.cloudflareinsights.com');
    expect(csp).toContain("connect-src 'self' https://cloudflareinsights.com");
  });

  it("should allow openpgp's WASM without allowing eval in production", async () => {
    const csp = (await headerMap(nextConfig))['Content-Security-Policy'];

    expect(csp).toContain("'wasm-unsafe-eval'");
    expect(csp).not.toContain("'unsafe-eval'");
  });

  it('should relax script-src with unsafe-eval only while developing', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.resetModules();

    const devConfig = (await import('../../next.config')).default;
    const csp = (await headerMap(devConfig))['Content-Security-Policy'];

    expect(csp).toContain(`${PRODUCTION_SCRIPT_SRC} 'unsafe-eval'`);
  });
});

describe('next.config cache headers', () => {
  it('should cache the icon routes for a day', async () => {
    const routes = await nextConfig.headers!();

    ['/icon.svg', '/apple-icon.png'].forEach((source) => {
      const route = routes.find((entry) => entry.source === source);

      expect(route?.headers).toEqual([
        { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
      ]);
    });
  });

  // /favicon.ico is a Workers asset, not a route: the ASSETS binding answers it
  // before the Worker runs, so its rule has to live in public/_headers.
  it('should leave /favicon.ico to public/_headers', async () => {
    const routes = await nextConfig.headers!();

    expect(routes.find((entry) => entry.source === '/favicon.ico')).toBeUndefined();
  });

  // Both are generated routes, so they would otherwise go out under the
  // framework default of `max-age=0, must-revalidate` and be re-fetched on every
  // visit for a document that changes when the locale list does.
  it('should cache the generated metadata documents for an hour', async () => {
    const routes = await nextConfig.headers!();

    ['/manifest.webmanifest', '/sitemap.xml'].forEach((source) => {
      const route = routes.find((entry) => entry.source === source);

      expect(route?.headers).toEqual([
        { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
      ]);
    });
  });
});

describe('next.config build options', () => {
  it('should not let next dev write agent rule files into the project root', () => {
    expect(nextConfig.agentRules).toBe(false);
  });

  it('should skip the image optimizer, which is a pass-through on Cloudflare', () => {
    expect(nextConfig.images?.unoptimized).toBe(true);
  });
});
