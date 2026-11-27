/**
 * Languages a learner can read feedback reports in. Shared by the web report,
 * the PDF and the `writing-report-assist` Edge Function; the mobile app keeps a
 * copy in `src/core/ported`.
 *
 * English is the default. The other seven follow signup countries sampled on
 * 2026-11-27 (BD, ID, IN, UZ, KZ/RU/KG, PK, IR), in that order. Only the
 * explanations are translated: essays, model paragraphs and corrections stay
 * in English, as in the exam.
 */

export type ReportLanguageCode = 'en' | 'bn' | 'id' | 'hi' | 'uz' | 'ru' | 'ur' | 'fa';

export type ReportLanguage = {
  code: ReportLanguageCode;
  /** The language's own name, as the picker shows it. */
  name: string;
  /** Unambiguous English name, used in the translation prompt. */
  englishName: string;
  rtl?: boolean;
};

export const DEFAULT_REPORT_LANGUAGE: ReportLanguageCode = 'en';

export const REPORT_LANGUAGES: ReportLanguage[] = [
  { code: 'en', name: 'English', englishName: 'English' },
  { code: 'bn', name: 'বাংলা', englishName: 'Bengali (Bangla)' },
  { code: 'id', name: 'Bahasa Indonesia', englishName: 'Indonesian' },
  { code: 'hi', name: 'हिन्दी', englishName: 'Hindi' },
  { code: 'uz', name: 'Oʻzbekcha', englishName: 'Uzbek in the Latin script' },
  { code: 'ru', name: 'Русский', englishName: 'Russian' },
  { code: 'ur', name: 'اردو', englishName: 'Urdu', rtl: true },
  { code: 'fa', name: 'فارسی', englishName: 'Persian (Farsi)', rtl: true },
];

const byCode = new Map<string, ReportLanguage>(
  REPORT_LANGUAGES.map((language) => [language.code, language])
);

const asCode = (value: unknown): ReportLanguageCode | null => {
  const code = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return byCode.has(code) ? (code as ReportLanguageCode) : null;
};

export const normalizeReportLanguage = (value: unknown): ReportLanguageCode =>
  asCode(value) ?? DEFAULT_REPORT_LANGUAGE;

export const reportLanguage = (value: unknown): ReportLanguage =>
  byCode.get(normalizeReportLanguage(value)) as ReportLanguage;

export const isRtlReportLanguage = (value: unknown): boolean => Boolean(reportLanguage(value).rtl);

/** The saved choice in `users.settings`, or null while the learner has not been asked. */
export const savedReportLanguage = (settings: unknown): ReportLanguageCode | null =>
  asCode((settings as { report_language?: unknown } | null | undefined)?.report_language);
