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
import { Lock, Sparkles, XCircle } from 'lucide-react';
import { useWritingTestDispatch } from '../context/WritingTestContext';
import { ConfirmExitDialog } from '@/shared/ui';

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
          className="max-w-md bg-white dark:bg-[#131315] border-none shadow-2xl"
          data-oid="27i6yss"
        >
          <AlertDialogHeader data-oid="vownwlc">
            <div
              className="w-16 h-16 bg-[#efedff] dark:bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4"
              data-oid="p0di8cx"
            >
              <Sparkles
                className="w-8 h-8 text-[#5661e9] dark:text-indigo-300"
                data-oid="s:_7haz"
              />
            </div>
            <AlertDialogTitle className="text-2xl font-black text-center" data-oid="elyl44v">
              Ready to submit?
            </AlertDialogTitle>
            <AlertDialogDescription
              className="text-center text-slate-500 dark:text-slate-400"
              data-oid="s1l5a:a"
            >
              {isExamMode
                ? 'Submitting ends this Exam Mode attempt. AI analysis is available afterward.'
                : 'Get AI feedback for your band score, or submit without feedback.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-4" data-oid="-cev:db">
            <AlertDialogCancel
              onClick={() => setShowSubmitDialog(false)}
              className="flex-1 rounded-xl h-12 font-bold"
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
                className="flex-1 bg-linear-to-r from-amber-400 via-yellow-400 to-amber-400 hover:from-amber-500 hover:via-yellow-500 hover:to-amber-500 dark:from-amber-500 dark:via-yellow-500 dark:to-amber-500 text-amber-900 dark:text-amber-100 border border-amber-400/30 dark:border-amber-500/30 rounded-xl h-12 font-bold shadow-[0_0_20px_rgba(245,158,11,0.25)] transition-all active:scale-[0.98]"
                data-oid="yujj_ul"
              >
                {isAnalyzing ? 'Analyzing...' : 'Get AI Feedback'}
              </Button>
            ) : null}
            <AlertDialogAction
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-linear-to-r from-[#5661e9] to-indigo-600 hover:from-[#4853d6] hover:to-indigo-700 text-white border-none rounded-xl h-12 font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]"
              data-oid="9wn7mk:"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Now'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Time Up Dialog */}
      <AlertDialog
        open={!isExamMode && showTimeUpDialog}
        onOpenChange={setShowTimeUpDialog}
        data-oid="yxae3w-"
      >
        <AlertDialogContent
          className="max-w-md bg-white dark:bg-[#131315] border-none shadow-2xl"
          data-oid="ijws.ud"
        >
          <AlertDialogHeader data-oid="w0hr399">
            <div
              className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4"
              data-oid="q6ia:fz"
            >
              <XCircle className="w-8 h-8 text-rose-600 dark:text-rose-400" data-oid="xv4p_k6" />
            </div>
            <AlertDialogTitle className="text-2xl font-black text-center" data-oid="ztlmdjk">
              Time is up!
            </AlertDialogTitle>
            <AlertDialogDescription
              className="text-center text-slate-500 dark:text-slate-400"
              data-oid=":wg0i75"
            >
              The 60-minute limit has been reached. Get AI feedback for your band score, or submit
              without feedback.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-4" data-oid="j-6qoep">
            <Button
              onClick={() => {
                setShowTimeUpDialog(false);
                handleGetFeedback();
              }}
              disabled={isSubmitting || isAnalyzing}
              className="flex-1 bg-linear-to-r from-amber-400 via-yellow-400 to-amber-400 hover:from-amber-500 hover:via-yellow-500 hover:to-amber-500 dark:from-amber-500 dark:via-yellow-500 dark:to-amber-500 text-amber-900 dark:text-amber-100 border border-amber-400/30 dark:border-amber-500/30 rounded-xl h-12 font-bold shadow-[0_0_20px_rgba(245,158,11,0.25)] transition-all active:scale-[0.98]"
              data-oid="faa4-7l"
            >
              {isAnalyzing ? 'Analyzing...' : 'Get AI Feedback'}
            </Button>
            <AlertDialogAction
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-linear-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white border-none rounded-xl h-12 font-bold shadow-lg shadow-rose-500/20"
              data-oid="36nu0nn"
            >
              {isSubmitting ? 'Submitting...' : 'Submit and Finish'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upgrade Dialog */}
      <AlertDialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog} data-oid="qq3k8bw">
        <AlertDialogContent
          className="max-w-md bg-white dark:bg-[#131315] border-none shadow-2xl p-0 overflow-hidden rounded-3xl ring-1 ring-slate-900/5"
          data-oid=".jxz1rs"
        >
          {/* Header Section - Premium Dark */}
          <div
            className="relative pt-10 pb-8 px-8 text-center bg-slate-900 overflow-hidden"
            data-oid="eiu67ah"
          >
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/30 blur-[80px] rounded-full" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/30 blur-[80px] rounded-full" />

            <div
              className="relative w-20 h-20 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center mx-auto shadow-2xl ring-1 ring-white/20 mb-6"
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
