import { useEffect } from 'react';

import { Passage } from '@/features/testing/shared/services/Passage';
import { TestSession } from '@/features/testing/shared/services/TestSession';
import { supabase } from '@/lib/supabase';
import { callEdgeFunction } from '@/utils/api';

import {
  buildAverageSpeakingEvaluation,
  buildCueCardTopic,
  buildLegacySpeakingEvaluation,
  buildSpeakingResumeState,
  getQuestionLines,
} from '../utils/speakingTestUtils';
import { prefetchSpeakingTts } from '../utils/speakingTtsPrefetch';

function isSpeakingV2Session(session) {
  return session?.content_data?.speakingVersion === 'v2';
}

export default function useSpeakingTestInitialization({
  testId,
  authLoading,
  authUser,
  acousticMetricsRef,
  pendingGreetingRef,
  checkCurrentQuota,
  requestAutoStart,
  requestFinalEvaluation,
  setAllParts,
  setAllPartsAcousticMetrics,
  setAllPartsConversation,
  setConversation,
  setCueCardTopic,
  setCurrentPartNumber,
  setCurrentQuestionIndex,
  setError,
  setFinalEvaluation,
  setIsLoading,
  setIsPart2Intro,
  setIsPart2Prep,
  setIsPartComplete,
  setIsTestComplete,
  setSession,
  setSpeakingMode,
  setSpeakingV2State,
  setPrepTimeLeft,
  setTestStarted,
  setTestTitle,
  setTimeLeft,
  speakText,
}) {
  useEffect(() => {
    const resolveInitialSession = async (rawTestId) => {
      if (rawTestId.length <= 30) return { initialSession: null, resolvedPassageId: rawTestId };

      const { data: session } = await supabase
        .from('test_sessions')
        .select('*')
        .eq('id', rawTestId)
        .maybeSingle();

      return {
        // Completed legacy reports remain viewable by their direct URL. An unfinished
        // legacy attempt must not revive the retired examiner pipeline.
        initialSession: session?.is_completed || isSpeakingV2Session(session) ? session : null,
        resolvedPassageId:
          session?.passage_id ||
          session?.content_data?.passage_id ||
          session?.content_data?.id ||
          rawTestId,
      };
    };

    const loadDisplayTitle = async (passageId) => {
      try {
        const passage = await Passage.getById(passageId);
        if (!passage) return 'Speaking Test';

        const { cambridge_year: year, cambridge_test_number: testNumber } = passage;
        if (year && testNumber) {
          return `IELTS ${year - 2005} Academic ${year} Test ${testNumber}`;
        }

        return passage.title || 'Speaking Test';
      } catch (error) {
        console.warn('Failed to fetch passage info:', error);
        return 'Speaking Test';
      }
    };

    const loadParts = async (passageId) => {
      const { data: questions, error } = await supabase
        .from('questions')
        .select('*')
        .eq('passage_id', passageId)
        .order('question_number', { ascending: true });

      if (error) throw error;
      if (!questions?.length) throw new Error('No questions found for this test.');

      return questions.reduce((parts, question) => {
        const partNumber = question.question_number;
        parts[partNumber] = {
          partNumber,
          part: `Part ${partNumber}`,
          title: question.question_text || `Part ${partNumber}`,
          duration: question.table_data?.duration_minutes || 5,
          questions: question.correct_answer || question.content || '',
          id: question.id,
        };
        return parts;
      }, {});
    };

    const findMatchingSession = async ({ initialSession, passageId, isRetake }) => {
      if (initialSession || !authUser || isRetake) return initialSession;

      const { data: sessions } = await supabase
        .from('test_sessions')
        .select('*')
        .eq('user_id', authUser.id)
        .eq('test_type', 'speaking')
        .order('created_at', { ascending: false });

      return sessions?.find((session) => {
        const contentData = session.content_data || {};
        return (
          isSpeakingV2Session(session) &&
          (session.passage_id === passageId ||
            contentData.id === passageId ||
            contentData.passage_id === passageId ||
            contentData.passageId === passageId)
        );
      });
    };

    const restoreCompletedSession = (matchingSession) => {
      setSession(matchingSession);
      const savedMetrics =
        matchingSession.content_data?.allPartsAcousticMetrics ||
        matchingSession.content_data?.allPartsPronunciation ||
        {};

      if (matchingSession.content_data?.finalEvaluation) {
        setFinalEvaluation(matchingSession.content_data.finalEvaluation);
      } else if (matchingSession.content_data?.allEvaluations) {
        const avgEval = buildAverageSpeakingEvaluation(matchingSession.content_data.allEvaluations);
        if (avgEval) setFinalEvaluation(avgEval);
      } else if (matchingSession.score != null) {
        setFinalEvaluation(buildLegacySpeakingEvaluation(matchingSession.score));
      }

      if (matchingSession.content_data?.allPartsConversation) {
        setAllPartsConversation(matchingSession.content_data.allPartsConversation);
      }
      acousticMetricsRef.current = savedMetrics;
      setAllPartsAcousticMetrics(savedMetrics);

      setIsTestComplete(true);
      setIsLoading(false);
    };

    const restoreActiveSession = async (matchingSession, dbParts) => {
      setSession(matchingSession);

      let serverResume = null;
      if (matchingSession.content_data?.speakingVersion === 'v2') {
        const savedMode =
          matchingSession.content_data?.speakingMode === 'practice' ? 'practice' : 'exam';
        setSpeakingMode?.(savedMode);
        serverResume = await callEdgeFunction('processSpeakingSessionV2', {
          action: savedMode === 'practice' ? 'resume_practice' : 'resume',
          sessionId: matchingSession.id,
        });
        setSpeakingV2State?.(serverResume.state);
      }

      const resumePart =
        serverResume?.state?.part || matchingSession.content_data?.currentPart || 1;
      const resumeAllPartsConversation = matchingSession.content_data?.allPartsConversation || {};
      const savedMetrics =
        matchingSession.content_data?.allPartsAcousticMetrics ||
        matchingSession.content_data?.allPartsPronunciation ||
        {};
      const currentPartData = dbParts[resumePart] || Object.values(dbParts)[0];
      const isPart2Prep = Boolean(
        matchingSession.content_data?.isPart2Prep || matchingSession.content_data?.isPart2Intro
      );
      const resumeState = buildSpeakingResumeState({
        conversation: matchingSession.answers?.conversation,
        currentQuestionIndex: matchingSession.answers?.currentQuestionIndex,
        currentPart: currentPartData,
        isPart2Prep,
      });

      acousticMetricsRef.current = savedMetrics;
      setAllPartsAcousticMetrics(savedMetrics);
      setCurrentPartNumber(resumePart);
      const resumedConversation = serverResume?.examinerText
        ? [
            ...resumeState.conversation.filter(
              (entry) => entry.text?.trim() !== serverResume.examinerText.trim()
            ),
            { speaker: 'ai', text: serverResume.examinerText },
          ]
        : resumeState.conversation;
      setConversation(resumedConversation);
      setCurrentQuestionIndex(
        serverResume?.state?.questionNumber ?? resumeState.currentQuestionIndex
      );
      setAllPartsConversation(resumeAllPartsConversation);
      setIsPartComplete(
        Boolean(
          serverResume?.state?.status === 'part_complete' ||
          matchingSession.content_data?.isPartComplete ||
          resumeState.isPartComplete
        )
      );
      setIsPart2Prep(isPart2Prep);
      setIsPart2Intro(false);
      setPrepTimeLeft(
        typeof matchingSession.content_data?.prepTimeLeft === 'number'
          ? matchingSession.content_data.prepTimeLeft
          : 60
      );
      setCueCardTopic(
        isPart2Prep
          ? matchingSession.content_data?.cueCardTopic || buildCueCardTopic(currentPartData)
          : null
      );

      if (currentPartData) {
        const savedTimeLeft = matchingSession.answers?.timeLeft;
        setTimeLeft(
          typeof savedTimeLeft === 'number' ? savedTimeLeft : currentPartData.duration * 60
        );
      }

      setTestStarted(true);
      setIsLoading(false);

      if (serverResume?.examinerText) {
        Promise.resolve(speakText(serverResume.examinerText)).finally(() => {
          if (!isPart2Prep && serverResume.state?.status !== 'part_complete') requestAutoStart?.();
        });
      } else {
        repairAndResumeSpeakingSession({
          matchingSession,
          requestAutoStart,
          resumeState,
          shouldAutoStart: !isPart2Prep && !resumeState.isPartComplete,
          speakText,
        });
      }

      if (
        !serverResume &&
        resumeState.conversation.filter((entry) => entry.speaker === 'user').length === 0
      ) {
        checkCurrentQuota();
      }

      if (
        matchingSession.content_data?.evaluationPending &&
        Object.keys(resumeAllPartsConversation).length > 0
      ) {
        setTimeout(() => requestFinalEvaluation(resumeAllPartsConversation), 500);
      }
    };

    const prepareNewSession = (firstPart, passageId) => {
      const greeting = `Hello! Welcome to the IELTS Speaking Test. I'm your AI examiner, and I'll be conducting Part ${firstPart.partNumber} today. The topic is: "${firstPart.title}". Let's begin the examination.`;

      setIsLoading(false);
      pendingGreetingRef.current = {
        greeting,
        testId: passageId,
        partNumber: firstPart.partNumber,
      };

      try {
        prefetchSpeakingTts(greeting);
        const questionLines = getQuestionLines(firstPart.questions);
        const firstQuestion = questionLines[0] || "Let's begin. Can you tell me about yourself?";
        prefetchSpeakingTts(firstQuestion);
      } catch (error) {
        console.warn('[TTS] Silent pre-cache warning:', error?.message || error);
      }
    };

    const initializeTest = async () => {
      if (!testId || authLoading) return;

      const isRetake = new URLSearchParams(window.location.search).get('retake') === 'true';

      try {
        const { initialSession, resolvedPassageId } = await resolveInitialSession(testId);
        const displayTitle = await loadDisplayTitle(resolvedPassageId);
        const dbParts = await loadParts(resolvedPassageId);
        const firstPart = dbParts[1] || Object.values(dbParts)[0];

        setTestTitle(displayTitle);
        setAllParts(dbParts);
        setCurrentPartNumber(firstPart.partNumber);
        setTimeLeft(firstPart.duration * 60);

        const matchingSession = await findMatchingSession({
          initialSession,
          passageId: resolvedPassageId,
          isRetake,
        });

        if (matchingSession?.is_completed) {
          restoreCompletedSession(matchingSession);
          return;
        }

        if (matchingSession) {
          await restoreActiveSession(matchingSession, dbParts);
          return;
        }

        prepareNewSession(firstPart, resolvedPassageId);
      } catch (error) {
        console.error('Error initializing speaking test:', error);
        setError(`Failed to load the speaking test: ${error.message}`);
        setIsLoading(false);
      }
    };

    initializeTest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId, authLoading, authUser?.id]);
}

function repairAndResumeSpeakingSession({
  matchingSession,
  requestAutoStart,
  resumeState,
  shouldAutoStart,
  speakText,
}) {
  const promptPromise = resumeState.resumePrompt
    ? speakText(resumeState.resumePrompt)
    : Promise.resolve();
  if (shouldAutoStart) promptPromise.finally(() => requestAutoStart?.());
  if (!resumeState.repaired) return;

  TestSession.update(matchingSession.id, {
    answers: {
      ...matchingSession.answers,
      conversation: resumeState.conversation,
      currentQuestionIndex: resumeState.currentQuestionIndex,
    },
    content_data: {
      ...matchingSession.content_data,
      ...(resumeState.isPartComplete ? { isPartComplete: true } : {}),
    },
    updated_at: new Date().toISOString(),
  }).catch((error) => {
    console.warn('Failed to repair resumed speaking session:', error);
  });
}
