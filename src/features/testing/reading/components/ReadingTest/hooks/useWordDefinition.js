import { useState, useCallback, useEffect, useRef } from 'react';
import { UserPoints } from '@/features/gamification/services/UserPoints';
import { VocabularyItem } from '@/features/vocabulary/services/VocabularyItem';
import { lookupReadingDefinition } from '@/features/testing/reading/services/readingWordDefinition';

export const useWordDefinition = (
  user,
  testData,
  currentPassageIndex,
  sessionId = null,
  assistantEnabled = false
) => {
  const [wordDefinition, updateWordDefinition] = useState(null);
  const requestControllerRef = useRef(null);
  const clearTimerRef = useRef(null);
  const requestIdRef = useRef(0);

  // Closing the card invalidates pending lookups as well as hiding it.
  const setWordDefinition = useCallback((value) => {
    if (value === null) {
      requestIdRef.current += 1;
      requestControllerRef.current?.abort();
    }
    updateWordDefinition(value);
  }, []);

  const clearFeedbackLater = useCallback(() => {
    if (clearTimerRef.current) window.clearTimeout(clearTimerRef.current);
    clearTimerRef.current = window.setTimeout(() => {
      clearTimerRef.current = null;
      setWordDefinition(null);
    }, 2000);
  }, [setWordDefinition]);

  useEffect(
    () => () => {
      requestIdRef.current += 1;
      requestControllerRef.current?.abort();
      if (clearTimerRef.current) window.clearTimeout(clearTimerRef.current);
    },
    []
  );

  const fetchWordDefinition = useCallback(
    async (word, selection = null) => {
      requestControllerRef.current?.abort();
      const controller = new AbortController();
      requestControllerRef.current = controller;
      const requestId = ++requestIdRef.current;
      if (clearTimerRef.current) window.clearTimeout(clearTimerRef.current);
      const cleanWord = word
        .trim()
        .replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '')
        .toLowerCase();
      if (!cleanWord) return;
      const isCurrent = () => requestId === requestIdRef.current && !controller.signal.aborted;
      const onError = (err) => {
        if (!isCurrent()) return;
        console.warn('Error fetching definition:', err);
        updateWordDefinition((prev) => ({
          ...prev,
          word: cleanWord,
          definition: 'Definition not found.',
          contextual: false,
          error: true,
        }));
      };
      try {
        await lookupReadingDefinition({
          word: cleanWord,
          contextualRequest:
            assistantEnabled && sessionId && selection
              ? {
                  sessionId,
                  passageIndex: currentPassageIndex,
                  selectionStart: selection.start,
                  selectionEnd: selection.end,
                  selectedText: selection.text || word,
                  action: 'dictionary',
                }
              : null,
          signal: controller.signal,
          onError,
          onDefinition: (definition) => {
            if (isCurrent()) updateWordDefinition((prev) => ({ ...prev, ...definition }));
          },
        });
      } catch (err) {
        onError(err);
      }
    },
    [assistantEnabled, currentPassageIndex, sessionId]
  );

  const addToVocabulary = useCallback(
    async (wordData) => {
      if (!user) {
        setWordDefinition((prev) => ({ ...prev, vocabError: true, addedToVocab: false }));
        console.error('User not logged in, cannot add to vocabulary.');
        return;
      }

      try {
        // Check if word already exists
        const existingWords = await VocabularyItem.list({
          user_id: user.id,
          word: wordData.word.toLowerCase(),
        });

        if (existingWords.length > 0) {
          setWordDefinition((prev) => ({
            ...prev,
            alreadyExists: true,
            addedToVocab: false,
            vocabError: false,
          }));
          clearFeedbackLater();
          return;
        }

        const sourceTag = `${testData?.title || 'Reading Test'} - Passage ${currentPassageIndex + 1}`;

        const createdVocabulary = await VocabularyItem.create({
          user_id: user.id,
          word: wordData.word,
          definition: wordData.definition,
          example: wordData.example,
          part_of_speech: wordData.part_of_speech || null,
          ipa: wordData.pronunciation || null,
          synonyms: Array.isArray(wordData.synonyms)
            ? wordData.synonyms
            : wordData.synonyms
              ? [wordData.synonyms]
              : [],
          source: sourceTag,
        });

        // Show success feedback
        setWordDefinition((prev) => ({
          ...prev,
          addedToVocab: true,
          vocabError: false,
          alreadyExists: false,
        }));

        // Award points for adding vocabulary
        if (user?.id) {
          try {
            await UserPoints.addPoints(
              user.id,
              5,
              'vocabulary_add',
              `vocabulary-add:${createdVocabulary.id}`
            );
          } catch (pointsError) {
            console.warn('Could not update points:', pointsError);
          }
        }

        clearFeedbackLater();
      } catch (error) {
        console.error('Error adding word to vocabulary:', error);
        setWordDefinition((prev) => ({
          ...prev,
          vocabError: true,
          errorMessage: error.message || 'Unknown error',
          addedToVocab: false,
          alreadyExists: false,
        }));
      }
    },
    [user, testData, currentPassageIndex, clearFeedbackLater, setWordDefinition]
  );

  return {
    wordDefinition,
    setWordDefinition,
    fetchWordDefinition,
    addToVocabulary,
  };
};
