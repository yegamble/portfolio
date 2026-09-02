// Asset pipeline for the images this site ships. Run it by hand and commit the
// output; nothing here runs during `next build`.
//
//   node scripts/process-images.mjs
//
// Steps:
//   1. (optional) re-derive og-image.jpg and profile.jpg from a full-resolution
//      profile2.png, then delete that source
//   2. derive the WebP avatar sources from profile.jpg

import { existsSync, readdirSync, unlinkSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const imagesDir = resolve(projectRoot, 'public', 'images');

// sharp arrives as an optional dependency of Next.js. pnpm's isolated store
// does not hoist it to node_modules/, so fall back to resolving it out of the
// store rather than making every contributor install it separately.
async function loadSharp() {
  try {
    return (await import('sharp')).default;
  } catch {
    const storeDir = resolve(projectRoot, 'node_modules', '.pnpm');
    const candidate = existsSync(storeDir)
      ? readdirSync(storeDir)
          .filter((entry) => entry.startsWith('sharp@'))
          .sort()
          .pop()
      : undefined;

    if (candidate === undefined) {
      console.error('sharp not found. Install it with `pnpm add -D sharp` and re-run.');
      process.exit(1);
    }

    const require = createRequire(resolve(storeDir, candidate, 'node_modules/sharp/package.json'));
    return require('sharp');
  }
}

const sharp = await loadSharp();

async function report(label, file) {
  const { width, height, format } = await sharp(file).metadata();
  console.log(`${label}: ${width}x${height} ${format} → ${file}`);
}

// 1. Full-resolution source, if one is sitting there waiting to be processed.
const FULL_RESOLUTION_SOURCE = resolve(imagesDir, 'profile2.png');
const OG_OUTPUT = resolve(imagesDir, 'og-image.jpg');
const AVATAR_OUTPUT = resolve(imagesDir, 'profile.jpg');

if (existsSync(FULL_RESOLUTION_SOURCE)) {
  console.log('Processing images from', FULL_RESOLUTION_SOURCE);

  await sharp(FULL_RESOLUTION_SOURCE)
    .resize(1200, 630, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(OG_OUTPUT);
  await report('OG image', OG_OUTPUT);

  await sharp(FULL_RESOLUTION_SOURCE)
    .resize(320, 320, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(AVATAR_OUTPUT);
  await report('Avatar', AVATAR_OUTPUT);

  unlinkSync(FULL_RESOLUTION_SOURCE);
  console.log(`Deleted source: ${FULL_RESOLUTION_SOURCE}`);
} else {
  console.log(`No ${FULL_RESOLUTION_SOURCE}; reusing the committed ${AVATAR_OUTPUT}.`);
}

// 2. WebP avatar sources. The hero renders the avatar at 128px (160px from the
// `sm` breakpoint up), so 256 covers 1x and 320 covers 2x. profile.jpg stays as
// the <img> fallback.
if (!existsSync(AVATAR_OUTPUT)) {
  console.error(`Avatar source not found: ${AVATAR_OUTPUT}`);
  process.exit(1);
}

for (const size of [256, 320]) {
  const output = resolve(imagesDir, `profile-${size}.webp`);
  await sharp(AVATAR_OUTPUT)
    .resize(size, size, { fit: 'cover', position: 'centre' })
    .webp({ quality: 82, effort: 6 })
    .toFile(output);
  await report(`Avatar ${size}px`, output);
}

console.log('Done.');
