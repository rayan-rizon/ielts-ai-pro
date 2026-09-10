// Reading Assistant translation options. The first entries cover the current
// top signup countries in the product (BD, IN, UZ, IR, VN, CA, NL, PH, DE,
// DZ, EG, HK, sampled 2026-09-10); the remaining entries preserve languages
// already offered to learners.
export const READING_TRANSLATION_LANGUAGES = [
  { code: 'bn', label: 'Bengali' },
  { code: 'hi', label: 'Hindi' },
  { code: 'uz', label: 'Uzbek' },
  { code: 'fa', label: 'Persian' },
  { code: 'vi', label: 'Vietnamese' },
  { code: 'fr', label: 'French' },
  { code: 'nl', label: 'Dutch' },
  { code: 'tl', label: 'Filipino' },
  { code: 'de', label: 'German' },
  { code: 'ar', label: 'Arabic' },
  { code: 'zh-CN', label: 'Simplified Chinese' },
  { code: 'zh-TW', label: 'Traditional Chinese' },
  { code: 'es', label: 'Spanish' },
  { code: 'ur', label: 'Urdu' },
];

export const READING_TRANSLATION_LANGUAGE_CODES = READING_TRANSLATION_LANGUAGES.map(
  ({ code }) => code
);
