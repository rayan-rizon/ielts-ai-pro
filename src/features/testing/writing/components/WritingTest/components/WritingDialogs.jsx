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
import { Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { useWritingTestDispatch } from '../context/WritingTestContext';
import { ConfirmExitDialog, TimeUpDialog } from '@/shared/ui';
import { IconChip, Pill, MUTED, MICRO, PANEL } from '@/features/dashboard/components/primitives';
import { cn } from '@/lib/cn';
import WritingUpgradeDialog from './WritingUpgradeDialog';
import { useUserUsageStats } from '@/features/settings/hooks/useUserUsageStats';
import { DEFAULT_PRICING_PLANS } from '@/features/subscription/config/pricingPlans';
import { usePricing } from '@/features/subscription/hooks/usePricing';

function FeedbackActionButton({ isAnalyzing, isSubmitting, onFeedback }) {
  return (
    <Button
      onClick={onFeedback}
      disabled={isSubmitting || isAnalyzing}
      className="h-9 w-full rounded-md border-0 bg-[#5a63df] px-4 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#4d55c7] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#131315] disabled:pointer-events-none disabled:opacity-50 flex items-center justify-center gap-1.5 sm:w-auto cursor-pointer"
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
  );
}

function SubmitActionButton({ isSubmitting, isExamMode, onSubmit, label }) {
  return (
    <AlertDialogAction
      onClick={onSubmit}
      disabled={isSubmitting}
      className={cn(
        'h-9 w-full rounded-md text-xs font-bold transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#131315] disabled:pointer-events-none disabled:opacity-50 flex items-center justify-center gap-1.5 sm:w-auto cursor-pointer',
        isExamMode
          ? 'border-0 bg-[#5a63df] px-4 text-white shadow-xs hover:bg-[#4d55c7]'
          : 'border border-[#e4e2f0] bg-[#fbfbfe] px-3.5 font-semibold text-slate-700 shadow-none hover:bg-[#f4f3fb] hover:text-slate-900 dark:border-white/11 dark:bg-white/5.5 dark:text-slate-200 dark:hover:bg-white/9'
      )}
    >
      {isSubmitting ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Submitting…</span>
        </>
      ) : (
        <span>{label}</span>
      )}
    </AlertDialogAction>
  );
}

function ExitConfirmationDialog({ open, onOpenChange, saveNow, isExiting, navigate }) {
  const [isSaving, setIsSaving] = React.useState(false);

  return (
    <ConfirmExitDialog
      open={open}
      onOpenChange={onOpenChange}
      onCancel={() => onOpenChange(false)}
      isConfirming={isSaving}
      onConfirm={async () => {
        setIsSaving(true);
        try {
          await saveNow();
        } finally {
          isExiting.current = true;
          setIsSaving(false);
          onOpenChange(false);
          navigate('/writing');
        }
      }}
      title="Exit Test?"
      description="Your progress will be saved. You can resume this test later from your dashboard."
    />
  );
}

function WritingSubmitDialog({
  open,
  onOpenChange,
  isExamMode,
  isSubmitting,
  isAnalyzing,
  handleGetFeedback,
  handleSubmit,
}) {
  const submitLabel = isExamMode ? 'Submit Now' : 'Submit without feedback';
  const description = isExamMode
    ? 'Submitting ends this Exam Mode attempt. AI analysis is available afterward.'
    : 'Get AI feedback for your band score, or submit without feedback.';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className={cn(
          PANEL,
          'max-w-[400px] gap-3 p-4 sm:p-4.5 border border-[#e4e2f0] dark:border-white/[0.07] bg-linear-to-b from-white to-[#faf9ff] dark:from-[#141319] dark:to-[#100f15] rounded-xl shadow-lg shadow-black/5 dark:shadow-2xl dark:shadow-black/40'
        )}
      >
        <AlertDialogHeader className="space-y-1.5 text-left">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <IconChip icon={Sparkles} tone="accent" size="sm" />
              <AlertDialogTitle className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
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
        </AlertDialogHeader>

        {/* Reassurance Instrument Strip */}
        <div className="flex items-start gap-2.5 rounded-lg border border-[#e4e2f0] bg-[#f7f6fd] p-2.5 sm:p-3 text-xs dark:border-white/[0.07] dark:bg-white/[0.03]">
          <div className="mt-0.5 shrink-0">
            <CheckCircle2 className="h-4 w-4 text-[rgb(var(--signal-ok))]" strokeWidth={2.25} />
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className={cn(MICRO, 'text-slate-600 dark:text-slate-300 font-semibold')}>
              {isExamMode ? 'Timed Evaluation' : 'Instant AI Feedback'}
            </p>
            <AlertDialogDescription className={cn('text-xs font-normal leading-relaxed', MUTED)}>
              {description}
            </AlertDialogDescription>
          </div>
        </div>

        <AlertDialogFooter className="gap-2 sm:justify-end sm:space-x-0">
          <AlertDialogCancel
            onClick={() => onOpenChange(false)}
            className="h-9 w-full rounded-md border border-[#e4e2f0] bg-[#fbfbfe] px-3.5 text-xs font-semibold text-slate-700 shadow-none transition-all hover:bg-[#f4f3fb] hover:text-slate-900 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2 dark:border-white/11 dark:bg-white/5.5 dark:text-slate-200 dark:hover:bg-white/9 dark:focus-visible:ring-offset-[#131315] sm:w-auto cursor-pointer"
          >
            Review More
          </AlertDialogCancel>
          {!isExamMode ? (
            <FeedbackActionButton
              isAnalyzing={isAnalyzing}
              isSubmitting={isSubmitting}
              onFeedback={() => {
                onOpenChange(false);
                handleGetFeedback();
              }}
            />
          ) : null}
          <SubmitActionButton
            isSubmitting={isSubmitting}
            isExamMode={isExamMode}
            onSubmit={handleSubmit}
            label={submitLabel}
          />
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function WritingTimeUpDialog({
  open,
  onOpenChange,
  isExamMode,
  isSubmitting,
  isAnalyzing,
  handleGetFeedback,
  handleSubmit,
}) {
  const description = isExamMode
    ? 'The 60-minute limit has been reached. Submitting ends this Exam Mode attempt.'
    : 'The 60-minute limit has been reached. Get AI feedback for your band score, or submit without feedback.';

  return (
    <TimeUpDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Time's Up"
      description={description}
      statusText="Drafts auto-saved"
      customFooter={
        <AlertDialogFooter className="gap-2 sm:justify-end sm:space-x-0">
          {!isExamMode ? (
            <FeedbackActionButton
              isAnalyzing={isAnalyzing}
              isSubmitting={isSubmitting}
              onFeedback={() => {
                onOpenChange(false);
                handleGetFeedback();
              }}
            />
          ) : null}
          <SubmitActionButton
            isSubmitting={isSubmitting}
            isExamMode={isExamMode}
            onSubmit={handleSubmit}
            label="Submit and Finish"
          />
        </AlertDialogFooter>
      }
    />
  );
}

/**
 * WritingDialogs
 *
 * Consolidates all alert dialogs (Exit, Submit, Time Up, Upgrade).
 */
export function WritingDialogs({ logic }) {
  const navigate = useNavigate();
  const { saveNow } = useWritingTestDispatch();
  const { data: usageStats } = useUserUsageStats();
  const { pricingConfig } = usePricing(DEFAULT_PRICING_PLANS);
  const proWritingLimit = pricingConfig?.tierLimits?.pro?.writing_monthly_limit;
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
      <ExitConfirmationDialog
        open={showExitDialog}
        onOpenChange={setShowExitDialog}
        saveNow={saveNow}
        isExiting={isExiting}
        navigate={navigate}
      />

      <WritingSubmitDialog
        open={showSubmitDialog}
        onOpenChange={setShowSubmitDialog}
        isExamMode={isExamMode}
        isSubmitting={isSubmitting}
        isAnalyzing={isAnalyzing}
        handleGetFeedback={handleGetFeedback}
        handleSubmit={handleSubmit}
      />

      <WritingTimeUpDialog
        open={showTimeUpDialog}
        onOpenChange={setShowTimeUpDialog}
        isExamMode={isExamMode}
        isSubmitting={isSubmitting}
        isAnalyzing={isAnalyzing}
        handleGetFeedback={handleGetFeedback}
        handleSubmit={handleSubmit}
      />

      <WritingUpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        isExiting={isExiting}
        navigate={navigate}
        currentWritingUsage={usageStats?.ai?.writing}
        proWritingLimit={proWritingLimit}
      />
    </>
  );
}
