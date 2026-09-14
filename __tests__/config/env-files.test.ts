import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * `.env.production` is the checked-in build configuration, and `next build`
 * loads it on its own — in CI, in Cloudflare's Workers Builds, on a fresh
 * clone — with no copy step in between. It exists because the site once
 * shipped without its cipher animation: the file that held the flag was
 * untracked, only the GitHub pipeline copied it into place, and the Cloudflare
 * builder that also deploys every push to `main` never saw it. A flag that is
 * read at build time and then baked into the bundle has to live in a file the
 * build finds unaided.
 */

const ENV_FILE = '.env.production';

/**
 * The subset of dotenv syntax the file uses: `KEY=value` lines, `#` comments,
 * and one double-quoted value with `\n` escapes (the PGP key).
 */
function parseEnvFile(contents: string): Record<string, string> {
  const parsed: Record<string, string> = {};
  for (const line of contents.split('\n')) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (!match) continue;
    const [, key, raw] = match;
    parsed[key] =
      raw.startsWith('"') && raw.endsWith('"') ? raw.slice(1, -1).replace(/\\n/g, '\n') : raw;
  }
  return parsed;
}

describe(ENV_FILE, () => {
  const env = parseEnvFile(readFileSync(ENV_FILE, 'utf8'));

  it('declares every public variable the build reads', () => {
    expect(Object.keys(env).sort()).toEqual([
      'NEXT_PUBLIC_CIPHER_TRANSITION',
      'NEXT_PUBLIC_CONTACT_EMAIL',
      'NEXT_PUBLIC_PGP_PUBLIC_KEY',
      'NEXT_PUBLIC_SECURE_CONTACT_EMAIL',
    ]);
  });

  it('turns the cipher animation on', () => {
    // The components compare against the literal string, so `1` or `yes`
    // would silently disable the feature.
    expect(env.NEXT_PUBLIC_CIPHER_TRANSITION).toBe('true');
  });

  it('holds only public values', () => {
    expect(env.NEXT_PUBLIC_PGP_PUBLIC_KEY.startsWith('-----BEGIN PGP PUBLIC KEY BLOCK-----')).toBe(
      true
    );
    expect(env.NEXT_PUBLIC_PGP_PUBLIC_KEY).not.toContain('PRIVATE KEY');
  });
});
