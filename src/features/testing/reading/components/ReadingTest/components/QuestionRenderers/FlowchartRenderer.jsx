import React from 'react';
import { ArrowDown } from 'lucide-react';
import DebouncedInput from '@/components/ui/debounced-input';
import QuestionNumberCircle from '@/components/test/QuestionNumberCircle';
import DeepDivePopover from '@/features/testing/reading/components/DeepDivePopover';
import { cn } from '@/lib/cn';

function getFlowchartGapStatus(disabled, validation, value) {
  if (!disabled) return 'default';
  if (validation?.isCorrect) return 'correct';
  return value ? 'incorrect' : 'unanswered';
}

function getFlowchartInputStyle(disabled, validation, value) {
  if (disabled && validation?.isCorrect) {
    return 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold';
  }
  if (disabled && value) {
    return 'border-rose-500 bg-rose-50/70 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 font-bold';
  }
  if (disabled) {
    return 'bg-white dark:bg-white/4 border-[#e4e2f0] dark:border-white/8 text-foreground';
  }
  return 'bg-white/70 dark:bg-white/4 border border-slate-300/70 dark:border-white/8 text-foreground hover:border-slate-400/80 dark:hover:border-white/[0.14] focus-visible:ring-1 focus-visible:ring-[#5a63df]/40 focus-visible:border-[#5a63df]/50';
}

function FlowchartDeepDive({
  disabled,
  explanationData,
  openDeepDive,
  setOpenDeepDive,
  answerKey,
  questionType,
  gapNumber,
  value,
}) {
  if (!disabled || !explanationData) return null;
  return (
    <DeepDivePopover
      explanationData={explanationData}
      userAnswer={value}
      isOpen={openDeepDive === answerKey}
      onToggle={() => setOpenDeepDive?.(openDeepDive === answerKey ? null : answerKey)}
      questionType={questionType}
      blankKey={gapNumber.toString()}
      questionNumber={gapNumber}
      inline={true}
    />
  );
}

function FlowchartStepGap({
  part,
  index,
  stepStartOffset,
  step,
  question,
  answers,
  onAnswerChange,
  flaggedQuestions,
  onToggleFlag,
  disabled,
  validationMap,
  explanationData,
  openDeepDive,
  setOpenDeepDive,
}) {
  const gapIndex = stepStartOffset + index;
  const gapNumber = step.gap_numbers?.[index] ?? Number(question.question_number || 1) + gapIndex;
  const answerKey = `${question.id}_gap_${gapNumber}`;
  const value = answers?.[answerKey] || '';
  const validation = validationMap?.[answerKey];
  const status = getFlowchartGapStatus(disabled, validation, value);
  const inputStyle = getFlowchartInputStyle(disabled, validation, value);

  return (
    <React.Fragment key={`gap-${gapNumber}-${index}`}>
      <span>{part}</span>
      <span className="inline-flex items-center gap-1.5 mx-1 align-middle whitespace-nowrap">
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
            'w-28 h-7 px-2 py-0.5 text-center text-[15px] rounded-lg transition-all duration-200 shadow-sm font-medium focus-visible:outline-none focus-visible:ring-1',
            inputStyle
          )}
        />
        <FlowchartDeepDive
          disabled={disabled}
          explanationData={explanationData}
          openDeepDive={openDeepDive}
          setOpenDeepDive={setOpenDeepDive}
          answerKey={answerKey}
          questionType={question.type}
          gapNumber={gapNumber}
          value={value}
        />
      </span>
    </React.Fragment>
  );
}

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
      return (
        <FlowchartStepGap
          key={`gap-${index}`}
          part={part}
          index={index}
          stepStartOffset={stepStartOffset}
          step={step}
          question={question}
          answers={answers}
          onAnswerChange={onAnswerChange}
          flaggedQuestions={flaggedQuestions}
          onToggleFlag={onToggleFlag}
          disabled={disabled}
          validationMap={validationMap}
          explanationData={explanationData}
          openDeepDive={openDeepDive}
          setOpenDeepDive={setOpenDeepDive}
        />
      );
    });
  };

  return (
    <div
      className="w-full bg-[#f4f3fb] dark:bg-white/3 rounded-xl p-2.5 sm:p-3 my-1"
      data-testid="reading-flowchart"
    >
      {flowchart.box_title && (
        <div className="mb-2 text-center">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
            {flowchart.box_title}
          </h3>
        </div>
      )}

      {flowchart.instruction && (
        <div className="mb-2 text-sm text-slate-600 dark:text-slate-400 italic">
          {flowchart.instruction}
        </div>
      )}

      <div className="flex flex-col items-center gap-1 sm:gap-1.5 w-full max-w-2xl mx-auto">
        {flowchart.steps.map((step, stepIndex) => (
          <React.Fragment key={step.id || stepIndex}>
            <div
              data-testid="flowchart-step"
              className="w-full rounded-lg border border-[#ebeaf7] bg-[#fbfbfe] dark:border-white/8 dark:bg-white/5.5 px-3.5 py-2.5 text-[15px] text-slate-800 dark:text-slate-200 leading-relaxed hover:border-slate-300 dark:hover:border-white/[0.14] transition-colors"
            >
              {renderStep(step)}
            </div>

            {stepIndex < flowchart.steps.length - 1 && (
              <div
                data-testid="flowchart-arrow"
                className="flex items-center justify-center text-[#5a63df]/70 dark:text-[#a9afff]/70 py-0"
              >
                <ArrowDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
});

export default FlowchartRenderer;
