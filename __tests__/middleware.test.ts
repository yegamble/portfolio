import { describe, it, expect } from 'vitest';
import { middleware } from '@/middleware';
import { NextRequest } from 'next/server';

describe('middleware', () => {
  describe('bypass', () => {
    it('should pass through /_next requests', () => {
      const req = new NextRequest('http://localhost:3000/_next/static/chunk.js');
      const res = middleware(req);
      expect(res.headers.get('x-middleware-next')).toBe('1');
      expect(res.headers.get('set-cookie')).toBeNull();
    });

    it('should pass through public files', () => {
      const req = new NextRequest('http://localhost:3000/favicon.ico');
      const res = middleware(req);
      expect(res.headers.get('x-middleware-next')).toBe('1');
      expect(res.headers.get('set-cookie')).toBeNull();
    });
  });

  describe('locale-less paths', () => {
    it('should redirect to the default locale with no cookie and no Accept-Language', () => {
      const req = new NextRequest('http://localhost:3000/about');
      const res = middleware(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/en/about');
      expect(res.cookies.get('locale')?.value).toBe('en');
    });

    it('should redirect the root path to the default locale', () => {
      const req = new NextRequest('http://localhost:3000/');
      const res = middleware(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/en');
      expect(res.cookies.get('locale')?.value).toBe('en');
    });

    it('should redirect to the locale stored in the cookie', () => {
      const req = new NextRequest('http://localhost:3000/projects', {
        headers: { cookie: 'locale=he' },
      });
      const res = middleware(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/he/projects');
      expect(res.cookies.get('locale')?.value).toBe('he');
    });

    it('should negotiate the locale from Accept-Language when there is no cookie', () => {
      const req = new NextRequest('http://localhost:3000/', {
        headers: { 'accept-language': 'he-IL,he;q=0.9,en;q=0.5' },
      });
      const res = middleware(req);

      expect(res.headers.get('location')).toBe('http://localhost:3000/he');
      expect(res.cookies.get('locale')?.value).toBe('he');
    });

    it('should ignore an Accept-Language header with no supported language', () => {
      const req = new NextRequest('http://localhost:3000/', {
        headers: { 'accept-language': 'fr-FR,de;q=0.8' },
      });
      const res = middleware(req);

      expect(res.headers.get('location')).toBe('http://localhost:3000/en');
    });

    it('should prefer the cookie over Accept-Language', () => {
      const req = new NextRequest('http://localhost:3000/', {
        headers: { cookie: 'locale=ru', 'accept-language': 'he-IL,he;q=0.9' },
      });
      const res = middleware(req);

      expect(res.headers.get('location')).toBe('http://localhost:3000/ru');
    });

    it('should fall through to Accept-Language when the cookie is not a supported locale', () => {
      const req = new NextRequest('http://localhost:3000/', {
        headers: { cookie: 'locale=fr', 'accept-language': 'et;q=0.9' },
      });
      const res = middleware(req);

      expect(res.headers.get('location')).toBe('http://localhost:3000/et');
      expect(res.cookies.get('locale')?.value).toBe('et');
    });

    it('should fall back to the default locale when the cookie is unsupported and no header is sent', () => {
      const req = new NextRequest('http://localhost:3000/', {
        headers: { cookie: 'locale=fr' },
      });
      const res = middleware(req);

      expect(res.headers.get('location')).toBe('http://localhost:3000/en');
      expect(res.cookies.get('locale')?.value).toBe('en');
    });

    it('should not mistake a path that merely starts with locale letters for a locale', () => {
      const req = new NextRequest('http://localhost:3000/english');
      const res = middleware(req);

      expect(res.headers.get('location')).toBe('http://localhost:3000/en/english');
    });

    it('should preserve the query string across the redirect', () => {
      const req = new NextRequest('http://localhost:3000/about?x=1&y=2');
      const res = middleware(req);

      expect(res.headers.get('location')).toBe('http://localhost:3000/en/about?x=1&y=2');
    });
  });

  describe('localized paths', () => {
    it('should pass a valid locale path through, forwarding the locale as a request header', () => {
      const req = new NextRequest('http://localhost:3000/ru/about');
      const res = middleware(req);

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
        const res = middleware(req);

        expect(res.status).toBe(200);
        expect(res.headers.get('set-cookie')).toBeNull();
        expect(res.cookies.get('locale')).toBeUndefined();
      }
    });

    it('should serve the path locale even when it disagrees with the stored one', () => {
      const req = new NextRequest('http://localhost:3000/en/about', {
        headers: { cookie: 'locale=he' },
      });
      const res = middleware(req);

      expect(res.headers.get('x-middleware-request-x-locale')).toBe('en');
      expect(res.headers.get('set-cookie')).toBeNull();
    });
  });

  describe('redirect cookie and cache headers', () => {
    it('should scope the cookie to the site for a year without the Secure flag over http', () => {
      const req = new NextRequest('http://localhost:3000/');
      const res = middleware(req);
      const setCookie = res.headers.get('set-cookie') ?? '';

      expect(setCookie).toContain('Max-Age=31536000');
      expect(setCookie).toContain('Path=/');
      expect(setCookie).toContain('SameSite=lax');
      expect(setCookie).not.toContain('Secure');
    });

    it('should mark the cookie Secure over https', () => {
      const req = new NextRequest('https://yosefgamble.com/');
      const res = middleware(req);

      expect(res.headers.get('set-cookie')).toContain('Secure');
    });

    it('should vary the redirect on the inputs that choose its target', () => {
      const req = new NextRequest('http://localhost:3000/about');
      const res = middleware(req);

      expect(res.headers.get('vary')).toBe('Accept-Language, Cookie');
    });
  });
});
