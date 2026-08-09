import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const claimFiles = [
  '../../features/subscription/components/FAQSection.jsx',
  '../../features/core/pages/About.jsx',
  '../../features/core/components/about/AboutHero.jsx',
  '../../features/core/components/contact/ContactCTA.jsx',
];

describe('AI accuracy claims', () => {
  it('does not publish unverified examiner-equivalence claims', () => {
    const copy = claimFiles
      .map((relativePath) => readFileSync(new URL(relativePath, import.meta.url), 'utf8'))
      .join('\n');

    expect(copy).not.toMatch(/trained on thousands|within 0\.5 bands|examiner-grade/i);
    expect(copy).not.toMatch(/official Cambridge rubrics/i);
    expect(copy).toMatch(/AI-assisted practice estimate/i);
    expect(copy).toMatch(/not an official IELTS result/i);
  });
});
