import { useEffect, useState, useSyncExternalStore } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { savedReportLanguage } from '../../../../../supabase/functions/_shared/reportLanguages';
import { readSavedReportLanguage, saveReportLanguage } from './reportLanguagePreference';

/*
 * A tiny store so every report on screen agrees, and a choice survives the
 * report being unmounted before the profile refreshes. Keyed by account.
 */
const choices = new Map();
const listeners = new Set();
const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const remember = (userId, entry) => {
  choices.set(userId, entry);
  listeners.forEach((listener) => listener());
};

export const resetReportLanguageForTests = () => choices.clear();

/**
 * Checks the database before ever asking: the cached profile can be older than
 * a choice made on another device. Returns the account confirmed as unasked.
 */
function useConfirmedUnchosen(userId, chosen) {
  const [unchosenFor, setUnchosenFor] = useState(null);
  useEffect(() => {
    if (!userId || chosen) return undefined;
    let current = true;
    readSavedReportLanguage()
      .then((stored) => {
        if (!current) return;
        if (stored) remember(userId, { language: stored });
        else setUnchosenFor(userId);
      })
      .catch(() => {
        // Unknown is not "never chosen": stay in English and do not ask.
      });
    return () => {
      current = false;
    };
  }, [userId, chosen]);
  return unchosenFor;
}

/** Applies the choice at once, then saves it; resolves to whether it saved. */
async function saveChoice(userId, language) {
  if (!userId) return false;
  remember(userId, { language });
  try {
    await saveReportLanguage(language);
    return true;
  } catch (error) {
    console.warn('Report language was not saved:', error?.message);
    remember(userId, { language, saveFailed: true });
    return false;
  }
}

const accountOf = (profile) => profile?.id || null;

export function useReportLanguage() {
  const { userProfile } = useAuth();
  const userId = accountOf(userProfile);
  const entry = useSyncExternalStore(subscribe, () => choices.get(userId));
  const chosen = entry?.language ?? savedReportLanguage(userProfile?.settings);
  const unchosenFor = useConfirmedUnchosen(userId, chosen);

  return {
    language: chosen ?? 'en',
    needsChoice: [userId, !chosen, unchosenFor === userId].every(Boolean),
    saveFailed: Boolean(entry?.saveFailed),
    choose: (language) => saveChoice(userId, language),
  };
}
