import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { NextConfig } from 'next';
import nextConfig from '../../next.config';

const PRODUCTION_SCRIPT_SRC =
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://static.cloudflareinsights.com https://www.googletagmanager.com";

const EXPECTED_CSP = [
  "default-src 'self'",
  PRODUCTION_SCRIPT_SRC,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://www.googletagmanager.com https://*.google-analytics.com",
  "font-src 'self' data:",
  "connect-src 'self' https://cloudflareinsights.com https://www.googletagmanager.com https://*.google-analytics.com https://*.google.com",
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

  // Google's list for Analytics without Ads features. Anything Ads-related
  // (doubleclick, google.<tld>, pagead2) would mean an Ads feature got turned on.
  it('should allow Google Analytics to load and report, and nothing Ads-related', async () => {
    const csp = (await headerMap(nextConfig))['Content-Security-Policy'];

    expect(csp).toContain('https://www.googletagmanager.com');
    expect(csp).toContain('https://*.google-analytics.com');
    expect(csp).not.toMatch(/doubleclick|googlesyndication/);
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

/**
 * Next's client polyfill module, as `next/dist/client/app-globals.js` asks for
 * it. Turbopack matches `resolveAlias` keys against the request string, so this
 * relative request is the key that works; the package path and the absolute
 * path of the same file both match nothing.
 */
const POLYFILL_MODULE_REQUEST = '../build/polyfills/polyfill-module';

/** Resolves as Node does from the project root, to the real file in node_modules. */
const requireFromRoot = createRequire(path.resolve('package.json'));

/**
 * Every built-in the module patches, read the way Lighthouse's legacy-JS check
 * reads it: `X.y=` and `X.prototype.y=` assignments, plus
 * `defineProperty(X.prototype,"y"` calls.
 */
function patchedBuiltins(source: string): string[] {
  const assigned = source.matchAll(/\b([A-Z]\w*(?:\.prototype)?)\.(\w+)=(?!=)/g);
  const defined = source.matchAll(/defineProperty\(([A-Z]\w*(?:\.prototype)?),"(\w+)"/g);

  return [
    ...new Set([...assigned, ...defined].map(([, owner, name]) => `${owner}.${name}`)),
  ].sort();
}

describe('next.config client polyfills', () => {
  it("should swap Next's polyfill module for the local stand-in", () => {
    expect(nextConfig.turbopack?.resolveAlias).toEqual({
      [POLYFILL_MODULE_REQUEST]: './src/lib/polyfill-module.ts',
    });
    expect(existsSync('src/lib/polyfill-module.ts')).toBe(true);
  });

  // The alias fails silently in both directions. If Next moves the module or
  // changes the request, the key matches nothing and the polyfills quietly come
  // back. If Next adds a polyfill, the alias quietly drops it. So each of these
  // pins something the alias depends on, and the fix for a failure is to re-check
  // the new module against the targets, not to edit the expectation until it
  // passes.
  it('should find app-globals still importing the module under the aliased request', () => {
    const appGlobals = requireFromRoot.resolve('next/dist/client/app-globals');
    const polyfillModule = requireFromRoot.resolve('next/dist/build/polyfills/polyfill-module');

    expect(readFileSync(appGlobals, 'utf8')).toContain(`require("${POLYFILL_MODULE_REQUEST}")`);
    expect(
      requireFromRoot.resolve(path.resolve(path.dirname(appGlobals), POLYFILL_MODULE_REQUEST))
    ).toBe(polyfillModule);
  });

  it('should find the module patching only the built-ins that were reviewed', () => {
    const source = readFileSync(
      requireFromRoot.resolve('next/dist/build/polyfills/polyfill-module'),
      'utf8'
    );

    // Every one of these is native in all four default targets except
    // URL.canParse (Chrome/Edge 120, Firefox 115, Safari 17), which is why the
    // stand-in keeps that one and only that one.
    expect(patchedBuiltins(source)).toEqual([
      'Array.prototype.at',
      'Array.prototype.flat',
      'Array.prototype.flatMap',
      'Object.fromEntries',
      'Object.hasOwn',
      'Promise.prototype.finally',
      'String.prototype.trimEnd',
      'String.prototype.trimStart',
      'Symbol.prototype.description',
      'URL.canParse',
    ]);
    // Byte for byte as well (Next 16.4.2), so a polyfill written in a shape the
    // pattern above does not recognise cannot slip through either.
    expect(createHash('sha256').update(source).digest('hex')).toBe(
      '94c8008b70e41ac5b0360fd6f35ea7a59c20c6927aca7731ef8c6a3c26b9cddf'
    );
  });

  it("should still compile for Next's default browser targets", () => {
    // The targets the list above was checked against. A browserslist anywhere
    // Next looks for one (package.json, .browserslistrc, the BROWSERSLIST
    // variable) or a change to Next's defaults shows up here first.
    const { getSupportedBrowsers } = requireFromRoot('next/dist/build/get-supported-browsers');

    expect(getSupportedBrowsers(process.cwd(), false)).toEqual([
      'chrome 111',
      'edge 111',
      'firefox 111',
      'safari 16.4',
    ]);
  });
});
