import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, X } from 'lucide-react';
import { isAnswerCorrect } from '@/lib/ieltsAnswerValidation';

const ReadingTestSheet = ({
  showAnswerSheet,
  setShowAnswerSheet,
  currentPassageIndex,
  testData,
  allQuestions,
  answers,
  handleAnswerChange,
  isFinished,
  onQuestionClick,
  isMobile,
}) => {
  const isInline = isFinished && !isMobile;
  // Check answer correctness using the proper IELTS validation function
  const checkAnswer = (userAns, correctAns) => {
    if (!correctAns) return false;
    if (!userAns || String(userAns).trim() === '') return false;
    return isAnswerCorrect(userAns, correctAns);
  };

  // Auto-scroll logic could be added here similar to notes if needed

  const renderAnswerInput = (q, globalNum, subId = null, correctAnswer = null) => {
    const questionId = q.id;
    // Fix: Use explicit null/undefined check instead of truthy check to handle subId of 0
    const answerKey = subId !== null && subId !== undefined ? `${questionId}_${subId}` : questionId;
    const value = answers[answerKey] || '';

    // Correct answer resolution logic - moved outside the isFinished block to prevent ReferenceError
    let cAnswer = correctAnswer;

    // If no explicit answer passed, try fallbacks
    if (cAnswer == null || cAnswer === '') {
      // Try gap_fill answers
      if (q.gap_fill?.answers && subId != null) {
        const num = parseInt(subId.toString().replace('gap_', '').replace('blank_', ''));
        if (!isNaN(num)) cAnswer = q.gap_fill.answers[num];
      }

      // Try correct_answers (plural)
      if ((cAnswer == null || cAnswer === '') && q.correct_answers && subId !== null) {
        const idxStr = subId.toString().replace('blank_', '').replace('gap_', '');
        const subIndex = parseInt(idxStr);
        cAnswer = q.correct_answers[subIndex] || q.correct_answers[subId];
      }

      if (cAnswer == null || cAnswer === '') {
        cAnswer = q.correct_answer;
      }

      if (q.type === 'matching_features') {
        if (q.matching_features?.answers && subId != null) {
          cAnswer = q.matching_features.answers[subId];
        } else if (q.matching_features?.questions && subId != null) {
          const subQ = q.matching_features.questions.find((sq) => sq.id === subId);
          if (subQ) cAnswer = subQ.answer;
        }
      }
    }

    let isCorrect = false;
    if (isFinished) {
      isCorrect = checkAnswer(value, cAnswer);
    }

    return (
      <div
        key={answerKey}
        className={`flex items-center gap-2 p-2 bg-card/70 rounded-lg border transition-all group ${
          isFinished
            ? isCorrect
              ? 'answer-correct shadow-sm'
              : value
                ? 'answer-incorrect shadow-sm'
                : 'answer-unanswered'
            : 'border-border/60 hover:border-primary/40 hover:shadow-sm'
        }`}
        data-oid="0ldq_fa"
      >
        <div className="flex items-center justify-center flex-none" data-oid="-3h9e27">
          <span
            onClick={() => onQuestionClick && onQuestionClick(questionId)}
            className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all cursor-pointer hover:scale-110 active:scale-95 ${
              isFinished
                ? isCorrect
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : value
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'bg-amber-400 text-amber-900 shadow-sm'
                : 'bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:ring-2 group-hover:ring-primary/20'
            }`}
            data-oid="94z:f23"
          >
            {globalNum}
          </span>
        </div>

        {isFinished ? (
          <div className="flex-1 min-w-0 flex flex-col justify-center" data-oid="lo1i2ox">
            <div
              className={`font-semibold text-sm ${isCorrect ? 'text-emerald-700 dark:text-emerald-300' : value ? 'text-rose-700 dark:text-rose-300' : 'text-amber-700 dark:text-amber-400'}`}
              data-oid="n6az2ld"
            >
              {/* For MCQs, parse arrays/comma-lists and retain only the letters */}
              {(() => {
                if (!value) return null;
                let v = value;
                try {
                  if (typeof value === 'string' && value.trim().startsWith('[')) {
                    v = JSON.parse(value);
                  }
                } catch (e) {
                  // Keep as string if parsing fails
                }
                const vArr = Array.isArray(v) ? v : String(v).split(',');
                const letters = vArr.map((item) => {
                  const str = String(item).trim();
                  return str.match(/^[A-E](?:\.|\s|$)/i) ? str.substring(0, 1).toUpperCase() : str;
                });
                return letters.join(', ');
              })() || (
                <span
                  className="text-amber-600/80 dark:text-amber-500/80 italic font-medium text-xs"
                  data-oid="laugwkv"
                >
                  Not Answered
                </span>
              )}
            </div>
            {!isCorrect && (
              <div
                className={`text-[10px] text-muted-foreground truncate mt-1 pt-1 border-t flex items-center gap-1 ${
                  value
                    ? 'border-rose-500/25 dark:border-rose-500/25'
                    : 'border-amber-500/25 dark:border-amber-500/25'
                }`}
                data-oid="rcns9sy"
              >
                <span
                  className="text-muted-foreground/70 text-[9px] uppercase tracking-wider font-medium"
                  data-oid="2iphazs"
                >
                  Correct:
                </span>
                <span
                  className="font-semibold text-emerald-700 dark:text-emerald-300"
                  data-oid="7sx9m2:"
                >
                  {/* Same letter-only array extraction logic for the correct answer */}
                  {(() => {
                    let ca = cAnswer;
                    if (!ca) return '-';
                    try {
                      if (typeof ca === 'string' && ca.trim().startsWith('[')) {
                        ca = JSON.parse(ca);
                      }
                    } catch (e) {
                      // Keep as string if parsing fails
                    }
                    const caArr = Array.isArray(ca) ? ca : String(ca).split(',');
                    const letters = caArr.map((item) => {
                      const str = String(item).trim();
                      return str.match(/^[A-E](?:\.|\s|$)/i)
                        ? str.substring(0, 1).toUpperCase()
                        : str;
                    });
                    return letters.join(', ');
                  })()}
                </span>
              </div>
            )}
          </div>
        ) : (
          <Input
            value={value}
            onChange={(e) => handleAnswerChange(answerKey, e.target.value)}
            placeholder=""
            className="flex-1 h-8 min-w-0 px-2 text-sm bg-background/60 border-border/70 focus:ring-1 focus:ring-primary rounded-md font-medium text-center"
            data-oid="7.8qgbt"
          />
        )}
      </div>
    );
  };

  const getSheetContent = () => {
    if (!testData || !allQuestions) return null;

    // Get questions for current passage only
    // MATCHING ReadingTest.jsx logic: use testData.sections primarily
    const currentPassage =
      (testData.sections && testData.sections[currentPassageIndex]) ||
      (testData.passages && testData.passages[currentPassageIndex]);

    if (!currentPassage) return null;

    const currentSectionNum = currentPassage.section_number || currentPassageIndex + 1;
    const passageQuestions = allQuestions
      .filter((q) => {
        // Priority 1: Direct Passage ID match
        if (q.passage_id === currentPassage.id) return true;

        // Priority 2: Section match (if sections exist)
        if (testData.sections && testData.sections.length > 1 && q.section) {
          return parseInt(q.section) === parseInt(currentSectionNum);
        }

        // Priority 3: Legacy/Fallbacks
        if (q.passage_id === testData.id) return true;
        if (!testData.sections || testData.sections.length <= 1) return true; // Single section tests

        // Priority 4: String match on 'section' field (matching ReadingTest.jsx)
        const questionSectionIdentifier = q.section;
        if (questionSectionIdentifier) {
          // Try exact number match from string
          const parsedQuestionSection = parseInt(
            questionSectionIdentifier.toString().match(/\d+/)?.[0]
          );
          if (!isNaN(parsedQuestionSection) && parsedQuestionSection === currentSectionNum) {
            return true;
          }
          // Try string match
          if (
            questionSectionIdentifier
              .toString()
              .toLowerCase()
              .includes(`passage ${currentSectionNum}`) ||
            questionSectionIdentifier
              .toString()
              .toLowerCase()
              .includes(`section ${currentSectionNum}`)
          ) {
            return true;
          }
        }

        // Default: show all questions if filtering is unclear (matching ReadingTest.jsx behavior)
        // This ensures we default to showing questions rather than hiding them if logic fails.
        return true;
      })
      .sort((a, b) => (a.question_number || 0) - (b.question_number || 0));

    // Flatten questions into individual answer entries
    const answerEntries = [];
    let questionCounter = 0;

    // Calculate starting question number for this passage
    if (testData.sections && testData.sections.length > 1) {
      for (let i = 0; i < currentPassageIndex; i++) {
        const sectionNum = testData.sections[i].section_number || i + 1;
        const sectionQuestions = allQuestions.filter((q) => {
          if (q.section) return parseInt(q.section) === parseInt(sectionNum);
          return false;
        });
        sectionQuestions.forEach((q) => {
          if (
            q.type === 'table_completion' &&
            (q.table_data?.blanks || q.table_data?.blank_positions)
          ) {
            questionCounter += (q.table_data.blanks || q.table_data.blank_positions || []).length;
          } else if (q.type === 'matching_headings' && q.matching_data?.paragraphs) {
            questionCounter += q.matching_data.paragraphs.length;
          } else if (q.type === 'matching' && q.options) {
            questionCounter += q.options.length;
          } else if (q.type === 'matching_features') {
            if (q.matching_features?.mode === 'paragraph') {
              const text = q.matching_features.text || '';
              const gaps = (text.match(/\[\d+\]/g) || []).length;
              questionCounter += Math.max(gaps, 1);
            } else {
              questionCounter += (q.matching_features?.questions || []).length;
            }
          } else if (q.type === 'notes_completion' || q.type === 'note_completion') {
            // Count [N] gaps
            const text = q.gap_fill?.structured_text || '';
            const gaps = (text.match(/\[\d+\]/g) || []).length;
            questionCounter += Math.max(gaps, 1);
          } else if (
            [
              'sentence_completion',
              'summary_completion',
              'flow_chart_completion',
              'diagram_completion',
              'short_answer',
            ].includes(q.type)
          ) {
            // Estimate based on blanks or just 1 per question if simple
            const blanks = ((q.question_text || q.text || '')?.match(/_____/g) || []).length;
            questionCounter += Math.max(blanks, 1);
          } else {
            questionCounter += 1; // Default
          }
        });
      }
    } else {
      // For non-section tests, assuming sequential but we need to count previous passages
      // Ideally we just trust q.question_number if available, or calc offset
      // Logic in ReadingTest might be complex, simplified here:
      const prevQuestions = allQuestions.filter(
        (q) => (q.question_number || 0) < (passageQuestions[0]?.question_number || 9999)
      );
      // This logic needs to align with ReadingTest.jsx exactly or be robust.
      // Best to use q.question_number directly if it exists.
    }

    passageQuestions.forEach((q) => {
      // Use the question_number from the question itself as the base
      // Fallback to counter if q.question_number isn't reliably set (though it should be)
      const baseQuestionNumber = q.question_number || q.question_start || questionCounter + 1;

      if (q.type === 'table_completion' && q.table_data?.rows) {
        let absoluteIdx = 0;
        const rows = q.table_data.rows;
        // Support both property names for blanks metadata
        const blanksMetadata = q.table_data.blanks || q.table_data.blank_positions || [];

        // First pass: collect all gaps with their blankNum and absoluteIdx
        const allGaps = [];

        rows.forEach((row, rIdx) => {
          const cells = Array.isArray(row) ? row : [];
          cells.forEach((cell, cIdx) => {
            const cellStr = cell || '';

            // 1. Check for Inline matches (__BLANK_N__)
            const inlineMatches = cellStr.match(/__BLANK_(\d+)__/g);
            if (inlineMatches) {
              inlineMatches.forEach((match) => {
                const blankNum = parseInt(match.match(/__BLANK_(\d+)__/)[1]);
                const blankMeta = blanksMetadata.find((b) => b.blankNumber === blankNum);

                allGaps.push({
                  blankNum,
                  absoluteIdx,
                  correctAns:
                    blankMeta?.answer ||
                    q.correct_answers?.[absoluteIdx] ||
                    q.table_data.answers?.[absoluteIdx],
                });
                absoluteIdx++;
              });
            }

            // 2. Check for Legacy matches (position based)
            const legacyBlank = blanksMetadata.find((b) => b.row === rIdx && b.col === cIdx);
            if (legacyBlank && !cellStr.includes('__BLANK_')) {
              const blankNum = legacyBlank.blankNumber || absoluteIdx + 1;
              allGaps.push({
                blankNum,
                absoluteIdx,
                correctAns:
                  legacyBlank.answer ||
                  q.correct_answers?.[absoluteIdx] ||
                  q.table_data.answers?.[absoluteIdx],
              });
              absoluteIdx++;
            }
          });
        });

        // Second pass: group by unique blankNum (for answer sheet display)
        // Only show ONE entry per unique question number
        const seenBlankNums = new Set();
        const uniqueQuestions = [];

        allGaps.forEach((gap) => {
          if (!seenBlankNums.has(gap.blankNum)) {
            seenBlankNums.add(gap.blankNum);
            // Find all gaps with this blankNum
            const gapsWithSameNum = allGaps.filter((g) => g.blankNum === gap.blankNum);
            uniqueQuestions.push({
              blankNum: gap.blankNum,
              // Use the first absoluteIdx for the key
              subId: gapsWithSameNum[0].absoluteIdx,
              correctAns: gap.correctAns,
              gapCount: gapsWithSameNum.length,
            });
          }
        });

        // Render one answer input per unique question number
        uniqueQuestions.forEach((uq) => {
          answerEntries.push(renderAnswerInput(q, uq.blankNum, uq.subId, uq.correctAns));
        });

        questionCounter += uniqueQuestions.length;
      } else if (q.type === 'matching_headings' && (q.matching_data?.paragraphs || q.questions)) {
        // Determine if it uses 'paragraphs' or 'questions' array
        const items = q.matching_data?.paragraphs || q.questions || [];
        items.forEach((item, idx) => {
          const itemNum = baseQuestionNumber + idx;
          answerEntries.push(renderAnswerInput(q, itemNum, item.id || idx));
        });
        questionCounter += items.length;
      } else if (q.type === 'matching' && q.options) {
        q.options.forEach((opt, idx) => {
          const optNum = baseQuestionNumber + idx; // Assuming 1 input per option for matching?
          // WAIT: Matching type in ReadingTest uses 1 input per option?
          // Checking ReadingTest logic:
          //  {question.options.map... <Input ... value={answers[`${question.id}_${String.fromCharCode(65 + optionIndex)}`]} ... />}
          // So specific sub-keys are used.
          const charCode = String.fromCharCode(65 + idx);
          answerEntries.push(renderAnswerInput(q, optNum, charCode));
        });
        questionCounter += q.options.length;
      } else if (
        [
          'sentence_completion',
          'summary_completion',
          'flow_chart_completion',
          'diagram_completion',
          'short_answer',
        ].includes(q.type)
      ) {
        // Determine blank count
        const text = q.question_text || q.text || '';
        const blankCount = Math.max((text.match(/_____/g) || []).length, 1);

        // Generate input for each blank
        for (let i = 0; i < blankCount; i++) {
          // Note: This logic must match the counting logic in the previous loop IF using counters
          // But here we rely on baseQuestionNumber which should be accurate if q.question_number is set.
          // If q.question_number is NOT set, we rely on the continuous questionCounter.

          // IMPORTANT: The questionCounter in the previous 'counting loop' counts ALL sub-questions.
          // So when we arrive here, 'questionCounter' is tracking the GLOBAL count up to this point?
          // No, 'questionCounter' in this loop is being continuously updated.

          // Let's use the local loop index 'i' relative to base
          const currentQNum = baseQuestionNumber + i;

          // For inputId: if multiple blanks, usually format is ID_index
          const inputId = blankCount > 1 ? `blank_${i + 1}` : null;

          answerEntries.push(renderAnswerInput(q, currentQNum, inputId, q.correct_answer));
        }
        questionCounter += blankCount;
      } else if (q.type === 'notes_completion' || q.type === 'note_completion') {
        const text = q.gap_fill?.structured_text || '';
        const parts = text.split(/\[(\d+)\]/g);
        parts.forEach((part, idx) => {
          if (idx % 2 === 1) {
            // It's a gap number
            const gapNum = parseInt(part);
            const correctAns = q.gap_fill?.answers?.[gapNum];
            answerEntries.push(renderAnswerInput(q, gapNum, `gap_${gapNum}`, correctAns));
          }
        });
        // Ensure at least one entry if no gaps found? (Fallback)
        const gapCount = (text.match(/\[\d+\]/g) || []).length;
        if (gapCount === 0) {
          answerEntries.push(renderAnswerInput(q, baseQuestionNumber));
        }
        questionCounter += Math.max(gapCount, 1);
      } else if (q.type === 'multiple_choice' && q.allow_multiple && q.question_count > 1) {
        // Handle multi-select MCQs
        for (let i = 0; i < q.question_count; i++) {
          const currentQNum = baseQuestionNumber + i;
          answerEntries.push(renderAnswerInput(q, currentQNum, i, q.correct_answers?.[i]));
        }
        questionCounter += q.question_count;
      } else if (q.type === 'matching_features') {
        // matching_features logic
        if (q.matching_features?.mode === 'paragraph') {
          // Placeholders
          const text = q.matching_features.text || '';
          const gapMatches = Array.from(text.matchAll(/\[(\d+)\]/g));
          gapMatches.forEach((match) => {
            const placeholderNum = parseInt(match[1]);
            const correctAns = q.matching_features?.answers?.[placeholderNum];
            answerEntries.push(renderAnswerInput(q, placeholderNum, placeholderNum, correctAns));
          });
          if (gapMatches.length === 0) {
            answerEntries.push(renderAnswerInput(q, baseQuestionNumber));
          }
          questionCounter += (text.match(/\[\d+\]/g) || []).length;
        } else {
          // List mode
          const mQuestions = q.matching_features?.questions || [];
          mQuestions.forEach((subQ, idx) => {
            const qNum = baseQuestionNumber + idx;
            answerEntries.push(renderAnswerInput(q, qNum, subQ.id, subQ.answer));
          });
          if (mQuestions.length === 0) {
            answerEntries.push(renderAnswerInput(q, baseQuestionNumber));
          }
          questionCounter += mQuestions.length;
        }
      } else if (q.type === 'matching_headings' || q.type === 'matching') {
        // Legacy matching types - handle similarly to list mode matching_features
        // These types may have different structures, try to adapt
        const items = q.matching_data?.paragraphs || q.questions || q.options || [];
        items.forEach((item, idx) => {
          const qNum = baseQuestionNumber + idx;
          // For matching_headings, the answer might be in item.answer, item.correctAnswer, or accessed via index
          const correctAns = item?.answer || item?.correctAnswer || q.correct_answers?.[idx] || '';
          answerEntries.push(renderAnswerInput(q, qNum, item?.id || idx, correctAns));
        });
        questionCounter += items.length;
      } else {
        // Standard single input questions
        answerEntries.push(renderAnswerInput(q, baseQuestionNumber));
        questionCounter += 1;
      }
    });

    // If automatic generation fails or is too complex, we might just map ALL answer keys?
    // But we want to show them in order.
    // For now, returning the generated entries.
    return answerEntries;
  };

  return (
    <AnimatePresence data-oid="d_r9vf6">
      {showAnswerSheet && (
        <>
          {/* Backdrop */}
          {!isInline && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] lg:hidden"
              onClick={() => setShowAnswerSheet(false)}
              data-oid="w1-11be"
            />
          )}

          <motion.div
            initial={isInline ? { width: 0, opacity: 0 } : { x: '100%', opacity: 0 }}
            animate={isInline ? { width: 320, opacity: 1 } : { x: 0, opacity: 1 }}
            exit={isInline ? { width: 0, opacity: 0 } : { x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            id="reading-answer-sheet"
            className={cn(
              'bg-card border-l border-border flex flex-col overflow-hidden',
              isInline
                ? 'relative z-40 h-full flex-shrink-0 shadow-none border-t-0 rounded-none w-80 max-w-[320px]'
                : 'fixed right-0 top-[76px] h-[calc(100vh-76px)] w-full sm:w-80 border-t shadow-2xl z-[100] rounded-tl-2xl'
            )}
            data-oid="fwsy8kw"
          >
            {/* Header */}
            <div
              className="p-3 border-b border-border/40 flex items-center justify-between bg-muted/80 backdrop-blur-md"
              data-oid="hinh_w0"
            >
              <div className="flex items-center gap-2" data-oid="6-jfbps">
                <div
                  className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center"
                  data-oid="mv2hypi"
                >
                  <ClipboardList className="w-4 h-4 text-primary" data-oid="xzyilry" />
                </div>
                <div data-oid="toc1ckr">
                  <h3 className="font-bold text-sm text-foreground" data-oid="fw:s8pl">
                    Answer Sheet
                  </h3>
                  <p className="text-[10px] text-muted-foreground" data-oid="uh6d9q-">
                    Passage {currentPassageIndex + 1}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAnswerSheet(false)}
                className="h-7 w-7 rounded-full hover:bg-muted transition-colors"
                data-oid="2.5g-:k"
              >
                <X className="w-4 h-4 text-muted-foreground" data-oid="c-xxotu" />
              </Button>
            </div>

            {/* Answers List */}
            <div
              className="flex-1 overflow-y-auto p-2 scroll-smooth bg-muted/50 scrollbar-thin scrollbar-thumb-border/50"
              data-oid="95:-bnd"
            >
              <motion.div
                layout
                className="grid grid-cols-1 gap-2"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.04 },
                  },
                }}
                initial="hidden"
                animate="visible"
                data-oid="lx4x_0u"
              >
                {getSheetContent()?.map((entry, idx) => (
                  <motion.div
                    key={idx}
                    variants={{
                      hidden: { opacity: 0, x: 20 },
                      visible: { opacity: 1, x: 0 },
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    data-oid="qkgt70_"
                  >
                    {entry}
                  </motion.div>
                ))}
              </motion.div>

              {/* Empty state or helper if no questions? */}
              {(!allQuestions || allQuestions.length === 0) && (
                <div
                  className="text-center py-8 text-muted-foreground col-span-2"
                  data-oid="n1n7vs-"
                >
                  No questions found.
                </div>
              )}
            </div>

            {/* Footer Status */}
            <div
              className="p-3 border-t border-border/40 bg-card flex justify-between items-center text-xs font-medium text-muted-foreground"
              data-oid="7:eeecd"
            >
              <span data-oid="06enhlj">{Object.keys(answers).length} answered</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ReadingTestSheet;
