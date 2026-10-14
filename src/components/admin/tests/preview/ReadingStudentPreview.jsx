import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { Pill, NUM } from '@/features/dashboard/components/primitives';
import { RotateCcw, X } from 'lucide-react';
import ReadingTestHeader from '@/features/testing/reading/components/ReadingTestHeader';
import PassagePanel from '@/features/testing/reading/components/ReadingTest/components/PassagePanel';
import ReadingTestQuestionsSidebar from '@/features/testing/reading/components/ReadingTest/components/ReadingTestQuestionsSidebar';
import ReadingTestNotes from '@/features/testing/reading/components/ReadingTestNotes';
import ReadingTestSheet from '@/features/testing/reading/components/ReadingTestSheet';
import ResizeHandle from '@/components/ui/resize-handle';
import { useIsMobile } from '@/hooks/use-mobile';
import { calculateTestResults } from '@/features/testing/reading/components/ReadingTest/utils/scoreCalculator';
import { buildReadingPreview, previewPassageEvidence } from './readingPreviewData';

const formatTime = (seconds) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

export default function ReadingStudentPreview({
  sections,
  title,
  onClose,
  showSourceHighlights = false,
}) {
  const snapshot = useMemo(() => buildReadingPreview(sections, title), [sections, title]);
  const { testData, allQuestions } = snapshot;
  const [passageIndex, setPassageIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState(new Set());
  const [result, setResult] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [highlightedAnswerQs, setHighlightedAnswerQs] = useState(
    showSourceHighlights ? 'all' : null
  );
  const [paperTheme, setPaperTheme] = useState('light');
  const [textSize, setTextSize] = useState('text-[15px]');
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [showSheet, setShowSheet] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [width, setWidth] = useState(50);
  const passageRef = useRef(null);
  const hoverRef = useRef(null);
  const layoutRef = useRef(null);
  const stopResizeRef = useRef(() => {});
  useEffect(() => () => stopResizeRef.current(), []);
  const isMobile = useIsMobile();
  const current = testData.sections[passageIndex];
  const passage = useMemo(
    () => ({ ...current, content: previewPassageEvidence(current, allQuestions) }),
    [current, allQuestions]
  );
  const changeAnswer = useCallback(
    (id, value) => setAnswers((prev) => ({ ...prev, [id]: value })),
    []
  );
  const toggleFlag = useCallback(
    (id) =>
      setFlagged((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    []
  );
  const finish = () => {
    setResult(calculateTestResults(allQuestions, answers, testData.sections));
    setShowResults(true);
  };
  const reset = () => {
    setAnswers({});
    setFlagged(new Set());
    setResult(null);
    setShowResults(false);
    setHighlightedAnswerQs(null);
  };
  useEffect(() => {
    const highlight = (event) => {
      if (event.detail?.type === 'specific')
        setHighlightedAnswerQs(new Set(event.detail.keys.map(Number)));
    };
    window.addEventListener('set-passage-highlight', highlight);
    return () => window.removeEventListener('set-passage-highlight', highlight);
  }, []);
  const sidebarHighlight = useCallback(
    (value) =>
      setHighlightedAnswerQs((previous) =>
        value === null && previous === 'all' ? previous : value
      ),
    []
  );
  const startResize = (event) => {
    event.preventDefault();
    stopResizeRef.current();
    const move = (e) => {
      const bounds = layoutRef.current?.getBoundingClientRect();
      if (bounds)
        setWidth(Math.min(80, Math.max(20, ((e.clientX - bounds.left) / bounds.width) * 100)));
    };
    const stop = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', stop);
    };
    stopResizeRef.current = stop;
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', stop, { once: true });
  };
  if (!current) return null;
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/65" />
        <Dialog.Content className="fixed inset-0 z-50 flex flex-col bg-[#f8f8fb] dark:bg-[#08080a] text-foreground outline-none overflow-hidden">
          <Dialog.Title className="sr-only">Full Reading student preview</Dialog.Title>
          <Dialog.Description className="sr-only">
            Try the current editor content with the student Reading interface. Answers and preview
            results stay in this window.
          </Dialog.Description>
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-[#e4e2f0] dark:border-white/[0.07] bg-white dark:bg-[#131315]">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Pill tone="accent">Student preview</Pill>
              <span>Current editor content · saves and submissions are disabled</span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={reset}>
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                Reset preview
              </Button>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Close student preview"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <ReadingTestHeader
            testData={testData}
            currentPassageIndex={passageIndex}
            answers={answers}
            totalQuestions={testData.total_questions}
            allQuestions={allQuestions}
            isFinished={!!result}
            showExitDialog={showExitDialog}
            setShowExitDialog={setShowExitDialog}
            onExit={onClose}
            onContinue={() => setShowExitDialog(false)}
            highlightedAnswerQs={highlightedAnswerQs}
            setHighlightedAnswerQs={setHighlightedAnswerQs}
            showNotes={showNotes}
            setShowNotes={setShowNotes}
            notes={notes}
            showAnswerSheet={showSheet}
            setShowAnswerSheet={setShowSheet}
            formatTime={formatTime}
            previewMode
          />
          {showResults && result && (
            <div
              role="status"
              className="px-4 py-2 text-sm border-b border-[#e4e2f0] dark:border-white/[0.07] flex flex-wrap items-center justify-between gap-2"
            >
              <span>
                Preview result:{' '}
                <strong className={NUM}>
                  {result.correctAnswers}/{result.totalQuestions}
                </strong>{' '}
                · Review answers and explanations below.
              </span>
              <Button variant="ghost" size="sm" onClick={() => setShowResults(false)}>
                Hide summary
              </Button>
            </div>
          )}
          <div
            ref={layoutRef}
            className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-0 relative"
          >
            <div
              className="@container flex flex-col overflow-hidden border-b md:border-b-0 md:border-r border-border shrink-0"
              style={{ width: isMobile ? '100%' : `${width}%`, height: isMobile ? '50%' : '100%' }}
            >
              <PassagePanel
                currentPassage={passage}
                passageIndex={passageIndex}
                passageRef={passageRef}
                hoverHighlightRef={hoverRef}
                paperTheme={paperTheme}
                textSize={textSize}
                onPaperThemeChange={setPaperTheme}
                onTextSizeChange={setTextSize}
                highlightedAnswerQs={highlightedAnswerQs}
              />
            </div>
            {!isMobile && (
              <ResizeHandle
                onMouseDown={startResize}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowLeft') setWidth((value) => Math.max(20, value - 5));
                  if (e.key === 'ArrowRight') setWidth((value) => Math.min(80, value + 5));
                }}
                aria-valuenow={width}
                aria-valuemin={20}
                aria-valuemax={80}
              />
            )}
            <div
              className="flex flex-col min-h-0 bg-[#f8f8fb] dark:bg-[#08080a] md:border-l md:border-[#e4e2f0] md:dark:border-white/[0.07]"
              style={{
                width: isMobile ? '100%' : `${100 - width}%`,
                height: isMobile ? '50%' : '100%',
              }}
            >
              <ReadingTestQuestionsSidebar
                currentPassageQuestions={current.questions}
                currentPassageIndex={passageIndex}
                setCurrentPassageIndex={setPassageIndex}
                testData={testData}
                allQuestions={allQuestions}
                answers={answers}
                handleAnswerChange={changeAnswer}
                flaggedQuestions={flagged}
                toggleFlag={toggleFlag}
                isFinished={!!result}
                validationMap={result?.correctAnswersMap || {}}
                isSaving={false}
                handleSubmit={finish}
                isSubmitting={false}
                showResults={showResults}
                setShowResults={setShowResults}
                setHighlightedAnswerQs={sidebarHighlight}
              />
            </div>
          </div>
          <ReadingTestNotes
            showNotes={showNotes}
            setShowNotes={setShowNotes}
            notes={notes}
            newNote={newNote}
            setNewNote={setNewNote}
            onAddNote={() => {
              if (newNote.trim()) {
                setNotes((prev) => [
                  ...prev,
                  {
                    id: crypto.randomUUID(),
                    content: newNote,
                    timestamp: new Date().toISOString(),
                    passageIndex,
                  },
                ]);
                setNewNote('');
              }
            }}
            onRemoveNote={(id) => setNotes((prev) => prev.filter((note) => note.id !== id))}
            onNavigateToRef={() => {}}
          />
          <ReadingTestSheet
            showAnswerSheet={showSheet}
            setShowAnswerSheet={setShowSheet}
            currentPassageIndex={passageIndex}
            testData={testData}
            allQuestions={allQuestions}
            isFinished={!!result}
            isMobile={isMobile}
            answers={answers}
            handleAnswerChange={changeAnswer}
            onQuestionClick={(id) => {
              const question = allQuestions.find((q) => String(id).startsWith(q.id));
              if (question) setPassageIndex(question.section - 1);
              setShowSheet(false);
            }}
            setCurrentPassageIndex={setPassageIndex}
            flaggedQuestions={flagged}
            toggleFlag={toggleFlag}
            validationMap={result?.correctAnswersMap || {}}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
