import React, { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Inbox, Loader2, Lightbulb, ChevronLeft, CheckCircle } from 'lucide-react';
import PremiumLoading from '@/components/ui/PremiumLoading';

import { cn, formatInstructionHTML } from '@/lib/utils';
import ErrorBoundary from '@/components/shared/ErrorBoundary';

import { Button } from '@/components/ui/button';
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
import ConfettiCelebration from '@/components/ConfettiCelebration';
import XPNotification from '@/components/XPNotification';
import TestResultsModal from '@/components/results/TestResultsModal';
import ListeningTestSheet from '../components/ListeningTestSheet';
import {
  ListeningTestProvider,
  useListeningTestState,
  useListeningTestDispatch,
} from '../components/ListeningTest/context/ListeningTestContext';
import { useTestNavigation } from '@/hooks/useTestNavigation';
import { useGamification } from '@/hooks/useGamification';
import ResizeHandle from '@/components/ui/resize-handle';
import TranscriptPanel from '../components/ListeningTest/components/TranscriptPanel';
import { useListeningTestLogic } from '../components/ListeningTest/hooks/useListeningTestLogic';
import { useListeningTestStore } from '../store/useListeningTestStore';

import ListeningTestHeader from '../components/ListeningTestHeader';
import AudioPlayer from '../components/ListeningTest/components/AudioPlayer';

// Question Renderers
import GapFillRenderer from '../components/ListeningTest/components/QuestionRenderers/GapFillRenderer';
import TableCompletionRenderer from '../components/ListeningTest/components/QuestionRenderers/TableCompletionRenderer';
import MultipleChoiceRenderer from '../components/ListeningTest/components/QuestionRenderers/MultipleChoiceRenderer';
import MatchingFeaturesRenderer from '../components/ListeningTest/components/QuestionRenderers/MatchingFeaturesRenderer';
import MapLabelingRenderer from '../components/ListeningTest/components/QuestionRenderers/MapLabelingRenderer';
import FlowchartRenderer from '../components/ListeningTest/components/QuestionRenderers/FlowchartRenderer';

function ListeningTestInner() {
  // Core Logic Hook
  const {
    audioPlayerRef,
    currentUser,
    toggleFlag,
    handleAnswerChange,
    handleMultiSelectChange,
    handleSubmit,
  } = useListeningTestLogic();

  const {
    answers,
    testData,
    questionsWithNumbers,
    session,
    isLoading,
    activePart,
    isSubmitting,
    isFinished,
    showResults,
    testResults,
    flaggedQuestions,
    correctAnswersMap,
    isSaving,
    lastSaved,
    // timeRemaining, // Removed to prevent re-renders
  } = useListeningTestState();

  const { dispatch, ACTIONS } = useListeningTestDispatch();

  // Computed Sections
  const displaySections = React.useMemo(() => {
    return Array.isArray(testData?.content)
      ? testData.content
      : testData?.audio_url
        ? [testData]
        : [];
  }, [testData]);

  const currentSection = React.useMemo(() => {
    return displaySections[activePart] || {};
  }, [displaySections, activePart]);
  // Section Questions Logic
  const sectionQuestions = React.useMemo(() => {
    if (!questionsWithNumbers) return [];
    // Filter questions for current section
    // Logic from previous file:
    return questionsWithNumbers.filter((q) => {
      const sectionNum = currentSection.section_number || activePart + 1;
      if (q.section !== undefined) return parseInt(q.section) === sectionNum;
      if (q.part_number !== undefined) return q.part_number === sectionNum;
      return activePart === 0;
    });
  }, [questionsWithNumbers, currentSection, activePart]);

  // Local UI State
  const [leftPanelWidth, setLeftPanelWidth] = useState(window.innerWidth < 768 ? 0 : 40);
  const [isResizing, setIsResizing] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Sync isMobile on resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile && leftPanelWidth !== 0 && leftPanelWidth !== 100) {
        setLeftPanelWidth(0); // Default to Questions on mobile
      } else if (!mobile && (leftPanelWidth === 0 || leftPanelWidth === 100)) {
        setLeftPanelWidth(40); // Restore split view on desktop
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [leftPanelWidth]);
  const containerRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [showAnswerSheet, setShowAnswerSheet] = useState(false);
  const [showTimeUpDialog, setShowTimeUpDialog] = useState(false);

  // Auto-scroll questions to top when switching parts
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activePart]);

  // Gamification
  const { showConfetti, showXPNotification, earnedXP, setShowXPNotification, setShowConfetti } =
    useGamification();

  // Navigation Blocker
  const { showExitDialog, setShowExitDialog, handleExit } = useTestNavigation({
    session,
    isFinished,
    answers,
    exitPath: '/listening',
  });

  // Resizing Logic
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      const constrainedWidth = Math.min(70, Math.max(20, newWidth));
      setLeftPanelWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Click outside answer sheet
  useEffect(() => {
    // Only apply click-outside behavior if NOT in inline review mode
    // In inline mode (finished + desktop), the sheet is part of the layout
    const isInline = isFinished && !isMobile;
    if (!showAnswerSheet || isInline) return;

    const handleClickOutside = (event) => {
      if (
        event.target.closest('#listening-answer-sheet') === null &&
        event.target.closest('#answer-sheet-toggle') === null
      ) {
        setShowAnswerSheet(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAnswerSheet, isFinished, isMobile]);

  const handleNavigateToQuestion = useCallback(
    (questionNumber) => {
      dispatch({ type: ACTIONS.SHOW_RESULTS_MODAL, payload: false });

      // Find the question matching this global number
      const targetQuestion = (questionsWithNumbers || []).find((q) => {
        return (
          questionNumber >= (q._displayStartNumber || 0) &&
          questionNumber <= (q._displayEndNumber || q._displayStartNumber || 0)
        );
      });

      if (targetQuestion) {
        // Find which part (section) it belongs to
        const partIndex = displaySections.findIndex((sec, idx) => {
          const sectionNum = sec.section_number || idx + 1;
          if (targetQuestion.section !== undefined)
            return parseInt(targetQuestion.section) === sectionNum;
          if (targetQuestion.part_number !== undefined)
            return targetQuestion.part_number === sectionNum;
          return idx === 0;
        });

        if (partIndex !== -1 && partIndex !== activePart) {
          dispatch({ type: ACTIONS.SET_ACTIVE_PART, payload: partIndex });
        }

        setTimeout(() => {
          const el = document.getElementById(`question-${targetQuestion.id}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);
      }
    },
    [dispatch, ACTIONS, questionsWithNumbers, displaySections, activePart]
  );

  // Render Question Function
  const renderQuestion = (question, isInsideMergedCard = false) => {
    // Common props
    const props = {
      question,
      answers,
      handleAnswerChange, // table/gapfill/matching use this
      onAnswerChange: handleAnswerChange, // MCQ uses this
      onMultiSelectChange: handleMultiSelectChange, // MCQ uses this
      toggleFlag,
      flaggedQuestions,
      isFinished,
      correctAnswersMap, // Added for review mode colors
      isInsideMergedCard,
      cardClass: isInsideMergedCard
        ? 'mb-2 bg-slate-50/30 dark:bg-slate-800/20 rounded-xl p-3 border border-slate-100 dark:border-slate-800/50'
        : 'mb-3 border border-slate-200/80 dark:border-slate-700/60 shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden',
    };

    return (
      <div id={`question-${question.id}`} key={question.id} data-oid="listening-q-wrap">
        <Suspense
          fallback={
            <div className="p-4 flex justify-center" data-oid="w2itdlr">
              <Loader2 className="animate-spin h-5 w-5 text-blue-500" data-oid="62j.nqg" />
            </div>
          }
          data-oid="0p03x66"
        >
          {question.type === 'gap_fill' &&
            (question.gap_fill?.text || question.gap_fill?.content) && (
              <GapFillRenderer {...props} data-oid="vg-b476" />
            )}
          {question.type === 'table_completion' && question.table_data && (
            <TableCompletionRenderer {...props} data-oid="72j2ku2" />
          )}
          {question.type === 'multiple_choice' && question.options && (
            <MultipleChoiceRenderer {...props} data-oid="xh04nel" />
          )}
          {question.type === 'matching_features' && (
            <MatchingFeaturesRenderer {...props} data-oid="-wjd1v0" />
          )}
          {(question.type === 'map_labeling' ||
            question.type === 'diagram_label_completion' ||
            question.type === 'diagram_completion') &&
            (question.map_labeling || question.diagram_data || question.diagram_completion) && (
              <MapLabelingRenderer {...props} data-oid=".tk--5n" />
            )}
          {question.type === 'flowchart' && (
            <FlowchartRenderer {...props} data-oid="flowchart-main" />
          )}
        </Suspense>
      </div>
    );
  };

  // Stats for progress bar - Count actual IELTS question numbers, not question cards
  const stats = React.useMemo(() => {
    const answerKeys = Object.keys(answers);

    const results = displaySections.map((sec, idx) => {
      const secNum = sec.section_number || idx + 1;
      const qInSec = (questionsWithNumbers || []).filter((q) => {
        if (q.section !== undefined) return parseInt(q.section) === secNum || q.section == secNum;
        if (q.part_number !== undefined) return q.part_number === secNum || q.part_number == secNum;
        return idx === 0;
      });

      // Count TOTAL individual questions (blanks) in this section
      const totalBlanksInSection = qInSec.reduce((acc, q) => acc + (q._displaySize || 1), 0);

      // Count ANSWERED blanks for this section
      let answeredBlanksInSection = 0;

      qInSec.forEach((q) => {
        const size = q._displaySize || 1;
        const qType = q.type;

        if (qType === 'multiple_choice') {
          // MCQ: Check if question.id has an answer
          const ans = answers[q.id];
          if (q.allow_multiple) {
            // Multi-select: count how many options are selected (up to size)
            if (Array.isArray(ans) && ans.length > 0) {
              answeredBlanksInSection += Math.min(ans.length, size);
            }
          } else {
            // Single select: 1 answer
            if (ans !== undefined && ans !== '') {
              answeredBlanksInSection += 1;
            }
          }
        } else if (qType === 'table_completion') {
          // Table: now uses pattern `${q.id}_${i}` like gap_fill
          for (let i = 0; i < size; i++) {
            const blankKey = `${q.id}_${i}`;
            if (answers[blankKey] !== undefined && answers[blankKey] !== '') {
              answeredBlanksInSection += 1;
            }
          }
        } else if (qType === 'gap_fill') {
          // Gap Fill: answers use pattern `${q.id}_${i}`
          for (let i = 0; i < size; i++) {
            const blankKey = `${q.id}_${i}`;
            if (answers[blankKey] !== undefined && answers[blankKey] !== '') {
              answeredBlanksInSection += 1;
            }
          }
        } else if (qType === 'matching_features' || qType === 'map_labeling') {
          // Matching/Map: can use `${q.id}_${i}` or direct `q.id` for simple ones
          if (size === 1) {
            if (answers[q.id] !== undefined && answers[q.id] !== '') {
              answeredBlanksInSection += 1;
            }
          } else {
            for (let i = 0; i < size; i++) {
              const blankKey = `${q.id}_${i}`;
              if (answers[blankKey] !== undefined && answers[blankKey] !== '') {
                answeredBlanksInSection += 1;
              }
            }
          }
        } else {
          // Fallback for unknown types
          if (size === 1) {
            if (answers[q.id] !== undefined && answers[q.id] !== '') {
              answeredBlanksInSection += 1;
            }
          } else {
            // Check both patterns
            let found = 0;
            for (let i = 0; i < size; i++) {
              if (answers[`${q.id}_${i}`] !== undefined && answers[`${q.id}_${i}`] !== '') {
                found += 1;
              }
            }
            // Also check table pattern
            const tableKeys = answerKeys.filter((k) => k.startsWith(`${q.id}_r`));
            found += tableKeys.filter((k) => answers[k] !== undefined && answers[k] !== '').length;
            answeredBlanksInSection += Math.min(found, size);
          }
        }
      });

      return { idx, sQCount: totalBlanksInSection, sAnswered: answeredBlanksInSection };
    });

    const totalQ = results.reduce((acc, r) => acc + r.sQCount, 0);
    const totalAns = results.reduce((acc, r) => acc + r.sAnswered, 0);

    return { results, totalQ, totalAns };
  }, [displaySections, questionsWithNumbers, answers]);

  if (isLoading) {
    return <PremiumLoading message="Initializing listening test..." />;
  }
  // Accessibility: Keyboard resize support
  const handleResizeKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setLeftPanelWidth((w) => Math.max(20, w - 5));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setLeftPanelWidth((w) => Math.min(70, w + 5));
    }
  };

  return (
    <div
      className="h-full w-full flex flex-col bg-background overflow-hidden font-sans antialiased text-foreground relative"
      data-oid="ocjmio6"
    >
      <ListeningTestHeader
        testData={testData}
        activePart={activePart}
        displaySections={displaySections}
        answers={answers}
        // timeRemaining={timeRemaining} // Removed
        showExitDialog={showExitDialog}
        setShowExitDialog={setShowExitDialog}
        onExit={handleExit}
        onContinue={() => setShowExitDialog(false)}
        formatTime={(seconds) => {
          const m = Math.floor(seconds / 60);
          const s = seconds % 60;
          return `${m}:${s.toString().padStart(2, '0')}`;
        }}
        totalQuestions={0}
        stats={stats}
        isFinished={isFinished}
        isSaving={isSaving}
        lastSaved={lastSaved}
        showAnswerSheet={showAnswerSheet}
        setShowAnswerSheet={setShowAnswerSheet}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        onViewResults={() => dispatch({ type: ACTIONS.SHOW_RESULTS_MODAL, payload: true })}
        onNextPart={() => dispatch({ type: ACTIONS.SET_ACTIVE_PART, payload: activePart + 1 })}
        data-oid="3bx8kdc"
      />

      {/* Split Pane & Answer Sheet Container */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative" data-oid="m0_71d5">
        <div
          className="flex-1 flex flex-col md:flex-row overflow-hidden w-full relative z-10"
          ref={containerRef}
          data-oid="9o3tmui"
        >
          {/* Left Panel: Transcript */}
          <div
            className={cn(
              'shrink-0 bg-white dark:bg-card border-r dark:border-border flex flex-col h-full overflow-hidden transition-[width,transform] duration-300 ease-in-out absolute md:relative z-30 md:z-auto',
              isMobile && leftPanelWidth === 0 && '-translate-x-full',
              isMobile && leftPanelWidth === 100 && 'w-full translate-x-0'
            )}
            style={{
              width: isMobile ? (leftPanelWidth === 100 ? '100%' : '0%') : `${leftPanelWidth}%`,
            }}
            data-oid="uhj7xa:"
          >
            <TranscriptPanel
              audioPlayerRef={audioPlayerRef}
              currentSection={currentSection}
              sectionQuestions={sectionQuestions}
              isMobile={isMobile}
              onAudioDurationChange={(d) => {
                // Only set timer from audio duration if:
                // 1. Timer is currently 0 (new test or reset)
                // 2. Test is not finished
                // 3. Duration is valid
                // Use getLatestState to avoid stale closure
                const state = useListeningTestStore.getState();
                if (state.timeRemaining === 0 && !state.isFinished && d > 0) {
                  dispatch({ type: ACTIONS.SET_TIME, payload: Math.ceil(d) + 60 });

                  // Robust auto-play for new tests: start playing as soon as duration is known
                  if (audioPlayerRef.current && !isFinished) {
                    audioPlayerRef.current.play();
                  }
                }
              }}
              data-oid="dyitrvd"
            />

            {/* Mobile Collapse Toggle (inside panel) */}
            {isMobile && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setLeftPanelWidth(0)}
                className="absolute top-4 right-4 h-8 w-8 rounded-full shadow-md z-50 md:hidden"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
          </div>

          {!isMobile && (
            <ResizeHandle
              onMouseDown={() => setIsResizing(true)}
              onKeyDown={handleResizeKeyDown}
              aria-valuenow={leftPanelWidth}
              aria-valuemin={20}
              aria-valuemax={70}
              data-oid="p2_2k:w"
            />
          )}

          {/* Right Panel: Questions */}
          <div
            className={cn(
              'flex-1 flex flex-col bg-slate-50/50 dark:bg-slate-950/50 relative overflow-hidden transition-all duration-300',
              isMobile && leftPanelWidth === 100 && 'hidden'
            )}
            style={{ width: isMobile ? '100%' : `${100 - leftPanelWidth}%` }}
            data-oid="1vkp36."
          >
            {/* Mobile View Transcript Toggle */}
            {isMobile && (
              <div className="md:hidden px-4 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLeftPanelWidth(100)}
                  className="w-full justify-start gap-2 h-9 text-xs font-bold border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-xl"
                >
                  <Lightbulb className="w-4 h-4 text-blue-500" />
                  Show Transcript & Audio
                </Button>
              </div>
            )}
            {/* Right Panel Header & Tabs */}
            {/* Right Panel Header & Tabs */}
            <div
              className="relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 px-2 sm:px-4 py-2 shrink-0 relative z-20 shadow-sm transition-all duration-300 w-full overflow-x-auto"
              style={{ scrollbarWidth: 'none' }}
              data-oid="v0bnih8"
            >
              <div
                className="flex items-center justify-start sm:justify-center min-w-max"
                data-oid="ujg4x08"
              >
                <div
                  className="inline-flex p-1 bg-slate-100/50 dark:bg-slate-950/50 rounded-xl sm:rounded-2xl border border-slate-200/50 dark:border-white/5 relative z-0 backdrop-blur-sm"
                  data-oid="2eggma3"
                >
                  {displaySections.map((section, idx) => {
                    const isActive = activePart === idx;
                    const result = stats.results[idx] || {};
                    const answeredInPart = (result.sAnswered || 0) > 0;
                    const isCompleted = result.sAnswered === result.sQCount && result.sQCount > 0;

                    return (
                      <button
                        key={idx}
                        onClick={() => dispatch({ type: ACTIONS.SET_ACTIVE_PART, payload: idx })}
                        className={cn(
                          'relative px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl transition-colors duration-200 ease-out flex items-center justify-center gap-1.5 sm:gap-2.5 z-10 select-none whitespace-nowrap',
                          isActive
                            ? 'text-white'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        )}
                        data-oid="hag248p"
                      >
                        {/* Active Background Animation */}
                        {isActive && (
                          <motion.div
                            layoutId="activeTabBackground"
                            className="absolute inset-0 bg-blue-600 dark:bg-blue-600 shadow-[0_4px_12px_-2px_rgba(37,99,235,0.4)] dark:shadow-[0_4px_12px_-2px_rgba(37,99,235,0.6)] rounded-lg sm:rounded-xl -z-10"
                            initial={false}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            data-oid="egxwqa:"
                          >
                            {/* Subtle Gradient Overlay for Depth */}
                            <div
                              className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-lg sm:rounded-xl"
                              data-oid="jn6630n"
                            />
                          </motion.div>
                        )}

                        {/* Status Indicator / Number */}
                        <span
                          className={cn(
                            'w-4 h-4 sm:w-5 sm:h-5 shrink-0 rounded-md flex items-center justify-center text-[9px] sm:text-[10px] font-black transition-colors duration-200 relative',
                            isActive
                              ? 'bg-white/20 text-white'
                              : isCompleted
                                ? 'bg-emerald-500 text-white shadow-sm'
                                : answeredInPart
                                  ? 'bg-blue-500 text-white shadow-sm'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-slate-300 dark:group-hover:bg-slate-700'
                          )}
                          data-oid="86c.5ck"
                        >
                          {isCompleted && !isActive ? (
                            <CheckCircle className="w-3 h-3" data-oid="d-aicsk" />
                          ) : (
                            idx + 1
                          )}
                        </span>

                        {/* Label */}
                        <span
                          className="uppercase tracking-wide sm:tracking-wider text-[10px] sm:text-[11px] font-bold"
                          data-oid=".sjw5by"
                        >
                          Part {idx + 1}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Questions Scroll Area */}
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto p-2 md:p-4 custom-scrollbar"
              data-oid="ei0mpxi"
            >
              <div className="max-w-4xl mx-auto pb-8" data-oid="mazna.x">
                <AnimatePresence mode="wait" data-oid="6t5jc9d">
                  <motion.div
                    key={activePart}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    data-oid="dtbr3a4"
                  >
                    {sectionQuestions.length > 0 ? (
                      <>
                        {sectionQuestions
                          .reduce((groups, q) => {
                            const lastGroup = groups[groups.length - 1];
                            const currentInstr = q.group_instructions || '';
                            const hasTitle = !!q.mcq_title;

                            // Start a new group if instructions mismatch OR if the question has its own title
                            if (
                              lastGroup &&
                              (lastGroup.instructions || '') === currentInstr &&
                              !hasTitle
                            ) {
                              lastGroup.questions.push(q);
                            } else {
                              groups.push({
                                instructions: currentInstr,
                                mcq_title: q.mcq_title || '',
                                questions: [q],
                              });
                            }
                            return groups;
                          }, [])
                          .map((group, gIdx) => (
                            <div key={gIdx} className="mb-2.5" data-oid=".ffofwm">
                              <div
                                className="relative bg-white/70 dark:bg-slate-900/55 border border-slate-200/60 dark:border-slate-700/60 rounded-lg shadow-sm overflow-hidden group/card backdrop-blur-sm transition-all duration-200"
                                data-oid="yfsdv5u"
                              >
                                {group.instructions && group.instructions !== '<p><br></p>' && (
                                  <div className="px-2.5 pt-2" data-oid="wdnm:1-">
                                    <div
                                      className="mb-1.5 p-2 rounded-lg bg-blue-50/60 dark:bg-blue-900/20 border border-blue-100/80 dark:border-blue-800 text-sm font-medium text-slate-700 dark:text-slate-300 flex items-start gap-2"
                                      data-oid="6dw9uti"
                                    >
                                      <div className="mt-0.5 flex-shrink-0" data-oid="ip7:at9">
                                        <Lightbulb
                                          className="w-4 h-4 text-blue-500"
                                          data-oid="3h83xkd"
                                        />
                                      </div>
                                      <div
                                        className="text-[14.5px] font-medium text-slate-700 dark:text-slate-300 leading-snug"
                                        dangerouslySetInnerHTML={{
                                          __html: formatInstructionHTML(group.instructions),
                                        }}
                                        data-oid="cpz5p_a"
                                      />
                                    </div>
                                  </div>
                                )}

                                {group.mcq_title && (
                                  <div className="px-2.5 pt-2" data-oid="z15c3c.">
                                    <div
                                      className="flex items-center justify-center gap-3 mb-2"
                                      data-oid="1n1k.e1"
                                    >
                                      <div
                                        className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent"
                                        data-oid="nhsoa0s"
                                      />

                                      <h3
                                        className="text-center font-bold text-base text-slate-800 dark:text-slate-200 tracking-tight"
                                        data-oid="g6izwei"
                                      >
                                        {group.mcq_title}
                                      </h3>
                                      <div
                                        className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent"
                                        data-oid="nu3tn.2"
                                      />
                                    </div>
                                  </div>
                                )}

                                <div
                                  className={`px-2.5 pb-2.5 ${!group.mcq_title && !group.instructions ? 'p-2 sm:p-2.5' : 'pt-1'}`}
                                  data-oid="mt_5c5t"
                                >
                                  {(!group.instructions || group.instructions === '<p><br></p>') &&
                                    !group.mcq_title && (
                                      <div className="mb-2" data-oid="jh.-gh7">
                                        <div
                                          className="flex items-center gap-3 mb-1.5"
                                          data-oid=".vlkfrk"
                                        >
                                          <div
                                            className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20"
                                            data-oid="1_4q4.x"
                                          >
                                            <Lightbulb
                                              className="w-3.5 h-3.5 text-white"
                                              data-oid=":cg-0hu"
                                            />
                                          </div>
                                          <div data-oid="oh:s49w">
                                            <h2
                                              className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-200"
                                              data-oid="gj95ryw"
                                            >
                                              Questions {group.questions[0]?._displayStartNumber}–
                                              {
                                                group.questions[group.questions.length - 1]
                                                  ?._displayEndNumber
                                              }
                                            </h2>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  <div className="space-y-3" data-oid="kt4a2v0">
                                    {group.questions.map((question) =>
                                      renderQuestion(question, true)
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </>
                    ) : (
                      <div
                        className="flex flex-col items-center justify-center h-full py-20 opacity-50"
                        data-oid="pfsl8gz"
                      >
                        <Inbox className="w-16 h-16 text-slate-300 mb-4" data-oid="w5rdlsj" />
                        <p className="font-semibold text-slate-400" data-oid="3em_akk">
                          No questions for this section
                        </p>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
              {/* Extra padding on mobile to account for floating audio player */}
              {isMobile && <div className="h-28 shrink-0" />}
            </div>
          </div>

          {/* Floating Mobile Audio Player */}
          {isMobile && leftPanelWidth === 0 && currentSection.audio_url && (
            <div className="absolute bottom-0 left-0 right-0 p-2 z-40 bg-gradient-to-t from-background/95 via-background/90 to-transparent pb-4 pt-8">
              <AudioPlayer
                ref={audioPlayerRef}
                src={currentSection.audio_url}
                onDurationChange={(d) => {
                  const state = useListeningTestStore.getState();
                  if (state.timeRemaining === 0 && !state.isFinished && d > 0) {
                    dispatch({ type: ACTIONS.SET_TIME, payload: Math.ceil(d) + 60 });
                    if (audioPlayerRef.current && !isFinished) {
                      audioPlayerRef.current.play();
                    }
                  }
                }}
                onTimeUpdate={(t) => dispatch({ type: ACTIONS.UPDATE_AUDIO_TIME, payload: t })}
                data-oid="floating-mob-audio"
              />
            </div>
          )}
        </div>

        {/* Overlays */}
        <ConfettiCelebration
          show={showConfetti}
          onComplete={() => setShowConfetti(false)}
          data-oid=".h72ayp"
        />
        <XPNotification
          show={showXPNotification}
          xp={earnedXP.xp}
          bonus={earnedXP.bonus}
          streak={earnedXP.streak}
          onComplete={() => setShowXPNotification(false)}
          data-oid="5s99p_4"
        />
        <style data-oid="aon6cm_">{`
                .custom-scrollbar::-webkit-scrollbar {width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track {background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb {background-color: #cbd5e1; border-radius: 10px; border: 3px solid transparent; background-clip: content-box; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {background-color: #94a3b8; }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {background-color: #334155; }
            `}</style>

        {/* Dialogs */}
        {/* Duplicate Exit Dialog Removed */}

        <AlertDialog open={showTimeUpDialog} onOpenChange={setShowTimeUpDialog} data-oid="qnwyd03">
          <AlertDialogContent className="max-w-md" data-oid="ug__9pq">
            <AlertDialogHeader data-oid="rnwsb03">
              <AlertDialogTitle className="text-2xl font-bold" data-oid="hivm9by">
                Time's Up
              </AlertDialogTitle>
              <AlertDialogDescription
                className="text-base text-slate-600 dark:text-slate-400"
                data-oid="j.6nfia"
              >
                Time is up. You can check your answers now, or come back to them later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-3 sm:gap-3" data-oid="-ghurb-">
              <AlertDialogCancel
                onClick={() => setShowTimeUpDialog(false)}
                className="border-2"
                data-oid="3kkp7:t"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSubmit}
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold"
                data-oid="uwj:9ou"
              >
                Check answers
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <TestResultsModal
          showResults={showResults}
          testResults={testResults}
          testData={testData}
          earnedXP={earnedXP}
          user={currentUser}
          onClose={() => dispatch({ type: ACTIONS.SHOW_RESULTS_MODAL, payload: false })}
          onReviewAnswers={() => {
            dispatch({ type: ACTIONS.SHOW_RESULTS_MODAL, payload: false });
            setShowAnswerSheet(true);
          }}
          onNavigateToQuestion={handleNavigateToQuestion}
          testType="listening"
          data-oid="m431y0n"
        />

        <ListeningTestSheet
          showAnswerSheet={showAnswerSheet}
          setShowAnswerSheet={setShowAnswerSheet}
          activePart={activePart}
          displaySections={displaySections}
          questionsWithComputedNumbers={questionsWithNumbers}
          answers={answers}
          handleAnswerChange={handleAnswerChange}
          isFinished={isFinished}
          correctAnswersMap={correctAnswersMap}
          solvedCount={stats.totalAns}
          isMobile={isMobile}
          onQuestionClick={(key) => {
            const el = document.getElementById(`question-${key}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
          data-oid="w185x.k"
        />
      </div>
    </div>
  );
}

export default function ListeningTest() {
  return (
    <React.Suspense
      fallback={<PremiumLoading message="Loading test module..." />}
      data-oid="qv2lotf"
    >
      <ErrorBoundary
        title="Listening Test Error"
        fallbackMessage="Something went wrong while loading the listening test. Your progress has been auto-saved. Please try refreshing the page."
        data-oid="oour:-e"
      >
        <ListeningTestProvider data-oid="cg29s21">
          <ListeningTestInner data-oid="p3tqef:" />
        </ListeningTestProvider>
      </ErrorBoundary>
    </React.Suspense>
  );
}
