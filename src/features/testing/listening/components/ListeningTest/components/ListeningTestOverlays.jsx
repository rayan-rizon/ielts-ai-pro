import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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

      <AlertDialog
        open={session?.test_mode !== 'mock' && showTimeUpDialog}
        onOpenChange={setShowTimeUpDialog}
        data-oid="qnwyd03"
      >
        <AlertDialogContent className="max-w-md" data-oid="ug__9pq">
          <AlertDialogHeader data-oid="rnwsb03">
            <AlertDialogTitle className="text-2xl font-bold" data-oid="hivm9by">
              Time's Up
            </AlertDialogTitle>
            <AlertDialogDescription
              className="text-base text-slate-600 dark:text-slate-400"
              data-oid="j.6nfia"
            >
              Time is up. You can check your answers now, or come back to them later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 sm:gap-3" data-oid="-ghurb-">
            <AlertDialogCancel
              onClick={() => setShowTimeUpDialog(false)}
              className="border-2"
              data-oid="3kkp7:t"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit}
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold"
              data-oid="uwj:9ou"
            >
              Check answers
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
