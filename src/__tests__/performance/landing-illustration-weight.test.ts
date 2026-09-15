import { readFileSync, statSync, existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The three feature-card watermarks are decorative: aria-hidden, drawn at 144
 * CSS px behind the card content at ~10% opacity. They used to ship as
 * 1254x1254 PNGs totalling 3.1 MB, downloaded by every visitor who scrolled the
 * landing page. This pins them at a weight proportional to what is actually
 * visible so a future re-export cannot quietly reintroduce the originals.
 */

const ILLUSTRATION_DIR = resolve(process.cwd(), 'public/landing-illustrations');
const FEATURES = resolve(process.cwd(), 'src/features/core/components/landing/FeaturesSection.jsx');

const ASSETS = ['ai-writing-feedback.webp', 'ai-speaking-practice.webp', 'progress-analytics.webp'];

/** Minimal WebP header reader: 'RIFF' ....  'WEBP' then a VP8/VP8L/VP8X chunk. */
function readWebpSize(buffer: Buffer): { width: number; height: number } {
  expect(buffer.toString('ascii', 0, 4)).toBe('RIFF');
  expect(buffer.toString('ascii', 8, 12)).toBe('WEBP');

  const chunk = buffer.toString('ascii', 12, 16);

  if (chunk === 'VP8 ') {
    // Lossy: 16-bit width/height at offset 26, masked to 14 bits.
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff,
    };
  }
  if (chunk === 'VP8L') {
    // Lossless: 14-bit width-1 and height-1 packed after the 0x2f signature.
    const bits = buffer.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (chunk === 'VP8X') {
    // Extended: 24-bit canvas width-1 / height-1.
    const width = buffer.readUIntLE(24, 3) + 1;
    const height = buffer.readUIntLE(27, 3) + 1;
    return { width, height };
  }
  throw new Error(`unrecognised WebP chunk: ${chunk}`);
}

describe('landing feature illustrations', () => {
  const source = readFileSync(FEATURES, 'utf8');

  it.each(ASSETS)('%s exists and is a real WebP', (asset) => {
    const path = resolve(ILLUSTRATION_DIR, asset);
    expect(existsSync(path)).toBe(true);
    expect(() => readWebpSize(readFileSync(path))).not.toThrow();
  });

  it.each(ASSETS)('%s is sized for a 144px slot at 2x, not the 1254px original', (asset) => {
    const { width, height } = readWebpSize(readFileSync(resolve(ILLUSTRATION_DIR, asset)));
    expect(width).toBe(288);
    expect(height).toBe(288);
  });

  it.each(ASSETS)('%s stays under 40 KB', (asset) => {
    const { size } = statSync(resolve(ILLUSTRATION_DIR, asset));
    expect(size).toBeLessThan(40 * 1024);
  });

  it('keeps the whole illustration set under 100 KB', () => {
    const total = readdirSync(ILLUSTRATION_DIR).reduce(
      (sum, file) => sum + statSync(resolve(ILLUSTRATION_DIR, file)).size,
      0
    );
    expect(total).toBeLessThan(100 * 1024);
  });

  it('ships no unreferenced files in the illustration directory', () => {
    for (const file of readdirSync(ILLUSTRATION_DIR)) {
      expect(source, `${file} is shipped but never referenced`).toContain(
        `/landing-illustrations/${file}`
      );
    }
  });

  it('declares intrinsic dimensions matching the files, so the box is reserved before decode', () => {
    const tags = source.match(/<img[\s\S]*?\/>/g) ?? [];
    const illustrationTags = tags.filter((tag) => tag.includes('/landing-illustrations/'));

    expect(illustrationTags).toHaveLength(ASSETS.length);
    for (const tag of illustrationTags) {
      expect(tag).toContain('width="288"');
      expect(tag).toContain('height="288"');
      // Decorative, and must not block the critical path.
      expect(tag).toContain('aria-hidden="true"');
      expect(tag).toContain('loading="lazy"');
      expect(tag).toContain('decoding="async"');
    }
  });
});
