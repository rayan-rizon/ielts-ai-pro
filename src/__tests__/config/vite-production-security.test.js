import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Vite production security contract', () => {
  it('does not emit public source maps in production builds', () => {
    const viteConfig = readFileSync(resolve(process.cwd(), 'vite.config.js'), 'utf8');

    expect(viteConfig).toMatch(/sourcemap:\s*false/);
    expect(viteConfig).not.toMatch(/sourcemap:\s*['\"]hidden['\"]/);
  });
});
