import React from 'react';
import { Input } from '@/components/ui/input';
import DebouncedInput from '@/components/ui/debounced-input';
import QuestionNumberCircle from '@/components/test/QuestionNumberCircle';
import DeepDivePopover from '@/features/testing/reading/components/DeepDivePopover';

/**
 * Renders a table completion question with inline inputs for blanks.
 * Memoized to prevent unnecessary re-renders.
 *
 * Supports both:
 * - Modern format: cells contain __BLANK_N__ placeholders
 * - Legacy format: blanks defined by row/col position
 */
const TableCompletionRenderer = React.memo(
  ({
    question,
    globalQuestionNumber,
    answers,
    onAnswerChange,
    flaggedQuestions,
    onToggleFlag,
    calculateGlobalNum,
    disabled = false,
    validationMap = {},
    explanationData,
    openDeepDive,
    setOpenDeepDive,
  }) => {
    // Use computed display numbers (like Listening version)
    const displayStart =
      question._displayStartNumber || globalQuestionNumber || question.question_number || 1;

    // Pre-calculate all gaps in the table for correct numbering and unique key association
    // Each gap occurrence gets a unique absoluteIdx, even if multiple blanks share the same number
    const gapMapping = React.useMemo(() => {
      const mapping = [];
      const rows = question.table_data.rows || [];

      rows.forEach((row, rIdx) => {
        row.forEach((cell, cIdx) => {
          const cellStr = cell || '';

          // Check for inline blanks (__BLANK_N__)
          const inlineMatches = cellStr.match(/__BLANK_(\d+)__/g);
          if (inlineMatches) {
            inlineMatches.forEach((match, gIdx) => {
              const blankNum = parseInt(match.match(/__BLANK_(\d+)__/)[1]);
              mapping.push({
                rIdx,
                cIdx,
                gIdx, // index of the gap within this specific cell
                blankNum, // the display number (e.g., 7) - THIS is what we show to the user
                absoluteIdx: mapping.length, // unique sequential index for input key (internal only)
                displayNumber: blankNum, // Use blankNum for display, NOT sequential index
              });
            });
          }

          // Check for legacy position-based blanks (row/col match)
          const isLegacyBlank = question.table_data.blanks?.some(
            (b) => b.row === rIdx && b.col === cIdx
          );
          if (isLegacyBlank && !cellStr.includes('__BLANK_')) {
            const blank = question.table_data.blanks.find((b) => b.row === rIdx && b.col === cIdx);
            mapping.push({
              rIdx,
              cIdx,
              gIdx: 0,
              blankNum: blank?.blankNumber || mapping.length + 1,
              absoluteIdx: mapping.length,
              displayNumber: blank?.blankNumber || mapping.length + 1, // Use blankNumber for display
              legacyBlank: blank,
            });
          }
        });
      });

      return mapping;
    }, [question.table_data.rows, question.table_data.blanks]);

    // Helper to get gaps for a specific cell
    const getGapsInCell = (targetRow, targetCol) => {
      return gapMapping.filter((g) => g.rIdx === targetRow && g.cIdx === targetCol);
    };

    // Helper for input styles
    const getInputStyles = (isCorrect, value) => {
      let styles =
        'inline-flex w-32 h-8 px-2 py-1 text-center border rounded-md transition-colors text-base shadow-sm';
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
          ' bg-white/70 dark:bg-slate-950/40 border border-slate-300/70 dark:border-slate-700/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/40 focus-visible:border-blue-500/50 hover:border-slate-400/80 dark:hover:border-slate-600/80 shadow-sm';
      }
      return styles;
    };

    if (!question.table_data || !question.table_data.headers || !question.table_data.rows) {
      return null;
    }

    return (
      <div className="overflow-x-auto rounded-lg mb-4" data-oid="_:f3hf2">
        <table
          className="w-full text-base border-collapse border border-slate-200/60 dark:border-slate-700/60 rounded-lg overflow-hidden"
          data-oid="3:da4lp"
        >
          <thead data-oid="svu6nmp">
            <tr className="bg-muted/40 dark:bg-slate-950/30" data-oid="_o2atxc">
              {question.table_data.headers.map((header, i) => (
                <th
                  key={i}
                  className="border border-slate-200/60 dark:border-slate-700/60 p-3 text-left font-semibold bg-white/60 dark:bg-slate-950/35 text-foreground"
                  data-oid="n6.yqbv"
                >
                  {header.split(/(\*\*[^*]+\*\*)/g).map((sub, sIdx) => {
                    if (sub.startsWith('**') && sub.endsWith('**')) {
                      return (
                        <strong key={sIdx} className="font-bold">
                          {sub.slice(2, -2)}
                        </strong>
                      );
                    }
                    return sub;
                  })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody data-oid="uw9mxi_">
            {question.table_data.rows.map((row, rIdx) => (
              <tr
                key={rIdx}
                className="hover:bg-slate-50/60 dark:hover:bg-slate-950/35"
                data-oid="6jnvs-6"
              >
                {row.map((cell, cIdx) => {
                  // Get all gaps for this cell from the pre-computed mapping
                  const cellGaps = getGapsInCell(rIdx, cIdx);

                  // Check for inline blanks (modern format)
                  if (cell && cell.includes('__BLANK_')) {
                    const parts = cell.split(/(__BLANK_\d+__)/g);
                    let gapPointer = 0; // Track which gap we're rendering within this cell

                    return (
                      <td
                        key={cIdx}
                        className="border border-slate-200/60 dark:border-slate-700/60 p-3 min-w-[150px] align-top relative text-foreground"
                        data-oid="7q8ta9a"
                      >
                        <div className="leading-[2.4rem]" data-oid=".dvmfhc">
                          {parts.map((part, pIdx) => {
                            const match = part.match(/__BLANK_(\d+)__/);
                            if (match) {
                              // Get the gap info from our pre-computed mapping
                              const gapInfo = cellGaps[gapPointer];
                              gapPointer++;

                              if (!gapInfo) return null; // Safety check

                              // Use absoluteIdx for a unique input ID
                              const inputId = `${question.id}_${gapInfo.absoluteIdx}`;
                              const value = answers?.[inputId] || '';
                              const validation = validationMap?.[inputId];
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
                                  key={pIdx}
                                  className="inline-flex items-center gap-2 mx-1 translate-y-[-2px] align-middle"
                                  data-oid="xgqd870"
                                >
                                  <QuestionNumberCircle
                                    number={gapInfo.displayNumber}
                                    isFlagged={flaggedQuestions?.has(inputId)}
                                    onClick={() => onToggleFlag?.(inputId)}
                                    status={circleStatus}
                                    data-oid="3qhezj1"
                                  />

                                  <DebouncedInput
                                    value={value}
                                    onChange={(val) => onAnswerChange?.(inputId, val)}
                                    className={getInputStyles(isCorrect, value)}
                                    placeholder={disabled ? (value ? '' : '-') : 'answer'}
                                    disabled={disabled}
                                    data-oid="w-n_s7d"
                                  />

                                  {/* Inline Explanation Popover */}
                                  {disabled &&
                                    explanationData &&
                                    (() => {
                                      const actualKey = explanationData.blanks?.[
                                        gapInfo.displayNumber
                                      ]
                                        ? gapInfo.displayNumber
                                        : explanationData.blanks?.[gapInfo.absoluteIdx]
                                          ? gapInfo.absoluteIdx
                                          : null;
                                      if (!actualKey) return null;

                                      return (
                                        <DeepDivePopover
                                          explanationData={explanationData}
                                          userAnswer={value}
                                          isOpen={openDeepDive === inputId}
                                          onToggle={() =>
                                            setOpenDeepDive?.(
                                              openDeepDive === inputId ? null : inputId
                                            )
                                          }
                                          questionType="table_completion"
                                          blankKey={actualKey}
                                          inline={true}
                                        />
                                      );
                                    })()}
                                </span>
                              );
                            }
                            return (
                              <span key={pIdx} className="whitespace-pre-wrap" data-oid="a7qmalh">
                                {part.split(/(\*\*[^*]+\*\*)/g).map((sub, sIdx) => {
                                  if (sub.startsWith('**') && sub.endsWith('**')) {
                                    return (
                                      <strong key={sIdx} className="font-bold">
                                        {sub.slice(2, -2)}
                                      </strong>
                                    );
                                  }
                                  return sub;
                                })}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                    );
                  }

                  // Check for legacy blank format (position-based)
                  // Legacy blanks would have been added to cellGaps in the gapMapping
                  const legacyGap = cellGaps.find((g) => g.legacyBlank);

                  if (legacyGap && !cell?.includes('__BLANK_')) {
                    // Use absoluteIdx for a unique input ID
                    const inputId = `${question.id}_${legacyGap.absoluteIdx}`;
                    const value = answers?.[inputId] || '';
                    const validation = validationMap?.[inputId];
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
                      <td
                        key={cIdx}
                        className="border border-slate-200/60 dark:border-slate-700/60 p-2 min-w-[120px] align-top bg-amber-50/30 dark:bg-amber-950/20 text-foreground"
                        data-oid=":8468.0"
                      >
                        <div className="flex flex-col gap-2" data-oid="6a7.dw4">
                          <div className="whitespace-pre-wrap" data-oid="n703r.0">
                            {cell.split(/(\*\*[^*]+\*\*)/g).map((sub, sIdx) => {
                              if (sub.startsWith('**') && sub.endsWith('**')) {
                                return (
                                  <strong key={sIdx} className="font-bold">
                                    {sub.slice(2, -2)}
                                  </strong>
                                );
                              }
                              return sub;
                            })}
                          </div>
                          <div className="flex items-center gap-1" data-oid=":klcr_w">
                            <QuestionNumberCircle
                              number={legacyGap.displayNumber}
                              isFlagged={flaggedQuestions?.has(inputId)}
                              onClick={() => onToggleFlag?.(inputId)}
                              status={circleStatus}
                              data-oid="_rc53d-"
                            />

                            <DebouncedInput
                              value={value}
                              onChange={(val) => onAnswerChange?.(inputId, val)}
                              className={getInputStyles(isCorrect, value)}
                              placeholder={disabled ? (value ? '' : '-') : 'answer'}
                              disabled={disabled}
                              data-oid="oxj5e1v"
                            />

                            {/* Inline Explanation Popover */}
                            {disabled &&
                              explanationData &&
                              (() => {
                                const actualKey = explanationData.blanks?.[legacyGap.displayNumber]
                                  ? legacyGap.displayNumber
                                  : explanationData.blanks?.[legacyGap.absoluteIdx]
                                    ? legacyGap.absoluteIdx
                                    : null;
                                if (!actualKey) return null;

                                return (
                                  <DeepDivePopover
                                    explanationData={explanationData}
                                    userAnswer={value}
                                    isOpen={openDeepDive === inputId}
                                    onToggle={() =>
                                      setOpenDeepDive?.(openDeepDive === inputId ? null : inputId)
                                    }
                                    questionType="table_completion"
                                    blankKey={actualKey}
                                    inline={true}
                                  />
                                );
                              })()}
                          </div>
                        </div>
                      </td>
                    );
                  }

                  // Regular cell (no blank)
                  return (
                    <td
                      key={cIdx}
                      className="border border-slate-200/60 dark:border-slate-700/60 p-2 min-w-[120px] align-top text-foreground"
                      data-oid="-7taze0"
                    >
                      <div className="whitespace-pre-wrap" data-oid="2d_j1f4">
                        {cell
                          ? cell.split(/(\n|\*\*[^*]+\*\*)/g).map((part, i) => {
                              if (part === '\n') return <br key={i} />;
                              if (part.startsWith('**') && part.endsWith('**')) {
                                return (
                                  <strong key={i} className="font-bold">
                                    {part.slice(2, -2)}
                                  </strong>
                                );
                              }
                              return part;
                            })
                          : ''}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
);

TableCompletionRenderer.displayName = 'TableCompletionRenderer';

export default TableCompletionRenderer;
