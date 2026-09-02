import { describe, expect, it } from 'vitest';
import nextConfig from '../../next.config';

const EXPECTED_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https:",
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
  'X-XSS-Protection': '1; mode=block',
  'Content-Security-Policy': EXPECTED_CSP,
};

async function getRouteHeaders(source: string): Promise<Record<string, string>> {
  expect(nextConfig.headers).toBeTypeOf('function');

  const routes = await nextConfig.headers!();
  const route = routes.find((entry) => entry.source === source);

  expect(route).toBeDefined();

  return Object.fromEntries(route!.headers.map((header) => [header.key, header.value]));
}

describe('next.config security headers', () => {
  it('should apply exactly the expected security headers to every route', async () => {
    const headers = await getRouteHeaders('/:path*');

    expect(headers).toEqual(EXPECTED_SECURITY_HEADERS);
  });

  it('should register a single header rule covering all paths', async () => {
    const routes = await nextConfig.headers!();

    expect(routes).toHaveLength(1);
    expect(routes[0].source).toBe('/:path*');
  });

  it.each(Object.entries(EXPECTED_SECURITY_HEADERS))(
    'should send %s with its exact production value',
    async (key, value) => {
      const headers = await getRouteHeaders('/:path*');

      expect(headers[key]).toBe(value);
    }
  );
});
