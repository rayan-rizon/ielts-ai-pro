import { useState, useCallback, useEffect, useRef } from 'react';
import { UserPoints } from '@/features/gamification/services/UserPoints';
import { VocabularyItem } from '@/features/vocabulary/services/VocabularyItem';

// Simple in-memory cache for word definitions to prevent redundant API calls
const definitionCache = new Map();
const DICTIONARY_API_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en';
const DATAMUSE_API_URL = 'https://api.datamuse.com/words';
const LOOKUP_TIMEOUT_MS = 4000;

async function fetchJsonWithTimeout(url, signal) {
  const timeoutController = new AbortController();
  const onAbort = () => timeoutController.abort();
  const timeoutId = window.setTimeout(() => timeoutController.abort(), LOOKUP_TIMEOUT_MS);

  signal.addEventListener('abort', onAbort, { once: true });

  try {
    const response = await fetch(url, { signal: timeoutController.signal });
    if (!response.ok) throw new Error('Word not found');
    return await response.json();
  } catch (error) {
    if (timeoutController.signal.aborted && !signal.aborted) {
      throw new Error('Dictionary request timed out');
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
    signal.removeEventListener('abort', onAbort);
  }
}

function dictionaryResult(entry) {
  const meaning = entry.meanings?.[0];
  const def = meaning?.definitions?.find((item) => item?.definition) || meaning?.definitions?.[0];
  const phonetics = entry.phonetics || [];
  const phonetic = phonetics.find((item) => item.audio && item.text) || phonetics[0];

  return {
    word: entry.word,
    definition: def?.definition || 'Definition unavailable.',
    pronunciation: phonetic?.text || entry.phonetic || '',
    audio: phonetic?.audio || '',
    example: def?.example || '',
    synonyms: meaning?.synonyms || [],
    part_of_speech: meaning?.partOfSpeech || '',
  };
}

function datamuseResult(entries, word) {
  const entry = entries.find((item) => item.word?.toLowerCase() === word) || entries[0];
  const rawDefinition = entry?.defs?.[0];
  if (!rawDefinition) throw new Error('Word not found');

  const [partOfSpeech = '', definition = rawDefinition] = rawDefinition.split('\t');
  return {
    word: entry.word || word,
    definition: definition.trim(),
    pronunciation: '',
    audio: '',
    example: '',
    synonyms: [],
    part_of_speech: partOfSpeech,
  };
}

export const useWordDefinition = (user, testData, currentPassageIndex) => {
  const [wordDefinition, setWordDefinition] = useState(null);
  const requestControllerRef = useRef(null);
  const clearTimerRef = useRef(null);
  const requestIdRef = useRef(0);

  const clearFeedbackLater = useCallback(() => {
    if (clearTimerRef.current) window.clearTimeout(clearTimerRef.current);
    clearTimerRef.current = window.setTimeout(() => {
      clearTimerRef.current = null;
      setWordDefinition(null);
    }, 2000);
  }, []);

  useEffect(
    () => () => {
      requestControllerRef.current?.abort();
      if (clearTimerRef.current) window.clearTimeout(clearTimerRef.current);
    },
    []
  );

  const fetchWordDefinition = useCallback(async (word) => {
    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;
    const requestId = ++requestIdRef.current;

    try {
      // Clean the word (remove punctuation)
      const cleanWord = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
      if (!cleanWord) return;

      // Check cache first
      if (definitionCache.has(cleanWord)) {
        setWordDefinition((prev) => ({ ...prev, ...definitionCache.get(cleanWord) }));
        return;
      }

      let result;
      try {
        const data = await fetchJsonWithTimeout(
          `${DICTIONARY_API_URL}/${encodeURIComponent(cleanWord)}`,
          controller.signal
        );
        result = dictionaryResult(data[0]);
      } catch (primaryError) {
        if (controller.signal.aborted || requestId !== requestIdRef.current) return;

        console.warn('[Dictionary] Primary lookup failed; trying fallback.', primaryError);
        const fallbackData = await fetchJsonWithTimeout(
          `${DATAMUSE_API_URL}?sp=${encodeURIComponent(cleanWord)}&md=d&max=5`,
          controller.signal
        );
        result = datamuseResult(fallbackData, cleanWord);
      }

      // Store in cache
      definitionCache.set(cleanWord, result);

      if (requestId === requestIdRef.current) setWordDefinition((prev) => ({ ...prev, ...result }));
    } catch (err) {
      if (err.name === 'AbortError' || requestId !== requestIdRef.current) return;
      console.warn('Error fetching definition:', err);
      setWordDefinition((prev) => ({
        ...prev,
        definition: 'Definition not found.',
        error: true,
      }));
    }
  }, []);

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
          definition: `${wordData.part_of_speech ? `(${wordData.part_of_speech}) ` : ''}${wordData.definition}`,
          example: wordData.example,
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
    [user, testData, currentPassageIndex, clearFeedbackLater]
  );

  return {
    wordDefinition,
    setWordDefinition,
    fetchWordDefinition,
    addToVocabulary,
  };
};
