import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import ReadingTestSheetHeader from './ReadingTestSheetHeader';
import ReadingTestSheetList from './ReadingTestSheetList';

export default function ReadingTestSheetDrawer({
  setShowAnswerSheet,
  currentPassageIndex,
  allQuestions,
  answers,
  handleAnswerChange,
  isFinished,
  onQuestionClick,
  isInline,
  sheetEntries,
}) {
  return (
    <>
      {!isInline && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-100 lg:hidden"
          onClick={() => setShowAnswerSheet(false)}
          data-oid="w1-11be"
        />
      )}

      <motion.div
        initial={isInline ? { width: 0, opacity: 0 } : { x: '100%', opacity: 0 }}
        animate={isInline ? { width: 320, opacity: 1 } : { x: 0, opacity: 1 }}
        exit={isInline ? { width: 0, opacity: 0 } : { x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        id="reading-answer-sheet"
        className={cn(
          'bg-card border-l border-border flex flex-col overflow-hidden',
          isInline
            ? 'relative z-40 h-full shrink-0 shadow-none border-t-0 rounded-none w-80 max-w-[320px]'
            : 'fixed right-0 top-[76px] h-[calc(100vh-76px)] w-full sm:w-80 border-t shadow-lg z-100 rounded-tl-2xl'
        )}
        data-oid="fwsy8kw"
      >
        <ReadingTestSheetHeader
          currentPassageIndex={currentPassageIndex}
          setShowAnswerSheet={setShowAnswerSheet}
        />

        <ReadingTestSheetList
          sheetEntries={sheetEntries}
          allQuestions={allQuestions}
          answers={answers}
          handleAnswerChange={handleAnswerChange}
          isFinished={isFinished}
          onQuestionClick={onQuestionClick}
        />

        <div
          className="p-3 border-t border-border/40 bg-card flex justify-between items-center text-xs font-medium text-muted-foreground"
          data-oid="7:eeecd"
        >
          <span data-oid="06enhlj">{Object.keys(answers).length} answered</span>
        </div>
      </motion.div>
    </>
  );
}
