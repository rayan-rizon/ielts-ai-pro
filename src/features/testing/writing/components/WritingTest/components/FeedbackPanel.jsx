import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { LanguagePromptDialog } from '../../../report/components/LanguagePromptDialog';
import { ReportErrorState } from '../../../report/components/ReportErrorState';
import { WritingReportBody } from '../../../report/components/WritingReportBody';
import { reportT } from '../../../report/reportStrings';
import { reportFontFamily, useReportFonts } from '../../../report/useReportFonts';
import { useReportLanguage } from '../../../report/useReportLanguage';
import WritingAnalysis from './WritingAnalysis';

/**
 * The Writing report pane: marking in progress, a failed review, or the report
 * in the learner's report language. `reportSessionId` is the saved attempt the
 * translation and Band 7/8 comparison are read from; without it the report is
 * shown as saved, in English explanations.
 */
export function FeedbackPanel({
  feedback,
  isAnalyzing,
  feedbackError,
  handleGetFeedback,
  loadingMessage,
  onShowInEssay,
  onRevise,
  coachSession,
  coachTaskType,
  originalHtml,
  reportSessionId,
  essay,
  toolbarHost,
}) {
  const reportLanguage = useReportLanguage();
  const showsReport = Boolean(!isAnalyzing && !feedbackError && feedback);
  const t = reportT(showsReport ? reportLanguage.language : 'en');
  useReportFonts(t.language);

  if (!feedback && !isAnalyzing && !feedbackError) return null;

  return (
    <div
      id="feedback-section"
      lang={t.language}
      dir={t.rtl ? 'rtl' : 'ltr'}
      style={{ fontFamily: reportFontFamily(t.language) }}
      className="flex h-full min-h-0 flex-col bg-[#f7f6fd] text-slate-900 dark:bg-[#08080a] dark:text-white"
    >
      <AnimatePresence mode="wait">
        {isAnalyzing && <WritingAnalysis loadingMessage={loadingMessage} />}
        {!isAnalyzing && feedbackError && (
          <ReportErrorState feedbackError={feedbackError} handleGetFeedback={handleGetFeedback} />
        )}
        {showsReport && (
          <WritingReportBody
            t={t}
            feedback={feedback}
            sessionId={reportSessionId}
            saveFailed={reportLanguage.saveFailed}
            onLanguageChange={reportLanguage.choose}
            onShowInEssay={onShowInEssay}
            onRevise={onRevise}
            coachSession={coachSession}
            coachTaskType={coachTaskType}
            originalHtml={originalHtml}
            essay={essay}
            toolbarHost={toolbarHost}
          />
        )}
      </AnimatePresence>
      {showsReport && reportLanguage.needsChoice && (
        <LanguagePromptDialog onChoose={reportLanguage.choose} />
      )}
    </div>
  );
}
