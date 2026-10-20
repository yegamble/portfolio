import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SECURITY_HEADERS } from '@/lib/security-headers';

/**
 * `public/_headers` is the only thing that can set a header on a static asset:
 * the Workers ASSETS binding answers `/media/*`, `/images/*`, `/_next/static/*`
 * and `/favicon.ico` before the Worker runs, so `next.config.ts` never sees those
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

/** Cloudflare's path grammar: one greedy `*` splat, `:name` placeholders up to a `/`. */
function matchesPath(pattern: string, path: string): boolean {
  const source = pattern
    .split('*')
    .map((part) => part.replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&').replace(/:[A-Za-z]\w*/g, '[^/]+'))
    .join('.*');
  return new RegExp(`^${source}$`).test(path);
}

const PUBLIC_DIR = join(process.cwd(), 'public');
const PUBLIC_PATHS = readdirSync(PUBLIC_DIR, { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile() && !entry.name.startsWith('.'))
  .map(
    (entry) => `/${relative(PUBLIC_DIR, join(entry.parentPath, entry.name)).split(sep).join('/')}`
  );

describe('public/_headers', () => {
  it('should cache content-hashed build output as immutable for a year', () => {
    expect(rules.get('/_next/static/*')).toEqual({
      'Cache-Control': 'public, max-age=31536000, immutable',
    });
  });

  it('should cache the content-hashed avatar sources as immutable for a year', () => {
    expect(rules.get('/media/*')).toEqual({
      'Cache-Control': 'public, max-age=31536000, immutable',
    });
  });

  // Every rule a path matches applies, and a header two of them set is
  // comma-joined rather than replaced: `public, max-age=31536000, immutable,
  // public, max-age=604800, ...` is a conflict, not an override.
  it('should give every public file at most one Cache-Control rule', () => {
    const cacheRules = [...rules]
      .filter(([, headers]) => 'Cache-Control' in headers)
      .map(([pattern]) => pattern);

    expect(PUBLIC_PATHS).toContain('/images/profile.jpg');
    for (const path of PUBLIC_PATHS) {
      const matching = cacheRules.filter((pattern) => matchesPath(pattern, path));
      expect(matching.length, `${path} matches ${matching.join(' and ')}`).toBeLessThanOrEqual(1);
    }
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
