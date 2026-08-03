import { useEffect } from 'react';

import { supabase } from '@/lib/supabase';
import { callEdgeFunction } from '@/utils/api';

import useConversationAutoScroll from './useConversationAutoScroll';

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

  // The container watches itself for growth, so the transcript follows the
  // draft bubble and the examiner's reply after Finish — moments when the
  // `conversation` array itself never changes.
  const { scrollToLatest } = useConversationAutoScroll(conversationContainerRef);

  // Re-follow on every new entry even if the learner had scrolled back to read.
  useEffect(() => {
    if (conversation.length > 0) scrollToLatest('smooth');
  }, [conversation, scrollToLatest]);

  useEffect(() => {
    if (!isPartComplete) return undefined;

    const revealTransition = setTimeout(() => {
      transitionCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      scrollToLatest('smooth');
    }, 100);
    return () => clearTimeout(revealTransition);
  }, [isPartComplete, scrollToLatest, transitionCardRef]);

  useEffect(() => {
    const pendingTimers = pendingTimersRef.current;
    return () => {
      isMountedRef.current = false;
      pendingTimers.forEach((id) => clearTimeout(id));
      pendingTimers.clear();
    };
  }, [isMountedRef, pendingTimersRef]);
}
