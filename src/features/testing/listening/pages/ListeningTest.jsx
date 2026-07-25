import React, { useState } from 'react';
import PremiumLoading from '@/components/ui/PremiumLoading';
import ErrorBoundary from '@/components/shared/ErrorBoundary';

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

function ListeningTestInner() {
  const {
    audioPlayerRef,
    currentUser,
    toggleFlag,
    handleAnswerChange,
    handleMultiSelectChange,
    handleSubmit,
  } = useListeningTestLogic();

  const state = useListeningTestState();
  const { dispatch, ACTIONS } = useListeningTestDispatch();

  const [showAnswerSheet, setShowAnswerSheet] = useState(false);
  const [showTimeUpDialog, setShowTimeUpDialog] = useState(false);

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

  const { showConfetti, showXPNotification, earnedXP, setShowXPNotification, setShowConfetti } =
    useGamification();

  const { showExitDialog, setShowExitDialog, handleExit } = useTestNavigation({
    session: state.session,
    isFinished: state.isFinished,
    answers: state.answers,
    exitPath: '/listening',
  });

  if (state.isLoading) {
    return <PremiumLoading message="Initializing listening test..." />;
  }

  return (
    <div
      className="h-full w-full flex flex-col flex-1 min-h-0 bg-background overflow-hidden font-sans antialiased text-foreground relative"
      data-oid="ocjmio6"
    >
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
        data-oid="3bx8kdc"
      />

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
      />

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
        showAnswerSheet={showAnswerSheet}
        setShowAnswerSheet={setShowAnswerSheet}
        handleNavigateToQuestion={nav.handleNavigateToQuestion}
        activePart={state.activePart}
        displaySections={nav.displaySections}
        questionsWithNumbers={state.questionsWithNumbers}
        answers={state.answers}
        handleAnswerChange={handleAnswerChange}
        isFinished={state.isFinished}
        correctAnswersMap={state.correctAnswersMap}
        stats={nav.stats}
        isMobile={layout.isMobile}
      />
    </div>
  );
}

export default function ListeningTest() {
  return (
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
  );
}
