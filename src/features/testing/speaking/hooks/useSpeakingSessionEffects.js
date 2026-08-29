import { useEffect } from 'react';

import { supabase } from '@/lib/supabase';
import { callEdgeFunction } from '@/utils/api';

export default function useSpeakingSessionEffects({
  testId,
  cancelCurrentAudio,
  conversation,
  currentQuestionIndex,
  timeLeft,
  isProcessing,
  isPartComplete,
  transitionCardRef,
  conversationRef,
  questionIndexRef,
  timeLeftRef,
  isProcessingRef,
  pendingTimersRef,
  isMountedRef,
  useSpeakingV2 = false,
}) {
  useEffect(() => {
    if (!testId) return;
    // V2 owns the complete speaking pipeline. Do not warm the retired
    // processSpeakingSession endpoint for a V2 room: it adds a second Edge
    // invocation on every mount and can race the authoritative state flow.
    if (!useSpeakingV2) {
      callEdgeFunction('processSpeakingSession', { ping: true }).catch(() => {});
    }
    supabase.functions.invoke('synthesizeSpeech', { body: { ping: true } }).catch(() => {});
  }, [testId, useSpeakingV2]);

  useEffect(() => {
    return () => {
      cancelCurrentAudio();
    };
  }, [cancelCurrentAudio]);

  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation, conversationRef]);

  useEffect(() => {
    questionIndexRef.current = currentQuestionIndex;
  }, [currentQuestionIndex, questionIndexRef]);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft, timeLeftRef]);

  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing, isProcessingRef]);

  // Transcript auto-scroll lives in SpeakingConversationPanel, which owns the
  // scroll container. Observing it from here could not work: the page renders
  // a loader until the session loads, so this hook's mount effect ran while
  // the container ref was still null and never re-ran to catch it appearing.
  useEffect(() => {
    if (!isPartComplete) return undefined;

    const revealTransition = setTimeout(() => {
      transitionCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
    return () => clearTimeout(revealTransition);
  }, [isPartComplete, transitionCardRef]);

  useEffect(() => {
    const pendingTimers = pendingTimersRef.current;
    return () => {
      isMountedRef.current = false;
      pendingTimers.forEach((id) => clearTimeout(id));
      pendingTimers.clear();
    };
  }, [isMountedRef, pendingTimersRef]);
}
