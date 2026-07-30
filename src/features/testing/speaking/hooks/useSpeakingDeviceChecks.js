import { useCallback, useEffect, useRef, useState } from 'react';

const MICROPHONE_TEST_DURATION_MS = 1400;
const VOICE_LEVEL_THRESHOLD = 0.012;

function getAudioContext() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  return AudioContext ? new AudioContext() : null;
}

function calculateSignalLevel(analyser, samples) {
  analyser.getByteTimeDomainData(samples);
  let sum = 0;
  for (let index = 0; index < samples.length; index += 1) {
    const normalized = (samples[index] - 128) / 128;
    sum += normalized * normalized;
  }
  return Math.sqrt(sum / samples.length);
}

async function measureMicrophone(stream) {
  const audioContext = getAudioContext();
  if (!audioContext) return { detected: true, level: null };

  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = 0.68;
  audioContext.createMediaStreamSource(stream).connect(analyser);
  await audioContext.resume().catch(() => {});

  const samples = new Uint8Array(analyser.fftSize);
  let peakLevel = 0;

  await new Promise((resolve) => {
    const startedAt = Date.now();
    const sampleInput = () => {
      peakLevel = Math.max(peakLevel, calculateSignalLevel(analyser, samples));
      if (Date.now() - startedAt >= MICROPHONE_TEST_DURATION_MS) {
        resolve();
        return;
      }
      setTimeout(sampleInput, 70);
    };
    sampleInput();
  });

  await audioContext.close().catch(() => {});
  return { detected: peakLevel >= VOICE_LEVEL_THRESHOLD, level: peakLevel };
}

function playSpeakerTone(audioContext) {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const now = audioContext.currentTime;

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(620, now);
  oscillator.frequency.exponentialRampToValueAtTime(820, now + 0.24);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.34);

  return new Promise((resolve) => {
    oscillator.onended = resolve;
  });
}

export default function useSpeakingDeviceChecks() {
  const [microphoneStatus, setMicrophoneStatus] = useState('idle');
  const [speakerStatus, setSpeakerStatus] = useState('idle');
  const mountedRef = useRef(true);
  const microphoneBusyRef = useRef(false);
  const speakerBusyRef = useRef(false);

  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    []
  );

  const testMicrophone = useCallback(async () => {
    if (microphoneBusyRef.current) return;
    microphoneBusyRef.current = true;
    setMicrophoneStatus('testing');
    let stream;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      const result = await measureMicrophone(stream);
      if (mountedRef.current) {
        setMicrophoneStatus(result.detected ? 'ready' : 'quiet');
      }
    } catch {
      if (mountedRef.current) setMicrophoneStatus('error');
    } finally {
      stream?.getTracks().forEach((track) => track.stop());
      microphoneBusyRef.current = false;
    }
  }, []);

  const testSpeaker = useCallback(async () => {
    if (speakerBusyRef.current) return;
    speakerBusyRef.current = true;
    setSpeakerStatus('testing');
    const audioContext = getAudioContext();

    if (!audioContext) {
      setSpeakerStatus('error');
      speakerBusyRef.current = false;
      return;
    }

    try {
      await audioContext.resume();
      await playSpeakerTone(audioContext);
      if (mountedRef.current) setSpeakerStatus('ready');
    } catch {
      if (mountedRef.current) setSpeakerStatus('error');
    } finally {
      await audioContext.close().catch(() => {});
      speakerBusyRef.current = false;
    }
  }, []);

  return {
    microphoneStatus,
    speakerStatus,
    testMicrophone,
    testSpeaker,
  };
}
