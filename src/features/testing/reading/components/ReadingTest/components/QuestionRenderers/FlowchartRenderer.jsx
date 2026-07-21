import React from 'react';
import { ArrowDown } from 'lucide-react';
import DebouncedInput from '@/components/ui/debounced-input';
import QuestionNumberCircle from '@/components/test/QuestionNumberCircle';
import DeepDivePopover from '@/features/testing/reading/components/DeepDivePopover';
import { cn } from '@/lib/cn';

const FlowchartRenderer = React.memo(function FlowchartRenderer({
  question,
  answers,
  onAnswerChange,
  flaggedQuestions,
  onToggleFlag,
  disabled = false,
  validationMap = {},
  explanationData,
  openDeepDive,
  setOpenDeepDive,
}) {
  const flowchart = question.flowchart;
  if (!flowchart?.steps?.length) return null;

  let gapOffset = 0;

  const renderStep = (step) => {
    const parts = (step.text || '').split('[gap]');
    const stepStartOffset = gapOffset;
    gapOffset += Math.max(parts.length - 1, 0);

    return parts.map((part, index) => {
      if (index === parts.length - 1) return <span key={`text-${index}`}>{part}</span>;

      const gapIndex = stepStartOffset + index;
      const gapNumber =
        step.gap_numbers?.[index] ?? Number(question.question_number || 1) + gapIndex;
      const answerKey = `${question.id}_gap_${gapNumber}`;
      const value = answers?.[answerKey] || '';
      const validation = validationMap?.[answerKey];
      const status = disabled
        ? validation?.isCorrect
          ? 'correct'
          : value
            ? 'incorrect'
            : 'unanswered'
        : 'default';

      return (
        <React.Fragment key={`gap-${gapNumber}-${index}`}>
          <span>{part}</span>
          <span className="inline-flex items-center gap-1.5 mx-1.5 align-middle whitespace-nowrap">
            <QuestionNumberCircle
              number={gapNumber}
              isFlagged={flaggedQuestions?.has(answerKey)}
              onClick={() => onToggleFlag?.(answerKey)}
              status={status}
              size="sm"
            />
            <DebouncedInput
              value={value}
              onChange={(nextValue) => onAnswerChange?.(answerKey, nextValue)}
              disabled={disabled}
              placeholder={disabled ? '' : 'answer'}
              className={cn(
                'h-9 sm:h-10 w-36 px-2.5 text-center text-base rounded-lg border shadow-xs transition-all duration-200 font-medium',
                disabled && validation?.isCorrect
                  ? 'border-emerald-500/80 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold ring-1 ring-emerald-500/20'
                  : disabled && value
                    ? 'border-rose-500/80 bg-rose-50/80 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-semibold ring-1 ring-rose-500/20'
                    : 'bg-slate-50/80 dark:bg-slate-950/60 border-slate-300/90 dark:border-slate-700/90 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:border-blue-400 dark:hover:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:border-blue-500'
              )}
            />
            {disabled && explanationData && (
              <DeepDivePopover
                explanationData={explanationData}
                userAnswer={value}
                isOpen={openDeepDive === answerKey}
                onToggle={() => setOpenDeepDive?.(openDeepDive === answerKey ? null : answerKey)}
                questionType={question.type}
                blankKey={gapNumber.toString()}
                questionNumber={gapNumber}
                inline={true}
              />
            )}
          </span>
        </React.Fragment>
      );
    });
  };

  return (
    <div
      className="w-full bg-slate-50/40 dark:bg-slate-900/30 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-2.5 sm:p-3.5 shadow-xs backdrop-blur-xs my-2"
      data-testid="reading-flowchart"
    >
      {flowchart.box_title && (
        <div className="mb-3 text-center">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
            {flowchart.box_title}
          </h3>
        </div>
      )}

      {flowchart.options?.length > 0 && (
        <div className="mb-3 border border-slate-200/90 dark:border-slate-800/90 p-2.5 bg-white/80 dark:bg-slate-900/80 rounded-xl shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Options
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {flowchart.options.map((opt, idx) => {
              const label = String.fromCharCode(65 + idx);
              return (
                <div
                  key={idx}
                  className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60"
                >
                  <span className="shrink-0 w-5 h-5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center">
                    {label}
                  </span>
                  <span>{opt}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col items-center w-full max-w-3xl mx-auto">
        {flowchart.steps.map((step, index) => (
          <React.Fragment key={step.id || index}>
            <div
              className="w-full border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900/90 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-base font-medium leading-[2.2rem] text-slate-800 dark:text-slate-200 shadow-xs hover:border-blue-400/40 dark:hover:border-blue-500/40 transition-all duration-200"
              data-testid="flowchart-step"
            >
              {renderStep(step)}
            </div>
            {index < flowchart.steps.length - 1 && (
              <div
                className="py-1 flex justify-center"
                data-testid="flowchart-arrow"
              >
                <ArrowDown
                  className="w-6 h-6 text-slate-700 dark:text-slate-300"
                  aria-hidden="true"
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
});

FlowchartRenderer.displayName = 'FlowchartRenderer';

export default FlowchartRenderer;

