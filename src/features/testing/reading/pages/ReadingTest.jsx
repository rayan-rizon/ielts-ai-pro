import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import { useLocation, useParams, Link, useBlocker } from 'react-router-dom'; // Added Link, useParams
import { createPageUrl } from '@/utils';
import { cn, getQuestionCount, formatInstructionHTML } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/security';
import { supabase } from '@/lib/supabase';
import {
  ReadingTestProvider,
  useReadingTestState,
  useReadingTestDispatch,
} from '../components/ReadingTest/context/ReadingTestContext';
import { useAuth } from '@/features/auth/context/AuthContext';
// Lazy load heavy components
const ReadingTestHeader = React.lazy(() => import('../components/ReadingTestHeader'));
const ReadingTestAppearance = React.lazy(() => import('../components/ReadingTestAppearance'));
const ReadingTestNotes = React.lazy(() => import('../components/ReadingTestNotes'));
const ReadingTestSheet = React.lazy(() => import('../components/ReadingTestSheet'));
const ReadingTestQuestionsSidebar = React.lazy(
  () => import('../components/ReadingTest/components/ReadingTestQuestionsSidebar')
);
import PremiumLoading from '@/components/ui/PremiumLoading';
const TestResultsModal = React.lazy(() => import('@/components/results/TestResultsModal'));
const ConfettiCelebration = React.lazy(() => import('@/components/ConfettiCelebration'));
const XPNotification = React.lazy(() => import('@/components/XPNotification'));
import WordDefinitionPopover from '../components/WordDefinitionPopover';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import DebouncedInput from '@/components/ui/debounced-input';
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
import {
  ArrowLeft,
  BarChart2,
  Clock,
  BookOpen,
  StickyNote,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Crown,
  Trash2,
  X,
  Edit3,
  GripVertical,
  Highlighter,
  FileText,
  AlertTriangle,
  Home,
  Brain,
  Lightbulb,
  XCircle,
  TrendingUp,
  Loader2,
  Plus,
  Trophy,
  RotateCcw,
  ShieldCheck,
  ClipboardList,
  CheckSquare,
  Send,
  Volume2,
  Search,
  Check,
  ListFilter,
  PanelRightClose,
  Eye,
  EyeOff,
} from 'lucide-react';

// QUESTION_TYPE_LABELS and toRoman moved to ./ReadingTest/utils/helpers.js

import { m, AnimatePresence } from 'framer-motion';

// Assuming updateUserPoints is a utility function, similar to generateDetailedFeedback
// If not, this import might need adjustment based to its actual location.
import { updateUserPoints } from '@/utils/api';

import { useGamification } from '@/hooks/useGamification';

// Import from extracted component files (removing inline duplicates)
import HighlightMenu from '../components/ReadingTest/components/HighlightMenu';
import ResizeHandle from '@/components/ui/resize-handle';
import PassagePanel from '../components/ReadingTest/components/PassagePanel';

// Import from extracted utils (removing inline duplicates)
import {
  QUESTION_TYPE_LABELS,
  toRoman,
  calculateTotalQuestions,
  calculateTotalTestQuestions,
  calculateGlobalQuestionNumber,
  groupQuestions,
} from '../components/ReadingTest/utils/helpers';
import { useReadingTestLogic } from '../components/ReadingTest/hooks/useReadingTestLogic';
import { useWordDefinition } from '../components/ReadingTest/hooks/useWordDefinition';
import { useHighlighter } from '../components/ReadingTest/hooks/useHighlighter';
import { useTestNotes } from '../components/ReadingTest/hooks/useTestNotes';
import { useIsMobile } from '@/hooks/use-mobile';
import { useReadingTestStore } from '../store/useReadingTestStore';

// HighlightMenu component moved to ./ReadingTest/components/HighlightMenu.jsx

// ResizeHandle component moved to ./ReadingTest/components/ResizeHandle.jsx

// Helper functions moved to ./ReadingTest/utils/helpers.js

// Animation variants moved to ReadingTestQuestionsSidebar.jsx

function ReadingTestContent() {
  const { id } = useParams();
  const ctxState = useReadingTestState();
  const { isSaving, lastSaved } = ctxState;
  const { dispatch, getLatestState } = useReadingTestDispatch();
  // TimeRemaining removed from render scope for performance!

  // Gamification - using shared hook
  const {
    showConfetti,
    showXPNotification,
    earnedXP,
    awardXP,
    setShowConfetti,
    setShowXPNotification,
  } = useGamification();

  // Use the extracted logic hook (Phase 2)
  const { userProfile, user: authUser } = useAuth();
  const user = userProfile || authUser;
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());

  const {
    testData,
    allQuestions,
    isLoading,
    error,
    session,
    user: logicUser,
    testMode,
    selectedMode,
    setSelectedMode,
    examEligibility,
    isAwaitingStart,
    isStarting,
    isFinished,
    showResults,
    setShowResults,
    testResults,
    isSubmitting,
    correctAnswersMap,
    validationMap,
    showTimeUpDialog,
    setShowTimeUpDialog,
    loadTest,
    loadUser, // Added back
    handleSubmit, // Added back
    handleStartTest,
    blocker,
    showExitDialog,
    setShowExitDialog,
    handleExit,
    resetBlocker,
    isExiting,
  } = useReadingTestLogic(null, { awardXP, user, flaggedQuestions });

  const location = useLocation();
  const [currentPassageIndex, setCurrentPassageIndex] = useState(0);

  // Lifted state from Context
  const answers = ctxState.answers || {};

  const [highlightedAnswerQs, setHighlightedAnswerQs] = useState(null); // 'all' | Set<number> | null
  const isMobile = useIsMobile(); // Add useIsMobile hook

  // --- Feature Hooks ---
  const wordDef = useWordDefinition(user, testData, currentPassageIndex);
  const highlighter = useHighlighter();
  const notesManager = useTestNotes();

  // Destructure for backward compatibility with existing render logic
  const { wordDefinition, setWordDefinition, fetchWordDefinition, addToVocabulary } = wordDef;

  const {
    highlights,
    setHighlights,
    showHighlightMenu,
    setShowHighlightMenu,
    highlightMenuPosition,
    setHighlightMenuPosition,
    currentSelection,
    setCurrentSelection,
    selectedHighlight,
    setSelectedHighlight,
    applyHighlight,
    removeHighlight,
    handleHighlightClick,
  } = highlighter;

  const { notes, setNotes, showNotes, setShowNotes, newNote, setNewNote, addNote, removeNote } =
    notesManager;

  const [hoveredWordRect, setHoveredWordRect] = useState(null);

  // Answer Sheet Sidebar
  const [showAnswerSheet, setShowAnswerSheet] = useState(false);

  const toggleFlag = (questionId) => {
    setFlaggedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) newSet.delete(questionId);
      else newSet.add(questionId);
      return newSet;
    });
  };

  // Analytics states — persisted in Zustand so they survive refresh/resume
  const passageTimes = useReadingTestStore((s) => s.passageTimes);
  const storeAddPassageTime = useReadingTestStore((s) => s.addPassageTime);

  // Ref to snapshot timeRemaining when we enter a passage (NOT persisted — used only for cleanup delta)
  const passageEntryTimeRef = useRef(null);

  // Resizable layout state
  const [passageWidth, setPassageWidth] = useState(50);
  const [isResizing, setIsResizing] = useState(false);

  // Appearance Settings
  // Start at a compact, exam-like reading size; learners can still increase it from Appearance.
  const [textSize, setTextSize] = useState('text-[15px]');
  const [paperTheme, setPaperTheme] = useState('light'); // light, sepia, dark

  const passageRef = useRef(null);
  const containerRef = useRef(null);
  const timeRemainingRef = useRef(3600); // Only for compatibility, mainly unused

  // Sync ref with state (Removed useEffect)
  // Instead, getLatestState() provides the Truth.

  // Sync Context with Local Data (Temporary Bridge)
  useEffect(() => {
    if (session) {
      dispatch({ type: 'SET_SESSION', payload: session });
    }
  }, [session]);

  // Listen for deep dive trigger highlights
  useEffect(() => {
    const handleHighlightEvent = (e) => {
      const { type, keys } = e.detail;
      if (type === 'specific' && keys && keys.length > 0) {
        setHighlightedAnswerQs(
          new Set(
            keys
              .map((k) => {
                // Robustly parse trailing numbers in case of legacy formats (e.g. "gap_1" -> 1)
                const match = String(k).match(/\d+/);
                return match ? parseInt(match[0], 10) : NaN;
              })
              .filter((n) => !isNaN(n))
          )
        );
      } else if (type === 'clear') {
        // Only clear if we were highlighting specific ones (not "all")
        setHighlightedAnswerQs((prev) => (prev instanceof Set ? null : prev));
      }
    };
    window.addEventListener('set-passage-highlight', handleHighlightEvent);
    return () => window.removeEventListener('set-passage-highlight', handleHighlightEvent);
  }, []);

  // Dispatch-based handler
  const handleAnswerChange = useCallback(
    (questionId, answer) => {
      dispatch({ type: 'SET_ANSWER', payload: { id: questionId, value: answer } });
    },
    [dispatch]
  );

  // Navigation handled by useTestNavigation hook
  // Scroll passage to top on change
  useEffect(() => {
    if (passageRef.current) {
      passageRef.current.scrollTop = 0;
    }
  }, [currentPassageIndex]);

  // --- Professional Interconnectivity (Pro Workflow) ---
  const [highlightedQuestionId, setHighlightedQuestionId] = useState(null);

  const scrollToQuestion = (questionId) => {
    const elementId = `question-${questionId}`;
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedQuestionId(questionId);
      setTimeout(() => setHighlightedQuestionId(null), 2500); // Glow duration
    }
  };

  const handleNavigateToQuestion = (questionNumber) => {
    setShowResults(false);

    // Find the question object with this global number
    const targetQuestion = allQuestions.find((q) => {
      const startNum = calculateGlobalQuestionNumber(allQuestions, q.id);
      const count = getQuestionCount(q);
      return questionNumber >= startNum && questionNumber < startNum + count;
    });

    if (targetQuestion) {
      // Find its passage index
      const passageIndex = testData.sections.findIndex((s, idx) => {
        const sectionNum = s.section_number || idx + 1;
        if (targetQuestion.section) {
          const qSection = parseInt(targetQuestion.section.toString().match(/\d+/)?.[0]);
          return qSection === parseInt(sectionNum);
        }
        return true; // Fallback for single passage or if section is missing
      });

      if (passageIndex !== -1 && passageIndex !== currentPassageIndex) {
        setCurrentPassageIndex(passageIndex);
      }

      // Use setTimeout to ensure the passage has switched and rendered
      setTimeout(() => {
        scrollToQuestion(targetQuestion.id);
      }, 150);
    }
  };

  const handleNavigateToRef = (refText) => {
    if (!refText || !passageRef.current) return;
    const match = refText.match(/Ref:\s*["'](.+)["']/);
    const textToFind = match ? match[1] : refText;

    // Clear existing selection
    window.getSelection().removeAllRanges();

    // Use window.find to locate
    const found = window.find(textToFind, false, false, true, false, true, false);

    if (found) {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        // Verify it's inside our passage
        if (passageRef.current.contains(range.commonAncestorContainer)) {
          range.startContainer.parentElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        } else {
          window.getSelection().removeAllRanges();
          // Try backup: simple scroll to top if not found in context (or refine search)
        }
      }
    }
  };

  useEffect(() => {
    const initTest = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const taskId = id || urlParams.get('test-id');
      const viewResults = urlParams.get('view-results') === 'true';
      const isRetake = urlParams.get('retake') === 'true';

      if (!taskId) {
        // loadTest will handle setting error correctly
        // For missing taskId, we can't call loadTest, but error state is managed by hook
        console.error('No task ID provided');
        return;
      }

      // loadTest internally handles error/loading states
      await loadTest(taskId, viewResults, isRetake);
    };

    initTest();
    loadUser();
  }, []);

  // beforeunload is now handled by useTestNavigation hook

  // Timer for active passage (Time-Waster Analytics)
  // SIMPLIFIED: Snapshot timeRemaining on entry, compute delta on exit.
  // The PacingIndicator derives live time from: initialTime - timeRemaining - sum(passageTimes).
  // This ensures it's ALWAYS in sync with the main timer.
  useEffect(() => {
    if (!testData || isFinished || showResults) return;

    // Snapshot the current timeRemaining as the entry point for this passage
    passageEntryTimeRef.current = useReadingTestStore.getState().timeRemaining;

    return () => {
      // On cleanup (passage change or unmount), freeze the elapsed time
      if (passageEntryTimeRef.current !== null) {
        const currentTR = useReadingTestStore.getState().timeRemaining;
        const elapsed = passageEntryTimeRef.current - currentTR;
        const cappedTime = Math.min(Math.max(0, elapsed), 3600);
        if (cappedTime > 0) {
          useReadingTestStore.getState().addPassageTime(currentPassageIndex, cappedTime);
        }
        passageEntryTimeRef.current = null;
      }
    };
  }, [currentPassageIndex, testData, isFinished, showResults]);

  const handleSubmitWithMetrics = useCallback(() => {
    // Freeze the current passage's live time before submitting
    const currentTR = useReadingTestStore.getState().timeRemaining;
    const { initialTime, passageTimes: pt } = useReadingTestStore.getState();
    const totalElapsed = initialTime - currentTR;
    const sumFrozen = Object.values(pt).reduce((a, b) => a + b, 0);
    const liveExtra = Math.max(0, totalElapsed - sumFrozen);
    const cappedTime = Math.min(liveExtra, 3600);
    const finalPassageTimes = {
      ...pt,
      [currentPassageIndex]: (pt[currentPassageIndex] || 0) + cappedTime,
    };
    return handleSubmit({ passageTimes: finalPassageTimes });
  }, [handleSubmit, currentPassageIndex]);

  // Auto-save answers
  // Auto-save answers
  // DELETED: Auto-save Logic (Handled by ReadingTestContext)

  // Click outside to hide answer sheet
  useEffect(() => {
    // Only apply click-outside behavior if NOT in inline review mode
    // In inline mode (finished + desktop), the sheet is part of the layout
    const isInline = isFinished && !isMobile;
    if (!showAnswerSheet || isInline) return;

    const handleClickOutside = (event) => {
      // Only hide if click is outside the answer sheet AND not on the toggle button
      if (
        event.target.closest('#reading-answer-sheet') === null &&
        event.target.closest('#reading-answer-sheet-toggle') === null
      ) {
        setShowAnswerSheet(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAnswerSheet, isFinished, isMobile]);

  // Resizing logic
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newPassageWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

      const constrainedWidth = Math.min(75, Math.max(35, newPassageWidth));
      setPassageWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
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
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  const isPremiumUser = () => {
    // Make highlighting available for all users now
    return true;
  };

  // fetchWordDefinition logic moved to useWordDefinition hook

  // Text selection for highlighting (updated to handle single word clicks and multi-word selections)
  // Optimize hover detection with throttling
  const lastHoverTime = useRef(0);

  const getRangeFromPoint = useCallback((x, y) => {
    if (document.caretRangeFromPoint) {
      return document.caretRangeFromPoint(x, y);
    }
    if (document.caretPositionFromPoint) {
      const position = document.caretPositionFromPoint(x, y);
      if (!position) return null;
      const range = document.createRange();
      range.setStart(position.offsetNode, position.offset);
      range.setEnd(position.offsetNode, position.offset);
      return range;
    }
    return null;
  }, []);

  const expandRangeToWord = useCallback((range) => {
    if (!range) return null;
    if (typeof range.expand === 'function') {
      range.expand('word');
      return range;
    }
    const node = range.startContainer;
    if (!node || node.nodeType !== Node.TEXT_NODE) return range;
    const text = node.textContent || '';
    const isWordChar = (char) => /[a-zA-Z]/.test(char);
    let start = range.startOffset;
    let end = range.startOffset;
    while (start > 0 && isWordChar(text[start - 1])) start -= 1;
    while (end < text.length && isWordChar(text[end])) end += 1;
    range.setStart(node, start);
    range.setEnd(node, end);
    return range;
  }, []);

  const handlePassageMouseMove = useCallback((e) => {
    const now = Date.now();
    if (now - lastHoverTime.current < 16) return; // ~60fps throttle
    lastHoverTime.current = now;

    // Only process if we are not dragging/selecting
    if (e.buttons !== 0) {
      setHoveredWordRect(null);
      return;
    }

    const range = getRangeFromPoint(e.clientX, e.clientY);
    if (range) {
      if (range && range.startContainer.nodeType === Node.TEXT_NODE) {
        // Expand to word boundary to see if we are really over a word
        const expandedRange = expandRangeToWord(range);
        if (!expandedRange) {
          setHoveredWordRect(null);
          return;
        }
        const word = expandedRange.toString().trim();

        // Basic check for valid word
        if (word && /^[a-zA-Z]{2,}$/.test(word)) {
          const rect = expandedRange.getBoundingClientRect();

          // Strict hit testing against the range rect
          if (
            e.clientX >= rect.left &&
            e.clientX <= rect.right &&
            e.clientY >= rect.top &&
            e.clientY <= rect.bottom
          ) {
            // Calculate position RELATIVE to the content container (e.currentTarget)
            // We use e.currentTarget because the updated render puts the highlight INSIDE the prose div
            const containerRect = e.currentTarget.getBoundingClientRect();
            setHoveredWordRect({
              top: rect.top - containerRect.top,
              left: rect.left - containerRect.left,
              width: rect.width,
              height: rect.height,
              word: word,
            });
            return;
          }
        }
      }
    }
    setHoveredWordRect(null);
  }, []);

  // Text selection for highlighting (updated to handle single word clicks and multi-word selections)
  const handleTextSelection = useCallback(
    async (event) => {
      // Note: We do NOT call event.stopPropagation() at the top.
      // We only stop propagation if we successfully handle a selection or definition logic.
      // If not handled here, it bubbles to the root div which calls handleClearSelection().

      const selection = window.getSelection();
      const selectedText = selection.toString().trim();

      // 1. Handle highlight selections. In Exam Mode, definitions are disabled,
      // so single-word selections should open the highlight menu too.
      if (selectedText && (testMode === 'exam' || selectedText.includes(' '))) {
        event.stopPropagation(); // Handled here, don't bubble

        // Clear definition if open
        setWordDefinition(null);

        const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
        if (!range) return;

        const rect = range.getBoundingClientRect();
        setCurrentSelection({
          text: selectedText,
          range: range.cloneRange(),
        });

        setHighlightMenuPosition({
          x: rect.left + window.scrollX + rect.width / 2,
          y: rect.top + window.scrollY - 10,
        });
        setShowHighlightMenu(true);
        return;
      }

      // Exam Mode keeps highlighting but does not allow dictionary definitions.
      if (testMode === 'exam') return;

      // 2. Handle single word clicks/selections (Definition or Gap)
      // If no text is selected (click), OR partial selection, check cursor.
      if (!selectedText) {
        const clickedElement = event.target;

        // Strict check: Only proceed if clicking directly on a text node or inline element
        if (clickedElement && clickedElement.textContent) {
          // Get word at cursor position
          const range = getRangeFromPoint(event.clientX, event.clientY);
          if (range && range.startContainer.nodeType === Node.TEXT_NODE) {
            const expandedRange = expandRangeToWord(range);
            if (!expandedRange) return;
            const wordAtCursor = expandedRange.toString().trim();

            // Ensure we actually clicked inside the range rect
            const rangeRect = expandedRange.getBoundingClientRect();
            const isClickInside =
              event.clientX >= rangeRect.left &&
              event.clientX <= rangeRect.right &&
              event.clientY >= rangeRect.top &&
              event.clientY <= rangeRect.bottom;

            if (isClickInside && wordAtCursor && /^[a-zA-Z]+$/.test(wordAtCursor)) {
              event.stopPropagation(); // Handled here, don't bubble

              // Clear highlight menu
              setShowHighlightMenu(false);

              const rect = expandedRange.getBoundingClientRect();
              const position = {
                x: rect.left + window.scrollX,
                y: rect.bottom + window.scrollY,
              };

              setWordDefinition({
                word: wordAtCursor,
                definition: 'Loading...',
                position: position,
              });

              await fetchWordDefinition(wordAtCursor);
              return;
            }
          }
        }
        // If we fall through here (e.g. clicked gap), we do NOTHING.
        // We let the event bubble to root, which ensures handleClearSelection() runs.
      }

      // 3. Fallback for single word selected via drag (without spaces)
      if (selectedText && !selectedText.includes(' ') && /^[a-zA-Z]+$/.test(selectedText)) {
        event.stopPropagation(); // Handled here

        const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
        if (!range) return;

        const rect = range.getBoundingClientRect();
        const position = {
          x: rect.left + window.scrollX,
          y: rect.bottom + window.scrollY,
        };

        setWordDefinition({
          word: selectedText,
          definition: 'Loading...',
          position: position,
        });

        await fetchWordDefinition(selectedText);
      }
    },
    [expandRangeToWord, fetchWordDefinition, getRangeFromPoint, testMode]
  ); // Add fetchWordDefinition to dependencies

  // addToVocabulary logic moved to useWordDefinition hook

  const handleClearSelection = useCallback(() => {
    setWordDefinition(null);
    setShowHighlightMenu(false);
    setCurrentSelection(null);
  }, []);

  // applyHighlight logic moved to useHighlighter hook

  // Handle highlight click (remains for completeness)
  // handleHighlightClick and removeHighlight logic moved to useHighlighter hook
  // addNote/removeNote logic moved to useTestNotes hook

  // Add event listener for table inputs after component mounts
  // Legacy direct DOM input handling removed.
  // Inputs are now fully controlled React components (QuestionInput, TableCompletionRenderer).

  // Removed old calculateScore function as it's replaced by logic in handleSubmit

  // Removed getAiAnalysis as per outline's implied removal of the AI analysis section from the isFinished display

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // groupQuestions moved to ./ReadingTest/utils/helpers.js

  // Get current passage and its questions - SINGLE PASSAGE DISPLAY
  const currentPassage = testData?.sections?.[currentPassageIndex];
  const currentPassageQuestions = useMemo(() => {
    if (!testData || !testData.sections || !currentPassage) return {};
    return groupQuestions(
      allQuestions.filter((q) => {
        // Logic to determine if question belongs to current passage

        // 1. If multi-section test and question has section info, use strict matching
        const currentSectionNum = currentPassage.section_number || currentPassageIndex + 1;
        if (testData.sections.length > 1 && q.section) {
          return parseInt(q.section) === parseInt(currentSectionNum);
        }

        // 2. Legacy/Simple fallback: show all questions that belong to this passage ID
        if (q.passage_id === testData.id) {
          return true;
        }

        // 3. Fallback: if only one passage, show all questions
        if (testData.sections.length === 1) {
          return true;
        }

        // 4. Try string match on 'section' field if numeric match failed but field exists
        const questionSectionIdentifier = q.section;

        if (questionSectionIdentifier) {
          // Try exact number match from string (e.g. "Section 1")
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

        // Default: show all questions if filtering is unclear
        return true;
      })
    );
  }, [testData, allQuestions, currentPassageIndex, currentPassage]);

  if (isLoading) {
    return <PremiumLoading message="Initializing test..." />;
  }

  if (!testData || !testData.sections || testData.sections.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-background" data-oid="xvtf1og">
        <p className="text-muted-foreground" data-oid="rpd63hy">
          No test data available.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="p-6 md:p-8 min-h-screen bg-[#f8f8fb] dark:bg-[#0b0a10] flex items-center justify-center"
        data-oid="29w.h8c"
      >
        <Card className="max-w-md w-full" data-oid="egxywnt">
          <CardContent className="pt-6 text-center" data-oid="::un8dw">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" data-oid="fjnde4." />
            <h2 className="text-xl font-semibold text-foreground mb-2" data-oid="ux4.6pg">
              Test Not Available
            </h2>
            <p className="text-muted-foreground mb-6" data-oid="v19re88">
              {error}
            </p>
            <div className="flex gap-3 justify-center" data-oid="-s-j5gj">
              <Button asChild variant="outline" data-oid="bn.m:a_">
                <Link to={createPageUrl('Reading')} data-oid="exyirxd">
                  <ArrowLeft className="w-4 h-4 mr-2" data-oid="tbnml-_" />
                  Back to Tests
                </Link>
              </Button>
              <Button asChild data-oid="nrr4bfg">
                <Link to={createPageUrl('Dashboard')} data-oid="w976uoh">
                  <Home className="w-4 h-4 mr-2" data-oid="g7s23ma" />
                  Dashboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Removed the previous 'isFinished' block that displayed AI Analysis results.
  // Keyboard support for resize handle
  const handleResizeKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setPassageWidth((w) => Math.max(20, w - 5));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setPassageWidth((w) => Math.min(80, w + 5));
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-background" onClick={handleClearSelection}>
      <Suspense
        fallback={
          <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
      >
        {/* Gamification Components */}
        <ConfettiCelebration show={showConfetti} onComplete={() => setShowConfetti(false)} />

        <XPNotification
          show={showXPNotification}
          xp={earnedXP.xp}
          bonus={earnedXP.bonus}
          streak={earnedXP.streak}
          onComplete={() => setShowXPNotification(false)}
        />

        {/* Header */}
        <ReadingTestHeader
          testData={testData}
          allQuestions={allQuestions}
          currentPassageIndex={currentPassageIndex}
          passageTimes={passageTimes}
          totalDurationSeconds={(session?.duration_minutes || 60) * 60}
          answers={answers}
          totalQuestions={calculateTotalTestQuestions(testData)}
          showExitDialog={showExitDialog}
          setShowExitDialog={setShowExitDialog}
          highlightedAnswerQs={highlightedAnswerQs}
          setHighlightedAnswerQs={setHighlightedAnswerQs}
          showNotes={showNotes}
          setShowNotes={setShowNotes}
          showAnswerSheet={showAnswerSheet}
          setShowAnswerSheet={setShowAnswerSheet}
          notes={notes}
          isSaving={isSaving}
          lastSaved={lastSaved}
          theme={paperTheme}
          onExit={async () => {
            if (session && session.id) {
              const exitTime = getLatestState().timeRemaining;
              try {
                await supabase
                  .from('test_sessions')
                  .update({
                    user_responses: answers,
                    content_data: {
                      ...session.content_data,
                      time_remaining: exitTime,
                      last_saved_at: new Date().toISOString(),
                    },
                  })
                  .eq('id', session.id);
              } catch (e) {
                console.error('Exit save failed', e);
              }
            }
            handleExit();
          }}
          onContinue={resetBlocker}
          formatTime={formatTime}
          isFinished={isFinished}
          testMode={testMode}
          isAwaitingStart={isAwaitingStart}
          selectedMode={selectedMode}
          onModeChange={setSelectedMode}
          examEligibility={examEligibility}
          onStart={handleStartTest}
          isStarting={isStarting}
        />

        {/* Main Layout Container */}
        <div
          className={cn(
            'flex flex-col md:flex-row flex-1 overflow-hidden min-h-0 relative transition-all duration-300',
            isAwaitingStart && 'pointer-events-none select-none blur-[3px] opacity-75'
          )}
          aria-disabled={isAwaitingStart || undefined}
          inert={isAwaitingStart ? '' : undefined}
        >
          {/* Main Content Area with Resizable Layout */}
          <div
            ref={containerRef}
            className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-0 relative z-10 w-full"
          >
            {/* Passage Content - Resizable */}
            <div
              className="flex flex-col overflow-hidden border-b md:border-b-0 md:border-r border-border"
              style={{
                width: isMobile ? '100%' : `${passageWidth}%`,
                height: isMobile ? '50%' : '100%',
                flexShrink: 0,
              }}
            >
              <PassagePanel
                currentPassage={currentPassage}
                passageIndex={currentPassageIndex}
                passageRef={passageRef}
                paperTheme={paperTheme}
                textSize={textSize}
                onTextSelection={handleTextSelection}
                onMouseMove={testMode === 'exam' ? undefined : handlePassageMouseMove}
                onMouseLeave={() => setHoveredWordRect(null)}
                hoveredWordRect={hoveredWordRect}
                highlightedAnswerQs={highlightedAnswerQs}
                onPaperThemeChange={setPaperTheme}
                onTextSizeChange={setTextSize}
              />
            </div>

            {/* Resize Handle - Hidden on Mobile */}
            {!isMobile && (
              <ResizeHandle
                onMouseDown={() => setIsResizing(true)}
                onKeyDown={handleResizeKeyDown}
                aria-valuenow={passageWidth}
                aria-valuemin={20}
                aria-valuemax={80}
              />
            )}

            {/* Questions Sidebar - Resizable */}
            <div
              className="flex flex-col bg-[#f8f8fb] dark:bg-[#0b0a10] md:border-l md:border-[#e4e2f0] md:dark:border-white/[0.07] h-full"
              style={{
                width: isMobile ? '100%' : `${100 - passageWidth}%`,
                height: isMobile ? '50%' : '100%',
              }}
            >
              <ReadingTestQuestionsSidebar
                currentPassageQuestions={currentPassageQuestions}
                currentPassageIndex={currentPassageIndex}
                setCurrentPassageIndex={setCurrentPassageIndex}
                testData={testData}
                allQuestions={allQuestions}
                answers={answers}
                handleAnswerChange={handleAnswerChange}
                flaggedQuestions={flaggedQuestions}
                toggleFlag={toggleFlag}
                isFinished={isFinished}
                validationMap={validationMap}
                highlightedQuestionId={highlightedQuestionId}
                isSaving={isSaving}
                lastSaved={lastSaved}
                handleSubmit={handleSubmitWithMetrics}
                isSubmitting={isSubmitting}
                showResults={showResults}
                setShowResults={setShowResults}
                session={session}
                setHighlightedAnswerQs={setHighlightedAnswerQs}
              />
            </div>
          </div>

          {/* Answer Sheet Sidebar (Inline when Finished on Desktop) */}
          <ReadingTestSheet
            showAnswerSheet={showAnswerSheet}
            setShowAnswerSheet={setShowAnswerSheet}
            currentPassageIndex={currentPassageIndex}
            testData={testData}
            allQuestions={allQuestions}
            answers={answers}
            handleAnswerChange={handleAnswerChange}
            isFinished={isFinished}
            onQuestionClick={scrollToQuestion}
            isMobile={isMobile}
          />
        </div>

        {/* Premium Notes Sidebar */}
        <ReadingTestNotes
          showNotes={showNotes}
          setShowNotes={setShowNotes}
          notes={notes}
          onRemoveNote={removeNote}
          onAddNote={addNote}
          newNote={newNote}
          setNewNote={setNewNote}
          onNavigateToRef={handleNavigateToRef}
        />

        {/* Highlight Menu */}
        {showHighlightMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={handleClearSelection} />
            <HighlightMenu
              position={highlightMenuPosition}
              onSelectColor={applyHighlight}
              onRemove={selectedHighlight ? removeHighlight : () => setShowHighlightMenu(false)}
              onEdit={() => {
                setSelectedHighlight(null);
                setShowHighlightMenu(false);
              }}
              isExistingHighlight={!!selectedHighlight}
              currentSelection={currentSelection}
              setNewNote={setNewNote}
              setShowNotes={setShowNotes}
              setShowHighlightMenu={setShowHighlightMenu}
            />
          </>
        )}

        {/* Word Definition Popover Call */}
        {testMode !== 'exam' ? (
          <WordDefinitionPopover
            wordDefinition={wordDefinition}
            addToVocabulary={addToVocabulary}
          />
        ) : null}

        {/* Premium Results Modal */}
        <TestResultsModal
          showResults={showResults}
          testResults={testResults}
          testData={testData}
          earnedXP={earnedXP}
          user={user}
          sessionId={session?.id}
          onClose={() => setShowResults(false)}
          onReviewAnswers={() => {
            setShowResults(false);
            setShowAnswerSheet(true);
          }}
          onNavigateToQuestion={handleNavigateToQuestion}
          testType="reading"
          testMode={testMode}
        />

        {/* Time's Up Dialog */}
        <AlertDialog
          open={testMode !== 'exam' && showTimeUpDialog}
          onOpenChange={setShowTimeUpDialog}
        >
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl font-bold">Time&apos;s Up</AlertDialogTitle>
              <AlertDialogDescription className="text-base text-slate-600 dark:text-slate-400">
                Time is up. You can check your answers now, or come back to them later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-3 sm:gap-3">
              <AlertDialogCancel onClick={() => setShowTimeUpDialog(false)} className="border-2">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSubmitWithMetrics}
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold"
              >
                Check answers
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Suspense>
    </div>
  );
}

export default function ReadingTest() {
  return (
    <ReadingTestProvider>
      <ReadingTestContent />
    </ReadingTestProvider>
  );
}
