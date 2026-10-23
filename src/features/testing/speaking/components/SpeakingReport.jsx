import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { toast } from 'sonner';

import XPNotification from '@/components/XPNotification';
import { callEdgeFunction } from '@/utils/api';
import { cn } from '@/lib/cn';
import { TooltipProvider } from '@/components/ui/tooltip';
import { MUTED, PANEL, Pill, TITLE } from '@/features/dashboard/components/primitives';

import AskAiCoachButton from '@/features/ai-coach/components/AskAiCoachButton';
import SpeakingAnalysis from './SpeakingAnalysis';
import SpeakingReportErrorState from './SpeakingReportErrorState';
import ReportHeader from './report/ReportHeader';
import VerdictPanel from './report/VerdictPanel';
import TopFixPanel from './report/TopFixPanel';
import AnswerLengthMap from './report/AnswerLengthMap';
import AnswersSection from './report/AnswersSection';
import PracticePlanPanel from './report/PracticePlanPanel';
import CriteriaDetailPanel from './report/CriteriaDetailPanel';
import { PRIMARY_BUTTON, QUIET_BUTTON } from './report/reportStyles';
import { buildSpeakingReport } from '../utils/buildSpeakingReport';
import { normalizePractice, planWeek, savePracticeState } from '../utils/speakingReportPractice';

function InsufficientEvidence({ finalEvaluation }) {
  return (
    <div className={cn(PANEL, 'p-5')} role="status" data-testid="insufficient-speaking-evidence">
      <Pill tone="warn">No band assigned</Pill>
      <h2 className={cn(TITLE, 'mt-3 text-lg')}>More speaking evidence is needed</h2>
      <p className={cn(MUTED, 'mt-2 max-w-2xl text-sm leading-6')}>{finalEvaluation.feedback}</p>
      <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
        {finalEvaluation.targetBandTips}
      </p>
      <Link to="/speaking" className={cn(PRIMARY_BUTTON, 'mt-4')}>
        Choose a speaking test
      </Link>
    </div>
  );
}

function useReportDate(testDate, generatedAt) {
  const date = new Date(testDate || generatedAt || NaN);
  if (Number.isNaN(date.getTime())) return { label: '', iso: '', date: null };
  return {
    label: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    iso: date.toISOString(),
    date,
  };
}

export default function SpeakingReport({
  finalEvaluation,
  isEvaluating,
  evaluationError,
  onRetryEvaluation,
  showConfetti,
  onConfettiComplete,
  showXPNotification,
  earnedXP,
  onXPComplete,
  testTitle,
  testDate,
  testId,
  sessionId,
  savedPractice,
  partTwoTopic,
  allPartsConversation,
  allPartsPronunciation,
  detailedFeedback,
  isGeneratingDetailed: isGeneratingDetailedProp,
  deepDiveError,
  onRetryDeepDive,
  loadingMessage,
}) {
  const { width, height } = useWindowSize();
  const [isGeneratingDetailedLocal, setIsGeneratingDetailedLocal] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [activePart, setActivePart] = useState(1);
  const [activeId, setActiveId] = useState(null);
  const [rehearsingId, setRehearsingId] = useState(null);
  const [scrollRequest, setScrollRequest] = useState(0);
  const [practice, setPractice] = useState(() => normalizePractice(savedPractice));
  const practiceRef = useRef(practice);
  const pendingScrollRef = useRef(null);

  const isGeneratingDetailed = isGeneratingDetailedProp ?? isGeneratingDetailedLocal;
  const reportDate = useReportDate(testDate, finalEvaluation?.generatedAt);

  const report = useMemo(
    () =>
      buildSpeakingReport({
        finalEvaluation,
        allPartsConversation,
        allPartsPronunciation,
        detailedFeedback,
        partTwoTopic,
      }),
    [finalEvaluation, allPartsConversation, allPartsPronunciation, detailedFeedback, partTwoTopic]
  );

  const week = useMemo(() => planWeek(reportDate.iso || new Date()), [reportDate.iso]);

  // Scroll after the part tab has rendered the target answer.
  useEffect(() => {
    const id = pendingScrollRef.current;
    if (!id) return;
    pendingScrollRef.current = null;
    const node = document.getElementById(`answer-${id}`);
    if (!node) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    node.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    node.focus({ preventScroll: true });
  }, [scrollRequest]);

  const focusAnswer = useCallback(
    (id, { rehearse = false } = {}) => {
      const answer = report?.answers.find((item) => item.id === id);
      if (!answer) return;
      pendingScrollRef.current = id;
      setActivePart(answer.part);
      setActiveId(id);
      if (rehearse) setRehearsingId(id);
      setScrollRequest((count) => count + 1);
    },
    [report]
  );

  const persistPractice = useCallback(
    (next) => {
      practiceRef.current = next;
      setPractice(next);
      if (!sessionId) return;
      savePracticeState(sessionId, next).catch((error) => {
        console.error(error);
        toast.error('Your practice progress could not be saved', {
          description: 'Check your connection. It will save with your next change.',
        });
      });
    },
    [sessionId]
  );

  const toggleDay = useCallback(
    (drillId, dayKey) => {
      const current = practiceRef.current;
      const done = current.days[drillId] || [];
      const nextDone = done.includes(dayKey)
        ? done.filter((key) => key !== dayKey)
        : [...done, dayKey];
      persistPractice({ ...current, days: { ...current.days, [drillId]: nextDone } });
    },
    [persistPractice]
  );

  const saveRehearsal = useCallback(
    (answerId, result) => {
      const current = practiceRef.current;
      persistPractice({ ...current, reanswers: { ...current.reanswers, [answerId]: result } });
    },
    [persistPractice]
  );

  const handleGenerateDetailed = async () => {
    if (!testId || !allPartsConversation) {
      toast.error('This test’s answers were not saved, so feedback can’t be generated.');
      return;
    }
    setIsGeneratingDetailedLocal(true);
    try {
      const response = await callEdgeFunction('generateDetailedSpeakingFeedback', {
        testId,
        allPartsConversation,
      });
      if (!response.success || !response.detailedAnalysis) {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error(error);
      toast.error('Answer feedback could not be generated', {
        description: 'Try again in a moment.',
      });
    } finally {
      setIsGeneratingDetailedLocal(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    try {
      const { downloadSpeakingReportPdf } = await import('../utils/speakingReportPdf');
      downloadSpeakingReportPdf({
        finalEvaluation,
        testTitle,
        report,
        dateLabel: reportDate.label,
        week,
        practiceDays: practiceRef.current.days,
      });
      toast.success('Speaking report downloaded');
    } catch (error) {
      console.error(error);
      toast.error('The PDF could not be created', { description: 'Try again in a moment.' });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  if (isEvaluating) return <SpeakingAnalysis loadingMessage={loadingMessage} />;

  if (evaluationError) {
    return (
      <SpeakingReportErrorState
        evaluationError={evaluationError}
        onRetryEvaluation={onRetryEvaluation}
      />
    );
  }

  if (!finalEvaluation || !report) return null;

  const insufficient = finalEvaluation.assessmentStatus === 'insufficient_evidence';

  return (
    <div
      data-testid="speaking-report-scroll"
      className="custom-scrollbar relative isolate h-full min-h-0 overflow-y-auto overscroll-contain bg-[#f8f8fb] px-3 py-3 dark:bg-[#08080a] sm:px-4 sm:py-4 lg:px-6 lg:py-5"
    >
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          numberOfPieces={160}
          recycle={false}
          onConfettiComplete={onConfettiComplete}
          colors={['#5a63df', '#8f97ff', '#16966c', '#ffffff']}
          style={{ pointerEvents: 'none', zIndex: 200 }}
        />
      )}

      <XPNotification
        show={showXPNotification}
        xp={earnedXP?.xp || 0}
        bonus={earnedXP?.bonus || 0}
        streak={earnedXP?.streak || 0}
        onComplete={onXPComplete}
      />

      <TooltipProvider delayDuration={150}>
        <main className="mx-auto grid w-full max-w-[1180px] grid-cols-12 gap-3">
          <div className="col-span-12">
            <ReportHeader
              testTitle={testTitle}
              dateLabel={reportDate.label}
              dateTime={reportDate.iso}
              onDownloadPdf={handleDownloadPdf}
              isDownloadingPdf={isDownloadingPdf}
            />
          </div>

          {insufficient ? (
            <div className="col-span-12">
              <InsufficientEvidence finalEvaluation={finalEvaluation} />
            </div>
          ) : (
            <>
              <div className="col-span-12 lg:col-span-4">
                <VerdictPanel
                  summary={report.summary}
                  criteria={report.criteria}
                  holdingBack={report.holdingBack}
                  targetTip={finalEvaluation.targetBandTips}
                />
              </div>
              <div className="col-span-12 lg:col-span-8">
                <TopFixPanel
                  fix={report.topFix}
                  onRehearse={(id) => focusAnswer(id, { rehearse: true })}
                  onShowAnswer={(id) => focusAnswer(id)}
                />
              </div>

              <div className="col-span-12">
                <AnswerLengthMap
                  answers={report.answers}
                  basis={report.basis}
                  delivery={report.delivery}
                  onSelect={(id) => focusAnswer(id)}
                  activeId={activeId}
                />
              </div>

              <div className="col-span-12 min-w-0 lg:col-span-8">
                <AnswersSection
                  answers={report.answers}
                  basis={report.basis}
                  parts={report.summary.parts}
                  activePart={activePart}
                  onPartChange={setActivePart}
                  activeId={activeId}
                  rehearsingId={rehearsingId}
                  onRehearse={(id) => focusAnswer(id, { rehearse: true })}
                  onCloseRehearsal={() => setRehearsingId(null)}
                  onSaveRehearsal={saveRehearsal}
                  reanswers={practice.reanswers}
                  flaggedWords={report.flaggedWords}
                  isGenerating={Boolean(isGeneratingDetailed)}
                  deepDiveError={deepDiveError}
                  onRetryDeepDive={onRetryDeepDive || handleGenerateDetailed}
                  canRequestFeedback={report.answers.length > 0 || Boolean(allPartsConversation)}
                />
              </div>

              <aside
                className="col-span-12 flex min-w-0 flex-col gap-3 lg:col-span-4"
                aria-label="Practice and scoring detail"
              >
                <PracticePlanPanel
                  drills={report.drills}
                  week={week}
                  days={practice.days}
                  onToggleDay={toggleDay}
                  sourceId={testId}
                />
                <CriteriaDetailPanel
                  criteria={report.summary.criteria}
                  strengths={report.summary.strengths}
                  pronunciationBreakdown={report.pronunciationBreakdown}
                />
              </aside>
            </>
          )}

          <nav
            className="col-span-12 flex flex-col-reverse gap-2 border-t border-[#e4e2f0] pt-4 dark:border-white/[0.07] sm:flex-row sm:justify-end"
            aria-label="Next"
          >
            {sessionId && !insufficient ? (
              <AskAiCoachButton
                compact
                showAvatar
                label="Ask Ava about this report"
                draft="Which Speaking criterion should I work on first, and how?"
                sourceReference={{ type: 'test_session', id: sessionId }}
                className="h-9"
              />
            ) : null}
            <Link to="/dashboard" className={QUIET_BUTTON}>
              Back to dashboard
            </Link>
            <Link to="/speaking" className={PRIMARY_BUTTON}>
              Take another speaking test
            </Link>
          </nav>
        </main>
      </TooltipProvider>
    </div>
  );
}
