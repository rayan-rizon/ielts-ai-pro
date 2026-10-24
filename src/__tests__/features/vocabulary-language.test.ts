import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  detectDefaultLanguage,
  getSavedLanguage,
  saveLanguagePreference,
  subscribeLanguage,
  SUPPORTED_LANGUAGES,
} from '@/features/vocabulary/services/translateService';

const browserLanguages = (...languages: string[]) =>
  vi.spyOn(window.navigator, 'languages', 'get').mockReturnValue(languages);

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('vocabulary language', () => {
  it('offers the languages learners signed up from', () => {
    const codes = SUPPORTED_LANGUAGES.map((language) => language.code);
    for (const code of ['en', 'bn', 'hi', 'ur', 'uz', 'fa', 'vi', 'tl', 'ru', 'ja', 'id']) {
      expect(codes).toContain(code);
    }
  });

  it('starts from the browser language when it is supported, never English', () => {
    browserLanguages('hi-IN', 'en-US');
    expect(detectDefaultLanguage()).toBe('hi');
    browserLanguages('en-GB', 'uz');
    expect(detectDefaultLanguage()).toBe('uz');
    browserLanguages('zh-HK');
    expect(detectDefaultLanguage()).toBe('zh-TW');
    browserLanguages('zh');
    expect(detectDefaultLanguage()).toBe('zh-CN');
    browserLanguages('fil-PH');
    expect(detectDefaultLanguage()).toBe('tl');
  });

  it('falls back to Bangla when nothing else matches', () => {
    browserLanguages('en-US');
    expect(detectDefaultLanguage()).toBe('bn');
    browserLanguages('sw');
    expect(detectDefaultLanguage()).toBe('bn');
  });

  it('prefers what the learner chose, English included, and ignores a stale or invalid value', () => {
    browserLanguages('hi');
    localStorage.setItem('vocabularyTargetLanguage', 'en');
    expect(getSavedLanguage()).toBe('en');
    localStorage.setItem('vocabularyTargetLanguage', 'klingon');
    expect(getSavedLanguage()).toBe('hi');
  });

  it('tells every listener when the language changes, and stops after unsubscribe', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeLanguage(listener);
    saveLanguagePreference('ru');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(getSavedLanguage()).toBe('ru');
    unsubscribe();
    saveLanguagePreference('ja');
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
