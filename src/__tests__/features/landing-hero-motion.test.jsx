import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath) => fs.readFileSync(path.resolve('.', relativePath), 'utf8');

describe('landing hero motion', () => {
  it('uses one restrained CSS animation for floating cards', () => {
    const hero = readSource('src/features/core/components/landing/HeroSection.jsx');
    const styles = readSource('src/index.css');

    expect(hero).toContain('animate-hero-drift');
    expect(hero).not.toContain(
      'animate-hero-drift motion-reduce:animate-none transition-shadow duration-300'
    );
    expect(hero).not.toContain('HeroMotionEffects');
    expect(styles).toContain('@keyframes hero-drift');
    expect(styles).toContain('hero-drift 5s ease-in-out calc(var(--hero-float-delay, 0s) * -1)');
    expect(styles).toContain('translate: 0 -8px');
  });
});
