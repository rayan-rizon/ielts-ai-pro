import { describe, expect, it } from 'vitest';
import { REPORT_STRINGS, reportT } from '@/features/testing/writing/report/reportStrings';
import { REPORT_LANGUAGES } from '../../../supabase/functions/_shared/reportLanguages';

const placeholders = (text) => (text.match(/\{\w+\}/g) || []).sort();
const SCRIPT = {
  bn: /\p{Script=Bengali}/u,
  hi: /\p{Script=Devanagari}/u,
  ru: /\p{Script=Cyrillic}/u,
  ur: /\p{Script=Arabic}/u,
  fa: /\p{Script=Arabic}/u,
};
// Words left to translate once placeholders and the exam's own term are removed.
const plainWords = (text) =>
  text
    .replace(/\{\w+\}|\bband\b|[^\p{L}\s]/giu, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
// Words that are the same in every language: a file type and the exam's own labels.
const SAME_EVERYWHERE = new Set(['pdf', 'legendBand8']);

describe('writing report interface text', () => {
  const english = REPORT_STRINGS.en;
  const others = REPORT_LANGUAGES.filter((language) => language.code !== 'en');

  it('has a dictionary for every offered language and no others', () => {
    expect(Object.keys(REPORT_STRINGS).sort()).toEqual(
      REPORT_LANGUAGES.map((language) => language.code).sort()
    );
  });

  it.each(others.map((language) => [language.code]))(
    '%s has every string, with the same placeholders, actually translated',
    (code) => {
      const strings = REPORT_STRINGS[code];
      expect(Object.keys(strings).sort()).toEqual(Object.keys(english).sort());
      for (const [key, text] of Object.entries(strings)) {
        expect(text.trim(), key).not.toBe('');
        expect(placeholders(text), key).toEqual(placeholders(english[key]));
        if (SAME_EVERYWHERE.has(key)) continue;
        if (SCRIPT[code]) expect(text, key).toMatch(SCRIPT[code]);
        else if (plainWords(english[key]) > 2) expect(text, key).not.toBe(english[key]);
      }
    }
  );

  it('fills placeholders, and falls back to English for an unknown language', () => {
    expect(reportT('en')('whyYouGot', { band: '6.0' })).toBe('Why you got 6.0');
    expect(reportT('de')('whyYouGot', { band: '6.0' })).toBe('Why you got 6.0');
    expect(reportT('bn')('whyYouGot', { band: '6.0' })).toContain('6.0');
    expect(reportT('en').language).toBe('en');
    expect(reportT('ur').rtl).toBe(true);
  });
});
