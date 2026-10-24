import { useCallback, useSyncExternalStore } from 'react';

import {
  getSavedLanguage,
  saveLanguagePreference,
  subscribeLanguage,
} from '../services/translateService';

/** The learner's meaning language, shared by every vocabulary component and kept across visits. */
export function useVocabularyLanguage() {
  const language = useSyncExternalStore(subscribeLanguage, getSavedLanguage, () => 'en');
  const setLanguage = useCallback((code) => saveLanguagePreference(code), []);
  return [language, setLanguage];
}
