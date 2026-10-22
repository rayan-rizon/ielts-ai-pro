import TakeWithFriend from '@/features/testing/paired/TakeWithFriend';
import PairedTestGate from '@/features/testing/paired/PairedTestGate';
import React, { useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import PremiumLoading from '@/components/ui/PremiumLoading';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import { cn } from '@/lib/cn';

import {
  ListeningTestProvider,
  useListeningTestState,
  useListeningTestDispatch,
} from '../components/ListeningTest/context/ListeningTestContext';
import { useTestNavigation } from '@/hooks/useTestNavigation';
import { useGamification } from '@/hooks/useGamification';
import { useListeningTestLogic } from '../components/ListeningTest/hooks/useListeningTestLogic';

import ListeningTestHeader from '../components/ListeningTestHeader';
import { useListeningTestLayout } from '../components/ListeningTest/hooks/useListeningTestLayout';
import { useListeningTestNavigation } from '../components/ListeningTest/hooks/useListeningTestNavigation';
import ListeningTestMainContent from '../components/ListeningTest/components/ListeningTestMainContent';
import ListeningTestOverlays from '../components/ListeningTest/components/ListeningTestOverlays';
import ListeningTestSheet from '../components/ListeningTestSheet';
import ObjectiveLimitPaywall from '@/features/testing/shared/components/ObjectiveLimitPaywall';
import { ObjectiveStartNote } from '@/features/testing/shared/components/ObjectiveQuotaControls';
import { summariseObjectiveQuota } from '@/features/testing/shared/quota/objectiveQuota';
import { useObjectiveTestQuota } from '@/features/testing/shared/quota/useObjectiveTestQuota';

export function hasListeningTestEntry(location, routeId = '') {
  const params = new URLSearchParams(location?.search || '');
  const hashParams = new URLSearchParams((location?.hash || '').replace(/^#/, ''));

  return Boolean(
    routeId ||
    params.get('test-id') ||
    params.get('room') ||
    params.get('together') === 'true' ||
    hashParams.get('invite')
  );
}

function ListeningTestInner() {
  const [showAnswerSheet, setShowAnswerSheet] = useState(false);
  const [showTimeUpDialog, setShowTimeUpDialog] = useState(false);

  const {
    showConfetti,
    showXPNotification,
    earnedXP,
    setShowXPNotification,
    setShowConfetti,
    awardXP,
  } = useGamification();

  const {
    audioPlayerRef,
    currentUser,
    toggleFlag,
    handleAnswerChange,
    handleMultiSelectChange,
    handleSubmit,
    handleStartTest,
    handleExamAudioEnded,
    testMode,
    selectedMode,
    setSelectedMode,
    examEligibility,
    isAwaitingStart,
    isStarting,
    examReview,
    limitQuota,
  } = useListeningTestLogic({
    awardXP,
    onResumeExpired: () => setShowTimeUpDialog(true),
  });

  const state = useListeningTestState();
  const { dispatch, ACTIONS } = useListeningTestDispatch();

  const nav = useListeningTestNavigation({
    testData: state.testData,
    questionsWithNumbers: state.questionsWithNumbers,
    activePart: state.activePart,
    answers: state.answers,
    isFinished: state.isFinished,
    dispatch,
    ACTIONS,
    showAnswerSheet,
    setShowAnswerSheet,
  });

  const layout = useListeningTestLayout({
    activePart: state.activePart,
    showAnswerSheet,
    isFinished: state.isFinished,
  });

  const { showExitDialog, setShowExitDialog, handleExit } = useTestNavigation({
    session: state.session,
    isFinished: state.isFinished,
    answers: state.answers,
    exitPath: '/listening',
  });

  const liveQuota = useObjectiveTestQuota('listening');

  if (state.isLoading) {
    return <PremiumLoading message="Initializing listening test..." />;
  }

  // A refused start carries the server's numbers; otherwise the live allowance
  // lets us show the paywall before the learner spends a click on Start.
  const paywallQuota = limitQuota ? summariseObjectiveQuota(limitQuota) : liveQuota;
  if (isAwaitingStart && paywallQuota.exhausted) {
    return (
      <ObjectiveLimitPaywall
        testType="listening"
        quota={paywallQuota}
        testTitle={state.testData?.title}
        surface={limitQuota ? 'start_refused' : 'start_screen'}
      />
    );
  }

  return (
    <div
      className="h-full w-full flex flex-col flex-1 min-h-0 bg-background overflow-hidden font-sans antialiased text-foreground relative"
      data-oid="ocjmio6"
    >
      {isAwaitingStart && <ObjectiveStartNote testType="listening" />}
      {isAwaitingStart && examEligibility.eligible && (
        <div className="px-4 pb-2">
          <TakeWithFriend test={state.testData} />
        </div>
      )}
      {state.error && (
        <div
          role="alert"
          className="mx-4 mb-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[rgba(var(--signal-fault),0.25)] bg-[rgba(var(--signal-fault),0.04)] px-3 py-2 text-xs text-[rgb(var(--signal-fault))]"
        >
          <span>{state.error}</span>
          {state.error.includes('free listening test limit') && (
            <Link className="font-bold underline" to="/pricing">
              See unlimited plans
            </Link>
          )}
        </div>
      )}
      <ListeningTestHeader
        testData={state.testData}
        activePart={state.activePart}
        displaySections={nav.displaySections}
        answers={state.answers}
        showExitDialog={showExitDialog}
        setShowExitDialog={setShowExitDialog}
        onExit={handleExit}
        onContinue={() => setShowExitDialog(false)}
        formatTime={(seconds) => {
          const m = Math.floor(seconds / 60);
          const s = seconds % 60;
          return `${m}:${s.toString().padStart(2, '0')}`;
        }}
        totalQuestions={0}
        stats={nav.stats}
        isFinished={state.isFinished}
        isSaving={state.isSaving}
        lastSaved={state.lastSaved}
        showAnswerSheet={showAnswerSheet}
        setShowAnswerSheet={setShowAnswerSheet}
        onSubmit={handleSubmit}
        isSubmitting={state.isSubmitting}
        onViewResults={() => dispatch({ type: ACTIONS.SHOW_RESULTS_MODAL, payload: true })}
        onNextPart={() =>
          dispatch({ type: ACTIONS.SET_ACTIVE_PART, payload: state.activePart + 1 })
        }
        testMode={testMode}
        examReview={examReview}
        isAwaitingStart={isAwaitingStart}
        selectedMode={selectedMode}
        onModeChange={setSelectedMode}
        examEligibility={examEligibility}
        onStart={handleStartTest}
        isStarting={isStarting}
        data-oid="3bx8kdc"
      />

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <div
          className={cn(
            'flex min-h-0 flex-1 overflow-hidden transition-all duration-300',
            isAwaitingStart && 'pointer-events-none select-none blur-[3px] opacity-75'
          )}
          aria-disabled={isAwaitingStart || undefined}
          inert={isAwaitingStart ? '' : undefined}
        >
          <ListeningTestMainContent
            layout={layout}
            nav={nav}
            audioPlayerRef={audioPlayerRef}
            activePart={state.activePart}
            answers={state.answers}
            handleAnswerChange={handleAnswerChange}
            handleMultiSelectChange={handleMultiSelectChange}
            toggleFlag={toggleFlag}
            flaggedQuestions={state.flaggedQuestions}
            isFinished={state.isFinished}
            correctAnswersMap={state.correctAnswersMap}
            dispatch={dispatch}
            ACTIONS={ACTIONS}
            testMode={testMode}
            isAwaitingStart={isAwaitingStart}
            examReview={examReview}
            onExamAudioEnded={handleExamAudioEnded}
          />

          <ListeningTestSheet
            showAnswerSheet={showAnswerSheet}
            setShowAnswerSheet={setShowAnswerSheet}
            activePart={state.activePart}
            displaySections={nav.displaySections}
            questionsWithComputedNumbers={state.questionsWithNumbers}
            answers={state.answers}
            handleAnswerChange={handleAnswerChange}
            isFinished={state.isFinished}
            correctAnswersMap={state.correctAnswersMap}
            solvedCount={nav.stats.totalAns}
            isMobile={layout.isMobile}
            onQuestionClick={(key) => {
              const el = document.getElementById(`question-${key}`);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
          />
        </div>
      </div>

      <ListeningTestOverlays
        showConfetti={showConfetti}
        setShowConfetti={setShowConfetti}
        showXPNotification={showXPNotification}
        setShowXPNotification={setShowXPNotification}
        earnedXP={earnedXP}
        showTimeUpDialog={showTimeUpDialog}
        setShowTimeUpDialog={setShowTimeUpDialog}
        handleSubmit={handleSubmit}
        showResults={state.showResults}
        testResults={state.testResults}
        testData={state.testData}
        currentUser={currentUser}
        session={state.session}
        dispatch={dispatch}
        ACTIONS={ACTIONS}
        setShowAnswerSheet={setShowAnswerSheet}
        handleNavigateToQuestion={nav.handleNavigateToQuestion}
      />
    </div>
  );
}

export default function ListeningTest() {
  const location = useLocation();
  const { id } = useParams();

  if (!hasListeningTestEntry(location, id)) {
    return <Navigate to="/listening" replace />;
  }

  return (
    <PairedTestGate type="listening">
      <React.Suspense
        fallback={<PremiumLoading message="Loading test module..." />}
        data-oid="qv2lotf"
      >
        <ErrorBoundary
          title="Listening Test Error"
          fallbackMessage="Something went wrong while loading the listening test. Your progress has been auto-saved. Please try refreshing the page."
          data-oid="oour:-e"
        >
          <ListeningTestProvider data-oid="cg29s21">
            <ListeningTestInner data-oid="p3tqef:" />
          </ListeningTestProvider>
        </ErrorBoundary>
      </React.Suspense>
    </PairedTestGate>
  );
}
