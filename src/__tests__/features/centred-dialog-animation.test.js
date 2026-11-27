import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/*
 * Tailwind v4 centres with the `translate` property, while tailwindcss-animate
 * slides with `transform`. The two add together, so a centred pop-up that also
 * slides starts half its own size away from where it belongs.
 */
const files = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : files(path);
    return /\.(jsx|tsx|js|ts)$/.test(entry.name) ? [path] : [];
  });

const CENTRED = /(?<![\w:-])-?translate-x-\[-50%\]/;
const SLIDES = /(slide-in-from|slide-out-to)-(left|top)-/;

describe('centred pop-ups', () => {
  it('fade and scale in place instead of sliding from off-centre', () => {
    const offenders = files('src').filter((file) =>
      readFileSync(file, 'utf8')
        .split('\n')
        .some((line) => CENTRED.test(line) && SLIDES.test(line))
    );
    expect(offenders).toEqual([]);
  });

  it.each(['dialog', 'alert-dialog'])('%s still fades and scales', (name) => {
    const source = readFileSync(`src/components/ui/${name}.jsx`, 'utf8');
    expect(source).toContain('data-[state=open]:fade-in-0');
    expect(source).toMatch(/data-\[state=open\]:zoom-in-9[58]/);
  });
});
