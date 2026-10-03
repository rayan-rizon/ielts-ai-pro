import { useState, useCallback, useEffect, useRef } from 'react';

const DICTIONARY_API_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en';
const DATAMUSE_API_URL = 'https://api.datamuse.com/words';
const LOOKUP_TIMEOUT_MS = 7000;

function isUsableDefinition(definition) {
  return (
    typeof definition === 'string' &&
    Boolean(definition.trim()) &&
    !/^(definition unavailable|definition not found|saved ielts vocabulary word|no definition)$/i.test(
      definition.trim()
    )
  );
}

function findAudioUrl(phonetics) {
  if (!phonetics) return '';
  const found = phonetics.find((p) => p.audio);
  return found ? found.audio : '';
}

function extractFirstMeaning(meanings) {
  for (const meaning of meanings || []) {
    const definition = meaning.definitions?.find((item) => isUsableDefinition(item?.definition));
    if (definition) {
      return {
        definition: definition.definition.trim(),
        example: definition.example || '',
        partOfSpeech: meaning.partOfSpeech || '',
      };
    }
  }
  return null;
}

function parseDictionaryResponse(data) {
  if (!Array.isArray(data) || data.length === 0) return null;
  const firstEntry = data[0];
  const meanings = firstEntry.meanings || [];
  const meaning = extractFirstMeaning(meanings);
  if (!meaning) return null;

  return {
    word: firstEntry.word,
    phonetic: firstEntry.phonetic || '',
    ...meaning,
    audio: findAudioUrl(firstEntry.phonetics),
    allMeanings: meanings,
  };
}

function parseDatamuseResponse(data, word) {
  const entry = Array.isArray(data)
    ? data.find((item) => item.word?.trim().toLowerCase() === word.trim().toLowerCase())
    : null;
  const rawDefinition = entry?.defs?.find(isUsableDefinition);
  if (!rawDefinition) return null;

  const [partOfSpeech = '', ...definitionParts] = rawDefinition.split('\t');
  const definition = definitionParts.join('\t').trim() || rawDefinition.trim();
  if (!isUsableDefinition(definition)) return null;

  return {
    word: entry.word,
    phonetic: '',
    definition,
    example: '',
    partOfSpeech,
    audio: '',
    allMeanings: [],
  };
}

async function fetchJson(url, signal) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Definition service returned ${response.status}`);
  return response.json();
}

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
        let result = null;
        try {
          const data = await fetchJson(
            `${DICTIONARY_API_URL}/${encodeURIComponent(trimmed)}`,
            controller.signal
          );
          result = parseDictionaryResponse(data);
        } catch (lookupError) {
          if (controller.signal.aborted) throw lookupError;
        }

        if (!result && !controller.signal.aborted) {
          try {
            const data = await fetchJson(
              `${DATAMUSE_API_URL}?sp=${encodeURIComponent(trimmed)}&md=d&max=5`,
              controller.signal
            );
            result = parseDatamuseResponse(data, trimmed);
          } catch (lookupError) {
            if (controller.signal.aborted) throw lookupError;
          }
        }

        if (!result) throw new Error('No definition found');
        if (requestId === requestIdRef.current) setWordData(result);
        return result;
      } catch {
        if (requestId === requestIdRef.current) {
          setError(
            controller.signal.aborted ? 'Definition lookup timed out' : 'No definition found'
          );
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
