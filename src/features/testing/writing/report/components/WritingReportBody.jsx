import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useWritingTestStore } from '@/features/testing/writing/store/useWritingTestStore';
import { combinedWritingBand } from '../../utils/writingReportModel';
import { useAttemptFacts } from '../useAttemptFacts';
import { useBandModels } from '../useBandModels';
import { useReportContent } from '../useReportContent';
import { useReportDownload } from '../useReportDownload';
import { useTranslatedReport } from '../useTranslatedReport';
import { ReportSections } from './ReportSections';
import { LanguageNotice, ReportToolbar } from './ReportToolbar';
import { ResultSlip } from './ResultSlip';

/** Revising needs a practice session the coach can save the new draft to. */
const reviseAction = ({ onRevise, coach }) =>
  [onRevise, coach.coachSession?.id, coach.coachTaskType].every(Boolean) ? onRevise : null;

const NO_ESSAY_ACTIONS = {};

export function WritingReportBody({ t, feedback, sessionId, essay = NO_ESSAY_ACTIONS, ...props }) {
  const { saveFailed, onLanguageChange, onShowInEssay, coachSession, coachTaskType, toolbarHost } =
    props;
  const { userProfile } = useAuth();
  const targetBand = userProfile?.target_band_score;
  const allFeedbacks = useWritingTestStore((state) => state.feedbacks);
  const translation = useTranslatedReport({ feedback, sessionId, language: t.language });
  const content = useReportContent({
    feedback,
    shown: translation.shown,
    originalHtml: props.originalHtml,
    sessionId,
    t,
  });
  const models = useBandModels({
    sessionId,
    taskType: content.taskType,
    language: t.language,
    markedAt: feedback.generatedAt,
  });
  const attempt = useAttemptFacts({
    sessionId,
    markedAt: feedback.generatedAt,
    taskType: content.taskType,
  });
  const download = useReportDownload({
    t,
    sessionId,
    targetBand,
    comparisons: () => ({ [content.taskType]: models.loaded() }),
  });
  const coach = { coachSession, coachTaskType };

  const toolbar = (
    <ReportToolbar
      t={t}
      onLanguageChange={onLanguageChange}
      onDownloadPdf={download.handleDownloadPdf}
      isDownloadingPdf={download.isDownloadingPdf}
    />
  );

  return (
    <motion.div
      key="results"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="@container min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
    >
      {toolbarHost && createPortal(toolbar, toolbarHost)}
      <div
        className={
          toolbarHost
            ? '@container mx-auto w-full max-w-[1240px] space-y-3.5 px-3 pb-6 pt-2.5 sm:px-4 sm:pt-3'
            : '@container mx-auto w-full max-w-[1240px] space-y-3.5 px-3 pb-6 pt-3 sm:p-4'
        }
      >
        {!toolbarHost && toolbar}
        <ResultSlip
          t={t}
          feedback={translation.shown}
          original={feedback}
          taskType={content.taskType}
          criteria={content.criteria}
          targetBand={targetBand}
          marking={content.marking}
          combinedBand={combinedWritingBand(allFeedbacks)}
          attempt={attempt}
        />
        <LanguageNotice
          t={t}
          status={translation.status}
          onRetry={translation.retry}
          onTranslate={translation.translate}
          saveFailed={saveFailed}
        />
        <ReportSections
          t={t}
          feedback={feedback}
          content={content}
          models={models}
          sessionId={sessionId}
          user={userProfile}
          revise={reviseAction({ onRevise: props.onRevise, coach })}
          onShowInEssay={onShowInEssay}
          coach={coach}
          explained={translation.shown}
          essay={essay}
        />
        <p className="px-1 pb-1 text-[11.5px] leading-4 text-slate-500 dark:text-slate-400">
          {t('disclaimer')}
        </p>
      </div>
    </motion.div>
  );
}
