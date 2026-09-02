import React from 'react';
import { motion } from 'framer-motion';
import AnswerInputItem from './AnswerInputItem';

export default function ReadingTestSheetList({
  sheetEntries,
  allQuestions,
  answers,
  handleAnswerChange,
  isFinished,
  onQuestionClick,
}) {
  return (
    <div
      className="flex-1 overflow-y-auto p-2 scroll-smooth bg-muted/50 scrollbar-thin scrollbar-thumb-border/50"
      data-oid="95:-bnd"
    >
      <motion.div
        layout
        className="grid grid-cols-1 gap-2"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.04 },
          },
        }}
        initial="hidden"
        animate="visible"
        data-oid="lx4x_0u"
      >
        {sheetEntries.map((entry, idx) => (
          <motion.div
            key={idx}
            variants={{
              hidden: { opacity: 0, x: 20 },
              visible: { opacity: 1, x: 0 },
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            data-oid="qkgt70_"
          >
            <AnswerInputItem
              question={entry.question}
              globalNum={entry.globalNum}
              subId={entry.subId}
              correctAnswer={entry.correctAnswer}
              answers={answers}
              handleAnswerChange={handleAnswerChange}
              isFinished={isFinished}
              onQuestionClick={onQuestionClick}
            />
          </motion.div>
        ))}
      </motion.div>

      {(!allQuestions || allQuestions.length === 0) && (
        <div className="text-center py-8 text-muted-foreground col-span-2" data-oid="n1n7vs-">
          No questions found.
        </div>
      )}
    </div>
  );
}
