import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const indexHtml = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');

describe('index.html', () => {
  // A dev tool once injected <script src="http://localhost:7331/inject.js">
  // here and it shipped: every visitor's browser tried to run whatever was
  // listening on that port, and logged a failed load on every page.
  it('never loads a script from a local development server', () => {
    const localSources = [...indexHtml.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)]
      .map((match) => match[1])
      .filter((src) => /^(https?:)?\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)[:/]/.test(src));

    expect(localSources).toEqual([]);
  });
});
