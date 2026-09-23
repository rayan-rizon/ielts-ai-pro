import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { VocabularyItem } from '@/features/vocabulary/services/VocabularyItem';

const VOCABULARY_LIMITS = { free: 100, pro: 300, premium: Infinity };

export function normalizeVocabularyTerm(word) {
  return String(word || '')
    .trim()
    .toLocaleLowerCase();
}

export function useWritingVocabularySave(user) {
  const [savedVocabularyTerms, setSavedVocabularyTerms] = useState(() => new Set());
  const [savingVocabularyTerms, setSavingVocabularyTerms] = useState(() => new Set());
  const savingTermsRef = useRef(new Set());

  useEffect(() => {
    setSavedVocabularyTerms(new Set());
    setSavingVocabularyTerms(new Set());
    savingTermsRef.current.clear();
  }, [user?.id]);

  const onSaveVocabularyWord = useCallback(
    async ({ word, original, context, example }) => {
      const term = String(word || '').trim();
      const termKey = normalizeVocabularyTerm(term);
      if (!term) return { success: false, error: 'Word is required.' };
      if (!user?.id) {
        toast.error('Sign in to save vocabulary.');
        return { success: false, error: 'Sign in to save vocabulary.' };
      }
      if (savedVocabularyTerms.has(termKey)) return { success: true, alreadySaved: true };
      if (savingTermsRef.current.has(termKey)) return { success: false, pending: true };

      savingTermsRef.current.add(termKey);
      setSavingVocabularyTerms((current) => new Set(current).add(termKey));
      try {
        const existing = await VocabularyItem.findByWord(user.id, term);
        if (existing) {
          setSavedVocabularyTerms((current) => new Set(current).add(termKey));
          toast.message('Already in your vocabulary list.');
          return { success: true, alreadySaved: true, item: existing };
        }

        const tier = String(user.subscription_tier || 'free').toLowerCase();
        const limit = VOCABULARY_LIMITS[tier] ?? VOCABULARY_LIMITS.free;
        const count = await VocabularyItem.count({ user_id: user.id });
        if (count >= limit) {
          const error = `Your ${tier} vocabulary limit of ${limit} words has been reached.`;
          toast.error(error);
          return { success: false, error };
        }

        const nextReviewDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const usageNote = String(context || '').trim();
        const item = await VocabularyItem.create({
          word: term,
          definition: usageNote
            ? `Writing usage note: ${usageNote}`
            : `Alternative to “${original || 'your wording'}” in this writing context.`,
          example: String(example || '').trim(),
          user_id: user.id,
          created_by: user.id,
          mastery_level: 0,
          next_review_date: nextReviewDate,
          source: 'Writing',
        });
        setSavedVocabularyTerms((current) => new Set(current).add(termKey));
        toast.success(`“${term}” added to your vocabulary list.`);
        return { success: true, item };
      } catch {
        toast.error('Could not save this word. Please try again.');
        return { success: false, error: 'Could not save this word.' };
      } finally {
        savingTermsRef.current.delete(termKey);
        setSavingVocabularyTerms((current) => {
          const next = new Set(current);
          next.delete(termKey);
          return next;
        });
      }
    },
    [savedVocabularyTerms, user]
  );

  return { onSaveVocabularyWord, savedVocabularyTerms, savingVocabularyTerms };
}
