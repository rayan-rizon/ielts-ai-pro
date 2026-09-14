import { useEffect, useRef } from 'react';
import { Activity, AudioLines, Mic2, PlayCircle, Radio, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { MICRO, MUTED, NUM, PANEL, TILE, TITLE } from '@/features/dashboard/components/primitives';

import useConversationAutoScroll from '../hooks/useConversationAutoScroll';
import ConversationMessage from './ConversationMessage';
import InitialWelcomeScreen from './InitialWelcomeScreen';
import Part2CueCard from './Part2CueCard';
import PartCompleteCard from './PartCompleteCard';
import RecordingControls from './RecordingControls';
import TimeUpTransition from './TimeUpTransition';
import { shouldShowPart2CueCard } from '../utils/speakingTestUtils';
import { getVisibleSpeakingConversation } from '../utils/speakingV2';

function Part2PreparationControls({ prepTimeLeft, onStartSpeaking }) {
  const minutes = Math.floor(prepTimeLeft / 60);
  const seconds = String(prepTimeLeft % 60).padStart(2, '0');

  return (
    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center justify-center gap-3 sm:justify-start">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
          <Timer className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className={cn(MICRO, MUTED)}>Preparation time</p>
          <p
            className={cn(NUM, 'mt-0.5 text-sm font-extrabold text-slate-800 dark:text-slate-100')}
          >
            {minutes}:{seconds} remaining
          </p>
        </div>
      </div>
      <Button
        onClick={onStartSpeaking}
        className="h-11 w-full gap-2 rounded-xl bg-rose-500 px-5 text-xs font-extrabold text-white hover:bg-rose-600 sm:w-auto"
      >
        <PlayCircle className="h-4 w-4" aria-hidden="true" />
        Start speaking now
      </Button>
    </div>
  );
}

function ExamListeningIndicator() {
  return (
    <div
      className={cn(
        TILE,
        'ml-auto flex w-fit max-w-[88%] items-center gap-3 border-rose-500/20 bg-rose-500/5 px-3 py-2 dark:border-rose-400/20 dark:bg-rose-400/8'
      )}
      role="status"
      aria-live="polite"
      aria-label="Microphone live. Your answer is being recorded."
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-500 text-white">
        <AudioLines className="h-4 w-4 motion-safe:animate-pulse" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className={cn(MICRO, 'text-rose-600 dark:text-rose-300')}>Microphone live</p>
        <p className="mt-0.5 text-sm font-semibold leading-snug text-slate-800 dark:text-slate-100">
          Listening to your answer
        </p>
        <p className={cn(MUTED, 'mt-0.5 text-[10px] leading-snug')}>
          Transcript stays hidden in Exam mode.
        </p>
      </div>
      <span className="ml-1 flex h-4 items-end gap-0.5" aria-hidden="true">
        {[5, 11, 8, 14, 7].map((height, index) => (
          <span
            key={`${height}-${index}`}
            className="w-0.5 rounded-full bg-rose-500 motion-safe:animate-pulse"
            style={{ height, animationDelay: `${index * 90}ms` }}
          />
        ))}
      </span>
    </div>
  );
}

export default function SpeakingConversationPanel({
  currentPartNumber,
  currentPart,
  allParts,
  conversation,
  authUser,
  testStarted,
  isPartComplete,
  moveToNextPart,
  isPartTransitioning,
  conversationContainerRef,
  isPart2Prep,
  cueCardTopic,
  prepTimeLeft,
  handleStartPart2Speaking,
  isListening,
  isRecording,
  isProcessing,
  isSpeaking,
  isTTSLoading,
  activeSpeechText,
  isPlaybackActive,
  speechProgress,
  processingStatus,
  micError,
  liveTranscript,
  autoFinishCountdown,
  autoSubmitPaused,
  handsFreeEnabled,
  timeExpired,
  timerExpiredRef,
  startListening,
  stopListening,
  setAutoSubmitPaused,
  handleStartTest,
  speakingMode = 'exam',
  setSpeakingMode,
  speakingV2Available = false,
}) {
  const cueCardRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!isPart2Prep || !cueCardRef.current || !conversationContainerRef.current) return;

    const container = conversationContainerRef.current;
    const scrollToCueCard = () => {
      container.scrollTo({
        top: Math.max(0, cueCardRef.current.offsetTop - 16),
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
    };

    scrollToCueCard();
    const delayedScroll = setTimeout(scrollToCueCard, 120);
    return () => clearTimeout(delayedScroll);
  }, [conversationContainerRef, isPart2Prep, prefersReducedMotion]);

  // Owned here, not by the page: this component renders the scroll container,
  // so the observers attach the moment it exists. Driving it from the page
  // silently did nothing, because the page shows a loader until the session
  // has loaded and the ref was still null when its effect ran.
  const { scrollToLatest } = useConversationAutoScroll(conversationContainerRef);

  // Re-follow on a new message or a completed part, even if the learner had
  // scrolled back to reread something.
  useEffect(() => {
    if (conversation.length > 0) scrollToLatest(prefersReducedMotion ? 'auto' : 'smooth');
  }, [conversation, prefersReducedMotion, scrollToLatest]);

  useEffect(() => {
    if (isPartComplete) scrollToLatest(prefersReducedMotion ? 'auto' : 'smooth');
  }, [isPartComplete, prefersReducedMotion, scrollToLatest]);

  const visibleConversation = getVisibleSpeakingConversation(conversation, speakingMode);
  const finalCandidateMessage = visibleConversation.findLast((entry) => entry.speaker === 'user');
  // The TTS hook owns utterance identity. Inferring activity from the latest AI
  // entry made an already-delivered question enter a queued/live state while a
  // candidate caption was listening below it. Only the exact active utterance
  // may receive the examiner-live treatment.
  const activeExaminerIndex = activeSpeechText
    ? visibleConversation.findLastIndex(
        (entry) => entry.speaker === 'ai' && entry.text?.trim() === activeSpeechText.trim()
      )
    : -1;
  const liveExaminerIndex = activeExaminerIndex;
  const showExaminerLive =
    liveExaminerIndex >= 0 && (isTTSLoading || isPlaybackActive || isSpeaking);
  const showStreamingCandidate =
    speakingMode === 'practice' &&
    (isListening || isProcessing) &&
    (!finalCandidateMessage || finalCandidateMessage.text !== liveTranscript);

  const roomStatus = !testStarted
    ? 'Ready when you are'
    : isPart2Prep
      ? 'Preparation window'
      : timeExpired
        ? "Time's up"
        : isListening
          ? 'Listening live'
          : isProcessing
            ? 'Processing response'
            : isSpeaking || isTTSLoading
              ? 'Examiner speaking'
              : 'Your turn';

  const roomStatusIsActive =
    testStarted &&
    (timeExpired || isListening || isProcessing || isSpeaking || isTTSLoading || isPart2Prep);

  return (
    <div
      className={cn(
        PANEL,
        'isolate flex h-[calc(100dvh-11.5rem)] max-h-[760px] min-h-[360px] transform-gpu flex-col overflow-hidden rounded-xl sm:h-[calc(100dvh-11.25rem)] sm:min-h-[480px] xl:h-[calc(100vh-7.5rem)] xl:min-h-[540px]'
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-11 shrink-0 items-center justify-between gap-2 border-b border-[#e4e2f0] bg-white px-3 py-1.5 dark:border-white/[0.07] dark:bg-[#131315] sm:px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
              <Mic2 className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className={cn(MICRO, 'hidden text-rose-600 dark:text-rose-400 sm:block')}>
                Conversation room
              </p>
              <p className={cn(TITLE, 'truncate text-xs sm:text-[13px]')}>AI examiner</p>
            </div>
          </div>

          <div
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-rose-500/15 bg-rose-500/5.5 px-2 py-1 dark:border-rose-400/20 dark:bg-rose-400/8"
            role="status"
            aria-live="polite"
          >
            {roomStatusIsActive ? (
              <Activity
                className="h-3.5 w-3.5 text-rose-500 motion-safe:animate-pulse"
                aria-hidden="true"
              />
            ) : (
              <Radio className="h-3.5 w-3.5 text-rose-500/70" aria-hidden="true" />
            )}
            <span className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-rose-600 dark:text-rose-300 sm:text-[10px]">
              {roomStatus}
            </span>
          </div>
        </div>

        <div
          ref={conversationContainerRef}
          className="custom-scrollbar flex-1 space-y-2.5 overflow-y-auto p-2.5 sm:space-y-3 sm:p-3.5 md:p-4"
          aria-live="polite"
          aria-label="Conversation with the AI examiner"
        >
          {!testStarted ? (
            <InitialWelcomeScreen
              partNumber={currentPartNumber}
              title={currentPart?.title}
              speakingMode={speakingMode}
              setSpeakingMode={setSpeakingMode}
              speakingV2Available={speakingV2Available}
            />
          ) : (
            <AnimatePresence initial={false} mode="sync">
              {visibleConversation.map((entry, index) => (
                <ConversationMessage
                  key={`${entry.speaker}-${index}`}
                  entry={
                    index === liveExaminerIndex && showExaminerLive
                      ? {
                          ...entry,
                          isExaminerLive: true,
                          isExaminerSpeaking: isPlaybackActive,
                          isExaminerPreparing: !isPlaybackActive,
                          speechProgress,
                        }
                      : entry
                  }
                  index={index}
                  authUser={authUser}
                />
              ))}
              {showStreamingCandidate && (
                <ConversationMessage
                  key="candidate-live-transcript"
                  entry={{
                    speaker: 'user',
                    text: liveTranscript,
                    isLoading: true,
                    isLive: isListening,
                    isTranscriptDraft: !isListening,
                    autoFinishCountdown,
                    autoSubmitPaused,
                  }}
                  index={visibleConversation.length}
                  authUser={authUser}
                />
              )}
              {speakingMode === 'exam' && isListening && <ExamListeningIndicator />}
            </AnimatePresence>
          )}
          {isPartComplete && (
            <div className="px-1 pb-2 pt-4">
              <PartCompleteCard
                isPartComplete={isPartComplete}
                currentPartNumber={currentPartNumber}
                allParts={allParts}
                onMoveToNext={moveToNextPart}
                isTransitioning={isPartTransitioning}
              />
            </div>
          )}
          {testStarted &&
            shouldShowPart2CueCard({ currentPartNumber, isPart2Prep, cueCardTopic }) && (
              <div ref={cueCardRef} className="pb-2 pt-1 sm:pt-2">
                <Part2CueCard cueCardTopic={cueCardTopic} />
              </div>
            )}
        </div>

        {!isPartComplete && (
          <div className="isolate shrink-0 transform-gpu border-t border-[#e4e2f0] px-2.5 py-2 dark:border-white/[0.07] sm:px-4">
            {timeExpired ? (
              <TimeUpTransition
                currentPartNumber={currentPartNumber}
                isFinalPart={!allParts[currentPartNumber + 1]}
              />
            ) : testStarted && isPart2Prep ? (
              <Part2PreparationControls
                prepTimeLeft={prepTimeLeft}
                onStartSpeaking={handleStartPart2Speaking}
              />
            ) : (
              <div className="flex flex-col items-center">
                <RecordingControls
                  testStarted={testStarted}
                  isPart2Prep={isPart2Prep}
                  isListening={isListening}
                  isRecording={isRecording}
                  isProcessing={isProcessing}
                  isSpeaking={isSpeaking}
                  isTTSLoading={isTTSLoading}
                  processingStatus={processingStatus}
                  micError={micError}
                  autoSubmitPaused={autoSubmitPaused}
                  handsFreeEnabled={handsFreeEnabled}
                  speakingMode={speakingMode}
                  timerExpiredRef={timerExpiredRef}
                  onStartListening={startListening}
                  onStopListening={stopListening}
                  onAutoSubmitPausedChange={setAutoSubmitPaused}
                  onStartTest={handleStartTest}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
