import React from 'react';
import { TimeUpDialog } from '@/shared/ui';

import XPNotification from '@/components/XPNotification';
import TestResultsModal from '@/components/results/TestResultsModal';

export default function ListeningTestOverlays({
  // Confetti now fires once, band-tiered, from TestResultsModal itself — this
  // used to also fire a generic burst the instant the test submitted, so every
  // completion showed two differently-styled confetti effects back to back.
  // showConfetti/setShowConfetti still arrive from the parent's shared
  // gamification state; they're intentionally unused here now.
  showXPNotification,
  setShowXPNotification,
  earnedXP,
  showTimeUpDialog,
  setShowTimeUpDialog,
  handleSubmit,
  showResults,
  testResults,
  testData,
  currentUser,
  session,
  dispatch,
  ACTIONS,
  setShowAnswerSheet,
  handleNavigateToQuestion,
}) {
  return (
    <>
      <XPNotification
        show={showXPNotification}
        xp={earnedXP.xp}
        bonus={earnedXP.bonus}
        streak={earnedXP.streak}
        onComplete={() => setShowXPNotification(false)}
        data-oid="5s99p_4"
      />
      <style data-oid="aon6cm_">{`
        .custom-scrollbar::-webkit-scrollbar {width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track {background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb {background-color: #cbd5e1; border-radius: 10px; border: 3px solid transparent; background-clip: content-box; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {background-color: #94a3b8; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {background-color: #334155; }
      `}</style>

      <TimeUpDialog
        open={showTimeUpDialog}
        onOpenChange={setShowTimeUpDialog}
        onConfirm={handleSubmit}
        onCancel={() => setShowTimeUpDialog(false)}
        totalQuestions={testData?.total_questions || 40}
      />

      <TestResultsModal
        showResults={showResults}
        testResults={testResults}
        testData={testData}
        earnedXP={earnedXP}
        user={currentUser}
        sessionId={session?.id}
        onClose={() => dispatch({ type: ACTIONS.SHOW_RESULTS_MODAL, payload: false })}
        onReviewAnswers={() => {
          dispatch({ type: ACTIONS.SHOW_RESULTS_MODAL, payload: false });
          setShowAnswerSheet(true);
        }}
        onNavigateToQuestion={handleNavigateToQuestion}
        testType="listening"
        testMode={session?.test_mode === 'mock' ? 'exam' : 'practice'}
        data-oid="m431y0n"
      />
    </>
  );
}
