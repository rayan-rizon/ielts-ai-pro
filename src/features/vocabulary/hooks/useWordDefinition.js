import { useState, useCallback, useEffect, useRef } from 'react';

import { defineWord, getBlockedSeconds, VocabDefineError } from '../services/vocabDefineService';

const WAIT_KINDS = new Set(['quota', 'burst', 'busy', 'budget']);
const BUDGET_RETRY_SECONDS = 300;

/**
 * Looks a word up as an AI word card (meaning, translation, IPA, examples...).
 *
 * `status` is idle | loading | ready | error. A refusal that means "wait"
 * (rate limit, daily allowance) is exposed as `retryIn` seconds that counts down,
 * so the UI can disable the button and say when it comes back instead of letting
 * the learner hammer it.
 */
export function useWordDefinition() {
  const [status, setStatus] = useState('idle');
  const [card, setCard] = useState(null);
  const [error, setError] = useState(null);
  const [quota, setQuota] = useState({ remaining: null, resetsAt: null });
  const [retryUntil, setRetryUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const requestIdRef = useRef(0);
  const controllerRef = useRef(null);

  useEffect(
    () => () => {
      requestIdRef.current += 1;
      controllerRef.current?.abort();
    },
    []
  );

  const retryIn = Math.max(0, Math.ceil((retryUntil - now) / 1000));

  // Tick only while a wait is running.
  useEffect(() => {
    if (retryUntil <= Date.now()) return undefined;
    const timer = setInterval(() => {
      setNow(Date.now());
      if (Date.now() >= retryUntil)
        setError((current) => (current?.kind === 'budget' ? current : null));
    }, 1000);
    return () => clearInterval(timer);
  }, [retryUntil]);

  const lookup = useCallback(async (word, { hint = '', language = 'bn' } = {}) => {
    const entry = (word || '').trim();
    if (!entry) return null;

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const requestId = ++requestIdRef.current;
    const isCurrent = () => requestId === requestIdRef.current;

    setStatus('loading');
    setError(null);
    try {
      const result = await defineWord(entry, { hint, language, signal: controller.signal });
      if (!isCurrent()) return null;
      setCard(result.card);
      setStatus('ready');
      setQuota({ remaining: result.remainingDailyQuota, resetsAt: result.quotaResetsAt });
      return result.card;
    } catch (caught) {
      if (!isCurrent() || caught?.name === 'AbortError') return null;
      const mapped =
        caught instanceof VocabDefineError
          ? caught
          : new VocabDefineError('unavailable', 'AI lookup is unavailable right now.');
      setCard(null);
      setError(mapped);
      setStatus('error');
      if (mapped.kind === 'quota') setQuota({ remaining: 0, resetsAt: mapped.quotaResetsAt });
      if (WAIT_KINDS.has(mapped.kind)) {
        const seconds =
          mapped.kind === 'budget'
            ? BUDGET_RETRY_SECONDS
            : Math.max(getBlockedSeconds(), mapped.retryAfterSeconds || 0);
        setNow(Date.now());
        setRetryUntil(Date.now() + seconds * 1000);
      }
      return null;
    }
  }, []);

  const clear = useCallback(() => {
    requestIdRef.current += 1;
    controllerRef.current?.abort();
    setStatus('idle');
    setCard(null);
    setError(null);
  }, []);

  return {
    status,
    isLooking: status === 'loading',
    card,
    error,
    quota,
    retryIn,
    lookup,
    clear,
  };
}

const SUGGESTION_CACHE_LIMIT = 200;
const suggestionCache = new Map();

async function fetchSuggestionsFromAPI(query, signal) {
  const key = query.toLowerCase();
  if (suggestionCache.has(key)) return suggestionCache.get(key);
  const response = await fetch(
    `https://api.datamuse.com/sug?s=${encodeURIComponent(query)}&max=5`,
    { signal }
  );
  if (!response.ok) throw new Error('Network response was not ok');
  const data = await response.json();
  if (suggestionCache.size >= SUGGESTION_CACHE_LIMIT) {
    suggestionCache.delete(suggestionCache.keys().next().value);
  }
  suggestionCache.set(key, data);
  return data;
}

/**
 * Autocomplete and spelling check for the word box. Datamuse only suggests
 * spellings here; every meaning shown to the learner comes from the AI card.
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
