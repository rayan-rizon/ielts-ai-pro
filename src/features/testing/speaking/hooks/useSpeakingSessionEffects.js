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
  conversationEndRef,
  transitionCardRef,
  conversationRef,
  questionIndexRef,
  timeLeftRef,
  isProcessingRef,
  pendingTimersRef,
  isMountedRef,
}) {
  useEffect(() => {
    if (!testId) return;
    callEdgeFunction('processSpeakingSession', { ping: true }).catch(() => {});
    supabase.functions.invoke('synthesizeSpeech', { body: { ping: true } }).catch(() => {});
  }, [testId]);

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

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, conversationEndRef]);

  useEffect(() => {
    if (!isPartComplete) return;

    setTimeout(() => {
      transitionCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }, [isPartComplete, transitionCardRef]);

  useEffect(() => {
    if (!isPartComplete) return;

    const scroll = () => {
      conversationEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    };

    const firstScroll = setTimeout(scroll, 100);
    const secondScroll = setTimeout(scroll, 500);
    const finalScroll = setTimeout(scroll, 1000);

    return () => {
      clearTimeout(firstScroll);
      clearTimeout(secondScroll);
      clearTimeout(finalScroll);
    };
  }, [isPartComplete, conversationEndRef]);

  useEffect(() => {
    const pendingTimers = pendingTimersRef.current;
    return () => {
      isMountedRef.current = false;
      pendingTimers.forEach((id) => clearTimeout(id));
      pendingTimers.clear();
    };
  }, [isMountedRef, pendingTimersRef]);
}
