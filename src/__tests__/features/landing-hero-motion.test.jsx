import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath) => fs.readFileSync(path.resolve('.', relativePath), 'utf8');

describe('landing hero motion', () => {
  it('keeps the hero film unobstructed by floating cards', () => {
    const hero = readSource('src/features/core/components/landing/HeroSection.jsx');
    const styles = readSource('src/index.css');

    expect(hero).not.toContain('FloatingCard');
    expect(hero).not.toContain('HeroMotionEffects');
    expect(styles).toContain('@keyframes hero-drift');
    expect(styles).toContain('hero-drift 5s ease-in-out calc(var(--hero-float-delay, 0s) * -1)');
    expect(styles).toContain('translate: 0 -8px');
  });

  it('adds staged, compositor-friendly hero motion with reduced-motion fallbacks', () => {
    const hero = readSource('src/features/core/components/landing/HeroSection.jsx');
    const landing = readSource('src/features/core/pages/LandingPage.jsx');
    const section = readSource('src/features/core/components/landing/LandingSection.jsx');
    const styles = readSource('src/index.css');

    expect(hero).toContain('animate-hero-enter');
    expect(landing).toContain('animate-landing-orb');
    expect(styles).toContain('@utility animate-hero-enter');
    expect(styles).toContain('@utility animate-landing-orb');
    expect(styles).toContain('@utility animate-hero-sheen');
    expect(styles).toContain('hero-enter 650ms cubic-bezier(0.2, 0, 0, 1)');
    expect(styles).toContain('landing-orb 20s ease-in-out');
    expect(styles).toContain('hero-sheen 8.5s cubic-bezier(0.4, 0, 0.2, 1)');
    expect(styles).toContain('will-change: transform, opacity');
    expect(section).not.toContain("filter: 'blur(6px)'");
    expect(styles).toContain('animation: none !important;');
  });

  it('keeps smooth ambient speaking waveform motion without jittery glitch artifacts', () => {
    const features = readSource('src/features/core/components/landing/FeaturesSection.jsx');
    const styles = readSource('src/index.css');

    expect(features).not.toContain('group-hover:animate-speaking-glitch');
    expect(features).not.toContain('group-hover:animate-speaking-glitch-echo');
    expect(features).not.toContain('group-hover:animate-speaking-scan');
    expect(features).not.toContain('group-hover:animate-speaking-wave-glitch');
    expect(styles).not.toContain('@utility animate-speaking-glitch');
    expect(styles).not.toContain('@utility animate-speaking-scan');
    expect(styles).not.toContain('speaking-glitch 760ms steps(1, end) both');
    expect(styles).not.toContain('speaking-wave-glitch 760ms steps(1, end) both');
  });

  it('keeps the practice-test card dense while using its available canvas height', () => {
    const features = readSource('src/features/core/components/landing/FeaturesSection.jsx');

    expect(features).toContain("['IELTS Academic Test 8', '6.5']");
    expect(features).toContain('flex-1 p-3');
    expect(features).toContain('relative h-[164px] overflow-hidden');
    expect(features).toContain('y: [0, -190]');
    expect(features).toContain('flex h-[34px] items-center');
  });

  it('keeps generated feature illustrations tied to real product capabilities', () => {
    const features = readSource('src/features/core/components/landing/FeaturesSection.jsx');

    for (const asset of [
      'ai-writing-feedback.webp',
      'ai-speaking-practice.webp',
      'progress-analytics.webp',
    ]) {
      expect(features).toContain(`/landing-illustrations/${asset}`);
      expect(fs.existsSync(path.resolve('public/landing-illustrations', asset))).toBe(true);
    }

    expect(features).toContain('aria-hidden="true"');
  });
});
