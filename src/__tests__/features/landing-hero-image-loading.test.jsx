import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath) => readFileSync(resolve('.', relativePath), 'utf8');

describe('landing hero image loading', () => {
  it('shows the muted product film where the hero photo used to be', () => {
    const hero = readSource('src/features/core/components/landing/HeroSection.jsx');
    const indexHtml = readSource('index.html');

    expect(hero).toContain('poster="/videos/hero-loop-poster.webp"');
    expect(hero).toContain('muted');
    expect(hero).toContain("'(prefers-reduced-motion: reduce)'");
    expect(hero).not.toContain('ielts-hero-student');
    expect(indexHtml).not.toContain('href="/ielts-hero-student-640.webp"');
  });

  it('keeps intrinsic dimensions on every raster logo variant', () => {
    const logo = readSource('src/components/shared/Logo.jsx');

    expect(logo).toContain('const LOGO_WIDTH = 300;');
    expect(logo).toContain('const LOGO_HEIGHT = 72;');
    expect(logo.match(/<img\s/g)).toHaveLength(4);
    expect(logo.match(/width=\{LOGO_WIDTH\}/g)).toHaveLength(4);
    expect(logo.match(/height=\{LOGO_HEIGHT\}/g)).toHaveLength(4);
  });
});
