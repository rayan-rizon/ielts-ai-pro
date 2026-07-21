import React, { memo, useEffect, useRef, useMemo, useState } from 'react';

import {
  Loader2,
  Lightbulb,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  BarChart2,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { cn, formatInstructionHTML } from '@/lib/utils';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import QuestionNumberCircle from '@/components/test/QuestionNumberCircle';
import QuestionInput from './QuestionInput';
import { calculateTotalQuestions, calculateGlobalQuestionNumber } from '../utils/helpers';
import DeepDivePopover from '../../DeepDivePopover';

// Direct imports for question renderers (no lazy loading to avoid blank states)
import TableCompletionRenderer from './QuestionRenderers/TableCompletionRenderer';
import NotesCompletionRenderer from './QuestionRenderers/NotesCompletionRenderer';
import FlowchartRenderer from './QuestionRenderers/FlowchartRenderer';
import MultipleChoiceRenderer from './QuestionRenderers/MultipleChoiceRenderer';
import MatchingRenderer from './QuestionRenderers/MatchingRenderer';
import TrueFalseRenderer from './QuestionRenderers/TrueFalseRenderer';

const renderInstructionText = (text) => {
  if (!text) return null;

  return (
    <div
      className="text-base font-medium text-slate-700 dark:text-slate-300 leading-snug"
      dangerouslySetInnerHTML={{
        __html: formatInstructionHTML(text),
      }}
      data-oid="ei8tuot"
    />
  );
};

const ReadingTestQuestionsSidebar = memo(function ReadingTestQuestionsSidebar({
  currentPassageQuestions,
  currentPassageIndex,
  setCurrentPassageIndex,
  testData,
  allQuestions,
  answers,
  handleAnswerChange,
  flaggedQuestions,
  toggleFlag,
  isFinished,
  validationMap,
  highlightedQuestionId,
  isSaving,
  lastSaved,
  handleSubmit,
  isSubmitting,
  showResults,
  setShowResults,
  session,
  setHighlightedAnswerQs, // New Prop
}) {
  const scrollContainerRef = useRef(null);
  const [openDeepDive, setOpenDeepDive] = useState(null);

  // Scroll to top when passage changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [currentPassageIndex]);

  // Handle passage highlighting dynamically based on openDeepDive
  useEffect(() => {
    // Only clear the highlights if there is no deep dive open.
    // Setting highlights is handled cleanly by the DeepDivePopover mounting its specific content.
    if (!openDeepDive && setHighlightedAnswerQs) {
      setHighlightedAnswerQs(null);
    }
  }, [openDeepDive, setHighlightedAnswerQs]);

  const questionRange = useMemo(() => {
    const qList = Object.values(currentPassageQuestions).flat();
    if (qList.length === 0) return '';
    const startNum = calculateGlobalQuestionNumber(allQuestions, qList[0].id);
    const total = calculateTotalQuestions(currentPassageQuestions);
    const endNum = startNum + total - 1;
    return startNum === endNum ? `Question ${startNum}` : `Questions ${startNum}-${endNum}`;
  }, [currentPassageQuestions, allQuestions]);

  return (
    <>
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-auto p-2 scroll-smooth scrollbar-thin scrollbar-thumb-slate-200/50 dark:scrollbar-thumb-slate-800/50 hover:scrollbar-thumb-slate-300 dark:hover:scrollbar-thumb-slate-700 transition-colors"
        style={{ willChange: 'scroll-position', contain: 'layout style' }}
        data-oid="-j6tz9w"
      >
        <div className="space-y-1.5" key={currentPassageIndex} data-oid="p:gq8r_">
          {Object.entries(currentPassageQuestions).map(([instruction, qList]) => {
            // Prevent duplicate tables: If we have a table_completion question,
            // strip any HTML table tags from the instruction text (legacy data issue).
            const hasTableQuestion = qList.some((q) => q.type === 'table_completion');
            let displayInstruction = instruction;

            if (hasTableQuestion) {
              displayInstruction = displayInstruction.replace(/<table[\s\S]*?<\/table>/gi, '');
            }

            return (
              <div key={instruction} data-oid="8jksp:y">
                <Card
                  className="mb-1 border border-slate-200/60 dark:border-slate-700/60 shadow-none bg-white/70 dark:bg-slate-900/50 hover:bg-white/80 dark:hover:bg-slate-900/65 transition-all duration-300 hover:shadow-sm"
                  data-oid="vb:lorr"
                >
                  <CardContent className="p-1.5 sm:p-2" data-oid="c_oc:w-">
                    {displayInstruction.trim() && (
                      <div
                        className="mb-2 p-2 rounded-lg bg-blue-50/60 dark:bg-blue-900/20 border border-blue-100/80 dark:border-blue-800 text-sm font-medium text-slate-700 dark:text-slate-300 flex items-start gap-2"
                        data-oid="6dw9uti"
                      >
                        <div className="mt-0.5 flex-shrink-0" data-oid="ip7:at9">
                          <Lightbulb className="w-4 h-4 text-blue-500" data-oid="3h83xkd" />
                        </div>
                        <div className="text-sm leading-snug" data-oid="fuf-zbg">
                          {renderInstructionText(displayInstruction)}
                        </div>
                      </div>
                    )}
                    <div className="space-y-1" data-oid="qpvl_ys">
                      {qList.map((question) => {
                        const questionKey = question.id;
                        const isFlagged = flaggedQuestions.has(questionKey);

                        // Calculate global question number across all groups
                        const globalQuestionNumber = calculateGlobalQuestionNumber(
                          allQuestions,
                          question.id
                        );

                        // Helper for calculating global number for blanks
                        const calculateGlobalNum = (questionId, blankIndex) =>
                          calculateGlobalQuestionNumber(allQuestions, questionId, blankIndex);

                        // Determine what to render based on type
                        let questionContent;
                        if (question.type === 'table_completion') {
                          questionContent = (
                            <ErrorBoundary
                              fallbackMessage="Could not load table question"
                              data-oid="izyb0tk"
                            >
                              <TableCompletionRenderer
                                question={question}
                                globalQuestionNumber={globalQuestionNumber}
                                answers={answers}
                                onAnswerChange={handleAnswerChange}
                                flaggedQuestions={flaggedQuestions}
                                onToggleFlag={toggleFlag}
                                calculateGlobalNum={calculateGlobalNum}
                                disabled={isFinished}
                                validationMap={validationMap}
                                explanationData={question.explanation_data}
                                openDeepDive={openDeepDive}
                                setOpenDeepDive={setOpenDeepDive}
                                data-oid="k7f9.al"
                              />
                            </ErrorBoundary>
                          );
                        } else if (
                          (question.type === 'flowchart' ||
                            question.type === 'flow_chart_completion') &&
                          question.flowchart?.steps
                        ) {
                          questionContent = (
                            <ErrorBoundary fallbackMessage="Could not load flow-chart question">
                              <FlowchartRenderer
                                question={question}
                                answers={answers}
                                onAnswerChange={handleAnswerChange}
                                flaggedQuestions={flaggedQuestions}
                                onToggleFlag={toggleFlag}
                                disabled={isFinished}
                                validationMap={validationMap}
                                explanationData={question.explanation_data}
                                openDeepDive={openDeepDive}
                                setOpenDeepDive={setOpenDeepDive}
                              />
                            </ErrorBoundary>
                          );
                        } else if (
                          question.type === 'notes_completion' &&
                          question.gap_fill?.structured_text
                        ) {
                          // Structured notes completion with title, bullets, and inline gaps
                          questionContent = (
                            <ErrorBoundary
                              fallbackMessage="Could not load notes question"
                              data-oid="021c8.m"
                            >
                              <NotesCompletionRenderer
                                question={question}
                                answers={answers}
                                onAnswerChange={handleAnswerChange}
                                flaggedQuestions={flaggedQuestions}
                                onToggleFlag={toggleFlag}
                                disabled={isFinished}
                                validationMap={validationMap}
                                explanationData={question.explanation_data}
                                openDeepDive={openDeepDive}
                                setOpenDeepDive={setOpenDeepDive}
                                data-oid="s0p2lto"
                              />
                            </ErrorBoundary>
                          );
                        } else if (
                          question.type === 'sentence_completion' ||
                          question.type === 'summary_completion' ||
                          question.type === 'notes_completion' ||
                          question.type === 'note_completion' ||
                          question.type === 'flow_chart_completion' ||
                          question.type === 'diagram_completion' ||
                          question.type === 'short_answer'
                        ) {
                          let text = question.question_text || '';
                          // For short_answer, if no gap markers exist, append a placeholder
                          // Gap markers can be underscores (___) or [N] format
                          const hasGapMarker = /_{3,}|\[\d+\]/.test(text);
                          if (question.type === 'short_answer' && !hasGapMarker) {
                            text += ` [${question.question_number || globalQuestionNumber}]`;
                          }
                          questionContent = (
                            <QuestionInput
                              text={text}
                              questionId={question.id}
                              globalNum={question.question_number || globalQuestionNumber}
                              answers={answers}
                              onAnswerChange={handleAnswerChange}
                              flaggedQuestions={flaggedQuestions}
                              onToggleFlag={toggleFlag}
                              disabled={isFinished}
                              validationMap={validationMap}
                              explanationData={question.explanation_data}
                              openDeepDive={openDeepDive}
                              setOpenDeepDive={setOpenDeepDive}
                              data-oid="503k8pk"
                            />
                          );
                        } else if (
                          question.type === 'matching_headings' ||
                          question.type === 'matching_features' ||
                          question.type === 'matching'
                        ) {
                          questionContent =
                            question.question_text &&
                            question.question_text !== 'Match the correct items' &&
                            !(
                              question.type === 'matching_features' &&
                              question.matching_features?.mode === 'paragraph'
                            ) ? (
                              <h4
                                className="text-base font-medium text-foreground mb-3"
                                data-oid="9ra7tn7"
                              >
                                {question.question_text}
                              </h4>
                            ) : null;
                        } else {
                          // Default render - for T/F/NG and other simple question types
                          // Strip answer options from question text if present
                          let cleanText = question.question_text || '';
                          if (question.type === 'true_false_not_given') {
                            cleanText = cleanText
                              .replace(/\s*TRUE\s*FALSE\s*NOT\s*GIVEN\s*$/i, '')
                              .trim();
                          } else if (question.type === 'yes_no_not_given') {
                            cleanText = cleanText
                              .replace(/\s*YES\s*NO\s*NOT\s*GIVEN\s*$/i, '')
                              .trim();
                          }

                          const isMultiSelectMCQ =
                            question.type === 'multiple_choice' &&
                            (question.allow_multiple || (question.question_count || 1) > 1);

                          const qStart = question.question_number || globalQuestionNumber;
                          const qRange = isMultiSelectMCQ
                            ? `${qStart}-${qStart + (question.question_count || 1) - 1}`
                            : qStart;

                          const validation = validationMap?.[question.id];
                          const value = answers?.[question.id];
                          let circleStatus = 'default';
                          if (isFinished && validation) {
                            const hasAnswer = Array.isArray(value) ? value.length > 0 : !!value;
                            circleStatus =
                              validation?.isCorrect === true
                                ? 'correct'
                                : hasAnswer
                                  ? 'incorrect'
                                  : 'unanswered';
                          }

                          questionContent = (
                            <div className="flex gap-3 items-baseline" data-oid="1dtvi85">
                              <QuestionNumberCircle
                                number={qRange}
                                isFlagged={isFlagged}
                                onClick={() => toggleFlag(questionKey)}
                                status={circleStatus}
                                className={cn(
                                  'translate-y-[1px]',
                                  isMultiSelectMCQ && 'w-12 h-6 px-1.5 rounded-lg'
                                )}
                                data-oid="su-j6uf"
                              />

                              <div className="flex-1 flex items-start gap-1">
                                <p
                                  className="text-base text-foreground leading-relaxed font-medium"
                                  data-oid="vo:pzhf"
                                >
                                  {cleanText}
                                </p>
                                {isFinished &&
                                  question.explanation_data &&
                                  (!question.explanation_data.blanks ||
                                    [
                                      'multiple_choice',
                                      'true_false_not_given',
                                      'yes_no_not_given',
                                    ].includes(question.type)) && (
                                    <DeepDivePopover
                                      explanationData={question.explanation_data}
                                      userAnswer={answers[question.id]}
                                      isOpen={openDeepDive === question.id}
                                      onToggle={() =>
                                        setOpenDeepDive(
                                          openDeepDive === question.id ? null : question.id
                                        )
                                      }
                                      questionType={question.type}
                                      blankKey={null}
                                      questionNumber={
                                        question.question_number || globalQuestionNumber
                                      }
                                      inline={true}
                                    />
                                  )}
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={question.id}
                            id={`question-${question.id}`}
                            className="relative"
                            data-oid="duo5yge"
                          >
                            <Card
                              className={`bg-white/70 dark:bg-slate-900/55 border border-slate-200/60 dark:border-slate-700/60 hover:border-blue-400/30 dark:hover:border-blue-400/30 hover:bg-white/80 dark:hover:bg-slate-900/70 transition-all duration-300 group rounded-lg relative overflow-hidden shadow-sm hover:shadow-md
                              ${isFlagged ? 'ring-1 ring-orange-500/30 border-orange-200 dark:border-orange-900/50' : ''}
                              ${highlightedQuestionId === question.id ? 'ring-2 ring-blue-500/50 shadow-md shadow-blue-500/10 scale-[1.005] z-10' : ''}
                            `}
                              data-oid="8jbu_s2"
                            >
                              {/* Flag button removed - integrated into question number */}

                              <CardContent
                                className="pt-1.5 pr-2 pb-1.5 pl-1.5 relative rounded-lg"
                                data-oid="xoabsgq"
                              >
                                {/* Check for answers for complex types as well */}
                                {!isFinished &&
                                  (answers[question.id] ||
                                    (question.type === 'multiple_choice' &&
                                      question.allow_multiple &&
                                      answers[question.id]?.length > 0) ||
                                    (question.type === 'matching_headings' &&
                                      Object.keys(answers).some((key) =>
                                        key.startsWith(`${question.id}_`)
                                      )) ||
                                    (question.type === 'table_completion' &&
                                      Object.keys(answers).some((key) =>
                                        key.startsWith(`${question.id}_blank_`)
                                      )) ||
                                    (question.type === 'matching' &&
                                      Object.keys(answers).some((key) =>
                                        key.startsWith(`${question.id}_`)
                                      )) ||
                                    ((question.type === 'summary_completion' ||
                                      question.type === 'note_completion' ||
                                      question.type === 'notes_completion' ||
                                      question.type === 'flowchart' ||
                                      question.type === 'flow_chart_completion' ||
                                      question.type === 'diagram_completion') &&
                                      Object.keys(answers).some(
                                        (key) =>
                                          key.startsWith(`${question.id}_blank_`) ||
                                          key.startsWith(`${question.id}_gap_`)
                                      ))) && (
                                    <div className="absolute top-2.5 right-1.5" data-oid="hnmve5q">
                                      <CheckCircle
                                        className="w-3.5 h-3.5 text-green-500"
                                        data-oid="t_tdond"
                                      />
                                    </div>
                                  )}

                                <div className="space-y-2" data-oid="i8otiyt">
                                  {questionContent}

                                  {/* Multiple Choice Questions */}
                                  <MultipleChoiceRenderer
                                    question={question}
                                    answers={answers}
                                    onAnswerChange={handleAnswerChange}
                                    isFinished={isFinished}
                                    validationMap={validationMap}
                                    data-oid="67.qra4"
                                  />

                                  {/* Matching Questions (Generic, Headings, Features) */}
                                  <MatchingRenderer
                                    question={question}
                                    answers={answers}
                                    onAnswerChange={handleAnswerChange}
                                    flaggedQuestions={flaggedQuestions}
                                    onToggleFlag={toggleFlag}
                                    isFinished={isFinished}
                                    validationMap={validationMap}
                                    allQuestions={allQuestions}
                                    explanationData={question.explanation_data}
                                    openDeepDive={openDeepDive}
                                    setOpenDeepDive={setOpenDeepDive}
                                    data-oid="k1v4.w1"
                                  />

                                  {/* Table Completion Questions - Enhanced with proper styling and numbering */}

                                  {/* Table Completion Questions - Enhanced with proper styling and numbering */}

                                  {(question.type === 'true_false_not_given' ||
                                    question.type === 'yes_no_not_given') && (
                                    <TrueFalseRenderer
                                      question={question}
                                      answers={answers}
                                      onAnswerChange={handleAnswerChange}
                                      isFinished={isFinished}
                                      validationMap={validationMap}
                                      data-oid="-e5.m_k"
                                    />
                                  )}

                                  {/* Deep Dive — Inline Explanation (shown after test completion) - MOVED INLINE for these types */}
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}

          {Object.keys(currentPassageQuestions).length === 0 && (
            <div className="text-center py-6 text-muted-foreground" data-oid="mill8m7">
              <AlertCircle className="w-6 h-6 mx-auto mb-2 opacity-50" data-oid="37cem.v" />
              <p className="text-sm" data-oid="hyyinq7">
                No questions available for this passage
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Premium Navigation bar */}
      <div
        className="p-3 border-t border-border bg-background/80 backdrop-blur-xl flex-shrink-0 relative z-30"
        data-oid="r0rcfur"
      >
        <div className="flex items-center justify-between gap-2" data-oid="3is3g04">
          {/* Previous Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPassageIndex(Math.max(0, currentPassageIndex - 1))}
            disabled={currentPassageIndex === 0}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300 group disabled:opacity-30 rounded-lg px-7 py-2"
            data-oid="ay15_bx"
          >
            <ChevronLeft
              className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform"
              data-oid=":s.la86"
            />

            <span className="font-semibold hidden sm:inline text-sm" data-oid="ys.2e3d">
              Previous
            </span>
          </Button>

          {/* Center Progress Indicator */}
          <div className="flex flex-col items-center gap-1.5 px-2 sm:px-4" data-oid=":5twpd-">
            <div className="flex items-center gap-2" data-oid="jxd:chz">
              <div className="hidden sm:flex items-center gap-1" data-oid="t-wb_a5">
                {[...Array(testData.sections.length)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 transition-all duration-500 rounded-full ${
                      i === currentPassageIndex
                        ? 'w-6 bg-blue-500'
                        : i < currentPassageIndex
                          ? 'w-1.5 bg-blue-200 dark:bg-blue-800'
                          : 'w-1.5 bg-slate-200 dark:bg-slate-800'
                    }`}
                    data-oid="jh9w00e"
                  />
                ))}
              </div>
              <div className="flex gap-2" data-oid="bthfqv0">
                <div
                  className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-800/50"
                  data-oid="2bzt1bp"
                >
                  <span
                    className="text-[9px] uppercase tracking-wider font-bold text-blue-600 dark:text-blue-400 hidden xs:inline"
                    data-oid="crlbg7x"
                  >
                    Passage
                  </span>
                  <span
                    className="text-xs font-black text-blue-700 dark:text-blue-300"
                    data-oid="g4.yhpu"
                  >
                    {currentPassageIndex + 1}{' '}
                    <span
                      className="text-blue-400 dark:text-blue-600 font-medium"
                      data-oid="hm2uha_"
                    >
                      /
                    </span>{' '}
                    {testData.sections.length}
                  </span>
                </div>
                <div
                  className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 whitespace-nowrap"
                  data-oid="ikburca"
                >
                  <span
                    className="text-xs font-bold text-slate-700 dark:text-slate-300"
                    data-oid="n5uzmjn"
                  >
                    {calculateTotalQuestions(currentPassageQuestions)} Qs
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Next / Submit Button */}
          {currentPassageIndex === testData.sections.length - 1 ? (
            <Button
              onClick={
                isFinished || (session && session.is_completed)
                  ? () => setShowResults(true)
                  : handleSubmit
              }
              disabled={
                isSubmitting ||
                (Object.keys(answers).length === 0 && !isFinished && !session?.is_completed)
              }
              className={cn(
                'font-bold px-4 h-11 rounded-xl shadow-lg transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 border-none',
                isFinished || (session && session.is_completed)
                  ? 'bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 text-white shadow-blue-500/30 hover:shadow-blue-500/50'
                  : 'bg-slate-900 dark:bg-indigo-600 text-white hover:bg-slate-800 dark:hover:bg-indigo-500 shadow-slate-900/25 dark:shadow-indigo-500/20'
              )}
              data-oid="lz1j9du"
            >
              {isFinished || (session && session.is_completed) ? (
                <>
                  <CheckCircle className="w-4 h-4" data-oid="axok:hl" />
                  <span className="uppercase tracking-wide hidden sm:inline" data-oid="ih5lhnz">
                    View Results
                  </span>
                  <span className="uppercase tracking-wide sm:hidden" data-oid="5y.xl1y">
                    Results
                  </span>
                </>
              ) : (
                <>
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" data-oid="w1m1jua" />
                  ) : (
                    <CheckCircle className="w-4 h-4" data-oid="jrfmd_-" />
                  )}
                  <span className="font-bold hidden sm:inline" data-oid="q1w_fp_">
                    {isSubmitting ? 'Submitting...' : 'Finish'}
                  </span>
                  <span className="font-bold sm:hidden" data-oid="x_:vq-g">
                    {isSubmitting ? '...' : 'Finish'}
                  </span>
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={() =>
                setCurrentPassageIndex(
                  Math.min(testData.sections.length - 1, currentPassageIndex + 1)
                )
              }
              className="bg-slate-900 dark:bg-indigo-600 text-white hover:bg-slate-800 dark:hover:bg-indigo-500 shadow-slate-900/25 dark:shadow-indigo-500/20 font-bold rounded-xl px-10 h-11 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
              data-oid="z674zld"
            >
              <div className="flex items-center gap-2" data-oid="m6u07y5">
                <span className="font-bold" data-oid="gx3v-uf">
                  Next
                </span>
                <ChevronRight className="w-5 h-5 flex-shrink-0" data-oid="esyua1r" />
              </div>
            </Button>
          )}
        </div>
      </div>
    </>
  );
});

export default ReadingTestQuestionsSidebar;
