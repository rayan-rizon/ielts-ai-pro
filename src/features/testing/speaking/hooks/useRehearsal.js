import { useCallback, useEffect, useRef, useState } from 'react';

const MAX_SECONDS = 150;

const getRecognitionClass = () =>
  typeof window === 'undefined'
    ? null
    : window.SpeechRecognition || window.webkitSpeechRecognition || null;

/**
 * Times a spoken re-answer and transcribes it with the browser's own speech
 * recognition. Nothing is uploaded and no model is called, so re-answering
 * costs nothing. Where the browser has no recogniser, the timer still works
 * and the self-check falls back to length only.
 */
export default function useRehearsal() {
  const [status, setStatus] = useState('idle'); // idle | recording | done | error
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);
  const activeRef = useRef(false);
  const startedAtRef = useRef(0);
  const timerRef = useRef(null);
  const finalRef = useRef('');
  const supportsTranscript = Boolean(getRecognitionClass());

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const stop = useCallback(() => {
    if (!activeRef.current) return;
    activeRef.current = false;
    clearTimer();
    setSeconds(Math.round((performance.now() - startedAtRef.current) / 1000));
    try {
      recognitionRef.current?.stop();
    } catch {
      // The recogniser may already have stopped after silence.
    }
    recognitionRef.current = null;
    setStatus('done');
  }, []);

  const start = useCallback(() => {
    setError('');
    setTranscript('');
    setSeconds(0);
    finalRef.current = '';
    activeRef.current = true;
    startedAtRef.current = performance.now();
    setStatus('recording');

    timerRef.current = setInterval(() => {
      const elapsed = (performance.now() - startedAtRef.current) / 1000;
      setSeconds(Math.floor(elapsed));
      if (elapsed >= MAX_SECONDS) stop();
    }, 250);

    const Recognition = getRecognitionClass();
    if (!Recognition) return;

    const listen = () => {
      const recognition = new Recognition();
      recognition.lang = 'en-GB';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (event) => {
        let interim = '';
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const text = event.results[index]?.[0]?.transcript || '';
          if (event.results[index].isFinal) finalRef.current = `${finalRef.current} ${text}`;
          else interim += ` ${text}`;
        }
        setTranscript(`${finalRef.current} ${interim}`.replace(/\s+/g, ' ').trim());
      };
      recognition.onerror = (event) => {
        if (event?.error === 'not-allowed' || event?.error === 'service-not-allowed') {
          setError('Microphone access is blocked. Allow it in your browser to re-answer.');
          activeRef.current = false;
          clearTimer();
          setStatus('error');
        }
      };
      // Browsers end recognition after a pause; keep listening until Stop.
      recognition.onend = () => {
        if (activeRef.current && recognitionRef.current === recognition) listen();
      };
      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch {
        // start() throws if called twice in quick succession; the timer still runs.
      }
    };
    listen();
  }, [stop]);

  const reset = useCallback(() => {
    activeRef.current = false;
    clearTimer();
    try {
      recognitionRef.current?.abort?.();
    } catch {
      // Already stopped.
    }
    recognitionRef.current = null;
    setStatus('idle');
    setSeconds(0);
    setTranscript('');
    setError('');
  }, []);

  useEffect(
    () => () => {
      activeRef.current = false;
      clearTimer();
      try {
        recognitionRef.current?.abort?.();
      } catch {
        // Already stopped.
      }
    },
    []
  );

  return {
    status,
    seconds,
    transcript,
    error,
    supportsTranscript,
    start,
    stop,
    reset,
    maxSeconds: MAX_SECONDS,
  };
}
