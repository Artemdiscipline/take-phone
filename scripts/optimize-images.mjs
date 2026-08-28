/**
 * One-off asset pipeline for official product photography.
 *
 * Downloaded PNGs (transparent, ~1400px) are trimmed, resized and re-encoded to
 * WebP so the catalogue ships small, layout-stable images. Run manually after
 * adding new source files:
 *
 *   node scripts/optimize-images.mjs
 *
 * Requires `sharp` (already available through the toolchain). The script is not
 * part of `npm run build` — committed WebP files are the build input.
 */
import { readdir, stat, unlink } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const TARGETS = [
  { dir: 'public/assets/products', width: 760 },
  { dir: 'public/assets/categories', width: 640 },
];

const root = process.cwd();

for (const target of TARGETS) {
  const dir = path.join(root, target.dir);
  const files = await readdir(dir);

  for (const file of files) {
    if (!file.endsWith('.png')) continue;

    const source = path.join(dir, file);
    const output = source.replace(/\.png$/, '.webp');

    await sharp(source)
      .trim({ threshold: 1 })
      .resize({
        width: target.width,
        height: target.width,
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .webp({ quality: 86, effort: 6 })
      .toFile(output);

    const { size } = await stat(output);
    await unlink(source);
    console.log(`${path.relative(root, output)}  ${Math.round(size / 1024)} KB`);
  }
}
