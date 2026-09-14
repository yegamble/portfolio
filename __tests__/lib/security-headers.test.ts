import { afterEach, describe, expect, it, vi } from 'vitest';
import { SECURITY_HEADERS, applySecurityHeaders } from '@/lib/security-headers';

/**
 * The header *values* are pinned by `__tests__/config/next-config.test.ts`
 * (every response Next produces) and `__tests__/proxy.test.ts` (the bare-domain
 * redirect). This file covers the module itself: the shape of the shared list,
 * the helper the proxy uses to copy it onto a response it builds by hand, and
 * the one value that depends on the environment.
 */

describe('SECURITY_HEADERS', () => {
  it('names each header once, so the two consumers cannot disagree with themselves', () => {
    const keys = SECURITY_HEADERS.map((header) => header.key);

    expect(new Set(keys).size).toBe(keys.length);
    expect(keys.every((key) => key.length > 0)).toBe(true);
  });

  it('does not carry the deprecated X-XSS-Protection header', () => {
    // Retired by every engine; where it still runs it has enabled attacks
    // rather than blocked them, so the right value is no header at all.
    expect(SECURITY_HEADERS.some((header) => header.key === 'X-XSS-Protection')).toBe(false);
  });

  it("does not ship 'unsafe-eval' outside development", () => {
    const csp = SECURITY_HEADERS.find((header) => header.key === 'Content-Security-Policy');

    expect(csp?.value).not.toContain("'unsafe-eval'");
    // openpgp's argon2 WASM needs this one, and it does not permit eval().
    expect(csp?.value).toContain("'wasm-unsafe-eval'");
  });
});

describe('applySecurityHeaders', () => {
  it('sets every shared header on the response and hands the same object back', () => {
    const response = new Response(null, { status: 307 });

    const returned = applySecurityHeaders(response);

    expect(returned).toBe(response);
    for (const { key, value } of SECURITY_HEADERS) {
      expect(response.headers.get(key)).toBe(value);
    }
  });

  it('overrides a weaker value that is already on the response', () => {
    const response = new Response(null, {
      headers: { 'X-Frame-Options': 'SAMEORIGIN', 'Referrer-Policy': 'unsafe-url' },
    });

    applySecurityHeaders(response);

    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
  });

  it('leaves headers it does not own alone', () => {
    const response = new Response(null, {
      headers: { Location: '/en', Vary: 'Accept-Language, Cookie' },
    });

    applySecurityHeaders(response);

    expect(response.headers.get('Location')).toBe('/en');
    expect(response.headers.get('Vary')).toBe('Accept-Language, Cookie');
  });
});

describe('in development', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("allows 'unsafe-eval', which only the dev overlay and Fast Refresh need", async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.resetModules();

    const { SECURITY_HEADERS: devHeaders } = await import('@/lib/security-headers');
    const csp = devHeaders.find((header) => header.key === 'Content-Security-Policy');

    expect(csp?.value).toContain("'unsafe-eval'");
  });
});
