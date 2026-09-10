import { useState, useCallback, useEffect, useRef } from 'react';
import { UserPoints } from '@/features/gamification/services/UserPoints';
import { VocabularyItem } from '@/features/vocabulary/services/VocabularyItem';
import { requestReadingAssistance } from '@/features/testing/reading/services/readingAiService';

// Simple in-memory cache for word definitions to prevent redundant API calls
const definitionCache = new Map();
const MAX_DEFINITION_CACHE_ENTRIES = 250;
const DEFINITION_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const DICTIONARY_API_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en';
const DATAMUSE_API_URL = 'https://api.datamuse.com/words';
const LOOKUP_TIMEOUT_MS = 2500;
const FALLBACK_STAGGER_MS = 150;
const CONTEXTUAL_LOOKUP_DEADLINE_MS = 5000;

function readCachedDefinition(word) {
  const entry = definitionCache.get(word);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    definitionCache.delete(word);
    return null;
  }
  definitionCache.delete(word);
  definitionCache.set(word, entry);
  return entry.value;
}

function cacheDefinition(word, value) {
  definitionCache.delete(word);
  if (definitionCache.size >= MAX_DEFINITION_CACHE_ENTRIES) {
    definitionCache.delete(definitionCache.keys().next().value);
  }
  definitionCache.set(word, { value, expiresAt: Date.now() + DEFINITION_CACHE_TTL_MS });
}

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

async function fetchFastDefinition(word, signal) {
  const lookupController = new AbortController();
  const onAbort = () => lookupController.abort();
  signal.addEventListener('abort', onAbort, { once: true });

  const primary = fetchJsonWithTimeout(
    `${DICTIONARY_API_URL}/${encodeURIComponent(word)}`,
    lookupController.signal
  ).then((data) => dictionaryResult(data[0]));
  const fallback = new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      fetchJsonWithTimeout(
        `${DATAMUSE_API_URL}?sp=${encodeURIComponent(word)}&md=d&max=5`,
        lookupController.signal
      )
        .then((data) => datamuseResult(data, word))
        .then(resolve, reject);
    }, FALLBACK_STAGGER_MS);
    lookupController.signal.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer);
        reject(new DOMException('Request aborted', 'AbortError'));
      },
      { once: true }
    );
  });

  try {
    return await Promise.any([primary, fallback]);
  } finally {
    lookupController.abort();
    signal.removeEventListener('abort', onAbort);
  }
}

export const useWordDefinition = (
  user,
  testData,
  currentPassageIndex,
  sessionId = null,
  assistantEnabled = false
) => {
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

  const fetchWordDefinition = useCallback(
    async (word, selection = null) => {
      requestControllerRef.current?.abort();
      const controller = new AbortController();
      requestControllerRef.current = controller;
      const requestId = ++requestIdRef.current;
      let contextualPromise = null;

      try {
        // Clean the word (remove punctuation)
        const cleanWord = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
        if (!cleanWord) return;

        if (assistantEnabled && sessionId && selection) {
          contextualPromise = requestReadingAssistance({
            sessionId,
            passageIndex: currentPassageIndex,
            selectionStart: selection.start,
            selectionEnd: selection.end,
            selectedText: selection.text || word,
            action: 'dictionary',
          }).catch(() => null);
          let deadlineId;
          const contextual = await Promise.race([
            contextualPromise,
            new Promise((resolve) => {
              deadlineId = window.setTimeout(() => resolve(null), CONTEXTUAL_LOOKUP_DEADLINE_MS);
            }),
          ]);
          window.clearTimeout(deadlineId);
          if (contextual?.result && requestId === requestIdRef.current) {
            setWordDefinition((prev) => ({
              ...prev,
              word: cleanWord,
              definition: contextual.result.meaning,
              part_of_speech: contextual.result.partOfSpeech || '',
              synonyms: contextual.result.synonyms || [],
              example: contextual.result.example || '',
              pronunciation: '',
              audio: '',
              contextual: true,
              error: false,
            }));
            return;
          }
        }

        let result;
        const cachedDefinition = readCachedDefinition(cleanWord);
        if (cachedDefinition) {
          result = cachedDefinition;
        } else {
          result = await fetchFastDefinition(cleanWord, controller.signal);
          cacheDefinition(cleanWord, result);
        }

        if (requestId === requestIdRef.current)
          setWordDefinition((prev) => ({ ...prev, ...result }));
      } catch (err) {
        if (err.name === 'AbortError' || requestId !== requestIdRef.current) return;
        const contextual = contextualPromise ? await contextualPromise : null;
        if (contextual?.result && requestId === requestIdRef.current) {
          setWordDefinition((prev) => ({
            ...prev,
            definition: contextual.result.meaning,
            part_of_speech: contextual.result.partOfSpeech || '',
            synonyms: contextual.result.synonyms || [],
            example: contextual.result.example || '',
            contextual: true,
            error: false,
          }));
          return;
        }
        console.warn('Error fetching definition:', err);
        setWordDefinition((prev) => ({
          ...prev,
          definition: 'Definition not found.',
          error: true,
        }));
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
