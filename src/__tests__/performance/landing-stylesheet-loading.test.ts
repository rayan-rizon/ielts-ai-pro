import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('landing page stylesheet loading', () => {
  it('does not wait for user interaction before loading the application stylesheet', () => {
    const indexHtml = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
    const viteConfig = readFileSync(resolve(process.cwd(), 'vite.config.js'), 'utf8');

    expect(indexHtml).toContain('rel="stylesheet" href="/src/index.css"');
    expect(viteConfig).not.toContain('deferred-app-styles');
    expect(viteConfig).not.toMatch(
      /addEventListener\(["'](?:pointerdown|touchstart|keydown|wheel)["']/
    );
  });
});
