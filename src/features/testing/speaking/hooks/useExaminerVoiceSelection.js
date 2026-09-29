import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';

import { getSpeakingVoice } from '../utils/speakingAccents';
import { setSpeakingTtsProfile, setSpeakingTtsVoice } from '../utils/speakingTtsPrefetch';

export default function useExaminerVoiceSelection({
  cancelCurrentAudio,
  isMuted,
  setExaminerVoice,
  setSpeakingMode,
  speakText,
}) {
  const [previewVoice, setPreviewVoice] = useState(null);
  const previewRequestRef = useRef(0);

  const stopVoicePreview = useCallback(() => {
    previewRequestRef.current += 1;
    setPreviewVoice(null);
    cancelCurrentAudio();
  }, [cancelCurrentAudio]);

  const handleExaminerVoiceChange = useCallback(
    (value) => {
      const voiceId = getSpeakingVoice(value).id;
      if (previewVoice) stopVoicePreview();
      setSpeakingTtsVoice(voiceId);
      setExaminerVoice(voiceId);
    },
    [previewVoice, setExaminerVoice, stopVoicePreview]
  );

  const handleVoicePreview = useCallback(
    async (voiceId, text) => {
      if (isMuted) {
        toast.info('Unmute examiner audio to hear a voice preview.');
        return;
      }
      if (previewVoice === voiceId) {
        stopVoicePreview();
        return;
      }

      stopVoicePreview();
      setSpeakingTtsProfile('exam');
      setSpeakingTtsVoice(voiceId);
      setExaminerVoice(voiceId);
      const request = ++previewRequestRef.current;
      setPreviewVoice(voiceId);
      try {
        await speakText(text, { cancel: true, requireProviderVoice: true });
      } catch {
        toast.error('Voice preview is unavailable. Please try again.');
      } finally {
        if (previewRequestRef.current === request) setPreviewVoice(null);
      }
    },
    [isMuted, previewVoice, setExaminerVoice, speakText, stopVoicePreview]
  );

  const handleSpeakingModeChange = useCallback(
    (mode) => {
      if (previewVoice) stopVoicePreview();
      setSpeakingMode(mode);
    },
    [previewVoice, setSpeakingMode, stopVoicePreview]
  );

  return {
    handleExaminerVoiceChange,
    handleSpeakingModeChange,
    handleVoicePreview,
    previewVoice,
    stopVoicePreview,
  };
}
