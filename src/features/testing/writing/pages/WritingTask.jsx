import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
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
import AnnotatedText from '@/components/writing/AnnotatedText';
import { analyzeWriting } from '../utils/writingCoaching';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useWritingVocabularySave } from '../hooks/useWritingVocabularySave';
import { useReportLanguage } from '../report/useReportLanguage';
import { useTranslatedReport } from '../report/useTranslatedReport';
import { reportT } from '../report/reportStrings';
import { reportedWords } from '../report/reportViewModel';
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

function WritingFeedbackDrawer({
  hasFeedbackPane,
  currentFeedback,
  isAnalyzing,
  feedbackError,
  handleGetFeedback,
  loadingMessage,
  onShowInEssay,
  onRevise,
  coachSession,
  coachTaskType,
  originalHtml,
  reportSessionId,
  isMobile,
}) {
  if (!hasFeedbackPane || isMobile) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="relative flex h-full min-h-0 min-w-0 w-full flex-col border-l border-[#e4e2f0] bg-white dark:border-white/[0.07] dark:bg-[#08080a]"
      data-oid="zsyqr7w"
    >
      <div className="min-h-0 flex-1" data-oid="178ww4r">
        <MemoizedFeedbackPanel
          feedback={currentFeedback}
          isAnalyzing={isAnalyzing}
          feedbackError={feedbackError}
          handleGetFeedback={handleGetFeedback}
          loadingMessage={loadingMessage}
          onShowInEssay={onShowInEssay}
          onRevise={onRevise}
          coachSession={coachSession}
          coachTaskType={coachTaskType}
          originalHtml={originalHtml}
          reportSessionId={reportSessionId}
          onClose={() => {}}
          data-oid="zp34i4j"
        />
      </div>
    </motion.div>
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
    <div className="flex items-center justify-center w-full px-2 py-1.5 bg-white dark:bg-[#131315] border-b border-[#e4e2f0] dark:border-white/[0.07] md:hidden z-30 shrink-0">
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
        className={cn('w-full max-w-sm rounded-lg p-0.5', TAB_THEME.track)}
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
  const [viewMode, setViewMode] = useState(() => (isMobile ? 'feedback' : 'review'));
  const [focusAnnotation, setFocusAnnotation] = useState(null);
  const showTaskPanel = showTask && !hasFeedbackPane;

  const handleShowInEssay = useCallback((annotation) => {
    setViewMode('review');
    setFocusAnnotation({ ...annotation, requestId: Date.now() });
  }, []);
  const [reviseRequest, setReviseRequest] = useState(0);
  const handleRevise = useCallback(() => {
    setViewMode('edit');
    setReviseRequest(Date.now());
  }, []);

  useEffect(() => {
    if (hasFeedbackPane && isMobile) {
      setViewMode('feedback');
    } else if (hasFeedbackPane && !isMobile) {
      setViewMode('review');
    }
  }, [hasFeedbackPane, isMobile]);

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
          hasFeedbackPane ? 'md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]' : 'md:flex-row',
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
            setViewMode={setViewMode}
            focusAnnotation={focusAnnotation}
            showSample={showSample}
            setShowSample={setShowSample}
            isMobile={isMobile}
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

        <AnimatePresence initial={false} data-oid="i3plaxk">
          <WritingFeedbackDrawer
            hasFeedbackPane={hasFeedbackPane}
            currentFeedback={currentFeedback}
            isAnalyzing={isAnalyzing}
            feedbackError={feedbackError}
            handleGetFeedback={handleGetFeedback}
            loadingMessage={loadingMessage}
            onShowInEssay={handleShowInEssay}
            onRevise={handleRevise}
            {...attemptProps(testMode, logic.session, activeType)}
            originalHtml={
              currentFeedback?.originalSource ||
              useWritingTestStore.getState().drafts[activeType] ||
              ''
            }
            isMobile={isMobile}
          />
        </AnimatePresence>
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

function WritingViewModeToggle({ viewMode, setViewMode, isMobile }) {
  const tabs = isMobile
    ? [
        { id: 'feedback', label: 'Report' },
        { id: 'review', label: 'My essay' },
        { id: 'question', label: 'Question' },
        { id: 'edit', label: 'Edit' },
      ]
    : [
        { id: 'review', label: 'My essay' },
        { id: 'question', label: 'Question' },
        { id: 'edit', label: 'Edit' },
      ];

  return (
    <div className="sticky top-0 z-40 bg-white dark:bg-[#131315] border-b border-[#e4e2f0] dark:border-white/[0.07] px-2 py-1.5 sm:px-4">
      <div className="flex items-center justify-center w-full">
        <SlidingTabs
          role="tablist"
          label="Writing view"
          value={viewMode}
          onChange={setViewMode}
          options={tabs.map((tab) => ({ value: tab.id, label: tab.label }))}
          className={cn(
            'w-full max-w-md items-center rounded-lg p-0.5 sm:w-auto sm:max-w-none sm:rounded-full sm:p-1',
            TAB_THEME.track
          )}
          indicatorClassName={cn('rounded-md sm:rounded-full', TAB_THEME.indicator)}
          tabClassName="min-h-8 flex-1 whitespace-nowrap rounded-md px-2 text-[11px] font-bold sm:flex-none sm:rounded-full sm:px-4 sm:text-xs"
          activeClassName={TAB_THEME.active}
          idleClassName={TAB_THEME.idle}
        />
      </div>
    </div>
  );
}

function AnnotatedReviewPane({
  feedback,
  writing,
  setWriting,
  focusAnnotation,
  onSaveVocabularyWord,
  savedVocabularyTerms,
  savingVocabularyTerms,
  reportSessionId,
}) {
  const analysis = React.useMemo(
    () => analyzeWriting(feedback.originalSource || writing, feedback.taskPrompt),
    [feedback.originalSource, feedback.taskPrompt, writing]
  );
  const applyCorrection = useCallback(
    (annotation) => {
      const source = writing || feedback.originalSource;
      if (!annotation.replacementText || !source?.includes(annotation.originalText)) return;
      setWriting(source.replace(annotation.originalText, annotation.replacementText));
    },
    [feedback, writing, setWriting]
  );

  // Explanations follow the report language; the essay and corrections do not.
  const { language } = useReportLanguage();
  const { shown: explained } = useTranslatedReport({
    feedback,
    sessionId: reportSessionId,
    language,
  });

  return (
    <div className="px-1 pb-6 sm:px-2" data-oid="j1tntdm">
      <AnnotatedText
        t={reportT(language)}
        reportedVocabulary={reportedWords(feedback.vocabularyEnhancements).map((e) => e.original)}
        text={feedback.originalSource || writing}
        annotations={explained.annotations || []}
        vocabularyEnhancements={feedback.vocabularyEnhancements || []}
        isVisualTask={feedback.taskType === 'Task 1'}
        chartText={
          feedback.taskType === 'Task 1'
            ? [
                feedback.taskAnalysis?.visualType,
                ...(feedback.taskAnalysis?.observedFeatures || []),
                feedback.taskAnalysis?.limitations,
              ]
                .filter(Boolean)
                .join(' ')
            : ''
        }
        writingAnalysis={analysis}
        onSaveVocabularyWord={onSaveVocabularyWord}
        savedVocabularyTerms={savedVocabularyTerms}
        savingVocabularyTerms={savingVocabularyTerms}
        onApplyCorrection={applyCorrection}
        focusAnnotation={focusAnnotation}
        cardClassName="min-h-[500px]"
        data-oid="wg_1:8b"
      />
    </div>
  );
}

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
  task,
  showSample,
  setShowSample,
  activeType,
  wordCount,
  isCompleted,
  isAnalyzing,
  testMode,
  focusAnnotation,
  isMobile,
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
  const [showRevision, setShowRevision] = useState(false);
  useEffect(() => setShowRevision(false), [activeType, viewMode]);
  // Declared after the reset above so a "Revise" request from the report wins
  // when it switches the view to the editor in the same render.
  useEffect(() => {
    if (reviseRequest) setShowRevision(true);
  }, [reviseRequest]);

  const isFeedbackMode = isMobile && hasFeedback && viewMode === 'feedback';
  const isReviewMode = hasFeedback && viewMode === 'review' && Boolean(currentFeedback);
  const isQuestionMode = hasFeedback && viewMode === 'question';
  const isRevisionMode =
    hasFeedback &&
    viewMode === 'edit' &&
    showRevision &&
    Boolean(currentFeedback && coachSession?.id && coachTaskType);
  const VIEW_TAB_ORDER = ['feedback', 'review', 'question', 'editor', 'revision'];
  const TAB_EASE = [0.23, 1, 0.32, 1];

  const contentKey = isFeedbackMode
    ? 'feedback'
    : isReviewMode
      ? 'review'
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
  if (isFeedbackMode) {
    content = (
      <div className="flex-1 overflow-y-auto">
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
          onClose={() => {}}
        />
      </div>
    );
  } else if (isReviewMode) {
    content = (
      <AnnotatedReviewPane
        feedback={currentFeedback}
        reportSessionId={reportSessionId}
        writing={writing}
        setWriting={setWriting}
        focusAnnotation={focusAnnotation}
        onSaveVocabularyWord={onSaveVocabularyWord}
        savedVocabularyTerms={savedVocabularyTerms}
        savingVocabularyTerms={savingVocabularyTerms}
      />
    );
  } else if (isQuestionMode) {
    content = (
      <QuestionViewPane task={task} showSample={showSample} setShowSample={setShowSample} />
    );
  } else if (isRevisionMode) {
    content = (
      <WritingRevisionEditor
        session={coachSession}
        taskType={coachTaskType}
        feedback={currentFeedback}
        originalHtml={currentFeedback?.originalSource || writing}
        onBack={() => setShowRevision(false)}
      />
    );
  } else {
    content = (
      <div className="flex min-h-0 flex-1 flex-col gap-2">
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
    <div className="relative flex min-h-0 flex-1 flex-col px-1 pt-1.5 pb-4 sm:px-2 sm:pt-2.5 sm:pb-6">
      {/* The new pane eases in directionally at once; waiting for the old one to leave left a blank gap. */}
      <motion.div
        key={contentKey}
        initial={
          reducedMotion ? false : { opacity: 0, x: tabNav.dir * 16, y: tabNav.dir === 0 ? 6 : 0 }
        }
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.22, ease: TAB_EASE }}
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
  isMobile,
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
  const isCompleted = useWritingTestStore((state) => state.isCompleted);
  const isAnalyzing = useWritingTestStore((state) => state.isAnalyzing);
  const currentFeedback = useWritingTestStore((state) => state.currentFeedback);
  const feedbackError = useWritingTestStore((state) => state.feedbackError);
  const setDraft = useWritingTestStore((state) => state.setDraft);

  const setWriting = useCallback(
    (content) => setDraft(activeType, content),
    [activeType, setDraft]
  );

  return (
    <div
      className={cn(
        'relative z-10 flex min-h-0 min-w-0 flex-col overflow-hidden bg-[#fcfcfc] dark:bg-[#08080a]',
        hasFeedback
          ? 'w-full h-full md:min-w-0 md:border-r border-[#e4e2f0] dark:border-white/[0.07]'
          : 'w-full md:w-1/2 md:basis-1/2 md:flex-1 h-full'
      )}
      data-oid="ctlrd56"
    >
      {hasFeedback && (
        <WritingViewModeToggle viewMode={viewMode} setViewMode={setViewMode} isMobile={isMobile} />
      )}
      <div
        className="flex flex-1 min-h-0 flex-col overflow-y-auto"
        style={{ scrollbarGutter: 'stable' }}
      >
        <WritingPaneBody
          hasFeedback={hasFeedback}
          viewMode={viewMode}
          currentFeedback={currentFeedback}
          feedbackError={feedbackError}
          writing={writing}
          setWriting={setWriting}
          task={task}
          showSample={showSample}
          setShowSample={setShowSample}
          activeType={activeType}
          wordCount={wordCount}
          isCompleted={isCompleted}
          isAnalyzing={isAnalyzing}
          testMode={testMode}
          focusAnnotation={focusAnnotation}
          isMobile={isMobile}
          handleShowInEssay={handleShowInEssay}
          handleRevise={handleRevise}
          reviseRequest={reviseRequest}
          handleGetFeedback={handleGetFeedback}
          loadingMessage={loadingMessage}
          coachSession={coachSession}
          coachTaskType={coachTaskType}
          reportSessionId={reportSessionId}
          onSaveVocabularyWord={onSaveVocabularyWord}
          savedVocabularyTerms={savedVocabularyTerms}
          savingVocabularyTerms={savingVocabularyTerms}
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
