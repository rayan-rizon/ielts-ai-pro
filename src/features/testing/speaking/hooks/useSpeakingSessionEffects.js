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
  conversationContainerRef,
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
    const container = conversationContainerRef.current;
    if (!container) return;

    const scroll = () => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      });
    };

    // Scroll immediately when conversation array updates
    scroll();

    // Fire again as animation is completing to ensure it stays pinned
    const t1 = setTimeout(scroll, 100);
    const t2 = setTimeout(scroll, 250);
    const t3 = setTimeout(scroll, 450);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [conversation, conversationContainerRef]);

  useEffect(() => {
    if (!isPartComplete) return;

    setTimeout(() => {
      transitionCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }, [isPartComplete, transitionCardRef]);

  useEffect(() => {
    if (!isPartComplete) return;

    const container = conversationContainerRef.current;
    if (!container) return;

    const scroll = () => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      });
    };

    const firstScroll = setTimeout(scroll, 100);
    const secondScroll = setTimeout(scroll, 500);
    const finalScroll = setTimeout(scroll, 1000);

    return () => {
      clearTimeout(firstScroll);
      clearTimeout(secondScroll);
      clearTimeout(finalScroll);
    };
  }, [isPartComplete, conversationContainerRef]);

  useEffect(() => {
    const pendingTimers = pendingTimersRef.current;
    return () => {
      isMountedRef.current = false;
      pendingTimers.forEach((id) => clearTimeout(id));
      pendingTimers.clear();
    };
  }, [isMountedRef, pendingTimersRef]);
}
