import { describe, it, expect } from 'vitest';
import { proxy } from '@/proxy';
import { NextRequest } from 'next/server';
import { SECURITY_HEADERS } from '@/lib/security-headers';

describe('proxy (locale routing)', () => {
  describe('bypass', () => {
    it('should pass through /_next requests', () => {
      const req = new NextRequest('http://localhost:3000/_next/static/chunk.js');
      const res = proxy(req);
      expect(res.headers.get('x-middleware-next')).toBe('1');
      expect(res.headers.get('set-cookie')).toBeNull();
    });

    it('should pass through public files', () => {
      const req = new NextRequest('http://localhost:3000/favicon.ico');
      const res = proxy(req);
      expect(res.headers.get('x-middleware-next')).toBe('1');
      expect(res.headers.get('set-cookie')).toBeNull();
    });
  });

  describe('locale-less paths', () => {
    it('should redirect to the default locale with no cookie and no Accept-Language', () => {
      const req = new NextRequest('http://localhost:3000/about');
      const res = proxy(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/en/about');
      expect(res.cookies.get('locale')?.value).toBe('en');
    });

    it('should redirect the root path to the default locale', () => {
      const req = new NextRequest('http://localhost:3000/');
      const res = proxy(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/en');
      expect(res.cookies.get('locale')?.value).toBe('en');
    });

    it('should redirect to the locale stored in the cookie', () => {
      const req = new NextRequest('http://localhost:3000/projects', {
        headers: { cookie: 'locale=he' },
      });
      const res = proxy(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/he/projects');
      expect(res.cookies.get('locale')?.value).toBe('he');
    });

    it('should negotiate the locale from Accept-Language when there is no cookie', () => {
      const req = new NextRequest('http://localhost:3000/', {
        headers: { 'accept-language': 'he-IL,he;q=0.9,en;q=0.5' },
      });
      const res = proxy(req);

      expect(res.headers.get('location')).toBe('http://localhost:3000/he');
      expect(res.cookies.get('locale')?.value).toBe('he');
    });

    it('should ignore an Accept-Language header with no supported language', () => {
      const req = new NextRequest('http://localhost:3000/', {
        headers: { 'accept-language': 'fr-FR,de;q=0.8' },
      });
      const res = proxy(req);

      expect(res.headers.get('location')).toBe('http://localhost:3000/en');
    });

    it('should prefer the cookie over Accept-Language', () => {
      const req = new NextRequest('http://localhost:3000/', {
        headers: { cookie: 'locale=ru', 'accept-language': 'he-IL,he;q=0.9' },
      });
      const res = proxy(req);

      expect(res.headers.get('location')).toBe('http://localhost:3000/ru');
    });

    it('should fall through to Accept-Language when the cookie is not a supported locale', () => {
      const req = new NextRequest('http://localhost:3000/', {
        headers: { cookie: 'locale=fr', 'accept-language': 'et;q=0.9' },
      });
      const res = proxy(req);

      expect(res.headers.get('location')).toBe('http://localhost:3000/et');
      expect(res.cookies.get('locale')?.value).toBe('et');
    });

    it('should fall back to the default locale when the cookie is unsupported and no header is sent', () => {
      const req = new NextRequest('http://localhost:3000/', {
        headers: { cookie: 'locale=fr' },
      });
      const res = proxy(req);

      expect(res.headers.get('location')).toBe('http://localhost:3000/en');
      expect(res.cookies.get('locale')?.value).toBe('en');
    });

    it('should not mistake a path that merely starts with locale letters for a locale', () => {
      const req = new NextRequest('http://localhost:3000/english');
      const res = proxy(req);

      expect(res.headers.get('location')).toBe('http://localhost:3000/en/english');
    });

    it('should preserve the query string across the redirect', () => {
      const req = new NextRequest('http://localhost:3000/about?x=1&y=2');
      const res = proxy(req);

      expect(res.headers.get('location')).toBe('http://localhost:3000/en/about?x=1&y=2');
    });
  });

  describe('localized paths', () => {
    it('should pass a valid locale path through, forwarding the locale as a request header', () => {
      const req = new NextRequest('http://localhost:3000/ru/about');
      const res = proxy(req);

      expect(res.status).toBe(200);
      expect(res.headers.get('x-middleware-next')).toBe('1');
      // Only global-not-found.tsx reads this. The prerendered locale routes take
      // their locale from `params`, so nothing here forces a dynamic render.
      expect(res.headers.get('x-middleware-request-x-locale')).toBe('ru');
    });

    it('should never set a cookie on a localized path, whatever the visitor has stored', () => {
      // Following an /en link from a CV must not overwrite a stored `he`, and a
      // Set-Cookie on an HTML response is what stops a CDN caching it.
      for (const cookie of [undefined, 'locale=en', 'locale=he', 'locale=fr']) {
        const req = new NextRequest(
          'http://localhost:3000/en',
          cookie == null ? undefined : { headers: { cookie } }
        );
        const res = proxy(req);

        expect(res.status).toBe(200);
        expect(res.headers.get('set-cookie')).toBeNull();
        expect(res.cookies.get('locale')).toBeUndefined();
      }
    });

    it('should serve the path locale even when it disagrees with the stored one', () => {
      const req = new NextRequest('http://localhost:3000/en/about', {
        headers: { cookie: 'locale=he' },
      });
      const res = proxy(req);

      expect(res.headers.get('x-middleware-request-x-locale')).toBe('en');
      expect(res.headers.get('set-cookie')).toBeNull();
    });
  });

  describe('redirect security headers', () => {
    // The proxy short-circuits before next.config's headers() layer, so the
    // bare domain — the URL people type, and the one the HSTS preload list
    // probes — would otherwise answer with Location, Set-Cookie and Vary only.
    it('should carry the full security header set on the redirect', () => {
      const req = new NextRequest('https://yosefgamble.com/');
      const res = proxy(req);

      expect(res.status).toBe(307);
      SECURITY_HEADERS.forEach(({ key, value }) => {
        expect(res.headers.get(key)).toBe(value);
      });
    });

    it('should send Strict-Transport-Security, which HSTS preload requires here', () => {
      const res = proxy(new NextRequest('https://yosefgamble.com/'));

      expect(res.headers.get('strict-transport-security')).toBe(
        'max-age=63072000; includeSubDomains; preload'
      );
    });

    it('should not weaken the redirect headers for a nested path', () => {
      const res = proxy(new NextRequest('https://yosefgamble.com/about?x=1'));

      expect(res.headers.get('x-content-type-options')).toBe('nosniff');
      expect(res.headers.get('x-frame-options')).toBe('DENY');
      expect(res.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
      expect(res.headers.get('content-security-policy')).toContain("frame-ancestors 'none'");
    });
  });

  describe('redirect cookie and cache headers', () => {
    it('should scope the cookie to the site for a year without the Secure flag over http', () => {
      const req = new NextRequest('http://localhost:3000/');
      const res = proxy(req);
      const setCookie = res.headers.get('set-cookie') ?? '';

      expect(setCookie).toContain('Max-Age=31536000');
      expect(setCookie).toContain('Path=/');
      expect(setCookie).toContain('SameSite=lax');
      expect(setCookie).not.toContain('Secure');
    });

    it('should mark the cookie Secure over https', () => {
      const req = new NextRequest('https://yosefgamble.com/');
      const res = proxy(req);

      expect(res.headers.get('set-cookie')).toContain('Secure');
    });

    it('should vary the redirect on the inputs that choose its target', () => {
      const req = new NextRequest('http://localhost:3000/about');
      const res = proxy(req);

      expect(res.headers.get('vary')).toBe('Accept-Language, Cookie');
    });
  });
});
