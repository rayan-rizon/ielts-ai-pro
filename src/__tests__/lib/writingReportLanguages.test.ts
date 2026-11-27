import { describe, expect, it } from 'vitest';
import {
  DEFAULT_REPORT_LANGUAGE,
  REPORT_LANGUAGES,
  isRtlReportLanguage,
  normalizeReportLanguage,
  reportLanguage,
  savedReportLanguage,
} from '../../../supabase/functions/_shared/reportLanguages';

describe('writing report languages', () => {
  it('offers English first, then the seven languages of the largest signup markets', () => {
    expect(REPORT_LANGUAGES.map((language) => language.code)).toEqual([
      'en',
      'bn',
      'id',
      'hi',
      'uz',
      'ru',
      'ur',
      'fa',
    ]);
    expect(DEFAULT_REPORT_LANGUAGE).toBe('en');
  });

  it('treats anything unsupported as English', () => {
    expect(normalizeReportLanguage('xx')).toBe('en');
    expect(normalizeReportLanguage(undefined)).toBe('en');
    expect(normalizeReportLanguage(42)).toBe('en');
    expect(normalizeReportLanguage(' BN ')).toBe('bn');
  });

  it('tells a learner who has not chosen apart from one who chose English', () => {
    expect(savedReportLanguage(null)).toBeNull();
    expect(savedReportLanguage({})).toBeNull();
    expect(savedReportLanguage({ default_test_mode: 'exam' })).toBeNull();
    expect(savedReportLanguage({ report_language: 'zz' })).toBeNull();
    expect(savedReportLanguage({ report_language: 'en' })).toBe('en');
    expect(savedReportLanguage({ report_language: 'hi' })).toBe('hi');
  });

  it('lays Urdu and Persian out right to left and nothing else', () => {
    expect(REPORT_LANGUAGES.filter((l) => isRtlReportLanguage(l.code)).map((l) => l.code)).toEqual([
      'ur',
      'fa',
    ]);
  });

  it('names each language in its own script and in English for the translator', () => {
    expect(reportLanguage('bn')).toMatchObject({ name: 'বাংলা', englishName: 'Bengali (Bangla)' });
    expect(reportLanguage('uz')).toMatchObject({ englishName: 'Uzbek in the Latin script' });
    expect(reportLanguage('nope')).toMatchObject({ code: 'en', name: 'English' });
  });
});
