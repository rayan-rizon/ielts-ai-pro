import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useWritingTestStore } from '@/features/testing/writing/store/useWritingTestStore';
import { combinedWritingBand } from '../../utils/writingReportModel';
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

export function WritingReportBody({ t, feedback, sessionId, ...props }) {
  const { saveFailed, onLanguageChange, onShowInEssay, coachSession, coachTaskType } = props;
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
  const models = useBandModels({ sessionId, taskType: content.taskType, language: t.language });
  const download = useReportDownload({
    t,
    sessionId,
    targetBand,
    comparisons: () => ({ [content.taskType]: models.loaded() }),
  });
  const coach = { coachSession, coachTaskType };

  return (
    <motion.div
      key="results"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="@container min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
    >
      <div className="@container space-y-3 p-3 sm:p-4">
        <ReportToolbar
          t={t}
          onLanguageChange={onLanguageChange}
          onDownloadPdf={download.handleDownloadPdf}
          isDownloadingPdf={download.isDownloadingPdf}
        />
        <ResultSlip
          t={t}
          feedback={translation.shown}
          taskType={content.taskType}
          criteria={content.criteria}
          targetBand={targetBand}
          marking={content.marking}
          combinedBand={combinedWritingBand(allFeedbacks)}
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
        />
        <p className="px-1 pb-1 text-[11.5px] leading-4 text-slate-500 dark:text-slate-400">
          {t('disclaimer')}
        </p>
      </div>
    </motion.div>
  );
}
