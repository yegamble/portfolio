import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import avatarSources from '@/data/avatar.json';

/**
 * public/_headers caches /media/* as immutable for a year, which is only safe
 * while a file's name changes whenever its bytes do. scripts/process-images.mjs
 * guarantees that; these tests catch a file edited or added by hand.
 */
const PUBLIC_DIR = join(process.cwd(), 'public');
const MEDIA_DIR = join(PUBLIC_DIR, 'media');
const urls = Object.values(avatarSources);

describe('src/data/avatar.json', () => {
  it('should list a 1x and a 2x source', () => {
    expect(Object.keys(avatarSources).sort()).toEqual(['256', '320']);
  });

  it.each(urls)('should name %s after a hash of its bytes', (url) => {
    const match = /^\/media\/profile-\d+\.([0-9a-f]{10})\.webp$/.exec(url);
    expect(match, `${url} is not a content-hashed /media/ URL`).not.toBeNull();

    const bytes = readFileSync(join(PUBLIC_DIR, url));
    expect(createHash('sha256').update(bytes).digest('hex').slice(0, 10)).toBe(match![1]);
  });

  // A superseded generation left behind would ship, and stay cached, forever.
  // Dotfiles are skipped: a local .DS_Store is gitignored and never deployed.
  it('should leave nothing in public/media that the manifest does not reference', () => {
    expect(
      readdirSync(MEDIA_DIR)
        .filter((name) => !name.startsWith('.'))
        .map((name) => `/media/${name}`)
        .sort()
    ).toEqual([...urls].sort());
  });
});
