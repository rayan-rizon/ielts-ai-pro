import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getReadingAssistantStatus,
  requestReadingAssistance,
} from '@/features/testing/reading/services/readingAiService';

const ACTION_LABELS = { translate: 'Translate', breakdown: 'Breakdown' };
const LANGUAGE_KEY = 'reading_assistant_language_v1';
const DEFAULT_LANGUAGE = 'bn';

function storedLanguage() {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  return window.localStorage.getItem(LANGUAGE_KEY) || DEFAULT_LANGUAGE;
}

export function useSentenceAssistant({ sessionId, passageIndex, enabled }) {
  const [language, setLanguageState] = useState(storedLanguage);
  const [assistant, setAssistant] = useState(null);
  const [status, setStatus] = useState(null);
  const requestSequence = useRef(0);

  useEffect(() => {
    if (!enabled || !sessionId) {
      setStatus(null);
      return;
    }
    let active = true;
    getReadingAssistantStatus(sessionId)
      .then((value) => {
        if (active) setStatus(value);
      })
      .catch(() => {
        if (active) setStatus(null);
      });
    return () => {
      active = false;
    };
  }, [enabled, sessionId]);

  useEffect(() => {
    requestSequence.current += 1;
    setAssistant(null);
  }, [sessionId, passageIndex, enabled]);

  const setLanguage = useCallback((value) => {
    setLanguageState(value);
    if (typeof window !== 'undefined') window.localStorage.setItem(LANGUAGE_KEY, value);
  }, []);

  const request = useCallback(
    async (action, selection, position, languageOverride = null) => {
      if (!enabled || !sessionId || !selection) return;
      const sequence = ++requestSequence.current;
      setAssistant({ action, selection, position, loading: true, result: null, error: null });
      try {
        const response = await requestReadingAssistance({
          sessionId,
          passageIndex,
          selectionStart: selection.start,
          selectionEnd: selection.end,
          selectedText: selection.text,
          action,
          ...(action === 'translate' ? { targetLanguage: languageOverride || language } : {}),
        });
        if (sequence !== requestSequence.current) return;
        setStatus((previous) => ({
          ...(previous || {}),
          // Translate and Breakdown hold separate allowances, so the server
          // reports both and the popover reads the one it is showing.
          remainingByAction: response.remainingByAction ?? previous?.remainingByAction ?? null,
          quotaResetsAt: response.quotaResetsAt ?? previous?.quotaResetsAt ?? null,
        }));
        setAssistant({
          action,
          selection,
          position,
          loading: false,
          result: response.result,
          error: null,
        });
      } catch (error) {
        if (sequence !== requestSequence.current) return;
        const quotaExceeded =
          error.status === 429 && /free (Translate|Breakdown) results/i.test(error.message || '');
        setAssistant({
          action,
          selection,
          position,
          loading: false,
          result: null,
          error: quotaExceeded
            ? `You have used today’s free ${ACTION_LABELS[action] || 'assistant'} results. They reset at midnight UTC.`
            : error.userMessage || error.message || 'Reading help is temporarily unavailable.',
          quotaExceeded,
        });
      }
    },
    [enabled, language, passageIndex, sessionId]
  );

  const changeAction = useCallback(
    (action) => {
      if (!assistant?.selection || !assistant?.position) return;
      request(action, assistant.selection, assistant.position);
    },
    [assistant, request]
  );

  const close = useCallback(() => {
    requestSequence.current += 1;
    setAssistant(null);
  }, []);

  return { assistant, status, language, setLanguage, request, changeAction, close };
}
