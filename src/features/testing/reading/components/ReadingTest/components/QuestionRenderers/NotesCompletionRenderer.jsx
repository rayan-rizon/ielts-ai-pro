import React from 'react';
import { Input } from '@/components/ui/input';
import DebouncedInput from '@/components/ui/debounced-input';
import QuestionNumberCircle from '@/components/test/QuestionNumberCircle';
import DeepDivePopover from '@/features/testing/reading/components/DeepDivePopover';

/**
 * Renders structured notes completion with title, bold headers, bullets, and inline gaps.
 * Parses [N] placeholders into input fields.
 */
const NotesCompletionRenderer = React.memo(
  ({
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
  }) => {
    const { gap_fill } = question;
    const title = gap_fill?.title || '';
    const structuredText = gap_fill?.structured_text || '';

    // Helper for input styles
    const getInputStyles = (isCorrect, value) => {
      let styles =
        'inline-flex w-32 h-8 px-2 py-1 text-center border rounded-md transition-colors text-[15px]';
      const showValidation = disabled && value?.trim() !== '';

      if (disabled) {
        styles += ' cursor-not-allowed opacity-100';
        if (showValidation) {
          if (isCorrect) {
            styles +=
              ' bg-green-100 dark:bg-green-900/30 border-green-500 text-green-800 dark:text-green-300 font-semibold';
          } else {
            styles +=
              ' bg-red-100 dark:bg-red-900/30 border-red-500 text-red-800 dark:text-red-300 font-semibold';
          }
        } else {
          styles +=
            ' bg-white dark:bg-slate-900/50 border-slate-300 dark:border-slate-700 text-muted-foreground';
        }
      } else {
        styles +=
          ' bg-white/70 dark:bg-slate-950/40 border-slate-300/70 dark:border-slate-700/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/40 focus-visible:border-blue-500/50 hover:border-slate-400/80 dark:hover:border-slate-600/80';
      }
      return styles;
    };

    if (!structuredText) return null;

    const lines = structuredText.split('\n');

    /**
     * Render a line with [N] placeholders converted to inline inputs
     */
    const renderLineWithGaps = (line, lineIdx) => {
      const parts = line.split(/\[(\d+)\]/g);

      return (
        <span key={lineIdx} data-oid="b4ivbfy">
          {parts.map((part, idx) => {
            // Odd indices are the captured group (the number)
            if (idx % 2 === 1) {
              const gapNum = parseInt(part);
              const answerKey = `${question.id}_gap_${gapNum}`;
              const isFlagged = flaggedQuestions?.has(answerKey);
              const value = answers?.[answerKey] || '';
              const validation = validationMap?.[answerKey];
              const isCorrect = validation?.isCorrect === true;
              const circleStatus =
                disabled && validation
                  ? isCorrect
                    ? 'correct'
                    : value
                      ? 'incorrect'
                      : 'unanswered'
                  : 'default';

              return (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 mx-1 translate-y-[-2px] align-middle"
                  data-oid="ks459g2"
                >
                  <QuestionNumberCircle
                    number={gapNum}
                    isFlagged={isFlagged}
                    onClick={() => onToggleFlag?.(answerKey)}
                    status={circleStatus}
                    data-oid="b4m65j3"
                  />

                  <DebouncedInput
                    className={getInputStyles(isCorrect, value)}
                    value={value}
                    onChange={(val) => onAnswerChange?.(answerKey, val)}
                    placeholder={disabled ? (value ? '' : '-') : 'answer'}
                    disabled={disabled}
                    data-oid="jv:afly"
                  />

                  {/* Inline Explanation Popover */}
                  {disabled &&
                    explanationData &&
                    (() => {
                      const actualKey = explanationData.blanks?.[gapNum] ? gapNum : null;
                      if (!actualKey) return null;

                      return (
                        <DeepDivePopover
                          explanationData={explanationData}
                          userAnswer={value}
                          isOpen={openDeepDive === answerKey}
                          onToggle={() =>
                            setOpenDeepDive?.(openDeepDive === answerKey ? null : answerKey)
                          }
                          questionType={question.type}
                          blankKey={actualKey}
                          inline={true}
                        />
                      );
                    })()}
                </span>
              );
            }
            return (
              <span key={idx} data-oid="-hq_9xb">
                {part}
              </span>
            );
          })}
        </span>
      );
    };

    return (
      <div className="rounded-xl p-4 sm:p-5" data-oid="kn-33aq">
        {/* Title - centered and bold */}
        {title && (
          <h2 className="text-xl font-bold text-center text-foreground mb-6" data-oid=".1avyxm">
            {title}
          </h2>
        )}

        {/* Structured content */}
        <div
          className="space-y-1.5 text-[15px] text-foreground leading-[2.4rem]"
          data-oid="il2kek2"
        >
          {lines.map((line, idx) => {
            let trimmedLine = line.trim();
            if (!trimmedLine) return <div key={idx} className="h-1" data-oid="g4vk_3k" />;

            // Check if entire line should be bold (wrapped in ** or __)
            const isBoldLine =
              (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) ||
              (trimmedLine.startsWith('__') && trimmedLine.endsWith('__'));

            if (isBoldLine) {
              // Remove the bold markers
              trimmedLine = trimmedLine.slice(2, -2);
              return (
                <p key={idx} className="font-bold text-[15px] mt-3 mb-1" data-oid="unmygo3">
                  {renderLineWithGaps(trimmedLine, idx)}
                </p>
              );
            }

            // Detect bold headers (lines ending with : that aren't bullets)
            if (trimmedLine.endsWith(':') && !trimmedLine.match(/^[●•–\-]/)) {
              return (
                <p key={idx} className="font-bold text-[15px] mt-3 mb-1" data-oid="nskbdnl">
                  {renderLineWithGaps(trimmedLine, idx)}
                </p>
              );
            }

            // Main bullet points (●) - render WITHOUT the bullet but with proper indent
            if (trimmedLine.startsWith('●') || trimmedLine.startsWith('•')) {
              return (
                <div key={idx} className="flex items-start gap-2 ml-0" data-oid="c_pb-x6">
                  <span className="text-muted-foreground" data-oid="1oqa19d">
                    •
                  </span>
                  <span className="flex-1" data-oid="9pzjok.">
                    {renderLineWithGaps(trimmedLine.substring(1).trim(), idx)}
                  </span>
                </div>
              );
            }

            // Sub bullet points (–)
            if (trimmedLine.startsWith('–') || trimmedLine.startsWith('-')) {
              return (
                <div key={idx} className="flex items-start gap-2 ml-6" data-oid="rx-140k">
                  <span className="text-muted-foreground" data-oid="_xcf5lp">
                    –
                  </span>
                  <span className="flex-1" data-oid="zfvbdf3">
                    {renderLineWithGaps(trimmedLine.substring(1).trim(), idx)}
                  </span>
                </div>
              );
            }

            // Regular text
            return (
              <p key={idx} data-oid="9u9hwj8">
                {renderLineWithGaps(trimmedLine, idx)}
              </p>
            );
          })}
        </div>
      </div>
    );
  }
);

NotesCompletionRenderer.displayName = 'NotesCompletionRenderer';

export default NotesCompletionRenderer;
