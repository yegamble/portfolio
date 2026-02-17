import { describe, expect, it } from 'vitest';
import nextConfig from '../../next.config';

describe('next.config security headers', () => {
  it('includes CSP and legacy XSS protection headers', async () => {
    expect(nextConfig.headers).toBeTypeOf('function');

    const routes = await nextConfig.headers!();
    expect(routes).toHaveLength(1);

    const routeHeaders = routes[0].headers;
    const headerValues = new Map(routeHeaders.map((header) => [header.key, header.value]));

    expect(headerValues.get('X-XSS-Protection')).toBe('1; mode=block');

    const csp = headerValues.get('Content-Security-Policy');
    expect(csp).toBeTruthy();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
  });
});
