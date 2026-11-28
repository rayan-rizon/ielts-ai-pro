import React, { useCallback, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { BookOpen, PenLine } from 'lucide-react';
import { cn } from '@/lib/cn';
import ConfettiCelebration from '@/components/ConfettiCelebration';
import XPNotification from '@/components/XPNotification';
import PremiumLoading from '@/components/ui/PremiumLoading';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import { MUTED, PANEL } from '@/features/dashboard/components/primitives';
import { WritingHeader } from '../components/WritingTest/components/WritingHeader';
import { TaskPanel } from '../components/WritingTest/components/TaskPanel';
import { WritingEditor } from '../components/WritingTest/components/WritingEditor';
import { FeedbackPanel } from '../components/WritingTest/components/FeedbackPanel';
import { WritingRevisionEditor } from '../components/WritingTest/components/WritingCoach';
import { WritingDialogs } from '../components/WritingTest/components/WritingDialogs';
import { WritingTestProvider } from '../components/WritingTest/context/WritingTestContext';
import { useWritingTaskLogic } from '../components/WritingTest/hooks/useWritingTaskLogic';
import { useWritingTestStore } from '../store/useWritingTestStore';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useWritingVocabularySave } from '../hooks/useWritingVocabularySave';
import { useOpenWritingTask, useTaskLocked } from '@/features/testing/writing/useOpenWritingTask';
import { OpenTaskNote } from '../components/WritingTest/components/OpenTaskNote';
import { TAB_THEME } from '../report/components/reportStyles';
import { SlidingTabs } from '../report/components/SlidingTabs';

const MemoizedWritingHeader = React.memo(WritingHeader);
const MemoizedTaskPanel = React.memo(TaskPanel);
const MemoizedWritingEditorPane = React.memo(WritingEditorPane);
const MemoizedFeedbackPanel = React.memo(FeedbackPanel);

function WritingErrorScreen({ error }) {
  return (
    <div
      className="min-h-screen bg-[#f7f6fd] dark:bg-[#08080a] flex items-center justify-center p-6"
      data-oid="7.ph7ms"
    >
      <div className={cn(PANEL, 'max-w-md w-full rounded-2xl p-8 text-center space-y-4')}>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50" data-oid="8rmw5n1">
          Task Not Available
        </h2>
        <p className={MUTED} data-oid="0n6sb4p">
          {error}
        </p>
        <button
          onClick={() => window.history.back()}
          className="px-6 py-2 bg-[#5661e9] text-white rounded-lg hover:bg-[#4853d6] transition-colors"
          data-oid="jkb2hob"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}

function useWritingInitialTaskPanelState(hasFeedbackPane) {
  const [showTask, setShowTask] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isViewMode = urlParams.get('view') === 'true' || urlParams.get('view-results') === 'true';
    const existingFeedback = useWritingTestStore.getState().currentFeedback;
    return !isViewMode && !existingFeedback;
  });

  useEffect(() => {
    if (hasFeedbackPane) {
      if (showTask) setShowTask(false);
      return;
    }
    if (!showTask) setShowTask(true);
  }, [hasFeedbackPane, showTask]);

  return [showTask, setShowTask];
}

function WritingMobileTabToggle({ activeTab, onTabChange, wordCount, targetLimit }) {
  const tabs = [
    { id: 'question', label: 'Question', icon: BookOpen },
    {
      id: 'editor',
      label: `Essay (${wordCount}/${targetLimit || 150}w)`,
      icon: PenLine,
    },
  ];

  return (
    <div className="flex items-center justify-center w-full px-3 py-1.5 bg-white dark:bg-[#131315] border-b border-[#e4e2f0] dark:border-white/[0.07] md:hidden z-30 shrink-0">
      <SlidingTabs
        role="tablist"
        label="Writing view"
        value={activeTab}
        onChange={onTabChange}
        options={tabs.map(({ id, label, icon: Icon }) => ({
          value: id,
          label: (
            <>
              <Icon className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="truncate">{label}</span>
            </>
          ),
        }))}
        className={cn('w-full rounded-lg p-0.5', TAB_THEME.track)}
        indicatorClassName={cn('rounded-md', TAB_THEME.indicator)}
        tabClassName="min-h-9 min-w-0 flex-1 rounded-md px-2 text-xs font-bold"
        activeClassName={TAB_THEME.active}
        idleClassName={TAB_THEME.idle}
      />
    </div>
  );
}

/** What each report layout needs to know about the attempt being read. */
function attemptProps(testMode, session, activeType) {
  return {
    // The coach is practice-only; translation and comparison work in exams too.
    coachSession: testMode !== 'exam' ? session : null,
    coachTaskType: activeType,
    reportSessionId: session?.id,
  };
}

function WritingTaskContent() {
  const { userProfile: authUser } = useAuth();
  const vocabularySaver = useWritingVocabularySave(authUser);
  const logic = useWritingTaskLogic(authUser);
  const isMobile = useIsMobile();

  const currentFeedback = useWritingTestStore((state) => state.currentFeedback);
  const isAnalyzing = useWritingTestStore((state) => state.isAnalyzing);
  const feedbackError = useWritingTestStore((state) => state.feedbackError);
  const activeType = useWritingTestStore((state) => state.activeType) || 'Task 1';
  const wordCount = useWritingTestStore((state) => state.wordCount);
  const targetLimit = activeType === 'Task 2' ? 250 : 150;

  const {
    task,
    isLoading,
    loadingMessage,
    showSample,
    setShowSample,
    error,
    initialize,
    handleGetFeedback,
    handleSwitchTask,
    showConfetti,
    showXPNotification,
    earnedXP,
    setShowConfetti,
    setShowXPNotification,
    testMode,
    selectedMode,
    setSelectedMode,
    examEligibility,
    isAwaitingStart,
    isStarting,
    handleStartTest,
    isCompleted,
    setShowSubmitDialog,
  } = logic;
  const hasFeedbackPane =
    Boolean(currentFeedback || isAnalyzing || feedbackError) &&
    (testMode !== 'exam' || isCompleted);

  const [showTask] = useWritingInitialTaskPanelState(hasFeedbackPane);
  const [mobileTab, setMobileTab] = useState('question');
  const [viewMode, setViewMode] = useState('report');
  const [focusAnnotation, setFocusAnnotation] = useState(null);
  const showTaskPanel = showTask && !hasFeedbackPane;

  const handleShowInEssay = useCallback((annotation) => {
    setViewMode('report');
    setFocusAnnotation({ ...annotation, requestId: Date.now() });
  }, []);
  // Leaving a view or a task forgets the passage, so it does not jump back to it.
  const chooseView = useCallback((mode) => {
    setFocusAnnotation(null);
    setViewMode(mode);
  }, []);
  useEffect(() => setFocusAnnotation(null), [activeType]);
  const showResults = useCallback(() => {
    showReportedTask();
    chooseView('report');
  }, [chooseView]);
  const [reviseRequest, setReviseRequest] = useState(0);
  const handleRevise = useCallback(() => {
    setViewMode('edit');
    setReviseRequest(Date.now());
  }, []);

  useEffect(() => {
    if (hasFeedbackPane) setViewMode('report');
  }, [hasFeedbackPane]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (error) {
    return <WritingErrorScreen error={error} />;
  }

  if (isLoading || !task) {
    return <PremiumLoading message="Loading writing task..." />;
  }

  return (
    <div
      className="flex min-h-0 h-full w-full flex-col overflow-hidden bg-[#f7f6fd] relative dark:bg-[#08080a]"
      data-oid="ypz5..c"
    >
      <MemoizedWritingHeader
        task={task}
        handleGetFeedback={handleGetFeedback}
        handleSwitchTask={handleSwitchTask}
        testMode={testMode}
        onSubmit={() => setShowSubmitDialog(true)}
        onViewResults={showResults}
        isAwaitingStart={isAwaitingStart}
        selectedMode={selectedMode}
        onModeChange={setSelectedMode}
        examEligibility={examEligibility}
        onStart={handleStartTest}
        isStarting={isStarting}
        data-oid=".3a0f71"
      />

      {/* Mobile Mode Switcher when testing/practicing */}
      {!hasFeedbackPane && (
        <WritingMobileTabToggle
          activeTab={mobileTab}
          onTabChange={setMobileTab}
          wordCount={wordCount}
          targetLimit={targetLimit}
        />
      )}

      <div
        className={cn(
          'relative mx-auto flex min-h-0 w-full max-w-[1920px] flex-1 flex-col overflow-hidden transition-all duration-300',
          hasFeedbackPane ? 'md:flex-col' : 'md:flex-row',
          isAwaitingStart && 'pointer-events-none select-none blur-[3px] opacity-75'
        )}
        aria-disabled={isAwaitingStart || undefined}
        inert={isAwaitingStart ? '' : undefined}
        data-oid="50emge."
      >
        {/* On Mobile during test: show TaskPanel if mobileTab === 'question' */}
        {/* On Desktop during test: show TaskPanel if showTaskPanel */}
        {((isMobile && !hasFeedbackPane && mobileTab === 'question') ||
          (!isMobile && showTaskPanel)) && (
          <MemoizedTaskPanel
            task={task}
            showSample={showSample}
            setShowSample={setShowSample}
            allowSample={testMode !== 'exam' || isCompleted}
            onSwitchToEditor={isMobile ? () => setMobileTab('editor') : undefined}
            data-oid="oxbs3rj"
          />
        )}

        {/* On Mobile during test: show Editor if mobileTab === 'editor' */}
        {/* In feedback mode or desktop: render EditorPane */}
        {((isMobile && !hasFeedbackPane && mobileTab === 'editor') ||
          (isMobile && hasFeedbackPane) ||
          !isMobile) && (
          <MemoizedWritingEditorPane
            task={task}
            testMode={testMode}
            hasFeedback={hasFeedbackPane}
            viewMode={viewMode}
            setViewMode={chooseView}
            focusAnnotation={focusAnnotation}
            showSample={showSample}
            setShowSample={setShowSample}
            handleShowInEssay={handleShowInEssay}
            handleRevise={handleRevise}
            reviseRequest={reviseRequest}
            handleGetFeedback={handleGetFeedback}
            loadingMessage={loadingMessage}
            {...attemptProps(testMode, logic.session, activeType)}
            onSaveVocabularyWord={vocabularySaver.onSaveVocabularyWord}
            savedVocabularyTerms={vocabularySaver.savedVocabularyTerms}
            savingVocabularyTerms={vocabularySaver.savingVocabularyTerms}
            data-oid="xaa39j6"
          />
        )}
      </div>

      <WritingDialogs logic={logic} data-oid=":-fg:99" />

      <ConfettiCelebration
        show={showConfetti}
        onComplete={() => setShowConfetti(false)}
        data-oid="lav_l9b"
      />

      <XPNotification
        show={showXPNotification}
        xp={earnedXP.xp}
        bonus={earnedXP.bonus}
        streak={earnedXP.streak}
        onComplete={() => setShowXPNotification(false)}
        data-oid="3w2va_q"
      />
    </div>
  );
}

const VIEW_TABS = [
  { value: 'report', label: 'Report' },
  { value: 'question', label: 'Question' },
  { value: 'edit', label: 'Edit' },
];

function WritingViewModeToggle({ viewMode, setViewMode, toolbarHostRef, hasReportToolbar }) {
  return (
    <div className="sticky top-0 z-40 border-b border-[#e4e2f0] bg-white px-3 py-1.5 dark:border-white/[0.07] dark:bg-[#131315] sm:px-4">
      <div
        className={cn(
          'mx-auto flex w-full max-w-[1240px] flex-wrap items-center gap-2',
          hasReportToolbar
            ? 'justify-center sm:justify-between lg:grid lg:grid-cols-[1fr_auto_1fr]'
            : 'justify-center'
        )}
      >
        <SlidingTabs
          role="tablist"
          label="Writing view"
          value={viewMode}
          onChange={setViewMode}
          options={VIEW_TABS}
          className={cn(
            'w-full items-center rounded-lg p-0.5 sm:w-auto sm:max-w-none sm:rounded-full sm:p-1',
            hasReportToolbar && 'lg:col-start-2 lg:justify-self-center',
            TAB_THEME.track
          )}
          indicatorClassName={cn('rounded-md sm:rounded-full', TAB_THEME.indicator)}
          tabClassName="min-h-8 flex-1 whitespace-nowrap rounded-md px-2 text-[11px] font-bold sm:flex-none sm:rounded-full sm:px-4 sm:text-xs"
          activeClassName={TAB_THEME.active}
          idleClassName={TAB_THEME.idle}
        />
        <div
          ref={toolbarHostRef}
          className={cn(
            'flex items-center empty:hidden',
            hasReportToolbar && 'w-full sm:w-auto lg:col-start-3 lg:justify-self-end'
          )}
        />
      </div>
    </div>
  );
}

/** The reviewed task, when the one on screen has no report to show. */
function showReportedTask() {
  const { currentFeedback, feedbacks, switchTaskFull } = useWritingTestStore.getState();
  if (currentFeedback) return;
  const reported = Object.keys(feedbacks).find((type) => feedbacks[type]);
  if (reported) switchTaskFull(reported);
}

/** What the report's essay can do: jump to a passage, apply a fix, save a word. */
function useEssayActions({ writing, setWriting, feedback, focusAnnotation, ...saving }) {
  const { onSaveVocabularyWord, savedVocabularyTerms, savingVocabularyTerms } = saving;
  const onApplyCorrection = useCallback(
    (annotation) => {
      const source = writing || feedback?.originalSource;
      if (!annotation.replacementText || !source?.includes(annotation.originalText)) return;
      setWriting(source.replace(annotation.originalText, annotation.replacementText));
    },
    [feedback, writing, setWriting]
  );
  return {
    focusAnnotation,
    onApplyCorrection,
    onSaveVocabularyWord,
    savedVocabularyTerms,
    savingVocabularyTerms,
  };
}

/** Reading and writing views keep a comfortable line length in the single panel. */
const COLUMN = 'mx-auto flex min-h-0 w-full max-w-[960px] flex-1 flex-col';

function QuestionViewPane({ task, showSample, setShowSample }) {
  return (
    <div className="flex-1" data-oid="2zns8ok">
      <MemoizedTaskPanel
        task={task}
        showSample={showSample}
        setShowSample={setShowSample}
        isInset={true}
        data-oid="jx93n_u"
      />
    </div>
  );
}

function WritingPaneBody({
  hasFeedback,
  viewMode,
  currentFeedback,
  feedbackError,
  writing,
  setWriting,
  essay,
  task,
  showSample,
  setShowSample,
  activeType,
  wordCount,
  isCompleted,
  isAnalyzing,
  testMode,
  handleShowInEssay,
  handleRevise,
  reviseRequest,
  handleGetFeedback,
  loadingMessage,
  coachSession,
  coachTaskType,
  reportSessionId,
  toolbarHost,
}) {
  const openTask = useOpenWritingTask();
  const [showRevision, setShowRevision] = useState(false);
  useEffect(() => setShowRevision(false), [activeType, viewMode]);
  // Declared after the reset above so a "Revise" request from the report wins
  // when it switches the view to the editor in the same render.
  useEffect(() => {
    if (reviseRequest) setShowRevision(true);
  }, [reviseRequest]);

  const isReportMode = hasFeedback && viewMode === 'report';
  const isQuestionMode = hasFeedback && viewMode === 'question';
  const isRevisionMode =
    hasFeedback &&
    viewMode === 'edit' &&
    showRevision &&
    Boolean(currentFeedback && coachSession?.id && coachTaskType);
  const VIEW_TAB_ORDER = ['report', 'question', 'editor', 'revision'];

  const contentKey = isReportMode
    ? 'report'
    : isQuestionMode
      ? 'question'
      : isRevisionMode
        ? 'revision'
        : 'editor';

  const reducedMotion = Boolean(useReducedMotion());
  const [tabNav, setTabNav] = useState({ key: contentKey, dir: 0 });
  if (tabNav.key !== contentKey) {
    const prevIdx = VIEW_TAB_ORDER.indexOf(tabNav.key);
    const nextIdx = VIEW_TAB_ORDER.indexOf(contentKey);
    const dir = prevIdx >= 0 && nextIdx >= 0 ? (nextIdx > prevIdx ? 1 : -1) : 0;
    setTabNav({ key: contentKey, dir });
  }

  let content;
  if (isReportMode) {
    content = (
      <MemoizedFeedbackPanel
        feedback={currentFeedback}
        isAnalyzing={isAnalyzing}
        feedbackError={feedbackError}
        handleGetFeedback={handleGetFeedback}
        loadingMessage={loadingMessage}
        onShowInEssay={handleShowInEssay}
        onRevise={handleRevise}
        coachSession={coachSession}
        coachTaskType={coachTaskType}
        originalHtml={currentFeedback?.originalSource || writing}
        reportSessionId={reportSessionId}
        essay={essay}
        toolbarHost={toolbarHost}
      />
    );
  } else if (isQuestionMode) {
    content = (
      <div className={COLUMN}>
        <QuestionViewPane task={task} showSample={showSample} setShowSample={setShowSample} />
      </div>
    );
  } else if (isRevisionMode) {
    content = (
      <div className={COLUMN}>
        <WritingRevisionEditor
          session={coachSession}
          taskType={coachTaskType}
          feedback={currentFeedback}
          originalHtml={currentFeedback?.originalSource || writing}
          onBack={() => setShowRevision(false)}
        />
      </div>
    );
  } else {
    content = (
      <div className={cn(hasFeedback ? COLUMN : 'flex min-h-0 flex-1 flex-col', 'gap-2')}>
        {openTask === activeType && !hasFeedback && <OpenTaskNote task={activeType} />}
        {hasFeedback && currentFeedback && coachSession?.id && coachTaskType && (
          <div className="flex justify-end px-1">
            <button
              type="button"
              onClick={() => setShowRevision(true)}
              className="inline-flex min-h-8 items-center gap-1.5 rounded-lg bg-[#5a63df] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#4953cf] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5a63df]"
            >
              <PenLine className="h-3.5 w-3.5" aria-hidden="true" /> Revise with feedback
            </button>
          </div>
        )}
        <div className="min-h-0 flex-1">
          <WritingEditor
            key={activeType}
            writing={writing}
            setWriting={setWriting}
            wordCount={wordCount}
            targetLimit={activeType === 'Task 2' ? 250 : 150}
            isCompleted={isCompleted}
            testMode={testMode}
            isAnalyzing={isAnalyzing}
            currentFeedback={currentFeedback}
            title={`${activeType} Response`}
            subtitle={`Draft your ${activeType.toLowerCase()} essay`}
            data-oid="p08gpnf"
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative flex min-h-0 flex-1 flex-col',
        !isReportMode && 'px-3 pt-2.5 pb-5 sm:px-4 sm:pt-3 sm:pb-6'
      )}
    >
      {/* The new pane eases in directionally at once; waiting for the old one to leave left a blank gap. */}
      <motion.div
        key={contentKey}
        initial={
          reducedMotion
            ? false
            : {
                opacity: 0,
                x: tabNav.dir * 12,
                y: tabNav.dir === 0 ? 4 : 0,
                filter: 'blur(1.5px)',
              }
        }
        animate={{ opacity: 1, x: 0, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: reducedMotion ? 0 : 0.26, ease: [0.22, 1, 0.36, 1] }}
        className="flex min-h-0 flex-1 flex-col"
      >
        {content}
      </motion.div>
    </div>
  );
}

function WritingEditorPane({
  task,
  testMode,
  hasFeedback,
  viewMode,
  setViewMode,
  focusAnnotation,
  showSample,
  setShowSample,
  handleShowInEssay,
  handleRevise,
  reviseRequest,
  handleGetFeedback,
  loadingMessage,
  coachSession,
  coachTaskType,
  onSaveVocabularyWord,
  savedVocabularyTerms,
  savingVocabularyTerms,
  reportSessionId,
}) {
  const activeType = useWritingTestStore((state) => state.activeType);
  const writing = useWritingTestStore((state) => state.drafts[activeType] || '');
  const wordCount = useWritingTestStore((state) => state.wordCount);
  const isCompleted = useTaskLocked();
  const isAnalyzing = useWritingTestStore((state) => state.isAnalyzing);
  const currentFeedback = useWritingTestStore((state) => state.currentFeedback);
  const feedbackError = useWritingTestStore((state) => state.feedbackError);
  const setDraft = useWritingTestStore((state) => state.setDraft);

  const setWriting = useCallback(
    (content) => setDraft(activeType, content),
    [activeType, setDraft]
  );
  const [toolbarHost, setToolbarHost] = useState(null);
  const hasReportToolbar =
    viewMode === 'report' && !isAnalyzing && !feedbackError && Boolean(currentFeedback);
  const essay = useEssayActions({
    writing,
    setWriting,
    feedback: currentFeedback,
    focusAnnotation,
    onSaveVocabularyWord,
    savedVocabularyTerms,
    savingVocabularyTerms,
  });

  return (
    <div
      className={cn(
        'relative z-10 flex min-h-0 min-w-0 flex-col overflow-hidden bg-[#fcfcfc] dark:bg-[#08080a]',
        hasFeedback ? 'w-full h-full md:min-w-0' : 'w-full md:w-1/2 md:basis-1/2 md:flex-1 h-full'
      )}
      data-oid="ctlrd56"
    >
      {hasFeedback && (
        <WritingViewModeToggle
          viewMode={viewMode}
          setViewMode={setViewMode}
          toolbarHostRef={setToolbarHost}
          hasReportToolbar={hasReportToolbar}
        />
      )}
      <div
        className={cn(
          'flex flex-1 min-h-0 flex-col',
          hasFeedback && viewMode === 'report' ? 'overflow-hidden' : 'overflow-y-auto'
        )}
      >
        <WritingPaneBody
          hasFeedback={hasFeedback}
          viewMode={viewMode}
          currentFeedback={currentFeedback}
          feedbackError={feedbackError}
          writing={writing}
          setWriting={setWriting}
          essay={essay}
          task={task}
          showSample={showSample}
          setShowSample={setShowSample}
          activeType={activeType}
          wordCount={wordCount}
          isCompleted={isCompleted}
          isAnalyzing={isAnalyzing}
          testMode={testMode}
          handleShowInEssay={handleShowInEssay}
          handleRevise={handleRevise}
          reviseRequest={reviseRequest}
          handleGetFeedback={handleGetFeedback}
          loadingMessage={loadingMessage}
          coachSession={coachSession}
          coachTaskType={coachTaskType}
          reportSessionId={reportSessionId}
          toolbarHost={toolbarHost}
        />
      </div>
    </div>
  );
}

export default function WritingTask() {
  return (
    <React.Suspense
      fallback={<PremiumLoading message="Initializing writing module..." />}
      data-oid="1pb7_3n"
    >
      <ErrorBoundary
        title="Writing Task Error"
        fallbackMessage="Something went wrong while loading the writing task. Your progress has been auto-saved. Please try refreshing the page."
        data-oid="5c65acz"
      >
        <WritingTestProvider data-oid="pwit..v">
          <WritingTaskContent data-oid="y6l-6so" />
        </WritingTestProvider>
      </ErrorBoundary>
    </React.Suspense>
  );
}
