import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SECURITY_HEADERS } from '@/lib/security-headers';

/**
 * `public/_headers` is the only thing that can set a header on a static asset:
 * the Workers ASSETS binding answers `/images/*`, `/_next/static/*` and
 * `/favicon.ico` before the Worker runs, so `next.config.ts` never sees those
 * requests. Nothing else in the suite reads this file, and a typo in it fails
 * silently — Cloudflare skips the rule it cannot parse and serves the platform
 * default instead.
 */
const HEADERS_FILE = readFileSync(join(process.cwd(), 'public', '_headers'), 'utf8');

/** Parse the `_headers` grammar: an unindented path, then indented `Key: value`. */
function parseRules(source: string): Map<string, Record<string, string>> {
  const rules = new Map<string, Record<string, string>>();
  let current: Record<string, string> | undefined;

  for (const line of source.split('\n')) {
    if (line.trim() === '' || line.trimStart().startsWith('#')) continue;

    if (!/^\s/.test(line)) {
      current = {};
      rules.set(line.trim(), current);
      continue;
    }

    const separator = line.indexOf(':');
    expect(separator, `header line without a colon: ${line}`).toBeGreaterThan(0);
    expect(current, `header line before any path: ${line}`).toBeDefined();
    current![line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }

  return rules;
}

const rules = parseRules(HEADERS_FILE);

describe('public/_headers', () => {
  it('should cache content-hashed build output as immutable for a year', () => {
    expect(rules.get('/_next/static/*')).toEqual({
      'Cache-Control': 'public, max-age=31536000, immutable',
    });
  });

  it('should cache hand-managed images and PWA icons for a week', () => {
    const weekly = { 'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400' };

    expect(rules.get('/images/*')).toEqual(weekly);
    expect(rules.get('/icons/*')).toEqual(weekly);
  });

  it('should cache /favicon.ico here, since it is an asset rather than a route', () => {
    expect(rules.get('/favicon.ico')).toEqual({ 'Cache-Control': 'public, max-age=86400' });
  });

  // A visitor whose first request is an asset — a bookmarked chunk URL, a
  // prefetch, a hotlinked image — never reaches the Worker, so the catch-all is
  // the only rule that can answer them.
  it('should send nosniff and HSTS on every asset', () => {
    const catchAll = rules.get('/*');
    const hsts = SECURITY_HEADERS.find((header) => header.key === 'Strict-Transport-Security');

    expect(catchAll?.['X-Content-Type-Options']).toBe('nosniff');
    // Pinned to the shared list rather than to a literal: an HSTS max-age that
    // disagrees with the HTML's is worse than one that is merely short.
    expect(catchAll?.['Strict-Transport-Security']).toBe(hsts?.value);
  });
});
