import React from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Button } from '@/components/ui/button';
import { Lock, Sparkles, Loader2 } from 'lucide-react';
import { useWritingTestDispatch } from '../context/WritingTestContext';
import { ConfirmExitDialog, TimeUpDialog } from '@/shared/ui';
import { IconChip, Pill, MUTED, PANEL } from '@/features/dashboard/components/primitives';
import { cn } from '@/lib/cn';

/**
 * WritingDialogs
 *
 * Consolidates all alert dialogs (Exit, Submit, Time Up, Upgrade).
 */
export function WritingDialogs({ logic }) {
  const navigate = useNavigate();
  const { saveNow } = useWritingTestDispatch();
  const {
    showExitDialog,
    setShowExitDialog,
    showSubmitDialog,
    setShowSubmitDialog,
    showTimeUpDialog,
    setShowTimeUpDialog,
    showUpgradeDialog,
    setShowUpgradeDialog,
    handleGetFeedback,
    handleSubmit,
    isSubmitting,
    isAnalyzing,
    isExiting,
    testMode,
  } = logic;
  const isExamMode = testMode === 'exam';

  return (
    <>
      {/* Exit Confirmation Dialog */}
      <ConfirmExitDialog
        open={showExitDialog}
        onOpenChange={setShowExitDialog}
        onCancel={() => setShowExitDialog(false)}
        onConfirm={async () => {
          // Save progress before exiting
          await saveNow();
          isExiting.current = true;
          setShowExitDialog(false);
          navigate('/writing');
        }}
        title="Exit Test?"
        description="Your progress will be saved. You can resume this test later from your dashboard."
      />

      {/* Manual Submission Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog} data-oid="1jcn4qf">
        <AlertDialogContent
          className={cn(
            PANEL,
            'max-w-[400px] gap-3 p-4 sm:p-4.5 border border-[#e4e2f0] dark:border-white/[0.07] bg-linear-to-b from-white to-[#faf9ff] dark:from-[#141319] dark:to-[#100f15] rounded-xl'
          )}
          data-oid="27i6yss"
        >
          <AlertDialogHeader className="space-y-1.5 text-left" data-oid="vownwlc">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <IconChip icon={Sparkles} tone="accent" size="sm" />
                <AlertDialogTitle
                  className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100"
                  data-oid="elyl44v"
                >
                  Ready to submit?
                </AlertDialogTitle>
              </div>
              <Pill
                tone="accent"
                className="text-[9px] px-1.5 py-0 font-bold tracking-wider uppercase shrink-0"
              >
                {isExamMode ? 'Exam Mode' : 'Practice'}
              </Pill>
            </div>
            <AlertDialogDescription
              className={cn('text-xs leading-relaxed', MUTED)}
              data-oid="s1l5a:a"
            >
              {isExamMode
                ? 'Submitting ends this Exam Mode attempt. AI analysis is available afterward.'
                : 'Get AI feedback for your band score, or submit without feedback.'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="gap-2 sm:justify-end sm:space-x-0" data-oid="-cev:db">
            <AlertDialogCancel
              onClick={() => setShowSubmitDialog(false)}
              className="h-9 w-full rounded-md border border-[#e4e2f0] bg-[#fbfbfe] px-3.5 text-xs font-semibold text-slate-700 shadow-none transition-all hover:bg-[#f4f3fb] hover:text-slate-900 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2 dark:border-white/11 dark:bg-white/5.5 dark:text-slate-200 dark:hover:bg-white/9 dark:focus-visible:ring-offset-[#131315] sm:w-auto cursor-pointer"
              data-oid="4d1wj8f"
            >
              Review More
            </AlertDialogCancel>
            {!isExamMode ? (
              <Button
                onClick={() => {
                  setShowSubmitDialog(false);
                  handleGetFeedback();
                }}
                disabled={isSubmitting || isAnalyzing}
                className="h-9 w-full rounded-md border-0 bg-[#5a63df] px-4 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#4d55c7] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#131315] disabled:pointer-events-none disabled:opacity-50 flex items-center justify-center gap-1.5 sm:w-auto cursor-pointer"
                data-oid="yujj_ul"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Analyzing…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Get AI Feedback</span>
                  </>
                )}
              </Button>
            ) : null}
            <AlertDialogAction
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={cn(
                'h-9 w-full rounded-md text-xs font-bold transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#131315] disabled:pointer-events-none disabled:opacity-50 flex items-center justify-center gap-1.5 sm:w-auto cursor-pointer',
                isExamMode
                  ? 'border-0 bg-[#5a63df] px-4 text-white shadow-xs hover:bg-[#4d55c7]'
                  : 'border border-[#e4e2f0] bg-[#fbfbfe] px-3.5 font-semibold text-slate-700 shadow-none hover:bg-[#f4f3fb] hover:text-slate-900 dark:border-white/11 dark:bg-white/5.5 dark:text-slate-200 dark:hover:bg-white/9'
              )}
              data-oid="9wn7mk:"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Submitting…</span>
                </>
              ) : (
                <span>Submit {isExamMode ? 'Now' : 'without feedback'}</span>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Time Up Dialog */}
      <TimeUpDialog
        open={showTimeUpDialog}
        onOpenChange={setShowTimeUpDialog}
        title="Time's Up"
        description={
          isExamMode
            ? 'The 60-minute limit has been reached. Submitting ends this Exam Mode attempt.'
            : 'The 60-minute limit has been reached. Get AI feedback for your band score, or submit without feedback.'
        }
        statusText="Drafts auto-saved"
        customFooter={
          <AlertDialogFooter className="gap-2 sm:justify-end sm:space-x-0" data-oid="j-6qoep">
            {!isExamMode ? (
              <Button
                onClick={() => {
                  setShowTimeUpDialog(false);
                  handleGetFeedback();
                }}
                disabled={isSubmitting || isAnalyzing}
                className="h-9 w-full rounded-md border-0 bg-[#5a63df] px-4 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#4d55c7] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#131315] disabled:pointer-events-none disabled:opacity-50 flex items-center justify-center gap-1.5 sm:w-auto cursor-pointer"
                data-oid="faa4-7l"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Analyzing…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Get AI Feedback</span>
                  </>
                )}
              </Button>
            ) : null}
            <AlertDialogAction
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={cn(
                'h-9 w-full rounded-md text-xs font-bold transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#131315] disabled:pointer-events-none disabled:opacity-50 flex items-center justify-center gap-1.5 sm:w-auto cursor-pointer',
                isExamMode
                  ? 'border-0 bg-[#5a63df] px-4 text-white shadow-xs hover:bg-[#4d55c7]'
                  : 'border border-[#e4e2f0] bg-[#fbfbfe] px-3.5 font-semibold text-slate-700 shadow-none hover:bg-[#f4f3fb] hover:text-slate-900 dark:border-white/11 dark:bg-white/5.5 dark:text-slate-200 dark:hover:bg-white/9'
              )}
              data-oid="36nu0nn"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Submitting…</span>
                </>
              ) : (
                <span>Submit and Finish</span>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        }
      />

      {/* Upgrade Dialog */}
      <AlertDialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog} data-oid="qq3k8bw">
        <AlertDialogContent
          className={cn(PANEL, 'max-w-md overflow-hidden p-0')}
          data-oid=".jxz1rs"
        >
          {/* Header Section - Premium Dark */}
          <div
            className="relative pt-10 pb-8 px-8 text-center bg-slate-900 overflow-hidden"
            data-oid="eiu67ah"
          >
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
            <div
              className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl border border-white/15 bg-white/8"
              data-oid="42he-sd"
            >
              <Lock className="w-10 h-10 text-white drop-shadow-md" data-oid="836ru7x" />
            </div>

            <div className="relative space-y-2 z-10" data-oid="c07as-g">
              <h3 className="text-2xl font-black tracking-tight text-white" data-oid="9ivdihh">
                Limit Reached
              </h3>
              <p
                className="text-indigo-200 text-sm font-medium px-4 leading-relaxed"
                data-oid="g093g4n"
              >
                You've hit your monthly limit. Unlock <b>unlimited evaluations</b> and accelerate
                your progress.
              </p>
            </div>
          </div>

          <div className="p-8 space-y-8 bg-white dark:bg-[#131315]" data-oid="uchlmwr">
            {/* Features List */}
            <div className="grid grid-cols-1 gap-4" data-oid="_1vgdpa">
              {[
                'Full IELTS Band Score (0-9)',
                'Detailed Criteria Analysis',
                'Grammar & Vocabulary Corrections',
                'Personalized Improvement Tips',
              ].map((feature, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 text-sm font-semibold text-slate-700 dark:text-slate-300 group"
                  data-oid="rialnw7"
                >
                  <div
                    className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-800/50 text-indigo-600 dark:text-indigo-400 transition-colors group-hover:scale-110 duration-300"
                    data-oid="2t34bf4"
                  >
                    <Sparkles className="w-4 h-4" data-oid="k04n532" />
                  </div>
                  {feature}
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-2" data-oid="y5zry3g">
              <Button
                onClick={() => {
                  isExiting.current = true;
                  navigate('/pricing');
                }}
                className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white h-14 rounded-2xl font-bold shadow-xl shadow-slate-900/20 hover:shadow-slate-900/30 dark:shadow-indigo-500/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                data-oid="ch5.1jo"
              >
                Upgrade to Pro
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowUpgradeDialog(false)}
                className="w-full h-12 rounded-2xl font-bold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-white/6 transition-all"
                data-oid="yn9j0-b"
              >
                Maybe Later
              </Button>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
