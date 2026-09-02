import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useReadingTestSheetEntries } from './ReadingTestSheet/answerSheetUtils';
import ReadingTestSheetDrawer from './ReadingTestSheet/ReadingTestSheetDrawer';

const ReadingTestSheet = (props) => {
  const { showAnswerSheet, currentPassageIndex, testData, allQuestions, isFinished, isMobile } =
    props;

  const sheetEntries = useReadingTestSheetEntries(allQuestions, testData, currentPassageIndex);
  const isInline = isFinished && !isMobile;

  return (
    <AnimatePresence data-oid="d_r9vf6">
      {showAnswerSheet && (
        <ReadingTestSheetDrawer {...props} sheetEntries={sheetEntries} isInline={isInline} />
      )}
    </AnimatePresence>
  );
};

export default ReadingTestSheet;
