import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath) => readFileSync(resolve('.', relativePath), 'utf8');

describe('landing hero image loading', () => {
  it('reserves high fetch priority for the main hero image', () => {
    const hero = readSource('src/features/core/components/landing/HeroSection.jsx');

    expect(hero).toContain("const heroImagePriorityProps = { fetchpriority: 'high' };");
    expect(hero).toContain('{...heroImagePriorityProps}');
    expect(hero).not.toContain('fetchPriority');
    expect(hero).not.toContain('{...highPriorityImageProps}');
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
