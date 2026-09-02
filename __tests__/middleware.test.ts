import { describe, it, expect, vi } from 'vitest';
import { middleware } from '../middleware';
import { NextRequest } from 'next/server';

describe('middleware', () => {
  it('should pass through /_next requests', () => {
    const req = new NextRequest('http://localhost:3000/_next/static/chunk.js');
    const res = middleware(req);
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });

  it('should pass through public files', () => {
    const req = new NextRequest('http://localhost:3000/favicon.ico');
    const res = middleware(req);
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });

  it('should redirect to default locale if no locale in path and no cookie', () => {
    const req = new NextRequest('http://localhost:3000/about');
    const res = middleware(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/en/about');
    expect(res.cookies.get('locale')?.value).toBe('en');
  });

  it('should redirect to default locale on root', () => {
    const req = new NextRequest('http://localhost:3000/');
    const res = middleware(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/en');
    expect(res.cookies.get('locale')?.value).toBe('en');
  });

  it('should redirect to preferred locale from cookie', () => {
    const req = new NextRequest('http://localhost:3000/projects', {
      headers: { cookie: 'locale=he' },
    });
    const res = middleware(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/he/projects');
    expect(res.cookies.get('locale')?.value).toBe('he');
  });

  it('should pass through if path has valid locale, and set header + cookie', () => {
    const req = new NextRequest('http://localhost:3000/ru/about');
    const res = middleware(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('x-middleware-next')).toBe('1');
    // Note: Next.js sets the request headers for the destination on x-middleware-request-<headername> in actual responses or we can check the request headers internally
    // In actual implementation it sets: x-middleware-request-x-locale
    expect(res.headers.get('x-middleware-request-x-locale')).toBe('ru');
    expect(res.cookies.get('locale')?.value).toBe('ru');
  });
});
