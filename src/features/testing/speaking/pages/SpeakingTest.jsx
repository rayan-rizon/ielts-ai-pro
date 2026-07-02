import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';

// Data entities
import { Passage } from '@/features/testing/shared/services/Passage';
import { TestSession } from '@/features/testing/shared/services/TestSession';
import { callEdgeFunction } from '@/utils/api';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/context/AuthContext';

import PremiumLoading from '@/components/ui/PremiumLoading';

// Local components
import SpeakingReport from '../components/SpeakingReport';
import ExitDialog from '../components/ExitDialog';
import UpgradeDialog from '../components/UpgradeDialog';
import TestHeader from '../components/TestHeader';
import SpeakingConversationPanel from '../components/SpeakingConversationPanel';
import SpeakingTestUnavailable from '../components/SpeakingTestUnavailable';

// Custom hooks
import useSpeechSynthesis from '../hooks/useSpeechSynthesis';
import useAudioRecorder from '../hooks/useAudioRecorder';
import useSpeakingEvaluation from '../hooks/useSpeakingEvaluation';
import useSpeakingNavigationBlocker from '../hooks/useSpeakingNavigationBlocker';
import useSpeakingSessionEffects from '../hooks/useSpeakingSessionEffects';
import useSpeakingTimers from '../hooks/useSpeakingTimers';
import {
  buildAverageSpeakingEvaluation,
  buildConversationHistory,
  buildCueCardTopic,
  buildLegacySpeakingEvaluation,
  buildLocalDevSpeakingResponse,
  formatIeltsQuestion,
  getQuestionLines,
  isTranscriptError,
} from '../utils/speakingTestUtils';

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SpeakingTest() {
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const [searchParams] = useSearchParams();
  const testId = paramId || searchParams.get('test-id');
  const { userProfile: authUser, loading: authLoading } = useAuth();

  // ─── TTS Hook ──────────────────────────────────────────────────────────
  const { speakText, cancelCurrentAudio, isSpeaking, isTTSLoading, isMuted, setIsMuted } =
    useSpeechSynthesis();

  // ─── Session State ─────────────────────────────────────────────────────
  const [session, setSession] = useState(null);
  const [currentPartNumber, setCurrentPartNumber] = useState(1);
  const [allParts, setAllParts] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [testTitle, setTestTitle] = useState('');

  // ─── Processing State ──────────────────────────────────────────────────
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');

  // ─── Conversation State ────────────────────────────────────────────────
  const [conversation, setConversationRaw] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const conversationEndRef = useRef(null);
  const transitionCardRef = useRef(null);

  // Refs to avoid stale closures
  const conversationRef = useRef([]);
  const questionIndexRef = useRef(0);

  // Auto-stamp conversation entries with timestamps
  const stampTimestamp = useCallback((entry) => {
    if (entry && typeof entry === 'object' && !entry.timestamp && !entry.isLoading) {
      return {
        ...entry,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    }
    return entry;
  }, []);

  const setConversation = useCallback(
    (valueOrUpdater) => {
      if (typeof valueOrUpdater === 'function') {
        setConversationRaw((prev) => {
          const result = valueOrUpdater(prev);
          return Array.isArray(result) ? result.map(stampTimestamp) : result;
        });
      } else if (Array.isArray(valueOrUpdater)) {
        setConversationRaw(valueOrUpdater.map(stampTimestamp));
      } else {
        setConversationRaw(valueOrUpdater);
      }
    },
    [stampTimestamp]
  );

  // ─── Evaluation State ──────────────────────────────────────────────────
  const [allPartsConversation, setAllPartsConversation] = useState(
    session?.content_data?.allPartsConversation || {}
  );
  const [isPartComplete, setIsPartComplete] = useState(false);
  const [isTestComplete, setIsTestComplete] = useState(false);

  // Accumulate acoustic metrics per part (from Gemini audio-in analysis)
  const acousticMetricsRef = useRef(session?.content_data?.allPartsAcousticMetrics || {});
  const [allPartsAcousticMetrics, setAllPartsAcousticMetrics] = useState(
    session?.content_data?.allPartsAcousticMetrics || {}
  );

  // ─── Test Flow State ───────────────────────────────────────────────────
  const [testStarted, setTestStarted] = useState(false);
  const pendingGreetingRef = useRef(null);
  const [isPart2Prep, setIsPart2Prep] = useState(false);
  const [prepTimeLeft, setPrepTimeLeft] = useState(60);
  const [cueCardTopic, setCueCardTopic] = useState(null);
  const prepTimerRef = useRef(null);

  // ─── UI Dialog State ───────────────────────────────────────────────────
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);

  // ─── Guards & Refs ─────────────────────────────────────────────────────
  const firstQuestionInsertedRef = useRef(false);
  const isStartingTestRef = useRef(false);
  const isProcessingRef = useRef(false);
  const pendingTimersRef = useRef(new Set());
  const isExiting = useRef(false);
  const timerExpiredRef = useRef(false);
  const timeLeftRef = useRef(0);
  const isMountedRef = useRef(true);

  useSpeakingSessionEffects({
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
  });

  // ─── Persistence ───────────────────────────────────────────────────────
  const saveSessionProgress = useCallback(
    async (updates) => {
      if (!session?.id) return;
      try {
        await TestSession.update(session.id, {
          ...updates,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Failed to save session progress:', err);
      }
    },
    [session?.id]
  );

  const {
    loadingMessage,
    finalEvaluation,
    setFinalEvaluation,
    isEvaluating,
    evaluationError,
    setEvaluationError,
    detailedFeedback,
    isGeneratingDetailed,
    deepDiveError,
    showConfetti,
    setShowConfetti,
    showXPNotification,
    setShowXPNotification,
    earnedXP,
    requestFinalEvaluation,
    fireDeepDive,
  } = useSpeakingEvaluation({
    testId,
    session,
    allParts,
    allPartsConversation,
    currentPartNumber,
    conversation,
    acousticMetricsRef,
    saveSessionProgress,
    isMountedRef,
    pendingTimersRef,
    setIsTestComplete,
    setShowUpgradeDialog,
    setProcessingStatus,
  });

  // ─── Navigation Blocker ────────────────────────────────────────────────
  const blocker = useSpeakingNavigationBlocker({
    isTestComplete,
    isExiting,
    evaluationError,
    showUpgradeDialog,
    conversationLength: conversation.length,
    setShowExitDialog,
  });

  // ─── Quota Helper ──────────────────────────────────────────────────────
  const checkCurrentQuota = useCallback(async () => {
    if (!authUser?.id) return true;
    try {
      let tier = (authUser.subscription_tier || 'free').toLowerCase();
      if (authUser.role === 'admin') tier = 'admin';
      const { data: quota, error: quotaError } = await supabase.rpc('check_user_rate_limit', {
        p_user_id: authUser.id,
        p_tier: tier,
        p_feature_type: 'speaking',
      });

      if (!quotaError) {
        const result = quota?.[0] || quota;
        if (result && !result.allowed) {
          setShowUpgradeDialog(true);
          return false;
        }
      }
      return true;
    } catch (err) {
      console.warn('Quota check failed:', err);
      return true;
    }
  }, [authUser]);

  // ─── Process Recording ─────────────────────────────────────────────────
  const processRecording = useCallback(
    async (audioBlob, metadata = {}) => {
      // BUG FIX: Handle short recordings (under 1.5s) from useAudioRecorder
      if (metadata.error === 'too_short') {
        toast.warning('Recording too short', {
          description: 'Please speak for at least a few seconds.',
          duration: 3000,
        });
        // Clear any "Active" state if needed, though stopListening handles it
        return;
      }

      // Reject very small blobs (silence) even if duration passed
      if (!audioBlob || audioBlob.size < 5000) {
        // BUG FIX: Remove any pending loading message before adding AI response
        setConversation((prev) => prev.filter((m) => !m.isLoading));
        const message = "I didn't hear anything. Please click the microphone and speak clearly.";
        setConversation((prev) => [...prev, { speaker: 'ai', text: message }]);
        speakText(message);
        return;
      }

      setIsProcessing(true);
      setProcessingStatus('Processing your answer...');

      // Add placeholder for user message
      setConversation((prev) => [...prev, { speaker: 'user', text: '...', isLoading: true }]);

      try {
        const reader = new FileReader();
        const base64Promise = new Promise((resolve, reject) => {
          reader.onloadend = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
        });
        reader.readAsDataURL(audioBlob);
        const audioBase64 = await base64Promise;

        const conversationHistory = buildConversationHistory(conversationRef.current);

        setProcessingStatus('AI is analyzing your response...');

        const snapshotQuestionIndex = questionIndexRef.current;

        // Extract current question text for pronunciation context
        const currentPart = allParts[currentPartNumber];
        const questionLines = getQuestionLines(currentPart?.questions);
        const questionContext = questionLines[snapshotQuestionIndex] || '';

        let response;
        try {
          response = await callEdgeFunction('processSpeakingSession', {
            testId,
            speakingSessionId: session?.id,
            turnId: crypto.randomUUID(),
            partNumber: currentPartNumber,
            audioBase64,
            conversationHistory,
            currentQuestionIndex: snapshotQuestionIndex,
            questionContext,
            speechConfidence: metadata.speechConfidence || null,
          });
        } catch (err) {
          console.error('Edge Function failed:', err);

          // QUOTA/TIER PRIORITY: Handle 429 (Rate Limit/Quota) or 403 (Forbidden/Tier Gate)
          if (err.status === 429 || err.status === 403 || err.name === 'RateLimitError') {
            // BUG FIX: Clear loading placeholder before early return
            setConversation((prev) => prev.filter((m) => !m.isLoading));
            if (err.rateLimitType === 'quota' || err.status === 403) {
              setShowUpgradeDialog(true);
              setIsProcessing(false);
              return;
            }
            toast.error('Too many requests', {
              description: 'Please wait a moment before continuing.',
              duration: 4000,
            });
            setIsProcessing(false);
            return;
          }

          if (import.meta.env.DEV) {
            // DEV ONLY: Mock response for other errors
            response = buildLocalDevSpeakingResponse({
              currentPart: allParts[currentPartNumber],
              currentPartNumber,
              currentQuestionIndex: snapshotQuestionIndex,
            });
          } else {
            toast.error('Processing Error', {
              description:
                err?.userMessage || 'Failed to process your response. Please try recording again.',
              duration: 5000,
            });
            setIsProcessing(false);
            return;
          }
        }

        // Update user message with transcript
        setConversation((prev) => {
          const updated = [...prev];
          const loadingIndex = updated.findIndex((m) => m.isLoading);
          if (loadingIndex !== -1) {
            updated[loadingIndex] = {
              speaker: 'user',
              text: response.userTranscript || '(Unable to transcribe - please try again)',
              isLoading: false,
              error: isTranscriptError(response.userTranscript),
            };
          }
          return updated;
        });

        if (response.success) {
          const baseCleanResponse = response.examinerResponse
            ?.replace(/\*\*(.*?)\*\*/g, '$1')
            ?.replace(/\*(.*?)\*/g, '$1')
            ?.replace(/#{1,6}\s/g, '')
            ?.trim();

          const cleanExaminerResponse = formatIeltsQuestion(baseCleanResponse);

          if (cleanExaminerResponse) {
            const responseTimerId = setTimeout(() => {
              pendingTimersRef.current.delete(responseTimerId);
              setConversation((prev) => [...prev, { speaker: 'ai', text: '...', isLoading: true }]);
              speakText(cleanExaminerResponse, {
                cancel: true,
                onPlayStart: () => {
                  setConversation((prev) => {
                    const updated = [...prev];
                    const idx = updated.findLastIndex((m) => m.isLoading && m.speaker === 'ai');
                    if (idx !== -1) {
                      updated[idx] = {
                        speaker: 'ai',
                        text: cleanExaminerResponse,
                        isLoading: false,
                      };
                    } else if (!updated.some((m) => m.text === cleanExaminerResponse)) {
                      updated.push({ speaker: 'ai', text: cleanExaminerResponse });
                    }
                    return updated;
                  });
                },
              });

              if (response.isPartComplete) {
                const partCompleteTimerId = setTimeout(() => {
                  pendingTimersRef.current.delete(partCompleteTimerId);
                  setIsPartComplete(true);
                }, 3000);
                pendingTimersRef.current.add(partCompleteTimerId);
              } else if (timerExpiredRef.current) {
                const timerForceCompleteId = setTimeout(() => {
                  pendingTimersRef.current.delete(timerForceCompleteId);
                  setConversation((prev) => [
                    ...prev,
                    {
                      speaker: 'ai',
                      text: `That's all the time we have for Part ${currentPartNumber}. Let's move on.`,
                    },
                  ]);
                  const finalTimerId = setTimeout(() => {
                    pendingTimersRef.current.delete(finalTimerId);
                    setIsPartComplete(true);
                  }, 1500);
                  pendingTimersRef.current.add(finalTimerId);
                }, 2000);
                pendingTimersRef.current.add(timerForceCompleteId);
              }
            }, 500);
            pendingTimersRef.current.add(responseTimerId);
          } else if (response.isPartComplete) {
            setIsPartComplete(true);
          }

          if (response.nextQuestionIndex >= 0) {
            setCurrentQuestionIndex(response.nextQuestionIndex);
          }

          // Accumulate pronunciation scores from audio analysis (per turn)
          if (response.pronunciationData) {
            const partKey = String(currentPartNumber);
            if (!acousticMetricsRef.current[partKey]) {
              acousticMetricsRef.current[partKey] = [];
            }
            acousticMetricsRef.current[partKey].push(response.pronunciationData);
            setAllPartsAcousticMetrics({ ...acousticMetricsRef.current });
          }

          saveSessionProgress({
            answers: {
              conversation: [
                ...conversationRef.current,
                { speaker: 'user', text: response.userTranscript, isLoading: false },
                ...(response.examinerResponse
                  ? [{ speaker: 'ai', text: response.examinerResponse }]
                  : []),
              ],
              currentQuestionIndex:
                response.nextQuestionIndex >= 0
                  ? response.nextQuestionIndex
                  : questionIndexRef.current,
            },
            content_data: {
              ...session?.content_data,
              currentPart: currentPartNumber,
              allPartsPronunciation: acousticMetricsRef.current,
              isPartComplete: !!response.isPartComplete,
            },
          });
        } else if (response.isPartComplete) {
          setConversation((prev) => prev.filter((m) => !m.isLoading));
          const farewell = response.message || `That concludes Part ${currentPartNumber}.`;
          setConversation((prev) => [...prev, { speaker: 'ai', text: '...', isLoading: true }]);
          speakText(farewell, {
            cancel: true,
            onPlayStart: () => {
              setConversation((prev) => {
                const updated = [...prev];
                const idx = updated.findLastIndex((m) => m.isLoading && m.speaker === 'ai');
                if (idx !== -1) {
                  updated[idx] = { speaker: 'ai', text: farewell, isLoading: false };
                } else if (!updated.some((m) => m.text === farewell)) {
                  updated.push({ speaker: 'ai', text: farewell });
                }
                return updated;
              });
            },
          });
          const completeTimerId = setTimeout(() => {
            pendingTimersRef.current.delete(completeTimerId);
            setIsPartComplete(true);
          }, 2500);
          pendingTimersRef.current.add(completeTimerId);
          saveSessionProgress({
            content_data: {
              ...session?.content_data,
              isPartComplete: true,
            },
          });
        } else {
          throw new Error(response.error || 'Failed to process response');
        }
      } catch (err) {
        console.error('Error processing recording:', err);

        setConversation((prev) => {
          const updated = [...prev];
          const loadingIndex = updated.findIndex((m) => m.isLoading);
          if (loadingIndex !== -1) {
            updated[loadingIndex] = {
              speaker: 'user',
              text: '(Failed to transcribe)',
              isLoading: false,
              error: true,
            };
          }
          return updated;
        });

        const errorRecoveryTimerId = setTimeout(() => {
          pendingTimersRef.current.delete(errorRecoveryTimerId);
          const recoveryMessage =
            "I'm sorry, I didn't quite catch that. Could you please repeat your answer?";
          setConversation((prev) => [...prev, { speaker: 'ai', text: '...', isLoading: true }]);
          speakText(recoveryMessage, {
            cancel: true,
            onPlayStart: () => {
              setConversation((prev) => {
                const updated = [...prev];
                const idx = updated.findLastIndex((m) => m.isLoading && m.speaker === 'ai');
                if (idx !== -1) {
                  updated[idx] = { speaker: 'ai', text: recoveryMessage, isLoading: false };
                } else if (!updated.some((m) => m.text === recoveryMessage)) {
                  updated.push({ speaker: 'ai', text: recoveryMessage });
                }
                return updated;
              });
            },
          });
          setIsProcessing(false);
        }, 1000);
        pendingTimersRef.current.add(errorRecoveryTimerId);
      } finally {
        setIsProcessing(false);
        setProcessingStatus('');
      }
    },
    [
      currentPartNumber,
      speakText,
      saveSessionProgress,
      allParts,
      testId,
      session?.id,
      session?.content_data,
      setConversation,
    ]
  );

  // ─── Audio Recorder Hook ───────────────────────────────────────────────
  const {
    startListening,
    stopListening,
    isListening,
    isRecording,
    micError,
    setIsProcessing: setRecorderProcessing,
  } = useAudioRecorder({ processRecording });

  // Keep recorder hook aware of processing state
  useEffect(() => {
    setRecorderProcessing(isProcessing);
  }, [isProcessing, setRecorderProcessing]);

  // ─── Move to Next Part ─────────────────────────────────────────────────
  const moveToNextPart = useCallback(async () => {
    const currentConversation = conversation.filter((c) => !c.isLoading);
    setAllPartsConversation((prev) => ({
      ...prev,
      [currentPartNumber]: currentConversation,
    }));

    // Store current part's acoustic metrics and reset for next part
    // (metrics are already accumulated in acousticMetricsRef via processRecording)

    const nextPartNumber = currentPartNumber + 1;
    const nextPart = allParts[nextPartNumber];

    if (nextPart) {
      setCurrentPartNumber(nextPartNumber);
      setTimeLeft(nextPart.duration * 60);
      setCurrentQuestionIndex(0);
      setIsPartComplete(false);
      timerExpiredRef.current = false;

      if (nextPartNumber === 2) {
        setCueCardTopic(buildCueCardTopic(nextPart));

        setIsPart2Prep(true);
        setPrepTimeLeft(60);

        const message = `Now it's time for Part 2, the Individual Long Turn. I'm going to give you a topic and I'd like you to talk about it for 1 to 2 minutes. Before you talk, you'll have one minute to think about what you're going to say. Here's your topic card.`;
        setConversation([{ speaker: 'ai', text: message }]);
        speakText(message);

        saveSessionProgress({
          answers: { conversation: [{ speaker: 'ai', text: message }], currentQuestionIndex: 0 },
          content_data: {
            ...session?.content_data,
            currentPart: nextPartNumber,
            allPartsConversation: {
              ...allPartsConversation,
              [currentPartNumber]: currentConversation,
            },
            isPartComplete: false,
          },
        });
      } else {
        const message = `Excellent! Now let's move on to Part ${nextPartNumber}: "${nextPart.title}". Take a moment to prepare, then click the microphone when you're ready.`;
        const messagePromise = speakText(message);
        setConversation([{ speaker: 'ai', text: message }]);

        const questionLines = getQuestionLines(nextPart.questions);

        if (questionLines.length > 0) {
          messagePromise.then(() => {
            const firstQ = formatIeltsQuestion(questionLines[0]);
            setConversation((prev) => [...prev, { speaker: 'ai', text: firstQ }]);
            speakText(firstQ);
            setCurrentQuestionIndex(0);
          });
        }

        saveSessionProgress({
          answers: { conversation: [{ speaker: 'ai', text: message }], currentQuestionIndex: 0 },
          content_data: {
            ...session?.content_data,
            currentPart: nextPartNumber,
            allPartsConversation: {
              ...allPartsConversation,
              [currentPartNumber]: currentConversation,
            },
            isPartComplete: false,
          },
        });
      }
    } else {
      const allConversations = {
        ...allPartsConversation,
        [currentPartNumber]: currentConversation,
      };
      await requestFinalEvaluation(allConversations);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentPartNumber,
    conversation,
    allPartsConversation,
    allParts,
    speakText,
    saveSessionProgress,
    requestFinalEvaluation,
    session?.content_data,
  ]);

  // ─── Initialize Test ───────────────────────────────────────────────────
  useEffect(() => {
    const initializeTest = async () => {
      if (!testId || authLoading) return;

      const isRetake = new URLSearchParams(window.location.search).get('retake') === 'true';

      try {
        const user = authUser;

        let resolvedPassageId = testId;
        let initialSession = null;

        if (testId.length > 30) {
          const { data: s } = await supabase
            .from('test_sessions')
            .select('*')
            .eq('id', testId)
            .maybeSingle();
          if (s) {
            initialSession = s;
            resolvedPassageId = s.passage_id || s.content_data?.passage_id || s.content_data?.id;
          }
        }

        let displayTitle = 'Speaking Test';
        try {
          const passage = await Passage.getById(resolvedPassageId);
          if (passage) {
            displayTitle = passage.title;
            const year = passage.cambridge_year;
            const testNum = passage.cambridge_test_number;
            if (year && testNum) {
              const bookNumber = year - 2005;
              displayTitle = `IELTS ${bookNumber} Academic ${year} Test ${testNum}`;
            }
          }
        } catch (pError) {
          console.warn('Failed to fetch passage info:', pError);
        }
        setTestTitle(displayTitle);

        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .eq('passage_id', resolvedPassageId)
          .order('question_number', { ascending: true });

        if (questionsError) throw questionsError;

        if (questionsData && questionsData.length > 0) {
          const dbParts = {};
          questionsData.forEach((q) => {
            const partNum = q.question_number;
            dbParts[partNum] = {
              partNumber: partNum,
              part: `Part ${partNum}`,
              title: q.question_text || `Part ${partNum}`,
              duration: q.table_data?.duration_minutes || 5,
              questions: q.correct_answer || q.content || '',
              id: q.id,
            };
          });

          setAllParts(dbParts);
          const firstPart = dbParts[1] || Object.values(dbParts)[0];

          if (firstPart) {
            setCurrentPartNumber(firstPart.partNumber);
            setTimeLeft(firstPart.duration * 60);

            let matchingSession = initialSession;
            if (!matchingSession && user && !isRetake) {
              const { data: sessions } = await supabase
                .from('test_sessions')
                .select('*')
                .eq('user_id', user.id)
                .eq('test_type', 'speaking')
                .order('created_at', { ascending: false });

              matchingSession = sessions?.find(
                (s) =>
                  s.passage_id === resolvedPassageId ||
                  (s.content_data &&
                    (s.content_data.id === resolvedPassageId ||
                      s.content_data.passage_id === resolvedPassageId ||
                      s.content_data.passageId === resolvedPassageId))
              );
            }

            if (matchingSession && matchingSession.is_completed) {
              setSession(matchingSession);
              if (matchingSession.content_data?.finalEvaluation) {
                setFinalEvaluation(matchingSession.content_data.finalEvaluation);
              } else if (matchingSession.content_data?.allEvaluations) {
                const avgEval = buildAverageSpeakingEvaluation(
                  Object.values(matchingSession.content_data.allEvaluations)
                );
                if (avgEval) setFinalEvaluation(avgEval);
              } else if (matchingSession.score != null) {
                // Fallback: reconstruct minimal evaluation from session score
                setFinalEvaluation(buildLegacySpeakingEvaluation(matchingSession.score));
              }
              // Restore allPartsConversation if available
              if (matchingSession.content_data?.allPartsConversation) {
                setAllPartsConversation(matchingSession.content_data.allPartsConversation);
              }
              setIsTestComplete(true);
              setIsLoading(false);
              return;
            }

            if (matchingSession && !matchingSession.is_completed) {
              setSession(matchingSession);
              const resumePart = matchingSession.content_data?.currentPart || 1;
              const resumeHistory = matchingSession.answers?.conversation || [];
              const resumeQuestionIndex = matchingSession.answers?.currentQuestionIndex || 0;
              const resumeAllPartsConversation =
                matchingSession.content_data?.allPartsConversation || {};
              // Restore acoustic metrics from saved session
              const savedMetrics = matchingSession.content_data?.allPartsAcousticMetrics || {};
              acousticMetricsRef.current = savedMetrics;
              setAllPartsAcousticMetrics(savedMetrics);

              setCurrentPartNumber(resumePart);
              setConversation(resumeHistory);
              setCurrentQuestionIndex(resumeQuestionIndex);
              setAllPartsConversation(resumeAllPartsConversation);

              if (matchingSession.content_data?.isPartComplete) {
                setIsPartComplete(true);
              }

              const currentPartData = dbParts[resumePart] || Object.values(dbParts)[0];
              if (currentPartData) {
                const savedTimeLeft = matchingSession.answers?.timeLeft;
                setTimeLeft(
                  typeof savedTimeLeft === 'number' ? savedTimeLeft : currentPartData.duration * 60
                );
              }

              setTestStarted(true);
              setIsLoading(false);

              // If it's a resume and no user history exists, check quota
              const userHistory = resumeHistory.filter((h) => h.speaker === 'user');
              if (userHistory.length === 0) {
                checkCurrentQuota();
              }

              if (
                matchingSession.content_data?.evaluationPending &&
                Object.keys(resumeAllPartsConversation).length > 0
              ) {
                setTimeout(() => {
                  requestFinalEvaluation(resumeAllPartsConversation);
                }, 500);
              }
              return;
            }

            const greeting = `Hello! Welcome to the IELTS Speaking Test. I'm your AI examiner, and I'll be conducting Part ${firstPart.partNumber} today. The topic is: "${firstPart.title}". Let's begin the examination.`;
            setIsLoading(false);
            pendingGreetingRef.current = {
              greeting,
              testId: resolvedPassageId,
              partNumber: firstPart.partNumber,
            };

            // SILENT PRE-CACHE: Hit the edge function in the background now so the audio
            // is generated and cached in Supabase Storage before the user clicks "Start Test".
            try {
              supabase.functions
                .invoke('synthesizeSpeech', { body: { text: greeting } })
                .catch(() => {});
              // Also pre-cache the absolute first question
              const questionLines = getQuestionLines(firstPart.questions);
              const firstQuestion =
                questionLines[0] || "Let's begin. Can you tell me about yourself?";
              supabase.functions
                .invoke('synthesizeSpeech', { body: { text: firstQuestion } })
                .catch(() => {});
            } catch (e) {
              // Ignore pre-cache failures silently but log to console to satisfy linter
              console.warn('[TTS] Silent pre-cache warning:', e?.message || e);
            }
          }
        } else {
          throw new Error('No questions found for this test.');
        }
      } catch (err) {
        console.error('Error initializing speaking test:', err);
        setError('Failed to load the speaking test: ' + err.message);
        setIsLoading(false);
      }
    };

    initializeTest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId, authUser?.id]);

  // ─── Handle Start Test ─────────────────────────────────────────────────
  const handleStartTest = useCallback(async () => {
    if (isStartingTestRef.current) return;
    isStartingTestRef.current = true;

    if (authUser?.id) {
      const isAllowed = await checkCurrentQuota();
      if (!isAllowed) {
        isStartingTestRef.current = false;
        return;
      }
    }

    setTestStarted(true);

    if (!session) {
      try {
        const user = authUser;
        if (user) {
          const resolvedPassageId = pendingGreetingRef.current?.testId || testId;
          const newSession = await TestSession.create({
            user_id: user.id,
            test_type: 'speaking',
            passage_id: resolvedPassageId,
            is_completed: false,
            content_data: { passage_id: resolvedPassageId, currentPart: 1 },
            answers: { conversation: conversation, currentQuestionIndex: -1 },
          });
          setSession(newSession);
        }
      } catch (err) {
        console.warn('Failed to create speaking session:', err);
      }
    }

    if (pendingGreetingRef.current) {
      const { greeting, partNumber } = pendingGreetingRef.current;

      // ADDED: Show greeting when test starts
      setConversation([{ speaker: 'ai', text: greeting }]);
      const greetingPromise = speakText(greeting);
      setTestStarted(true);

      (async () => {
        pendingGreetingRef.current = null;
        await greetingPromise;
        firstQuestionInsertedRef.current = false;

        const currentPart = allParts[partNumber];
        if (currentPart?.questions) {
          const questionLines = getQuestionLines(currentPart.questions);
          const firstQuestion = questionLines[0] || "Let's begin. Can you tell me about yourself?";

          if (!firstQuestionInsertedRef.current) {
            firstQuestionInsertedRef.current = true;
            const cleanedFirstQuestion = formatIeltsQuestion(firstQuestion);
            setConversation((prev) => [...prev, { speaker: 'ai', text: cleanedFirstQuestion }]);
            speakText(cleanedFirstQuestion);
            setCurrentQuestionIndex(0);
          }
        }
      })();
    }
  }, [
    session,
    testId,
    conversation,
    speakText,
    allParts,
    authUser,
    checkCurrentQuota,
    setConversation,
  ]);

  // ─── Start Part 2 Speaking ─────────────────────────────────────────────
  const handleStartPart2Speaking = useCallback(() => {
    setIsPart2Prep(false);
    setCueCardTopic(null);

    const message =
      'Alright, your preparation time is up. Please start speaking now. Remember, you should talk for 1 to 2 minutes.';
    setConversation((prev) => [...prev, { speaker: 'ai', text: message }]);
    speakText(message);
  }, [speakText, setConversation]);

  // ─── Timer Effects ─────────────────────────────────────────────────────
  useSpeakingTimers({
    isLoading,
    error,
    timeLeft,
    setTimeLeft,
    isTestComplete,
    testStarted,
    session,
    currentPartNumber,
    saveSessionProgress,
    isPartComplete,
    setIsPartComplete,
    isSpeaking,
    setConversation,
    handleStartPart2Speaking,
    isPart2Prep,
    prepTimeLeft,
    setPrepTimeLeft,
    prepTimerRef,
    isProcessing,
    isEvaluating,
    moveToNextPart,
    conversationRef,
    questionIndexRef,
    timeLeftRef,
    isProcessingRef,
    timerExpiredRef,
    pendingTimersRef,
  });

  // ─── Derived Values ────────────────────────────────────────────────────
  const currentPart = allParts[currentPartNumber];
  const totalParts = Object.keys(allParts).length;

  // ─── Early Returns ─────────────────────────────────────────────────────
  if (isLoading) {
    return <PremiumLoading message="Preparing your speaking test..." />;
  }

  if (error) {
    return <SpeakingTestUnavailable error={error} />;
  }

  if (isTestComplete) {
    return (
      <SpeakingReport
        finalEvaluation={finalEvaluation}
        isEvaluating={isEvaluating}
        evaluationError={evaluationError}
        testTitle={testTitle}
        loadingMessage={loadingMessage}
        allPartsPronunciation={allPartsAcousticMetrics}
        onRetryEvaluation={() => {
          setEvaluationError(null);
          requestFinalEvaluation();
        }}
        showConfetti={showConfetti}
        onConfettiComplete={() => setShowConfetti(false)}
        showXPNotification={showXPNotification}
        earnedXP={earnedXP}
        onXPComplete={() => setShowXPNotification(false)}
        isExitingRef={isExiting}
        testId={testId}
        allPartsConversation={allPartsConversation}
        detailedFeedback={detailedFeedback}
        isGeneratingDetailed={isGeneratingDetailed}
        deepDiveError={deepDiveError}
        onRetryDeepDive={() => fireDeepDive(allPartsConversation)}
      />
    );
  }

  // ─── Main Render ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen transition-colors duration-500 bg-background overflow-x-hidden">
      <div className="fixed inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))] dark:bg-grid-white/5 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.05))] pointer-events-none" />

      <ExitDialog
        open={showExitDialog}
        onOpenChange={setShowExitDialog}
        blocker={blocker}
        isExitingRef={isExiting}
      />

      <div className="relative max-w-4xl mx-auto px-2 sm:px-4 py-2 md:py-4">
        <TestHeader
          currentPartNumber={currentPartNumber}
          currentPart={currentPart}
          totalParts={totalParts}
          currentQuestionIndex={currentQuestionIndex}
          timeLeft={timeLeft}
          testTitle={testTitle}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
          onExit={() => setShowExitDialog(true)}
          isTestComplete={isTestComplete}
          conversationLength={conversation.length}
          onShowExitDialog={() => {
            if (!isTestComplete && conversation.length > 1) {
              setShowExitDialog(true);
            } else {
              navigate(createPageUrl('Speaking'));
            }
          }}
        />

        <SpeakingConversationPanel
          currentPartNumber={currentPartNumber}
          currentPart={currentPart}
          allParts={allParts}
          conversation={conversation}
          authUser={authUser}
          testStarted={testStarted}
          isPartComplete={isPartComplete}
          moveToNextPart={moveToNextPart}
          conversationEndRef={conversationEndRef}
          isPart2Prep={isPart2Prep}
          cueCardTopic={cueCardTopic}
          prepTimeLeft={prepTimeLeft}
          handleStartPart2Speaking={handleStartPart2Speaking}
          isListening={isListening}
          isRecording={isRecording}
          isProcessing={isProcessing}
          isSpeaking={isSpeaking}
          isTTSLoading={isTTSLoading}
          processingStatus={processingStatus}
          micError={micError}
          timerExpiredRef={timerExpiredRef}
          startListening={startListening}
          stopListening={stopListening}
          handleStartTest={handleStartTest}
        />
      </div>

      <UpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        authUser={authUser}
        isExitingRef={isExiting}
      />
    </div>
  );
}
