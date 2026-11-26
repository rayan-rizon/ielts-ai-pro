import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

vi.mock('@/lib/supabase', () => ({ supabase: {} }));

const { pricingFaqs } = await import('@/features/subscription/config/pricingFaqs');
const { default: FAQSection } = await import('@/features/subscription/components/FAQSection');
const { generateFeatureStrings, getDefaultLimits } = await import('@/lib/tierLimitsUtils');

// Free learners get a set number of Reading and Listening tests. Copy written
// while those tests were free for everyone must not come back.
const STALE = [
  /unlimited\s+Cambridge\s+Reading/i,
  /stay\s+unlimited\s+on\s+the\s+free\s+plan/i,
  /completely\s+free\s+for\s+all/i,
  /Free\s+plan\s+includes\s+Cambridge\s+IELTS\s+Reading\s+and\s+Listening\s+practice\s+tests/i,
  /Free\s+plan\s+includes\s+Reading\s+and\s+Listening\s+practice,/i,
  /free\s+account\s+covers\s+Reading\s+and\s+Listening\s+practice/i,
  /'Reading and Listening practice tests'/,
  /Free\s+includes\s+Reading\s+&amp;\s+Listening\s+practice/i,
];

const PUBLIC_COPY = [
  'index.html',
  'api/pricing.js',
  'scripts/generate-public-seo-pages.mjs',
  'src/features/core/pages/LandingPage.jsx',
  'src/features/core/components/about/AboutValues.jsx',
  'src/features/core/components/about/AboutFacts.jsx',
  'src/features/subscription/components/FAQSection.jsx',
  'src/features/subscription/pages/Upgrade.jsx',
];

const read = (path) => readFileSync(join(process.cwd(), path), 'utf8');

const plans = (features) => [{ tier: 'free', features }];
const live = plans([
  '6 free Reading tests',
  '6 free Listening tests',
  '1 AI Writing Evaluation/month',
  '0 AI Speaking Sessions/month',
]);
const answer = (list, words) =>
  pricingFaqs(list).find((entry) => words.test(entry.question)).answer;

describe('public copy about free Reading and Listening', () => {
  it.each(PUBLIC_COPY)('no longer promises free tests without a limit in %s', (path) => {
    const text = read(path);
    expect(STALE.filter((claim) => claim.test(text)).map(String)).toEqual([]);
  });

  it('says the same thing in the page and in its crawler copy', () => {
    const flat = (path) => read(path).replace(/\s+/g, ' ');
    const promise = 'a limited number of Cambridge IELTS Reading and Listening tests';
    expect(flat('src/features/core/pages/LandingPage.jsx')).toContain(promise);
    expect(flat('index.html').split(promise)).toHaveLength(3);
  });
});

describe('pricing page questions', () => {
  it('gives the live number of free tests and what resuming costs', () => {
    const text = answer(live, /Cambridge/);
    expect(text).toMatch(/^Not all of them\./);
    expect(text).toContain('6 Reading and 6 Listening tests in total');
    expect(text).toContain('Resuming a test does not use one');
    expect(text).toContain('Pro and Premium give unlimited');
  });

  it('promises no number when the live limits are not known', () => {
    const text = answer(plans(['Reading & Listening practice tests']), /Cambridge/);
    expect(text).toContain('a limited number');
    expect(text).not.toMatch(/\d/);
  });

  it('follows the admin setting if free tests become unlimited again', () => {
    const open = plans(['Unlimited Reading tests', 'Unlimited Listening tests']);
    expect(answer(open, /Cambridge/)).toMatch(/^Yes\./);
  });

  it('does not say AI feedback needs a subscription when Free includes some', () => {
    const text = answer(live, /AI feedback/);
    expect(text).toContain('Free includes 1 AI Writing evaluation a month');
    expect(text).toContain('AI Speaking sessions');
    expect(text).toContain('need Pro or Premium');
  });

  it('names both free allowances when Free includes Speaking too', () => {
    const generous = plans(['3 AI Writing Evaluations/month', '2 AI Speaking Sessions/month']);
    expect(answer(generous, /AI feedback/)).toBe(
      'Free includes 3 AI Writing evaluations and 2 AI Speaking sessions a month. Pro and Premium include many more.'
    );
  });

  it('shows those answers on the page', () => {
    render(<FAQSection plans={live} />);
    fireEvent.click(screen.getByRole('button', { name: 'Are the Cambridge IELTS tests free?' }));
    expect(screen.getByText(/6 Reading and 6 Listening tests in total/)).toBeInTheDocument();
  });
});

describe('fallback limits, used when the live ones cannot be read', () => {
  it('never advertises unlimited tests to a free learner', () => {
    const text = generateFeatureStrings('free', getDefaultLimits().free);
    expect(text.readingFeature).toBe('6 free Reading tests');
    expect(text.listeningFeature).toBe('6 free Listening tests');
  });
});
