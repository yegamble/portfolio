import sharp from 'sharp';
import { existsSync, unlinkSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const imagesDir = resolve(__dirname, '..', 'public', 'images');

const SOURCE = resolve(imagesDir, 'profile2.png');
const OG_OUTPUT = resolve(imagesDir, 'og-image.jpg');
const AVATAR_OUTPUT = resolve(imagesDir, 'profile.jpg');

if (!existsSync(SOURCE)) {
  console.error(`Source image not found: ${SOURCE}`);
  process.exit(1);
}

console.log('Processing images from', SOURCE);

// OG image: 1200x630, JPEG quality 85
await sharp(SOURCE)
  .resize(1200, 630, { fit: 'cover', position: 'centre' })
  .jpeg({ quality: 85, mozjpeg: true })
  .toFile(OG_OUTPUT);

const ogStats = await sharp(OG_OUTPUT).metadata();
console.log(`OG image: ${ogStats.width}x${ogStats.height} → ${OG_OUTPUT}`);

// Avatar: 320x320, JPEG quality 85
await sharp(SOURCE)
  .resize(320, 320, { fit: 'cover', position: 'centre' })
  .jpeg({ quality: 85, mozjpeg: true })
  .toFile(AVATAR_OUTPUT);

const avatarStats = await sharp(AVATAR_OUTPUT).metadata();
console.log(`Avatar: ${avatarStats.width}x${avatarStats.height} → ${AVATAR_OUTPUT}`);

// Delete 18MB source
unlinkSync(SOURCE);
console.log(`Deleted source: ${SOURCE}`);

console.log('Done.');
