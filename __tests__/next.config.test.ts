import { describe, it, expect } from 'vitest';
import nextConfig from '../next.config';

describe('next.config.ts headers', () => {
  it('should have the Strict-Transport-Security header', async () => {
    if (typeof nextConfig.headers !== 'function') {
      throw new Error('nextConfig.headers is not a function');
    }

    const headers = await nextConfig.headers();
    const securityHeaders = headers.find((h: any) => h.source === '/:path*');

    expect(securityHeaders).toBeDefined();

    const hstsHeader = securityHeaders?.headers.find(
      (h: any) => h.key === 'Strict-Transport-Security'
    );

    expect(hstsHeader).toBeDefined();
    expect(hstsHeader?.value).toBe('max-age=63072000; includeSubDomains; preload');
  });

  it('should have other security headers', async () => {
    if (typeof nextConfig.headers !== 'function') {
      throw new Error('nextConfig.headers is not a function');
    }

    const headers = await nextConfig.headers();
    const securityHeaders = headers.find((h: any) => h.source === '/:path*');

    expect(securityHeaders).toBeDefined();

    const expectedHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    ];

    expectedHeaders.forEach((expected) => {
      const header = securityHeaders?.headers.find((h: any) => h.key === expected.key);
      expect(header).toBeDefined();
      expect(header?.value).toBe(expected.value);
    });
  });
});
