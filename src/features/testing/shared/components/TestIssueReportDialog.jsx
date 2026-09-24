import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Flag,
  Loader2,
  BookOpen,
  Headphones,
  FileQuestion,
  CheckCircle2,
  Type,
  Volume2,
  MoreHorizontal,
  Hash,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TooltipProvider } from '@/components/ui/tooltip';
import { IconChip, Pill, Tip, NUM, PANEL } from '@/features/dashboard/components/primitives';
import { cn } from '@/lib/cn';
import { testIssueReportsService } from '@/features/testing/shared/services/testIssueReportsService';

const ISSUE_CONFIGS = {
  question_error: {
    label: 'Question / Prompt',
    hint: 'Unclear or wrong prompt',
    icon: FileQuestion,
  },
  answer_error: {
    label: 'Answer Key',
    hint: 'Incorrect answer key',
    icon: CheckCircle2,
  },
  typo: {
    label: 'Typo / Formatting',
    hint: 'Spelling or formatting',
    icon: Type,
  },
  audio_problem: {
    label: 'Audio Glitch',
    hint: 'Distorted or desynced',
    icon: Volume2,
  },
  other: {
    label: 'Something Else',
    hint: 'Other feedback or issue',
    icon: MoreHorizontal,
  },
};

const getIssueTypes = (testType) => [
  { value: 'question_error', ...ISSUE_CONFIGS.question_error },
  { value: 'answer_error', ...ISSUE_CONFIGS.answer_error },
  { value: 'typo', ...ISSUE_CONFIGS.typo },
  ...(testType === 'listening' ? [{ value: 'audio_problem', ...ISSUE_CONFIGS.audio_problem }] : []),
  { value: 'other', ...ISSUE_CONFIGS.other },
];

export default function TestIssueReportDialog({
  testType,
  testId,
  testTitle,
  sectionLabel,
  testMode,
}) {
  const [open, setOpen] = useState(false);
  const [issueType, setIssueType] = useState('question_error');
  const [questionReference, setQuestionReference] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const issueTypes = getIssueTypes(testType);

  const handleOpenChange = (nextOpen) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setDescription('');
      setQuestionReference('');
      setIssueType('question_error');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const reportDescription = description.trim();
    if (reportDescription.length < 10) {
      toast.error('Add a little more detail', {
        description: 'Please describe the issue in at least 10 characters.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await testIssueReportsService.submit({
        testType,
        issueType,
        description: reportDescription,
        testId,
        testTitle,
        sectionLabel,
        questionReference: questionReference.trim(),
        testMode,
      });
      toast.success('Report sent', {
        description: 'Thanks for helping us keep this test accurate.',
      });
      handleOpenChange(false);
    } catch (error) {
      toast.error('Could not send your report', {
        description: error?.message || 'Please try again in a moment.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <TooltipProvider delayDuration={150}>
        <Tip content="Report a test issue" side="bottom">
          <button
            type="button"
            aria-label="Report a test issue"
            onClick={() => setOpen(true)}
            className="group relative flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg border border-[#e4e2f0] bg-[#f4f3fb] text-slate-500 shadow-none transition-all duration-200 hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-600 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]/25 dark:border-white/10 dark:bg-white/5.5 dark:text-slate-400 dark:hover:border-rose-400/30 dark:hover:bg-rose-500/15 dark:hover:text-rose-300 cursor-pointer"
          >
            <Flag
              className="h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110"
              strokeWidth={2}
            />
          </button>
        </Tip>
      </TooltipProvider>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className={cn(
            PANEL,
            'max-w-[460px] sm:max-w-[480px] gap-3 p-4 sm:p-5 border border-[#e4e2f0] dark:border-white/[0.09] bg-linear-to-b from-white to-[#faf9ff] dark:from-[#15141b] dark:to-[#111016] rounded-xl shadow-xl shadow-black/5 dark:shadow-2xl dark:shadow-black/60'
          )}
        >
          {/* Header with clearance for close button */}
          <DialogHeader className="space-y-1 text-left pr-8">
            <div className="flex items-center gap-2 flex-wrap">
              <IconChip icon={Flag} tone="rose" size="sm" />
              <DialogTitle className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Report a test issue
              </DialogTitle>
              <Pill
                tone={testType === 'reading' ? 'sky' : 'emerald'}
                className="text-[9px] px-1.5 py-0 font-bold tracking-wider uppercase shrink-0"
              >
                {testType || 'test'}
              </Pill>
            </div>
            <DialogDescription className="text-xs font-normal text-slate-600 dark:text-slate-300 leading-relaxed">
              Tell us what looks wrong. Your answers and timer are not included in the report.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-3 sm:space-y-3.5" onSubmit={handleSubmit}>
            {/* Test Context Card */}
            <div className="flex items-center justify-between gap-2.5 rounded-lg border border-slate-200/90 bg-slate-50/90 px-3 py-2.5 dark:border-white/[0.08] dark:bg-white/[0.04]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-2xs dark:border-white/10 dark:bg-white/[0.08] dark:text-slate-200">
                  {testType === 'reading' ? (
                    <BookOpen className="h-3.5 w-3.5" strokeWidth={2} />
                  ) : (
                    <Headphones className="h-3.5 w-3.5" strokeWidth={2} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold leading-tight text-slate-900 dark:text-slate-100">
                    {testTitle || `${testType === 'reading' ? 'Reading' : 'Listening'} test`}
                  </p>
                  <p className="flex items-center gap-1.5 text-[11px] font-medium leading-tight text-slate-600 dark:text-slate-300 mt-1">
                    <span>
                      {sectionLabel ||
                        (testType === 'reading' ? 'Reading section' : 'Listening section')}
                    </span>
                    {testMode && (
                      <>
                        <span className="text-slate-400 dark:text-slate-500">•</span>
                        <span className="capitalize">{testMode} mode</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
              {testMode && (
                <Pill
                  tone={testMode === 'exam' ? 'amber' : 'accent'}
                  className="shrink-0 text-[8px] font-bold uppercase tracking-wider"
                >
                  {testMode}
                </Pill>
              )}
            </div>

            {/* Issue Category Radio Grid */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                What is the issue?
              </label>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Issue category">
                {issueTypes.map((option, idx) => {
                  const isSelected = issueType === option.value;
                  const OptionIcon = option.icon;
                  const isLastOdd = issueTypes.length % 2 !== 0 && idx === issueTypes.length - 1;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setIssueType(option.value)}
                      className={cn(
                        'group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-all duration-150 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]',
                        isLastOdd && 'col-span-2',
                        isSelected
                          ? 'border border-[#5a63df]/45 bg-[#5a63df]/[0.05] shadow-xs dark:border-[#8f97ff]/40 dark:bg-[#8f97ff]/[0.10]'
                          : 'border border-slate-200/90 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50/80 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-slate-200 dark:hover:border-white/20 dark:hover:bg-white/[0.06]'
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors',
                          isSelected
                            ? 'bg-[#5a63df]/12 text-[#5a63df] dark:bg-[#8f97ff]/20 dark:text-[#afb5ff]'
                            : 'bg-slate-100 text-slate-600 border border-slate-200/80 group-hover:bg-slate-200/70 group-hover:text-slate-800 dark:bg-white/[0.07] dark:border-white/[0.08] dark:text-slate-300'
                        )}
                      >
                        <OptionIcon className="h-3.5 w-3.5" strokeWidth={2} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            'truncate text-xs font-bold leading-snug',
                            isSelected
                              ? 'text-[#5a63df] dark:text-[#afb5ff]'
                              : 'text-slate-900 dark:text-slate-100'
                          )}
                        >
                          {option.label}
                        </p>
                        <p
                          className={cn(
                            'truncate text-[11px] font-medium leading-snug mt-0.5',
                            isSelected
                              ? 'text-slate-600 dark:text-slate-300'
                              : 'text-slate-500 dark:text-slate-400'
                          )}
                        >
                          {option.hint}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Question Reference / Location */}
            <div className="space-y-1.5">
              <label
                htmlFor="test-issue-location"
                className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
              >
                <span>Question or location</span>
                <span className="font-normal lowercase tracking-normal text-slate-400 dark:text-slate-400">
                  optional
                </span>
              </label>
              <div className="relative">
                <Hash
                  className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500 dark:text-slate-400"
                  strokeWidth={2}
                />
                <input
                  id="test-issue-location"
                  value={questionReference}
                  onChange={(event) => setQuestionReference(event.target.value.slice(0, 80))}
                  maxLength={80}
                  placeholder="e.g. Question 12 or Passage 1"
                  className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 transition-colors focus-visible:border-[#5a63df] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]/20 dark:border-white/[0.12] dark:bg-[#16151c] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:border-[#8f97ff]/60"
                />
              </div>
            </div>

            {/* Description Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="test-issue-details"
                  className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
                >
                  Details
                </label>
                <span
                  className={cn(
                    NUM,
                    'text-[11px] font-semibold',
                    description.trim().length >= 10
                      ? 'text-slate-600 dark:text-slate-400'
                      : description.length > 0
                        ? 'font-bold text-amber-600 dark:text-amber-400'
                        : 'text-slate-500 dark:text-slate-400'
                  )}
                >
                  {description.trim().length} / 2000
                </span>
              </div>
              <Textarea
                id="test-issue-details"
                value={description}
                onChange={(event) => setDescription(event.target.value.slice(0, 2000))}
                rows={3}
                required
                minLength={10}
                maxLength={2000}
                placeholder="Describe what looks wrong..."
                className="min-h-[76px] max-h-[140px] resize-none rounded-lg border border-slate-300 bg-white p-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 transition-colors focus-visible:border-[#5a63df] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]/20 dark:border-white/[0.12] dark:bg-[#16151c] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:border-[#8f97ff]/60"
              />
              {description.length > 0 && description.trim().length < 10 && (
                <p className="text-[10.5px] font-semibold text-amber-600 dark:text-amber-400">
                  Please provide at least 10 characters ({10 - description.trim().length} more
                  needed)
                </p>
              )}
            </div>

            {/* Action Footer */}
            <DialogFooter className="gap-2 pt-1 sm:justify-end sm:space-x-0">
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
                className="h-9 rounded-lg border border-slate-300 bg-white px-4 text-xs font-bold text-slate-700 shadow-none transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] dark:border-white/12 dark:bg-white/[0.05] dark:text-slate-200 dark:hover:bg-white/[0.09] dark:hover:text-white sm:w-auto cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || description.trim().length < 10}
                className="h-9 rounded-lg border border-transparent bg-[#5a63df] px-4 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#4d55ce] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2 dark:bg-[#5a63df] dark:hover:bg-[#4d55ce] disabled:pointer-events-none disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:border-white/[0.08] dark:disabled:bg-white/[0.04] dark:disabled:text-slate-500 sm:w-auto cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                    <span>Sending…</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                    <span>Send report</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

TestIssueReportDialog.propTypes = {
  testType: PropTypes.oneOf(['reading', 'listening']).isRequired,
  testId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  testTitle: PropTypes.string,
  sectionLabel: PropTypes.string,
  testMode: PropTypes.string,
};
