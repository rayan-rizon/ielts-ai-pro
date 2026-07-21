import { useState, useRef, useCallback, useEffect } from 'react';

// Keep only the safety cap — user manually starts/stops recording
const MAX_RECORDING_DURATION = 120000; // 2 min absolute cap

/**
 * Custom hook encapsulating audio recording and microphone management.
 * Silence detection has been removed — recording is controlled manually by the user.
 *
 * @param {Object} options
 * @param {Function} options.processRecording - Callback invoked with the audio Blob when recording stops
 * @returns {{ startListening: Function, stopListening: Function, isListening: boolean, isRecording: boolean, micError: string|null }}
 */
export default function useAudioRecorder({ processRecording }) {
  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [micError, setMicError] = useState(null);

  // Audio refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const maxRecordingTimerRef = useRef(null);
  const startTimeRef = useRef(0); // Track start time
  const discardRecordingRef = useRef(false);

  // Web Speech API refs (parallel confidence collection)
  const speechRecognitionRef = useRef(null);
  const speechConfidenceRef = useRef([]);

  // Refs to avoid stale closures
  const isListeningRef = useRef(false);
  const isRecordingRef = useRef(false);
  const isProcessingRef = useRef(false);

  // Stop listening — called manually by user or by safety timer
  const stopListening = useCallback(() => {
    if (maxRecordingTimerRef.current) {
      clearTimeout(maxRecordingTimerRef.current);
      maxRecordingTimerRef.current = null;
    }

    // Stop Web Speech API recognition
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {
        /* already stopped */
      }
      speechRecognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setIsListening(false);
    isListeningRef.current = false;
    setIsRecording(false);
    isRecordingRef.current = false;
  }, []);

  // End microphone capture without submitting the buffered audio. This is used
  // when the test completes or the page unmounts so a late MediaRecorder event
  // cannot create another paid turn or overwrite the completed report.
  const cancelListening = useCallback(() => {
    discardRecordingRef.current = true;
    stopListening();
  }, [stopListening]);

  // Start listening — user presses the mic button
  const startListening = useCallback(async () => {
    if (isProcessingRef.current || isRecordingRef.current || isListeningRef.current) return;

    try {
      setMicError(null);
      discardRecordingRef.current = false;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1, // Mono
          sampleRate: 16000, // 16kHz (optimal for speech AI, reduces file size)
        },
      });
      streamRef.current = stream;

      // Use capability check for cross-browser support (Safari doesn't support webm)
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : ''; // Let browser choose default

      const mediaRecorder = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: 24000, // 24kbps — sufficient for speech, halves payload
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const duration = Date.now() - startTimeRef.current;

        if (discardRecordingRef.current) {
          discardRecordingRef.current = false;
          audioChunksRef.current = [];
          return;
        }

        // Enforce minimum duration (e.g. 1.5 seconds) to prevent accidental clicks
        if (duration < 1500) {
          await processRecording(null, { error: 'too_short', duration });
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || 'audio/webm',
        });
        const speechConfidence =
          speechConfidenceRef.current.length > 0 ? [...speechConfidenceRef.current] : null;
        await processRecording(audioBlob, { duration, speechConfidence });
      };

      mediaRecorder.start(100);
      startTimeRef.current = Date.now();

      // Start Web Speech API in parallel for confidence collection
      speechConfidenceRef.current = [];
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = false;
          recognition.lang = 'en-GB';
          recognition.onresult = (event) => {
            for (let i = event.resultIndex; i < event.results.length; i++) {
              if (event.results[i].isFinal) {
                const alt = event.results[i][0];
                speechConfidenceRef.current.push({
                  transcript: alt.transcript,
                  confidence: alt.confidence,
                });
              }
            }
          };
          recognition.onerror = () => {
            /* non-critical — swallow */
          };
          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch {
          /* Web Speech API unavailable — continue without it */
        }
      }
      setIsListening(true);
      isListeningRef.current = true;
      setIsRecording(true);
      isRecordingRef.current = true;

      // Safety cap — auto-stop after 2 minutes to prevent runaway recordings
      maxRecordingTimerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          stopListening();
        }
      }, MAX_RECORDING_DURATION);
    } catch (err) {
      console.error('Microphone error:', err);
      if (err.name === 'NotAllowedError') {
        setMicError(
          'Microphone access denied. Please allow microphone access in your browser settings.'
        );
      } else if (err.name === 'NotFoundError') {
        setMicError('No microphone found. Please connect a microphone and try again.');
      } else {
        setMicError('Could not access microphone: ' + err.message);
      }
    }
  }, [processRecording, stopListening]);

  // Expose isProcessingRef setter for parent to sync
  const setIsProcessing = useCallback((val) => {
    isProcessingRef.current = val;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelListening();
    };
  }, [cancelListening]);

  return {
    startListening,
    stopListening,
    cancelListening,
    isListening,
    isRecording,
    micError,
    setIsProcessing,
  };
}
