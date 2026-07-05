// Translation Service using MyMemory API (free, no API key required)
// https://mymemory.translated.net/doc/spec.php

// Supported languages (commonly used)
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh-CN', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'bn', name: 'Bengali' },
  { code: 'tr', name: 'Turkish' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'th', name: 'Thai' },
  { code: 'pl', name: 'Polish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'id', name: 'Indonesian' },
];

// Cache for translations to avoid repeated API calls
const translationCache = new Map<string, string>();

/**
 * Get saved language preference
 * @returns Language code
 */
export function getSavedLanguage(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('vocabularyTargetLanguage') || 'en';
  }
  return 'en';
}

/**
 * Save language preference
 * @param langCode - Language code to save
 */
export function saveLanguagePreference(langCode: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('vocabularyTargetLanguage', langCode);
  }
}

/**
 * Translate text using MyMemory API
 * @param text - Text to translate
 * @param targetLang - Target language code (e.g., 'es', 'fr')
 * @param sourceLang - Source language code (default: 'en')
 * @returns Translated text
 */
export async function translateText(
  text: string,
  targetLang: string,
  sourceLang: string = 'en'
): Promise<string> {
  if (!text || !targetLang) {
    return text;
  }

  // Don't translate if source and target are the same
  if (sourceLang === targetLang) {
    return text;
  }

  // Check cache first
  const cacheKey = `${text}_${sourceLang}_${targetLang}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey) || text;
  }

  try {
    // MyMemory API endpoint
    const langPair = `${sourceLang}|${targetLang}`;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(langPair)}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`[Translate] API returned ${response.status}`);
      return text;
    }

    const data = await response.json();

    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      const translatedText = data.responseData.translatedText;
      // Cache the result
      translationCache.set(cacheKey, translatedText);
      return translatedText;
    } else {
      console.warn('[Translate] No translation found:', data);
      return text;
    }
  } catch (error: any) {
    console.error('[Translate] Translation failed:', error.message);
    return text;
  }
}

/**
 * Batch translate multiple texts
 * @param texts - Array of texts to translate
 * @param targetLang - Target language code
 * @param sourceLang - Source language code
 * @returns Array of translated texts
 */
export async function batchTranslate(
  texts: string[],
  targetLang: string,
  sourceLang: string = 'en'
): Promise<string[]> {
  if (!targetLang || targetLang === sourceLang) {
    return texts;
  }

  // Translate each text with a small delay to avoid rate limiting
  const translations: string[] = [];
  for (const text of texts) {
    const translated = await translateText(text, targetLang, sourceLang);
    translations.push(translated);
    // Small delay between requests to be respectful to the free API
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return translations;
}

/**
 * Clear the translation cache
 */
export function clearTranslationCache(): void {
  translationCache.clear();
}

/**
 * Get language name by code
 * @param code - Language code
 * @returns Language name
 */
export function getLanguageName(code: string): string {
  const lang = SUPPORTED_LANGUAGES.find((l) => l.code === code);
  return lang ? lang.name : code;
}

/**
 * Get cached translation if available
 * @param text - Original text
 * @param targetLang - Target language
 * @param sourceLang - Source language
 * @returns Cached translation or null
 */
export function getCachedTranslation(
  text: string,
  targetLang: string,
  sourceLang: string = 'en'
): string | null {
  const cacheKey = `${text}_${sourceLang}_${targetLang}`;
  return translationCache.get(cacheKey) || null;
}
