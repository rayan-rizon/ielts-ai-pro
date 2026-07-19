import { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PlayCircle, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatePresence } from 'framer-motion';

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
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
            Preparation time
          </p>
          <p className="mt-0.5 text-sm font-extrabold tabular-nums text-foreground">
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
  processingStatus,
  micError,
  timerExpiredRef,
  startListening,
  stopListening,
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

  return (
    <Card className="isolate flex min-h-[470px] transform-gpu flex-col overflow-hidden rounded-2xl border border-border/65 bg-card/95 shadow-[0_22px_65px_-42px_hsl(var(--foreground)/0.38)] backdrop-blur-xl sm:min-h-[560px] sm:rounded-3xl lg:min-h-[600px] xl:h-[calc(100vh-13.25rem)] xl:min-h-[500px] xl:max-h-[740px]">
      <CardContent className="flex min-h-0 flex-1 flex-col bg-dot-slate-200/20 p-0 dark:bg-dot-white/[0.02]">
        <div
          ref={conversationContainerRef}
          className="custom-scrollbar min-h-[300px] flex-1 space-y-4 overflow-y-auto scroll-smooth p-3.5 sm:min-h-[400px] sm:space-y-5 sm:p-6 md:p-7 lg:min-h-[430px]"
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
                  entry={entry}
                  index={index}
                  authUser={authUser}
                />
              ))}
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
          <div className="isolate shrink-0 transform-gpu border-t border-border/60 bg-card/95 px-3 py-2.5 sm:px-5 sm:py-4">
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
                  timerExpiredRef={timerExpiredRef}
                  onStartListening={startListening}
                  onStopListening={stopListening}
                  onStartTest={handleStartTest}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
