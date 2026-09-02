// Asset pipeline for the images this site ships. Run it by hand and commit the
// output; nothing here runs during `next build`.
//
//   node scripts/process-images.mjs
//
// Steps:
//   1. (optional) re-derive og-image.jpg and profile.jpg from a full-resolution
//      profile2.png, then delete that source
//   2. derive the WebP avatar sources from profile.jpg
//   3. rasterize src/app/icon.svg into favicon.ico and apple-icon.png
//   4. rasterize the PWA icons the web app manifest points at
//
// Run this on macOS. `src/app/icon.svg` draws its "Y" with a <text> element in
// `system-ui,sans-serif`, so librsvg resolves it against the HOST's fonts: the
// committed PNGs are San Francisco, and a Linux run would silently re-render
// them in DejaVu Sans. Converting the glyph to a <path> would remove the
// dependency (and would also settle how /icon.svg renders in each visitor's
// browser, which varies for the same reason).

import { existsSync, mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const imagesDir = resolve(projectRoot, 'public', 'images');
const appDir = resolve(projectRoot, 'src', 'app');

// Several sharp versions can coexist in pnpm's store (Next and OpenNext pull
// their own) and the directory names carry peer suffixes, so a lexical sort
// would rank 0.9.0 above 0.35.4. Compare the parsed triples instead, newest
// first.
function byVersionDescending(a, b) {
  for (let index = 0; index < 3; index += 1) {
    if (a.version[index] !== b.version[index]) {
      return b.version[index] - a.version[index];
    }
  }

  return 0;
}

// sharp arrives as an optional dependency of Next.js. pnpm's isolated store
// does not hoist it to node_modules/, so fall back to resolving it out of the
// store rather than making every contributor install it separately.
async function loadSharp() {
  try {
    return (await import('sharp')).default;
  } catch {
    const storeDir = resolve(projectRoot, 'node_modules', '.pnpm');
    const candidate = (existsSync(storeDir) ? readdirSync(storeDir) : [])
      .map((entry) => {
        const match = /^sharp@(\d+)\.(\d+)\.(\d+)/.exec(entry);
        return match === null ? null : { entry, version: match.slice(1, 4).map(Number) };
      })
      .filter((parsed) => parsed !== null)
      .sort(byVersionDescending)
      .at(0);

    if (candidate === undefined) {
      console.error('sharp not found. Install it with `pnpm add -D sharp` and re-run.');
      process.exit(1);
    }

    const require = createRequire(
      resolve(storeDir, candidate.entry, 'node_modules/sharp/package.json')
    );
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

// 3. App icons. `src/app/icon.svg` is the source of truth; Next serves whatever
// icon files sit beside it, so these two only exist because .ico and Apple's
// touch icon cannot be SVG.
const ICON_SOURCE = resolve(appDir, 'icon.svg');
const FAVICON_OUTPUT = resolve(appDir, 'favicon.ico');
const APPLE_ICON_OUTPUT = resolve(appDir, 'apple-icon.png');
// Matches `--color-bg-dark` in globals.css, and the icon's own rounded square.
const BACKGROUND = '#0f172a';

if (!existsSync(ICON_SOURCE)) {
  console.error(`Icon source not found: ${ICON_SOURCE}`);
  process.exit(1);
}

// sharp cannot write .ico, but the format has allowed a PNG payload since
// Vista and every browser in use reads it, so the container is a 6-byte
// ICONDIR plus one 16-byte ICONDIRENTRY wrapped around a normal PNG.
function wrapPngInIco(png, size) {
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // one image
  header.writeUInt8(size, 6); // width
  header.writeUInt8(size, 7); // height
  header.writeUInt8(0, 8); // colours in palette: none, it is truecolour
  header.writeUInt8(0, 9); // reserved
  header.writeUInt16LE(1, 10); // colour planes
  header.writeUInt16LE(32, 12); // bits per pixel
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(header.length, 18); // payload offset

  return Buffer.concat([header, png]);
}

const faviconPng = await sharp(ICON_SOURCE, { density: 384 })
  .resize(32, 32, { fit: 'contain', background: BACKGROUND })
  .png({ compressionLevel: 9 })
  .toBuffer();
writeFileSync(FAVICON_OUTPUT, wrapPngInIco(faviconPng, 32));
console.log(`Favicon: 32x32 ico → ${FAVICON_OUTPUT}`);

// Apple flattens the touch icon onto white and squares off the corners, so it
// gets an opaque dark plate and a little padding instead of the bare glyph.
await sharp(ICON_SOURCE, { density: 1080 })
  .resize(160, 160, { fit: 'contain', background: BACKGROUND })
  .extend({ top: 10, bottom: 10, left: 10, right: 10, background: BACKGROUND })
  .flatten({ background: BACKGROUND })
  .png({ compressionLevel: 9 })
  .toFile(APPLE_ICON_OUTPUT);
await report('Apple touch icon', APPLE_ICON_OUTPUT);

// 4. PWA icons, referenced by `src/app/manifest.ts`. These live in `public/`
// rather than beside `icon.svg`, because Next turns every icon file in the app
// directory into another <link rel="icon"> in the document head.
const PWA_ICON_DIR = resolve(projectRoot, 'public', 'icons');

mkdirSync(PWA_ICON_DIR, { recursive: true });

for (const size of [192, 512]) {
  const output = resolve(PWA_ICON_DIR, `icon-${size}.png`);
  await sharp(ICON_SOURCE, { density: size * 12 })
    .resize(size, size, { fit: 'contain', background: BACKGROUND })
    .png({ compressionLevel: 9 })
    .toFile(output);
  await report(`PWA icon ${size}px`, output);
}

// A maskable icon is cropped to whatever shape the launcher wants, and only the
// centre circle of 80% diameter is guaranteed visible. Render the mark at 60%
// on a full-bleed plate so nothing important can be clipped.
const MASKABLE_SIZE = 512;
// Rounded to an even number so the padding either side is a whole pixel.
const MASKABLE_GLYPH = Math.round((MASKABLE_SIZE * 0.6) / 2) * 2;
const MASKABLE_PAD = (MASKABLE_SIZE - MASKABLE_GLYPH) / 2;
const MASKABLE_OUTPUT = resolve(PWA_ICON_DIR, 'icon-maskable-512.png');

await sharp(ICON_SOURCE, { density: MASKABLE_GLYPH * 12 })
  .resize(MASKABLE_GLYPH, MASKABLE_GLYPH, { fit: 'contain', background: BACKGROUND })
  .extend({
    top: MASKABLE_PAD,
    bottom: MASKABLE_PAD,
    left: MASKABLE_PAD,
    right: MASKABLE_PAD,
    background: BACKGROUND,
  })
  .flatten({ background: BACKGROUND })
  .png({ compressionLevel: 9 })
  .toFile(MASKABLE_OUTPUT);
await report('PWA icon maskable', MASKABLE_OUTPUT);

console.log('Done.');
