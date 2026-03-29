import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link, useSearchParams, useBlocker, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';

// Data entities
import { TestSession, Passage, User, UserPoints } from '@/entities';
import { callEdgeFunction } from '@/utils/api';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/context/AuthContext';
import { refreshLearningPathAfterTest } from '@/services/adaptiveLearningService';

// UI Components
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bot, ArrowLeft, Home, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PremiumLoading from '@/components/ui/PremiumLoading';

// Local components
import SpeakingReport from '../components/SpeakingReport';
import ExitDialog from '../components/ExitDialog';
import UpgradeDialog from '../components/UpgradeDialog';
import TestHeader from '../components/TestHeader';
import RecordingControls from '../components/RecordingControls';
import Part2CueCard from '../components/Part2CueCard';
import PartCompleteCard from '../components/PartCompleteCard';
import InitialWelcomeScreen from '../components/InitialWelcomeScreen';

// Custom hooks
import useSpeechSynthesis from '../hooks/useSpeechSynthesis';
import useAudioRecorder from '../hooks/useAudioRecorder';

// --- Memoized sub-component: prevents all messages re-rendering on every state change ---
const ConversationMessage = React.memo(({ entry, index, authUser }) => (
  <motion.div
    key={`${entry.speaker}-${index}`}
    initial={{ opacity: 0, y: 20, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.3, delay: 0.1 }}
    className={`flex items-start gap-3 ${entry.speaker === 'user' ? 'flex-row-reverse' : ''}`}
  >
    {entry.speaker === 'ai' ? (
      <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md bg-gradient-to-br from-rose-500 to-orange-500">
        <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
      </div>
    ) : authUser?.avatar_url ? (
      <img
        src={authUser.avatar_url}
        alt={authUser?.full_name || 'User'}
        className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg object-cover shadow-md bg-zinc-100"
      />
    ) : (
      <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md bg-gradient-to-br from-blue-500 to-indigo-500">
        <span className="text-white text-xs font-bold">
          {(authUser?.full_name || 'C').charAt(0).toUpperCase()}
        </span>
      </div>
    )}

    <div
      className={`max-w-[90%] sm:max-w-[85%] ${entry.speaker === 'user' ? 'text-right' : ''} space-y-1.5 min-w-0`}
    >
      <div
        className={`flex items-center gap-2 px-1 ${entry.speaker === 'user' ? 'flex-row-reverse' : ''}`}
      >
        <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest truncate">
          {entry.speaker === 'ai' ? 'Examiner' : authUser?.full_name || 'Candidate'}
        </span>
        {entry.timestamp && (
          <span className="text-[9px] sm:text-[10px] text-muted-foreground/40 font-mono flex-shrink-0">
            {entry.timestamp}
          </span>
        )}
      </div>
      <div
        className={`px-3.5 py-2.5 sm:px-4 sm:py-3 text-[14px] sm:text-[15px] leading-relaxed tracking-normal shadow-sm ${
          entry.speaker === 'user'
            ? entry.error
              ? 'bg-red-100/80 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-[1.25rem] rounded-tr-none text-red-700 dark:text-red-300 text-right italic font-medium'
              : 'bg-gradient-to-br from-blue-500/10 to-indigo-500/5 dark:from-blue-500/20 dark:to-indigo-500/5 border border-blue-500/10 dark:border-blue-500/10 rounded-[1.25rem] rounded-tr-none text-right font-medium text-slate-800 dark:text-slate-200'
            : 'bg-gradient-to-br from-rose-600/10 to-rose-600/5 dark:from-rose-500/20 dark:to-rose-500/5 border border-rose-500/20 dark:border-rose-500/20 rounded-[1.25rem] rounded-tl-none text-left font-medium text-slate-800 dark:text-slate-200'
        }`}
      >
        {entry.isLoading ? (
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">
              Transcribing
            </span>
          </div>
        ) : (
          <p className="whitespace-pre-wrap">
            {entry.text?.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')}
          </p>
        )}
      </div>
    </div>
  </motion.div>
));

ConversationMessage.displayName = 'ConversationMessage';

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SpeakingTest() {
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const [searchParams] = useSearchParams();
  const testId = paramId || searchParams.get('test-id');
  const { userProfile: authUser, loading: authLoading } = useAuth();

  // ─── TTS Hook ──────────────────────────────────────────────────────────
  const { speakText, isSpeaking, isMuted, setIsMuted } = useSpeechSynthesis();

  // ─── Edge Function Warm-up ─────────────────────────────────────────────
  // Fire a no-op ping on mount to eliminate cold-start latency on first turn
  useEffect(() => {
    if (!testId) return;
    callEdgeFunction('processSpeakingSession', { ping: true }).catch(() => {});
  }, [testId]);

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
  const [loadingMessage, setLoadingMessage] = useState('Analyzing Performance...');

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
  const [finalEvaluation, setFinalEvaluation] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isPartComplete, setIsPartComplete] = useState(false);
  const [isTestComplete, setIsTestComplete] = useState(false);
  const [evaluationError, setEvaluationError] = useState(null);

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

  // ─── Gamification State ────────────────────────────────────────────────
  const [showConfetti, setShowConfetti] = useState(false);
  const [showXPNotification, setShowXPNotification] = useState(false);
  const [earnedXP, setEarnedXP] = useState({ xp: 0, bonus: 0, streak: 0 });

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

  // ─── Navigation Blocker ────────────────────────────────────────────────
  const conversationLengthRef = useRef(0);
  useEffect(() => {
    conversationLengthRef.current = conversation.length;
  }, [conversation.length]);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !isTestComplete &&
      !isExiting.current &&
      conversationLengthRef.current > 1 &&
      !evaluationError &&
      !showUpgradeDialog && // Also allow navigation if showing upgrade dialog
      currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker.state === 'blocked') {
      setShowExitDialog(true);
    }
  }, [blocker.state]);

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

  // ─── Sync Refs ─────────────────────────────────────────────────────────
  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);
  useEffect(() => {
    questionIndexRef.current = currentQuestionIndex;
  }, [currentQuestionIndex]);
  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);
  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  // Auto-scroll conversation
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  // Auto-scroll to transition card
  useEffect(() => {
    if (isPartComplete) {
      setTimeout(() => {
        transitionCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [isPartComplete]);

  // ─── IELTS Text Formatting ─────────────────────────────────────────────
  const formatIeltsQuestion = useCallback((text) => {
    return text
      .replace(/\[\s*Why\s*\/\s*Why\s*not\s*\?*\]/gi, '(Why or why not?)')
      .replace(/\(\s*Why\s*\/\s*Why\s*not\s*\?*\)/gi, '(Why or why not?)')
      .replace(/Why\s*\/\s*Why\s*not/gi, 'Why or why not');
  }, []);

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

        const conversationHistory = conversationRef.current
          .filter((entry) => !entry.isLoading)
          .map((entry) => ({
            speaker: entry.speaker === 'ai' ? 'model' : 'user',
            text: entry.text,
          }));

        setProcessingStatus('AI is analyzing your response...');

        const snapshotQuestionIndex = questionIndexRef.current;

        // Extract current question text for pronunciation context
        const currentPart = allParts[currentPartNumber];
        const questionLines = String(currentPart?.questions || '')
          .split('\n')
          .filter((q) => q.trim());
        const questionContext = questionLines[snapshotQuestionIndex] || '';

        let response;
        try {
          response = await callEdgeFunction('processSpeakingSession', {
            testId,
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
            const fallbackTranscript = '(Your response was recorded)';
            const currentPart = allParts[currentPartNumber];
            const questionLines = String(currentPart?.questions || '')
              .split('\n')
              .filter((q) => q.trim());
            const actualTotalQuestions = questionLines.length || 4;
            const isLastQuestion = currentQuestionIndex >= actualTotalQuestions - 1;
            const nextQuestion =
              !isLastQuestion && questionLines[currentQuestionIndex + 1]
                ? questionLines[currentQuestionIndex + 1]
                : null;

            const followUpResponses = [
              "That's very interesting. Can you tell me more about that?",
              'I see. And how does that make you feel?',
              'Good. Now, let me ask you about something else.',
              'Thank you for sharing that. What would you say is the most important aspect?',
              "Excellent response. Let's continue with the next question.",
            ];

            let followUp;
            if (isLastQuestion) {
              followUp =
                'That concludes Part ' +
                currentPartNumber +
                ". Well done! You've completed this section.";
            } else if (nextQuestion) {
              const ack = followUpResponses[currentQuestionIndex % followUpResponses.length];
              followUp = ack + ' ' + nextQuestion;
            } else {
              followUp = followUpResponses[currentQuestionIndex % followUpResponses.length];
            }

            response = {
              success: true,
              userTranscript: fallbackTranscript,
              examinerResponse: followUp,
              nextQuestionIndex: isLastQuestion ? -1 : currentQuestionIndex + 1,
              isPartComplete: isLastQuestion,
              totalQuestions: actualTotalQuestions,
              evaluation: isLastQuestion
                ? {
                    fluency: 6.5,
                    lexical: 6.5,
                    grammar: 6.5,
                    pronunciation: 6.5,
                    overallBand: 6.5,
                    isFallback: true,
                    feedback: 'Mock evaluation for local development.',
                    strengths: ['Good attempt at practicing'],
                    improvements: ['Deploy to production for accurate evaluation'],
                  }
                : null,
            };
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
            const isError =
              !response.userTranscript ||
              response.userTranscript.includes('(Unable to transcribe') ||
              response.userTranscript.includes('(Audio received but transcription failed)') ||
              response.userTranscript.includes('(Inaudible)');

            updated[loadingIndex] = {
              speaker: 'user',
              text: response.userTranscript || '(Unable to transcribe - please try again)',
              isLoading: false,
              error: isError,
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
              setConversation((prev) => [...prev, { speaker: 'ai', text: cleanExaminerResponse }]);
              speakText(cleanExaminerResponse);

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
          setConversation((prev) => [...prev, { speaker: 'ai', text: farewell }]);
          speakText(farewell);
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
          setConversation((prev) => [...prev, { speaker: 'ai', text: recoveryMessage }]);
          speakText(recoveryMessage);
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
      formatIeltsQuestion,
      currentQuestionIndex,
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

  // ─── Award XP ──────────────────────────────────────────────────────────
  const awardXP = useCallback(async (evaluation) => {
    try {
      const userProfile = await User.me();
      if (userProfile?.id && evaluation.overallBand) {
        const xpAmount = 100 + Math.round(evaluation.overallBand * 20);
        await UserPoints.addPoints(userProfile.id, xpAmount);
        const streakData = await UserPoints.updateStreak(userProfile.id);

        setEarnedXP({
          xp: xpAmount,
          bonus: 0,
          streak: streakData?.current_streak || 0,
        });
        setShowConfetti(true);
        const xpTimerId = setTimeout(() => {
          pendingTimersRef.current.delete(xpTimerId);
          setShowXPNotification(true);
        }, 500);
        pendingTimersRef.current.add(xpTimerId);
      }
    } catch (xpError) {
      console.warn('Could not award XP:', xpError);
    }
  }, []);

  useEffect(() => {
    if (isPartComplete) {
      // Multiple attempts to ensure it's scrolled even if content takes time to layout
      const scroll = () => {
        conversationEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      };

      const t1 = setTimeout(scroll, 100);
      const t2 = setTimeout(scroll, 500);
      const t3 = setTimeout(scroll, 1000);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [isPartComplete]);

  // ─── Final Evaluation ──────────────────────────────────────────────────
  const requestFinalEvaluation = useCallback(
    async (allConversationsData) => {
      setIsEvaluating(true);
      setIsTestComplete(true);
      setEvaluationError(null);

      const conversationsToEvaluate = allConversationsData || {
        ...allPartsConversation,
        [currentPartNumber]: conversation.filter((c) => !c.isLoading),
      };

      try {
        setLoadingMessage('AI is analyzing your response...');
        setProcessingStatus('AI is analyzing your response...');

        const response = await callEdgeFunction('evaluateSpeakingTest', {
          testId,
          allPartsConversation: conversationsToEvaluate,
          allPartsPronunciation: acousticMetricsRef.current,
        });

        if (response.success && response.evaluation) {
          setFinalEvaluation(response.evaluation);
          setEvaluationError(null);
          await awardXP(response.evaluation);

          await saveSessionProgress({
            is_completed: true,
            score: response.evaluation.overallBand || 0,
            completed_at: new Date().toISOString(),
            content_data: {
              ...session?.content_data,
              finalEvaluation: response.evaluation,
              allPartsConversation: conversationsToEvaluate,
            },
          });

          try {
            const { removeFromCache } = await import('@/lib/apiCache');
            removeFromCache('speaking-tests-list');
          } catch (e) {
            console.warn('[Speaking] Cache invalidation failed:', e);
          }

          // Trigger adaptive learning path refresh in background (Pro/Premium only)
          if (session?.user_id) {
            refreshLearningPathAfterTest(
              session.user_id,
              'speaking',
              response.evaluation.overallBand || 0
            ).catch((err) => {
              if (err?.status !== 403)
                console.warn('Speaking: learning path refresh failed:', err?.message);
            });
          }

          setIsEvaluating(false);
        } else if (!response.success) {
          console.warn('Evaluation returned success:false:', response);
          setEvaluationError(
            response.message || 'AI evaluation could not be processed. Please retry.'
          );
          setIsEvaluating(false);

          await saveSessionProgress({
            content_data: {
              ...session?.content_data,
              allPartsConversation: conversationsToEvaluate,
              evaluationPending: true,
            },
          });
          return;
        }
      } catch (evalError) {
        console.error('Error getting final evaluation:', evalError);

        if (
          evalError.status === 403 ||
          evalError.status === 429 ||
          evalError.name === 'RateLimitError'
        ) {
          if (evalError.status === 403 || evalError.rateLimitType === 'quota') {
            setEvaluationError(
              'Your plan does not include speaking evaluation. Please upgrade to continue.'
            );
            setShowUpgradeDialog(true);
            // Keep isTestComplete true so we show the SpeakingReport with the error state
            setIsTestComplete(true);
          } else {
            toast.error('Too many requests', {
              description: 'Please wait a moment and try evaluating again.',
              duration: 4000,
            });
            setEvaluationError('Too many requests. Please wait and retry.');
          }
          setIsEvaluating(false);
          return;
        }

        const errorMessage =
          evalError?.userMessage || evalError?.message || 'Unable to get AI evaluation';
        const isNetworkError =
          evalError?.isNetworkError || errorMessage.toLowerCase().includes('connect');

        const userFacingMessage = isNetworkError
          ? 'Connection issue. Please check your internet and retry.'
          : 'AI evaluation is temporarily unavailable. Please retry.';

        setEvaluationError(userFacingMessage);

        toast.error(isNetworkError ? 'Connection Issue' : 'Evaluation Unavailable', {
          description: isNetworkError
            ? 'Please check your internet connection and try generating reports again.'
            : 'AI evaluation is temporarily unavailable. Please try again in a moment.',
          duration: 8000,
        });

        await saveSessionProgress({
          content_data: {
            ...session?.content_data,
            allPartsConversation: conversationsToEvaluate,
            evaluationPending: true,
          },
        });
      } finally {
        setIsEvaluating(false);
      }
    },
    [
      testId,
      allPartsConversation,
      currentPartNumber,
      conversation,
      session?.content_data,
      awardXP,
      saveSessionProgress,
      session?.user_id,
    ]
  );

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
        const topicText = nextPart.title || 'Describe a topic';
        const questionsText = nextPart.questions || '';

        let bulletPoints = [];
        try {
          const parsed = JSON.parse(questionsText);
          if (Array.isArray(parsed)) {
            bulletPoints = parsed.map((q) => (typeof q === 'string' ? q : q.text || q.question));
          }
        } catch {
          bulletPoints = questionsText.split('\n').filter((line) => line.trim());
        }

        setCueCardTopic({
          title: topicText,
          bulletPoints:
            bulletPoints.length > 0
              ? bulletPoints
              : [
                  'What it is',
                  'When it happened',
                  'Who was involved',
                  'Why it was important to you',
                ],
        });

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

        const questionLines = String(nextPart.questions || '')
          .split('\n')
          .filter((q) => q.trim());

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
    formatIeltsQuestion,
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
                const evals = Object.values(matchingSession.content_data.allEvaluations);
                if (evals.length > 0) {
                  const avgEval = {
                    fluency: evals.reduce((a, e) => a + (e.fluency || 0), 0) / evals.length,
                    lexical: evals.reduce((a, e) => a + (e.lexical || 0), 0) / evals.length,
                    grammar: evals.reduce((a, e) => a + (e.grammar || 0), 0) / evals.length,
                    pronunciation:
                      evals.reduce((a, e) => a + (e.pronunciation || 0), 0) / evals.length,
                    overallBand: evals.reduce((a, e) => a + (e.overallBand || 0), 0) / evals.length,
                    feedback: evals[evals.length - 1]?.feedback || '',
                    strengths: evals.flatMap((e) => e.strengths || []).slice(0, 3),
                    improvements: evals.flatMap((e) => e.improvements || []).slice(0, 3),
                  };
                  setFinalEvaluation(avgEval);
                }
              } else if (matchingSession.score != null) {
                // Fallback: reconstruct minimal evaluation from session score
                const band = Number(matchingSession.score) || 0;
                setFinalEvaluation({
                  overallBand: band,
                  fluency: band,
                  lexical: band,
                  grammar: band,
                  pronunciation: band,
                  feedback: 'Detailed criterion breakdown was not saved for this session.',
                  strengths: [],
                  improvements: [],
                  partScores: {},
                });
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
            // setConversation([{ speaker: 'ai', text: greeting }]); // REMOVED: Don't show until start
            setIsLoading(false);
            pendingGreetingRef.current = {
              greeting,
              testId: resolvedPassageId,
              partNumber: firstPart.partNumber,
            };
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
          const questionLines = String(currentPart.questions)
            .split('\n')
            .filter((q) => q.trim());
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
    formatIeltsQuestion,
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
  useEffect(() => {
    let timer = null;
    if (!isLoading && !error && timeLeft > 0 && !isTestComplete && testStarted) {
      timer = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isLoading, error, isTestComplete, testStarted, timeLeft]);

  // Periodic persistence of timeLeft (every 15s)
  useEffect(() => {
    if (!testStarted || isTestComplete || !session?.id) return;

    const interval = setInterval(() => {
      if (timeLeftRef.current > 0) {
        saveSessionProgress({
          answers: {
            conversation: conversationRef.current,
            currentQuestionIndex: questionIndexRef.current,
            timeLeft: timeLeftRef.current,
          },
          content_data: {
            ...session?.content_data,
            currentPart: currentPartNumber,
          },
        });
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [
    testStarted,
    isTestComplete,
    session?.id,
    currentPartNumber,
    saveSessionProgress,
    session?.content_data,
  ]);

  // Timer expiry auto-complete
  useEffect(() => {
    if (
      timeLeft === 0 &&
      testStarted &&
      !isLoading &&
      !isTestComplete &&
      !isPartComplete &&
      !isProcessingRef.current &&
      !isSpeaking &&
      conversationRef.current.length > 2 &&
      !timerExpiredRef.current
    ) {
      timerExpiredRef.current = true;
      setConversation((prev) => [
        ...prev,
        {
          speaker: 'ai',
          text: `That's all the time we have for Part ${currentPartNumber}. Let's move on.`,
        },
      ]);
      const timerId = setTimeout(() => {
        pendingTimersRef.current.delete(timerId);
        setIsPartComplete(true);
        saveSessionProgress({
          content_data: {
            ...session?.content_data,
            isPartComplete: true,
          },
        });
      }, 2000);
      pendingTimersRef.current.add(timerId);
    }
  }, [
    timeLeft,
    testStarted,
    isLoading,
    isTestComplete,
    isPartComplete,
    isSpeaking,
    currentPartNumber,
    setConversation,
    saveSessionProgress,
    session?.content_data,
  ]);

  // Part 2 Preparation Timer
  useEffect(() => {
    if (isPart2Prep && prepTimeLeft > 0) {
      prepTimerRef.current = setInterval(() => {
        setPrepTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(prepTimerRef.current);
            handleStartPart2Speaking();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (prepTimerRef.current) {
        clearInterval(prepTimerRef.current);
      }
    };
  }, [isPart2Prep, handleStartPart2Speaking, prepTimeLeft]);

  // Handle keyboard shortcuts (Enter to proceed)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && isPartComplete && !isProcessing && !isEvaluating) {
        e.preventDefault();
        moveToNextPart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPartComplete, isProcessing, isEvaluating, moveToNextPart]);

  // Cleanup on Unmount
  useEffect(() => {
    const pendingTimers = pendingTimersRef.current;
    return () => {
      pendingTimers.forEach((id) => clearTimeout(id));
      pendingTimers.clear();
    };
  }, []);

  // ─── Derived Values ────────────────────────────────────────────────────
  const currentPart = allParts[currentPartNumber];
  const totalParts = Object.keys(allParts).length;

  // ─── Early Returns ─────────────────────────────────────────────────────
  if (isLoading) {
    return <PremiumLoading message="Preparing your speaking test..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-rose-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full shadow-xl border-0">
          <CardContent className="pt-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-100 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-rose-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Test Not Available</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex gap-3 justify-center">
              <Button asChild variant="outline">
                <Link to={createPageUrl('Speaking')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Tests
                </Link>
              </Button>
              <Button
                asChild
                className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600"
              >
                <Link to={createPageUrl('Dashboard')}>
                  <Home className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
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
          setIsEvaluating(true);
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
        detailedFeedback={session?.content_data?.detailedFeedback}
        onSaveDetailedFeedback={(data) => {
          if (session) {
            saveSessionProgress({
              content_data: {
                ...session.content_data,
                detailedFeedback: data,
              },
            });
          }
        }}
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

        {/* Conversation Card */}
        <Card className="glass-card-premium border-none shadow-2xl rounded-3xl sm:rounded-[1.5rem] overflow-hidden mb-4 isolate transform-gpu">
          <CardHeader className="bg-muted/10 backdrop-blur-md border-b border-border/40 flex flex-row items-center gap-3 py-2 px-4 sm:px-6 md:px-8">
            <div className="relative shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-rose-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg transform -rotate-2 transition-transform hover:rotate-0">
                <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
            </div>
            <div>
              <CardTitle className="text-base font-black tracking-tight">AI Examiner</CardTitle>
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="text-[9px] uppercase tracking-widest font-bold py-0 h-4 bg-muted/50"
                >
                  IELTS Certified
                </Badge>
                <div className="w-0.5 h-0.5 rounded-full bg-muted-foreground/30" />
                <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Exam Board
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 bg-dot-slate-200/40 dark:bg-dot-white/5">
            <div className="p-3 md:p-5 min-h-[150px] max-h-[500px] overflow-y-auto space-y-4 custom-scrollbar scroll-smooth">
              {!testStarted ? (
                <InitialWelcomeScreen partNumber={currentPartNumber} title={currentPart.title} />
              ) : (
                <AnimatePresence mode="popLayout">
                  {conversation.map((entry, index) => (
                    <ConversationMessage
                      key={`${entry.speaker}-${index}`}
                      entry={entry}
                      index={index}
                      authUser={authUser}
                    />
                  ))}
                </AnimatePresence>
              )}
              {/* Part Complete Milestone Integrated into Scroll Area */}
              {isPartComplete && (
                <div className="pt-4 pb-2 px-1">
                  <PartCompleteCard
                    isPartComplete={isPartComplete}
                    currentPartNumber={currentPartNumber}
                    allParts={allParts}
                    onMoveToNext={moveToNextPart}
                  />
                </div>
              )}
              <div ref={conversationEndRef} />
            </div>

            {/* Recording Controls Section */}
            {!isPartComplete && (
              <div className="bg-muted/10 border-t border-border/50 p-2 md:p-3 isolate transform-gpu">
                <div className="flex flex-col items-center gap-4">
                  <RecordingControls
                    testStarted={testStarted}
                    isPart2Prep={isPart2Prep}
                    isListening={isListening}
                    isRecording={isRecording}
                    isProcessing={isProcessing}
                    isSpeaking={isSpeaking}
                    processingStatus={processingStatus}
                    micError={micError}
                    timerExpiredRef={timerExpiredRef}
                    onStartListening={startListening}
                    onStopListening={stopListening}
                    onStartTest={handleStartTest}
                  />

                  {/* Part 2 Cue Card */}
                  {testStarted && isPart2Prep && cueCardTopic && (
                    <div className="mt-2 w-full flex justify-center">
                      <Part2CueCard
                        cueCardTopic={cueCardTopic}
                        prepTimeLeft={prepTimeLeft}
                        onStartSpeaking={handleStartPart2Speaking}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
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
