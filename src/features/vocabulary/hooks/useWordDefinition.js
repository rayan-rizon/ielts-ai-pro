import { useState, useCallback, useRef } from 'react';

const DICTIONARY_API_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en';

function findAudioUrl(phonetics) {
  if (!phonetics) return '';
  const found = phonetics.find((p) => p.audio);
  return found ? found.audio : '';
}

function extractFirstMeaning(meanings) {
  const defaultResult = { definition: 'Definition unavailable.', example: '', partOfSpeech: '' };
  if (!meanings || meanings.length === 0) return defaultResult;

  const firstMeaning = meanings[0];
  const partOfSpeech = firstMeaning.partOfSpeech || '';

  const definitions = firstMeaning.definitions || [];
  if (definitions.length === 0) {
    return { definition: 'Definition unavailable.', example: '', partOfSpeech };
  }

  const firstDef = definitions[0];
  return {
    definition: firstDef.definition || 'Definition unavailable.',
    example: firstDef.example || '',
    partOfSpeech,
  };
}

function parseDictionaryResponse(data) {
  if (!data || data.length === 0) return null;
  const firstEntry = data[0];
  const meanings = firstEntry.meanings || [];
  const { definition, example, partOfSpeech } = extractFirstMeaning(meanings);

  return {
    word: firstEntry.word,
    phonetic: firstEntry.phonetic || '',
    definition,
    example,
    partOfSpeech,
    audio: findAudioUrl(firstEntry.phonetics),
    allMeanings: meanings,
  };
}

/**
 * Custom hook for fetching word definitions from dictionary API
 */
export function useWordDefinition() {
  const [isFetchingDef, setIsFetchingDef] = useState(false);
  const [wordData, setWordData] = useState(null);
  const [error, setError] = useState(null);

  const fetchWordDetails = useCallback(async (word) => {
    const trimmed = (word || '').trim();
    if (!trimmed) return null;

    setIsFetchingDef(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const response = await fetch(`${DICTIONARY_API_URL}/${encodeURIComponent(trimmed)}`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error('Word not found');
      }

      const data = await response.json();
      const result = parseDictionaryResponse(data);
      if (result) {
        setWordData(result);
        return result;
      }
      return null;
    } catch (err) {
      const errorMessage = err.name === 'AbortError' ? 'Request timed out' : err.message;
      setError(errorMessage);
      return null;
    } finally {
      clearTimeout(timeoutId);
      setIsFetchingDef(false);
    }
  }, []);

  const clearWordData = useCallback(() => {
    setWordData(null);
    setError(null);
  }, []);

  return {
    isFetchingDef,
    wordData,
    error,
    fetchWordDetails,
    clearWordData,
  };
}

async function fetchSuggestionsFromAPI(query, signal) {
  const response = await fetch(
    `https://api.datamuse.com/sug?s=${encodeURIComponent(query)}&max=5`,
    { signal }
  );
  if (!response.ok) throw new Error('Network response was not ok');
  return response.json();
}

/**
 * Custom hook for word suggestions/autocomplete
 */
export function useWordSuggestions() {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const activeRequestRef = useRef(null);

  const fetchSuggestions = useCallback(async (query) => {
    const trimmed = (query || '').trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      return [];
    }

    activeRequestRef.current?.abort();

    const controller = new AbortController();
    activeRequestRef.current = controller;

    setIsLoading(true);
    try {
      const data = await fetchSuggestionsFromAPI(trimmed, controller.signal);
      setSuggestions(data);
      return data;
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Suggestion fetch error:', error);
        setSuggestions([]);
      }
      return [];
    } finally {
      if (activeRequestRef.current === controller) {
        setIsLoading(false);
      }
    }
  }, []);

  const clearSuggestions = useCallback(() => {
    activeRequestRef.current?.abort();
    setSuggestions([]);
  }, []);

  return {
    suggestions,
    isLoading,
    fetchSuggestions,
    clearSuggestions,
  };
}
