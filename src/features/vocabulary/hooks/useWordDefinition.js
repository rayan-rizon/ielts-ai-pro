import { useState, useEffect, useCallback } from 'react';

const DICTIONARY_API_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en';

/**
 * Custom hook for fetching word definitions from dictionary API
 */
export function useWordDefinition() {
  const [isFetchingDef, setIsFetchingDef] = useState(false);
  const [wordData, setWordData] = useState(null);
  const [error, setError] = useState(null);

  const fetchWordDetails = useCallback(async (word) => {
    if (!word?.trim()) return null;

    setIsFetchingDef(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const response = await fetch(`${DICTIONARY_API_URL}/${encodeURIComponent(word.trim())}`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error('Word not found');
      }

      const data = await response.json();

      if (data && data.length > 0) {
        const firstEntry = data[0];
        const meanings = firstEntry.meanings || [];

        // Get the first definition
        let definition = '';
        let example = '';
        let partOfSpeech = '';

        if (meanings.length > 0) {
          const firstMeaning = meanings[0];
          partOfSpeech = firstMeaning.partOfSpeech || '';

          if (firstMeaning.definitions && firstMeaning.definitions.length > 0) {
            definition = firstMeaning.definitions[0].definition || '';
            example = firstMeaning.definitions[0].example || '';
          }
        }

        const result = {
          word: firstEntry.word,
          phonetic: firstEntry.phonetic || '',
          definition: definition || 'Definition unavailable.',
          example,
          partOfSpeech,
          audio: firstEntry.phonetics?.find((p) => p.audio)?.audio || '',
          allMeanings: meanings,
        };

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

/**
 * Custom hook for word suggestions/autocomplete
 */
export function useWordSuggestions() {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSuggestions = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return [];
    }

    setIsLoading(true);
    try {
      // Use datamuse API for suggestions
      const response = await fetch(
        `https://api.datamuse.com/sug?s=${encodeURIComponent(query)}&max=5`
      );
      const data = await response.json();
      setSuggestions(data);
      return data;
    } catch (error) {
      console.error('Suggestion fetch error:', error);
      setSuggestions([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  return {
    suggestions,
    isLoading,
    fetchSuggestions,
    clearSuggestions,
  };
}
