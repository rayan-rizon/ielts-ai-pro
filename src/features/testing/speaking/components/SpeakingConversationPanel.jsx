import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Activity, Mic2, PlayCircle, Radio, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';
import { MICRO, MUTED, NUM, PANEL, TITLE } from '@/features/dashboard/components/primitives';

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
        className="h-11 w-full gap-2 rounded-xl bg-rose-500 px-5 text-xs font-extrabold text-white shadow-lg shadow-rose-500/20 hover:bg-rose-600 sm:w-auto"
      >
        <PlayCircle className="h-4 w-4" aria-hidden="true" />
        Start speaking now
      </Button>
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

  useEffect(() => {
    if (!isPart2Prep || !cueCardRef.current || !conversationContainerRef.current) return;

    const container = conversationContainerRef.current;
    const scrollToCueCard = () => {
      container.scrollTo({
        top: Math.max(0, cueCardRef.current.offsetTop - 16),
        behavior: 'smooth',
      });
    };

    scrollToCueCard();
    const delayedScroll = setTimeout(scrollToCueCard, 120);
    return () => clearTimeout(delayedScroll);
  }, [conversationContainerRef, isPart2Prep]);

  // Owned here, not by the page: this component renders the scroll container,
  // so the observers attach the moment it exists. Driving it from the page
  // silently did nothing, because the page shows a loader until the session
  // has loaded and the ref was still null when its effect ran.
  const { scrollToLatest } = useConversationAutoScroll(conversationContainerRef);

  // Re-follow on a new message or a completed part, even if the learner had
  // scrolled back to reread something.
  useEffect(() => {
    if (conversation.length > 0) scrollToLatest('smooth');
  }, [conversation, scrollToLatest]);

  useEffect(() => {
    if (isPartComplete) scrollToLatest('smooth');
  }, [isPartComplete, scrollToLatest]);

  const visibleConversation = getVisibleSpeakingConversation(conversation, speakingMode);
  const finalCandidateMessage = visibleConversation.findLast((entry) => entry.speaker === 'user');
  const latestExaminerIndex = visibleConversation.findLastIndex((entry) => entry.speaker === 'ai');
  const latestExaminerMessage =
    latestExaminerIndex >= 0 ? visibleConversation[latestExaminerIndex] : null;

  // Identity is the spoken text, never the array position. Keying on the index
  // meant that dropping a loading placeholder — which happens every time an
  // answer is submitted — renumbered the examiner's last message, and an
  // already-delivered question replayed its typing animation underneath the
  // learner's new reply.
  const latestExaminerKey = latestExaminerMessage?.text?.trim() || null;
  const activeExaminerIndex = activeSpeechText
    ? visibleConversation.findLastIndex(
        (entry) => entry.speaker === 'ai' && entry.text?.trim() === activeSpeechText
      )
    : -1;
  const activeExaminerKey =
    activeExaminerIndex >= 0 ? visibleConversation[activeExaminerIndex].text?.trim() || null : null;
  const [examinerStream, setExaminerStream] = useState({
    key: null,
    phase: 'finished',
  });
  // Texts that have already run their stream once, so a re-render can never
  // send the same examiner turn back through the "LIVE" treatment.
  const streamedKeysRef = useRef(new Set());

  useLayoutEffect(() => {
    if (!latestExaminerKey) return;
    if (streamedKeysRef.current.has(latestExaminerKey)) return;
    streamedKeysRef.current.add(latestExaminerKey);
    setExaminerStream((current) =>
      current.key === latestExaminerKey ? current : { key: latestExaminerKey, phase: 'queued' }
    );
  }, [latestExaminerKey]);

  // Each part starts a fresh transcript, so the streamed history resets with it.
  useEffect(() => {
    if (conversation.length === 0) streamedKeysRef.current.clear();
  }, [conversation.length]);

  useEffect(() => {
    if (!activeExaminerKey || examinerStream.key !== activeExaminerKey) return;
    if (isPlaybackActive) {
      setExaminerStream((current) =>
        current.phase === 'playing' ? current : { ...current, phase: 'playing' }
      );
      return;
    }
    if (!isSpeaking && !isTTSLoading && examinerStream.phase === 'playing') {
      setExaminerStream((current) => ({ ...current, phase: 'finished' }));
    }
  }, [
    activeExaminerKey,
    examinerStream.key,
    examinerStream.phase,
    isPlaybackActive,
    isSpeaking,
    isTTSLoading,
  ]);

  useEffect(() => {
    if (
      examinerStream.phase !== 'queued' ||
      examinerStream.key !== latestExaminerKey ||
      isSpeaking ||
      isTTSLoading
    ) {
      return undefined;
    }

    const settleExistingMessage = setTimeout(() => {
      setExaminerStream((current) =>
        current.key === latestExaminerKey && current.phase === 'queued'
          ? { ...current, phase: 'finished' }
          : current
      );
    }, 900);
    return () => clearTimeout(settleExistingMessage);
  }, [examinerStream.key, examinerStream.phase, isSpeaking, isTTSLoading, latestExaminerKey]);

  const latestExaminerIsNew =
    Boolean(latestExaminerKey) && examinerStream.key !== latestExaminerKey;
  const queuedExaminerIndex =
    latestExaminerIsNew || examinerStream.phase === 'queued' ? latestExaminerIndex : -1;
  const liveExaminerIndex = activeExaminerIndex >= 0 ? activeExaminerIndex : queuedExaminerIndex;
  const showExaminerLive =
    liveExaminerIndex >= 0 &&
    (queuedExaminerIndex >= 0 || isTTSLoading || isPlaybackActive || isSpeaking);
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
        'isolate flex h-[calc(100dvh-14rem)] max-h-[740px] min-h-[420px] transform-gpu flex-col overflow-hidden rounded-xl sm:h-[calc(100dvh-15rem)] sm:min-h-[480px] xl:h-[calc(100vh-13.25rem)] xl:min-h-[500px]'
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#e4e2f0] bg-white px-3.5 py-2.5 dark:border-white/[0.07] dark:bg-[#131315] sm:px-5 sm:py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
              <Mic2 className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className={cn(MICRO, 'text-rose-600 dark:text-rose-400')}>Conversation room</p>
              <p className={cn(TITLE, 'truncate text-xs sm:text-sm')}>AI examiner chat</p>
            </div>
          </div>

          <div
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-rose-500/15 bg-rose-500/5.5 px-2.5 py-1.5 dark:border-rose-400/20 dark:bg-rose-400/8"
            role="status"
            aria-live="polite"
          >
            {roomStatusIsActive ? (
              <Activity className="h-3.5 w-3.5 animate-pulse text-rose-500" aria-hidden="true" />
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
          className="custom-scrollbar flex-1 space-y-3 overflow-y-auto scroll-smooth p-3 sm:space-y-4 sm:p-4 md:p-5"
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
            <AnimatePresence mode="sync">
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
            </AnimatePresence>
          )}
          {isPartComplete && (
            <div className="px-1 pb-2 pt-4">
              <PartCompleteCard
                isPartComplete={isPartComplete}
                currentPartNumber={currentPartNumber}
                allParts={allParts}
                onMoveToNext={moveToNextPart}
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
          <div className="isolate shrink-0 transform-gpu border-t border-[#e4e2f0] px-3 py-2.5 dark:border-white/[0.07] sm:px-5 sm:py-4">
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
              <div className="flex flex-col items-center gap-3">
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
