import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ClipboardList, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { motion, AnimatePresence } from 'framer-motion';

const ListeningTestSheet = ({
  showAnswerSheet,
  setShowAnswerSheet,
  activePart,
  displaySections,
  questionsWithComputedNumbers,
  answers,
  handleAnswerChange,
  isFinished,
  correctAnswersMap,
  onQuestionClick,
  solvedCount,
  isMobile,
}) => {
  const isInline = isFinished && !isMobile && isMobile !== undefined; // Default to false if isMobile is undefined
  // Extract just the letter from MCQ answers (e.g., "C. IT HELPS FINANCE..." -> "C")
  const extractMcqLetter = (answer) => {
    if (!answer) return '';
    const ansStr = String(answer).trim();
    // Check if it starts with a single letter followed by a period or space
    const match = ansStr.match(/^([A-Za-z])(?:[.\s]|$)/);
    if (match) {
      return match[1].toUpperCase();
    }
    // If the answer is just a single letter, return it
    if (ansStr.length === 1 && /^[A-Za-z]$/.test(ansStr)) {
      return ansStr.toUpperCase();
    }
    // Return original if not an MCQ-style answer
    return ansStr;
  };

  // Import the IELTS answer checking logic for consistency
  // Note: For answer sheet display, we primarily rely on correctAnswersMap from scoreCalculator
  // This is only a fallback and uses the same logic pattern
  const checkAnswer = (userAns, correctAns) => {
    if (!correctAns) return false;
    const u = (userAns || '').toLowerCase().trim();
    // Empty answers are always incorrect
    if (!u) return false;

    // Use same IELTS pattern matching as scoreCalculator
    const correctStr = String(correctAns).trim();

    // Split main alternatives by " / "
    const mainAlts = correctStr.split(/\s+\/\s+/);

    for (const alt of mainAlts) {
      // Expand optional parts and inline alternatives
      const variations = expandVariations(alt.trim());
      if (variations.some((v) => v.toLowerCase() === u)) {
        return true;
      }
      // Also check without currency symbols
      const uNoCurrency = u.replace(/^[£$€¥]\s*/, '').replace(/\s*[£$€¥]$/, '');
      if (
        variations.some(
          (v) =>
            v
              .toLowerCase()
              .replace(/^[£$€¥]\s*/, '')
              .replace(/\s*[£$€¥]$/, '') === uNoCurrency
        )
      ) {
        return true;
      }
    }
    return false;
  };

  // Helper to expand IELTS answer variations (simplified version)
  const expandVariations = (pattern) => {
    if (!pattern) return [];

    // Check for special patterns
    const hasOptional = /\([^)]+\)/.test(pattern);
    const hasInlineAlt = /\b[a-zA-Z0-9]+\/[a-zA-Z0-9]+\b/.test(pattern);

    if (!hasOptional && !hasInlineAlt) return [pattern];

    let variations = [pattern];

    // Expand optionals
    if (hasOptional) {
      const newVars = [];
      variations.forEach((v) => {
        const match = v.match(/\(([^)]+)\)/);
        if (!match) {
          newVars.push(v);
          return;
        }
        const before = v.substring(0, match.index);
        const after = v.substring(match.index + match[0].length);
        const withContent = (before + match[1] + after).replace(/\s+/g, ' ').trim();
        const withoutContent = (before + after).replace(/\s+/g, ' ').trim();
        newVars.push(...expandVariations(withContent));
        newVars.push(...expandVariations(withoutContent));
      });
      variations = newVars;
    }

    // Expand inline alternatives
    if (hasInlineAlt) {
      const newVars = [];
      variations.forEach((v) => {
        const match = v.match(/\b([a-zA-Z0-9]+)\/([a-zA-Z0-9]+)\b/);
        if (!match) {
          newVars.push(v);
          return;
        }
        const before = v.substring(0, match.index);
        const after = v.substring(match.index + match[0].length);
        newVars.push(...expandVariations(before + match[1] + after));
        newVars.push(...expandVariations(before + match[2] + after));
      });
      variations = newVars;
    }

    return [...new Set(variations)];
  };

  // Render a single answer input row
  const renderAnswerInput = (questionNum, answerKey, correctAnswer = null, questionId = null) => {
    let value = answers[answerKey] || '';

    // Determine correctness after submission
    let isCorrect = false;
    let cAnswer = correctAnswer;

    if (isFinished && correctAnswersMap[answerKey]) {
      isCorrect = correctAnswersMap[answerKey].isCorrect === true;
      cAnswer = correctAnswersMap[answerKey].correctAnswer;
      // Override value with the pre-calculated user answer for display (crucial for multi-select)
      if (correctAnswersMap[answerKey].userAnswer) {
        value = correctAnswersMap[answerKey].userAnswer;
      }
    } else if (isFinished) {
      isCorrect = checkAnswer(value, cAnswer);
    }

    return (
      <div
        key={answerKey}
        className={`flex items-center gap-2 p-2 bg-card rounded-lg border transition-all ${
          isFinished
            ? isCorrect
              ? 'answer-correct shadow-sm'
              : value
                ? 'answer-incorrect shadow-sm'
                : 'answer-unanswered'
            : 'border-border hover:border-primary/40 hover:shadow-sm'
        }`}
        data-oid="ew:wml1"
      >
        <div className="flex items-center justify-center flex-none" data-oid="_n5vse0">
          <span
            onClick={() => onQuestionClick && onQuestionClick(questionId || answerKey)}
            className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-all hover:scale-110 active:scale-95 ${
              isFinished
                ? isCorrect
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : value
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'bg-amber-400 text-amber-900 shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:ring-2 hover:ring-primary/20'
            }`}
            data-oid="j24n49b"
          >
            {questionNum}
          </span>
        </div>

        {isFinished ? (
          <div className="flex-1 min-w-0 flex flex-col justify-center" data-oid="4w5e-jj">
            <div
              className={`font-semibold text-sm ${isCorrect ? 'text-emerald-700 dark:text-emerald-300' : value ? 'text-rose-700 dark:text-rose-300' : 'text-amber-700 dark:text-amber-400'}`}
              data-oid="rva2mpp"
            >
              {value || (
                <span
                  className="text-amber-600/80 dark:text-amber-500/80 italic font-medium text-xs"
                  data-oid="-uc7pe0"
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
                data-oid="9zidzcb"
              >
                <span
                  className="text-muted-foreground/70 text-[9px] uppercase tracking-wider font-medium"
                  data-oid="d0pqn6c"
                >
                  Correct:
                </span>
                <span
                  className="font-semibold text-emerald-700 dark:text-emerald-300"
                  data-oid="dbxqi-m"
                >
                  {extractMcqLetter(cAnswer) || '-'}
                </span>
              </div>
            )}
          </div>
        ) : (
          <Input
            value={value}
            onChange={(e) => handleAnswerChange(answerKey, e.target.value)}
            placeholder=""
            className="flex-1 h-9 min-w-0 px-3 text-sm bg-background/60 border-border/70 dark:bg-slate-950/40 dark:border-slate-700/70 focus:ring-1 focus:ring-primary rounded-md font-medium text-center"
            data-oid=".atbmoy"
          />
        )}
      </div>
    );
  };

  // Get questions for current part only
  const getSheetContent = () => {
    if (!displaySections || !questionsWithComputedNumbers) return null;

    const currentSection = displaySections[activePart];
    if (!currentSection) return null;

    // Get the section number (1-based)
    const currentSectionNum = currentSection.section_number || activePart + 1;

    // Filter questions for current part
    const partQuestions = questionsWithComputedNumbers
      .filter((q) => {
        // Check by section_id first
        if (currentSection.id && q.section_id === currentSection.id) return true;

        // Check by section number
        if (q.section !== undefined && q.section !== null) {
          const qSection = parseInt(q.section);
          if (!isNaN(qSection) && qSection === currentSectionNum) return true;
        }

        // Check by part_number
        if (q.part_number !== undefined && q.part_number === currentSectionNum) return true;

        return false;
      })
      .sort((a, b) => (a._displayStartNumber || 0) - (b._displayStartNumber || 0));

    // If no questions found via section filtering, try to use question number ranges
    // This is a fallback for tests with different data structures
    const answerEntries = [];

    partQuestions.forEach((q) => {
      const startNum = q._displayStartNumber || q.question_number || 1;
      const size = q._displaySize || 1;

      // Handle gap_fill, notes_completion, sentence_completion
      if (
        ['gap_fill', 'notes_completion', 'sentence_completion'].includes(q.type) &&
        q.gap_fill?.answers
      ) {
        Object.keys(q.gap_fill.answers).forEach((key) => {
          const num = parseInt(startNum) + parseInt(key);
          const ansKey = `${q.id}_${key}`;
          const correctAns = q.gap_fill.answers[key];
          answerEntries.push({ num, ansKey, correctAns, questionId: q.id });
        });
      }
      // Handle table_completion
      else if (q.type === 'table_completion' && q.table_data) {
        // Support both possible property names
        const tableRows = q.table_data.table_rows || q.table_data.rows || [];
        // Get blanks metadata - answers are stored in blank_positions/blanks
        const blanks = q.table_data.blank_positions || q.table_data.blanks || [];
        // Sort blanks by blankNumber to match display order
        const sortedBlanks = [...blanks].sort(
          (a, b) => (a.blankNumber || 0) - (b.blankNumber || 0)
        );

        let gapIndex = 0;

        tableRows.forEach((row) => {
          // Handle row as array of cells
          if (Array.isArray(row)) {
            row.forEach((cell) => {
              const cellStr = String(cell || '');
              const cellMatches = cellStr.match(/\[gap\]|__BLANK__|__BLANK_\d+__/gi) || [];

              cellMatches.forEach(() => {
                const num = parseInt(startNum) + gapIndex;
                const ansKey = `${q.id}_${gapIndex}`;
                // Get correct answer from blanks metadata
                const blankMeta = sortedBlanks[gapIndex];
                const correctAns = blankMeta?.answer || q.table_data.answers?.[gapIndex] || '';
                answerEntries.push({ num, ansKey, correctAns, questionId: q.id });
                gapIndex++;
              });
            });
          }
        });
      }
      // Handle matching_features
      else if (q.type === 'matching_features' && q.matching_features?.questions) {
        q.matching_features.questions.forEach((subQ, idx) => {
          const num = parseInt(startNum) + idx;
          const ansKey = subQ.id || `${q.id}_${idx}`;
          const correctAns = subQ.answer;
          answerEntries.push({ num, ansKey, correctAns, questionId: q.id });
        });
      }
      // Handle flowchart
      else if (q.type === 'flowchart' && q.flowchart?.steps) {
        let cumulativeGapsInSheet = 0;
        q.flowchart.steps.forEach((step, idx) => {
          const gaps = step.text.match(/\[gap\]/g) || [];
          gaps.forEach((gap, gIdx) => {
            const num = parseInt(startNum) + cumulativeGapsInSheet;
            const ansKey = `${q.id}_${cumulativeGapsInSheet}`;
            const correctAns = step.answers?.[num] || step.answer || '';
            answerEntries.push({ num, ansKey, correctAns, questionId: q.id });
            cumulativeGapsInSheet++;
          });
        });
      }
      // Handle map_labeling
      else if (q.type === 'map_labeling' && q.map_labeling?.questions) {
        q.map_labeling.questions.forEach((subQ, idx) => {
          const num = subQ.questionNumber || startNum + idx;
          const ansKey = `map_${q.id}_${num}`;
          const correctAns = subQ.answer;
          answerEntries.push({ num, ansKey, correctAns, questionId: q.id });
        });
      }
      // Handle multi-select MCQ - each correctly counting as separate questions
      // Show correct answers in uppercase (e.g., A, C)
      else if (q.type === 'multiple_choice' && q.allow_multiple) {
        let correctAnswers = [];
        if (Array.isArray(q.correct_answer)) {
          correctAnswers = q.correct_answer;
        } else if (typeof q.correct_answer === 'string') {
          // Try parsing as JSON array or comma-separated
          try {
            const parsed = JSON.parse(q.correct_answer);
            if (Array.isArray(parsed)) correctAnswers = parsed;
            else correctAnswers = q.correct_answer.split(',');
          } catch (e) {
            correctAnswers = q.correct_answer.split(',');
          }
        }

        const count =
          parseInt(q.question_count) || (correctAnswers.length > 0 ? correctAnswers.length : 1);

        for (let idx = 0; idx < count; idx++) {
          const num = parseInt(startNum) + idx;
          const ansKey = `${q.id}_option_${idx}`;
          const correctAns = correctAnswers[idx] ? correctAnswers[idx].toUpperCase() : '';
          answerEntries.push({ num, ansKey, correctAns, isMultiSelect: true, questionId: q.id });
        }
      }
      // Handle standard questions
      else {
        for (let i = 0; i < size; i++) {
          const num = parseInt(startNum) + i;
          const ansKey = size > 1 ? `${q.id}_${i}` : q.id;
          const correctAns = q.correct_answer;
          answerEntries.push({ num, ansKey, correctAns, questionId: q.id });
        }
      }
    });

    // Sort by question number and render
    return answerEntries
      .sort((a, b) => a.num - b.num)
      .map((entry) =>
        renderAnswerInput(entry.num, entry.ansKey, entry.correctAns, entry.questionId)
      );
  };

  return (
    <AnimatePresence>
      {showAnswerSheet && (
        <>
          {/* Backdrop (Only when NOT inline) */}
          {!isInline && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setShowAnswerSheet(false)}
              data-oid="--i-7.."
            />
          )}

          <motion.div
            id="listening-answer-sheet"
            initial={isInline ? { width: 0, opacity: 0 } : { x: '100%', opacity: 0 }}
            animate={isInline ? { width: 320, opacity: 1 } : { x: 0, opacity: 1 }}
            exit={isInline ? { width: 0, opacity: 0 } : { x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              'bg-card border-l border-border flex flex-col overflow-hidden',
              isInline
                ? 'relative z-40 h-full shrink-0 shadow-none border-t-0 rounded-none w-80 max-w-[320px]'
                : 'fixed right-0 top-[68px] sm:top-[76px] h-[calc(100vh-68px)] sm:h-[calc(100vh-76px)] w-full sm:w-80 border-t shadow-lg z-50 rounded-tl-2xl'
            )}
            data-oid="1_:0.hv"
          >
            {/* Header */}
            <div
              className="p-3 border-b border-border/40 flex items-center justify-between bg-muted/80 backdrop-blur-md"
              data-oid="rs-aplx"
            >
              <div className="flex items-center gap-2" data-oid="n76fj57">
                <div
                  className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center"
                  data-oid=".kxyule"
                >
                  <ClipboardList className="w-4 h-4 text-primary" data-oid=":sr6b-4" />
                </div>
                <div data-oid="1no8.fl">
                  <h3 className="font-bold text-sm text-foreground" data-oid="ijzoepu">
                    Answer Sheet
                  </h3>
                  <p className="text-[10px] text-muted-foreground" data-oid="qar0c2g">
                    Part {activePart + 1}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAnswerSheet(false)}
                className="h-7 w-7 rounded-full hover:bg-muted transition-colors"
                data-oid="2257le0"
              >
                <X className="w-4 h-4 text-muted-foreground" data-oid="5k27mmg" />
              </Button>
            </div>

            {/* Answers List */}
            <div
              className="flex-1 overflow-y-auto p-2 scroll-smooth bg-muted/50"
              data-oid="wze1ois"
            >
              <div className="grid grid-cols-2 sm:grid-cols-1 gap-2" data-oid="65xfydt">
                {getSheetContent()}
              </div>

              {/* Empty state */}
              {(!questionsWithComputedNumbers || questionsWithComputedNumbers.length === 0) && (
                <div
                  className="text-center py-8 text-muted-foreground col-span-2"
                  data-oid="ao.lr-0"
                >
                  No questions found.
                </div>
              )}
            </div>

            {/* Footer Status */}
            <div
              className="p-3 border-t border-border/40 bg-card flex justify-between items-center text-xs font-medium text-muted-foreground"
              data-oid="5qm95pu"
            >
              <span data-oid="pj8yk1y">{solvedCount || 0} answered</span>
              <span data-oid="8.vu5l4">{isFinished ? 'Test completed' : ''}</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ListeningTestSheet;
