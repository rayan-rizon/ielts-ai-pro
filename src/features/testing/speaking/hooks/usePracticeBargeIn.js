import { useEffect, useRef } from 'react';

import { getSharedCaptureAudioContext } from '../utils/audioRecorderRuntime';
import { createBargeInDetector, rmsFromByteSamples } from '../utils/bargeInDetector';

const ANALYSIS_INTERVAL_MS = 50;

/**
 * While the practice coach is speaking, listen for the learner starting to
 * talk and call onBargeIn once. The microphone is opened only for the length
 * of the coach's speech and released as soon as it ends or the learner
 * interrupts, so the answer recorder can take it over.
 */
export default function usePracticeBargeIn({ enabled, isPlaybackActive, onBargeIn }) {
  const onBargeInRef = useRef(onBargeIn);
  onBargeInRef.current = onBargeIn;

  useEffect(() => {
    if (!enabled || !isPlaybackActive) return undefined;
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return undefined;

    let cancelled = false;
    let stream = null;
    let source = null;
    let timer = null;

    const release = () => {
      if (timer) clearInterval(timer);
      timer = null;
      try {
        source?.disconnect();
      } catch {
        // Already disconnected.
      }
      stream?.getTracks().forEach((track) => track.stop());
      stream = null;
    };

    navigator.mediaDevices
      .getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
      .then((micStream) => {
        if (cancelled) {
          micStream.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = micStream;
        const audioContext = getSharedCaptureAudioContext();
        if (!audioContext) return release();
        if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.6;
        source = audioContext.createMediaStreamSource(micStream);
        source.connect(analyser);

        const samples = new Uint8Array(analyser.fftSize);
        const detector = createBargeInDetector();
        timer = setInterval(() => {
          analyser.getByteTimeDomainData(samples);
          if (detector.push(rmsFromByteSamples(samples), Date.now())) {
            release();
            if (!cancelled) onBargeInRef.current?.();
          }
        }, ANALYSIS_INTERVAL_MS);
      })
      // No permission or no device: the Interrupt button still works.
      .catch(() => {});

    return () => {
      cancelled = true;
      release();
    };
  }, [enabled, isPlaybackActive]);
}
