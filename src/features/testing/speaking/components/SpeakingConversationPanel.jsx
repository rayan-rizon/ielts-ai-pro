import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { PlayCircle, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';
import { MICRO, MUTED, NUM, PANEL } from '@/features/dashboard/components/primitives';

import ConversationMessage from './ConversationMessage';
import InitialWelcomeScreen from './InitialWelcomeScreen';
import Part2CueCard from './Part2CueCard';
import PartCompleteCard from './PartCompleteCard';
import RecordingControls from './RecordingControls';

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
  timerExpiredRef,
  startListening,
  stopListening,
  setAutoSubmitPaused,
  handleStartTest,
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

  useEffect(() => {
    if (!isListening || !conversationContainerRef.current) return;
    conversationContainerRef.current.scrollTo({
      top: conversationContainerRef.current.scrollHeight,
      behavior: liveTranscript ? 'smooth' : 'auto',
    });
  }, [conversationContainerRef, isListening, liveTranscript]);

  const finalCandidateMessage = conversation.findLast((entry) => entry.speaker === 'user');
  const latestExaminerIndex = conversation.findLastIndex((entry) => entry.speaker === 'ai');
  const latestExaminerMessage = latestExaminerIndex >= 0 ? conversation[latestExaminerIndex] : null;
  const latestExaminerKey = latestExaminerMessage
    ? `${latestExaminerIndex}:${latestExaminerMessage.text}`
    : null;
  const activeExaminerIndex = activeSpeechText
    ? conversation.findLastIndex(
        (entry) => entry.speaker === 'ai' && entry.text?.trim() === activeSpeechText
      )
    : -1;
  const activeExaminerKey =
    activeExaminerIndex >= 0
      ? `${activeExaminerIndex}:${conversation[activeExaminerIndex].text}`
      : null;
  const [examinerStream, setExaminerStream] = useState({
    key: null,
    phase: 'finished',
  });

  useLayoutEffect(() => {
    if (!latestExaminerKey) return;
    setExaminerStream((current) =>
      current.key === latestExaminerKey ? current : { key: latestExaminerKey, phase: 'queued' }
    );
  }, [latestExaminerKey]);

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
    (isListening || isProcessing) &&
    (!finalCandidateMessage || finalCandidateMessage.text !== liveTranscript);

  return (
    <div
      className={cn(
        PANEL,
        'isolate flex h-[calc(100dvh-14rem)] max-h-[740px] min-h-[420px] transform-gpu flex-col overflow-hidden rounded-2xl sm:h-[calc(100dvh-15rem)] sm:min-h-[480px] sm:rounded-3xl xl:h-[calc(100vh-13.25rem)] xl:min-h-[500px]'
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div
          ref={conversationContainerRef}
          className="custom-scrollbar flex-1 space-y-4 overflow-y-auto scroll-smooth p-3.5 sm:space-y-5 sm:p-6 md:p-7"
          aria-live="polite"
          aria-label="Conversation with the AI examiner"
        >
          {!testStarted ? (
            <InitialWelcomeScreen partNumber={currentPartNumber} title={currentPart?.title} />
          ) : (
            <AnimatePresence mode="sync">
              {conversation.map((entry, index) => (
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
                  index={conversation.length}
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
          {testStarted && isPart2Prep && cueCardTopic && (
            <div ref={cueCardRef} className="pb-2 pt-1 sm:pt-2">
              <Part2CueCard cueCardTopic={cueCardTopic} />
            </div>
          )}
        </div>

        {!isPartComplete && (
          <div className="isolate shrink-0 transform-gpu border-t border-[#e4e2f0] px-3 py-2.5 dark:border-white/[0.07] sm:px-5 sm:py-4">
            {testStarted && isPart2Prep ? (
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
