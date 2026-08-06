import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Inbox, Lightbulb, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import ResizeHandle from '@/components/ui/resize-handle';
import TranscriptPanel from './TranscriptPanel';
import AudioPlayer from './AudioPlayer';
import ListeningPartTabs from './ListeningPartTabs';
import QuestionGroupCard from './QuestionGroupCard';
import { useListeningTestStore } from '../../../store/useListeningTestStore';

export default function ListeningTestMainContent({
  layout,
  nav,
  audioPlayerRef,
  activePart,
  answers,
  handleAnswerChange,
  handleMultiSelectChange,
  toggleFlag,
  flaggedQuestions,
  isFinished,
  correctAnswersMap,
  dispatch,
  ACTIONS,
  testMode = 'practice',
  isAwaitingStart = false,
  examReview = false,
  onExamAudioEnded,
}) {
  const isExamMode = testMode === 'exam';
  const {
    leftPanelWidth,
    setLeftPanelWidth,
    setIsResizing,
    isMobile,
    containerRef,
    scrollContainerRef,
    handleResizeKeyDown,
  } = layout;

  const { displaySections, currentSection, sectionQuestions, questionGroups, stats } = nav;

  return (
    <div
      className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden relative"
      data-oid="m0_71d5"
    >
      <div
        className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden w-full relative z-10"
        ref={containerRef}
        data-oid="9o3tmui"
      >
        {/* Left Panel: Transcript */}
        <div
          className={cn(
            'shrink-0 bg-white dark:bg-[#08080a] border-r border-slate-200 dark:border-white/[0.07] flex flex-col h-full overflow-hidden transition-[width,transform] duration-300 ease-in-out absolute md:relative z-30 md:z-auto',
            isMobile && leftPanelWidth === 0 && '-translate-x-full',
            isMobile && leftPanelWidth === 100 && 'w-full translate-x-0'
          )}
          style={{
            width: isMobile ? (leftPanelWidth === 100 ? '100%' : '0%') : `${leftPanelWidth}%`,
          }}
          data-oid="uhj7xa:"
        >
          <TranscriptPanel
            audioPlayerRef={audioPlayerRef}
            currentSection={currentSection}
            sectionQuestions={sectionQuestions}
            isMobile={isMobile}
            examMode={isExamMode}
            isAwaitingStart={isAwaitingStart}
            examReview={examReview}
            onAudioEnded={onExamAudioEnded}
            onAudioDurationChange={(d) => {
              if (isExamMode || isAwaitingStart) return;
              const state = useListeningTestStore.getState();
              const isTimerUnset = state.timeRemaining === 0;
              const hasValidDuration = d > 0;
              const shouldSetInitialTime = isTimerUnset && !state.isFinished && hasValidDuration;
              if (shouldSetInitialTime) {
                dispatch({ type: ACTIONS.SET_TIME, payload: Math.ceil(d) + 60 });
                if (audioPlayerRef.current && !isFinished) {
                  audioPlayerRef.current.play();
                }
              }
            }}
            data-oid="dyitrvd"
          />

          {isMobile && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setLeftPanelWidth(0)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full shadow-md z-50 md:hidden"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        {!isMobile && (
          <ResizeHandle
            onMouseDown={() => setIsResizing(true)}
            onKeyDown={handleResizeKeyDown}
            aria-valuenow={leftPanelWidth}
            aria-valuemin={20}
            aria-valuemax={70}
            data-oid="p2_2k:w"
          />
        )}

        {/* Right Panel: Questions */}
        <div
          className={cn(
            'flex-1 flex flex-col min-h-0 bg-[#f8f8fb] dark:bg-[#08080a] relative overflow-hidden transition-all duration-300',
            isMobile && leftPanelWidth === 100 && 'hidden'
          )}
          style={{ width: isMobile ? '100%' : `${100 - leftPanelWidth}%` }}
          data-oid="1vkp36."
        >
          {isMobile && (
            <div className="md:hidden px-4 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLeftPanelWidth(100)}
                className="w-full justify-start gap-2 h-9 text-xs font-bold border-slate-200 dark:border-white/[0.07] bg-white/50 dark:bg-white/4 backdrop-blur-sm rounded-xl"
              >
                <Lightbulb className="w-4 h-4 text-[#5a63df]" />
                {isExamMode ? 'Show Audio' : 'Show Transcript & Audio'}
              </Button>
            </div>
          )}

          {/* Right Panel Header & Tabs */}
          <ListeningPartTabs
            displaySections={displaySections}
            activePart={activePart}
            stats={stats}
            dispatch={dispatch}
            ACTIONS={ACTIONS}
            locked={isExamMode && !examReview}
          />

          {/* Questions Scroll Area */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto min-h-0 p-2 md:p-4 custom-scrollbar"
            data-oid="ei0mpxi"
          >
            <div className="max-w-4xl mx-auto pb-8" data-oid="mazna.x">
              <AnimatePresence mode="wait" data-oid="6t5jc9d">
                <motion.div
                  key={activePart}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  data-oid="dtbr3a4"
                >
                  {sectionQuestions.length > 0 ? (
                    questionGroups.map((group, gIdx) => (
                      <QuestionGroupCard
                        key={gIdx}
                        group={group}
                        answers={answers}
                        handleAnswerChange={handleAnswerChange}
                        handleMultiSelectChange={handleMultiSelectChange}
                        toggleFlag={toggleFlag}
                        flaggedQuestions={flaggedQuestions}
                        isFinished={isFinished}
                        correctAnswersMap={correctAnswersMap}
                      />
                    ))
                  ) : (
                    <div
                      className="flex flex-col items-center justify-center h-full py-20 opacity-50"
                      data-oid="pfsl8gz"
                    >
                      <Inbox className="w-16 h-16 text-slate-300 mb-4" data-oid="w5rdlsj" />
                      <p className="font-semibold text-slate-400" data-oid="3em_akk">
                        No questions for this section
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
            {isMobile && <div className="h-28 shrink-0" />}
          </div>
        </div>

        {/* Floating Mobile Audio Player */}
        {isMobile && leftPanelWidth === 0 && currentSection.audio_url && (
          <div className="absolute bottom-0 left-0 right-0 p-2 z-40 bg-linear-to-t/srgb from-background/95 via-background/90 to-transparent pb-4 pt-8">
            <AudioPlayer
              ref={audioPlayerRef}
              src={currentSection.audio_url}
              onDurationChange={(d) => {
                if (isExamMode || isAwaitingStart) return;
                const state = useListeningTestStore.getState();
                const isTimerUnset = state.timeRemaining === 0;
                const hasValidDuration = d > 0;
                const shouldSetInitialTime = isTimerUnset && !state.isFinished && hasValidDuration;
                if (shouldSetInitialTime) {
                  dispatch({ type: ACTIONS.SET_TIME, payload: Math.ceil(d) + 60 });
                  if (audioPlayerRef.current && !isFinished) {
                    audioPlayerRef.current.play();
                  }
                }
              }}
              onTimeUpdate={(t) => dispatch({ type: ACTIONS.UPDATE_AUDIO_TIME, payload: t })}
              examMode={isExamMode}
              isAwaitingStart={isAwaitingStart}
              examReview={examReview}
              onEnded={onExamAudioEnded}
              data-oid="floating-mob-audio"
            />
          </div>
        )}
      </div>
    </div>
  );
}
