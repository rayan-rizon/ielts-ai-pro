import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Bot } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

import ConversationMessage from './ConversationMessage';
import InitialWelcomeScreen from './InitialWelcomeScreen';
import Part2CueCard from './Part2CueCard';
import PartCompleteCard from './PartCompleteCard';
import RecordingControls from './RecordingControls';

export default function SpeakingConversationPanel({
  currentPartNumber,
  currentPart,
  allParts,
  conversation,
  authUser,
  testStarted,
  isPartComplete,
  moveToNextPart,
  conversationEndRef,
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
  return (
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
              AI Practice
            </Badge>
            <div className="w-0.5 h-0.5 rounded-full bg-muted-foreground/30" />
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
              Mock Examiner
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 bg-dot-slate-200/40 dark:bg-dot-white/5">
        <div className="p-3 md:p-5 min-h-[150px] max-h-[500px] overflow-y-auto space-y-4 custom-scrollbar scroll-smooth">
          {!testStarted ? (
            <InitialWelcomeScreen partNumber={currentPartNumber} title={currentPart?.title} />
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
                isTTSLoading={isTTSLoading}
                processingStatus={processingStatus}
                micError={micError}
                timerExpiredRef={timerExpiredRef}
                onStartListening={startListening}
                onStopListening={stopListening}
                onStartTest={handleStartTest}
              />

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
  );
}
