import { useState, useCallback, useEffect, useRef } from 'react';

import { fetchFastDefinition } from '../utils/dictionaryLookup';

const LOOKUP_TIMEOUT_MS = 7000;

/**
 * Custom hook for fetching word definitions from dictionary API
 */
export function useWordDefinition() {
  const [isFetchingDef, setIsFetchingDef] = useState(false);
  const [wordData, setWordData] = useState(null);
  const [error, setError] = useState(null);
  const requestRef = useRef(null);
  const requestIdRef = useRef(0);

  useEffect(
    () => () => {
      requestIdRef.current += 1;
      requestRef.current?.controller.abort();
    },
    []
  );

  const fetchWordDetails = useCallback(async (word) => {
    const trimmed = (word || '').trim();
    if (!trimmed) return null;

    const normalizedWord = trimmed.toLowerCase();
    if (requestRef.current?.word === normalizedWord) return requestRef.current.promise;

    requestRef.current?.controller.abort();
    const controller = new AbortController();
    const requestId = ++requestIdRef.current;
    const timeoutId = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS);

    setIsFetchingDef(true);
    setError(null);

    const promise = (async () => {
      try {
        const result = await fetchFastDefinition(trimmed, controller.signal);
        if (requestId !== requestIdRef.current) return null;
        setWordData(result);
        return result;
      } catch {
        if (requestId === requestIdRef.current) {
          setError('No definition found. Enter the meaning manually.');
        }
        return null;
      } finally {
        clearTimeout(timeoutId);
        if (requestId === requestIdRef.current) {
          setIsFetchingDef(false);
          requestRef.current = null;
        }
      }
    })();

    requestRef.current = { word: normalizedWord, controller, promise };
    return promise;
  }, []);

  const clearWordData = useCallback(() => {
    requestIdRef.current += 1;
    requestRef.current?.controller.abort();
    requestRef.current = null;
    setIsFetchingDef(false);
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
