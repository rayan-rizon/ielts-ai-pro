import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { trackAppEvent } from '@/lib/tracking';
import { countWords } from './checkerUtils';
import { TASKS, DEMO_ESSAYS, DRAFT_STORAGE_KEY, CHECKER_PATH } from './checkerConstants';
import { runAnalysis } from './analyseHelper';
import WritingForm from './WritingForm';
import DemoResultPanel from './DemoResultPanel';

export default function CheckerWorkspace({ user, authLoading }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTask, setActiveTask] = useState('Task 1');
  const [drafts, setDrafts] = useState(() => ({
    'Task 1': { prompt: TASKS['Task 1'].prompt, essay: '' },
    'Task 2': { prompt: '', essay: '' },
  }));
  const [feedback, setFeedback] = useState(null);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState('preparing');
  const [error, setError] = useState('');
  const [showSignupGate, setShowSignupGate] = useState(false);
  const [showPromptField, setShowPromptField] = useState(false);
  const [showTaskImageField, setShowTaskImageField] = useState(false);
  const [taskImageFile, setTaskImageFile] = useState(null);
  const autoSubmitRef = useRef(false);
  const restoredSubmissionRef = useRef(null);

  const task = TASKS[activeTask];
  const currentDraft = drafts[activeTask];
  const wordCount = countWords(currentDraft.essay);

  const updateDraft = (field, value) => {
    setDrafts((current) => ({
      ...current,
      [activeTask]: { ...current[activeTask], [field]: value },
    }));
    setFeedback(null);
    setError('');
    setShowSignupGate(false);
  };

  const persistDraft = useCallback(
    (pendingAnalysis) => {
      const payload = { activeTask, drafts, pendingAnalysis, savedAt: Date.now() };
      window.sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
      return payload;
    },
    [activeTask, drafts]
  );

  const requestSignup = useCallback(() => {
    persistDraft(true);
    window.sessionStorage.setItem('auth_destination', CHECKER_PATH);
    trackAppEvent('writing_checker_signup_gate_viewed', {
      task_type: activeTask,
      word_count: wordCount,
    });
    navigate('/signup', { state: { from: location } });
  }, [activeTask, location, navigate, persistDraft, wordCount]);

  // Stable setter bag — useState setters are referentially stable; object is memoised to satisfy exhaustive-deps.
  const setters = React.useMemo(
    () => ({
      setActiveTask,
      setDrafts,
      setFeedback,
      setError,
      setIsAnalysing,
      setAnalysisStage,
      setShowPromptField,
      setShowTaskImageField,
    }),

    []
  );

  const analyse = useCallback(
    (submission = null) =>
      runAnalysis({ submission, activeTask, drafts, taskImageFile, user, setters }),
    [activeTask, drafts, taskImageFile, user, setters]
  );

  // Restore draft from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = JSON.parse(window.sessionStorage.getItem(DRAFT_STORAGE_KEY) || 'null');
      if (!saved?.drafts || !TASKS[saved.activeTask]) return;
      restoredSubmissionRef.current = saved;
      setActiveTask(saved.activeTask);
      setDrafts(saved.drafts);
    } catch {
      window.sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  }, []);

  // Auto-submit after auth redirect
  useEffect(() => {
    const saved = restoredSubmissionRef.current;
    if (!saved?.pendingAnalysis || !user || authLoading || autoSubmitRef.current) return;
    autoSubmitRef.current = true;
    analyse(saved);
  }, [analyse, authLoading, user]);

  const handleTabChange = (taskType) => {
    setActiveTask(taskType);
    setFeedback(null);
    setError('');
    setShowSignupGate(false);
    setShowPromptField(false);
    setShowTaskImageField(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (wordCount < task.feedbackMinimum) {
      setError(`Write at least ${task.feedbackMinimum} words to request useful feedback.`);
      return;
    }
    if (!user) {
      persistDraft(false);
      setShowSignupGate(true);
      trackAppEvent('writing_checker_feedback_preview_requested', {
        task_type: activeTask,
        word_count: wordCount,
      });
      window.setTimeout(() => {
        document
          .querySelector('#checker-results')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
      return;
    }
    if (!currentDraft.prompt.trim()) {
      setShowPromptField(true);
      setError('Paste the original Task 2 instructions so Task Response can be scored accurately.');
      return;
    }
    if (activeTask === 'Task 1' && !taskImageFile) {
      setShowTaskImageField(true);
      setError(
        'Add the original Task 1 chart, graph, table, map or diagram so Task Achievement can be scored accurately.'
      );
      return;
    }
    analyse();
  };

  const handleLoadDemo = () => {
    setDrafts((current) => ({
      ...current,
      [activeTask]: {
        ...current[activeTask],
        essay: DEMO_ESSAYS[activeTask],
        prompt: TASKS[activeTask].prompt,
      },
    }));
    setFeedback(null);
    setError('');
    setShowSignupGate(false);
    trackAppEvent('writing_checker_demo_loaded', { task_type: activeTask });
  };

  const handleClearEssay = () => {
    updateDraft('essay', '');
    window.sessionStorage.removeItem(DRAFT_STORAGE_KEY);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) updateDraft('essay', text);
    } catch {
      setError('Your browser blocked clipboard access. Paste the essay into the text box instead.');
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setError('Use a PNG, JPG or WebP image for the Task 1 visual.');
      event.target.value = '';
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('The Task 1 image must be smaller than 8 MB.');
      event.target.value = '';
      return;
    }
    setTaskImageFile(file);
    setError('');
  };

  return (
    <section id="checker" className="relative scroll-mt-24 pb-8 pt-3 sm:pb-12">
      <div className="grid gap-5 sm:gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <WritingForm
          activeTask={activeTask}
          currentDraft={currentDraft}
          wordCount={wordCount}
          error={error}
          isAnalysing={isAnalysing}
          authLoading={authLoading}
          showTaskImageField={showTaskImageField}
          showPromptField={showPromptField}
          taskImageFile={taskImageFile}
          onTabChange={handleTabChange}
          onUpdateDraft={updateDraft}
          onLoadDemo={handleLoadDemo}
          onClearEssay={handleClearEssay}
          onPaste={handlePaste}
          onImageChange={handleImageChange}
          onSubmit={handleSubmit}
        />
        <div id="checker-results" className="scroll-mt-24 h-full">
          <DemoResultPanel
            feedback={feedback}
            activeTask={activeTask}
            isLoading={isAnalysing}
            analysisStage={analysisStage}
            error={error}
            onSignUp={requestSignup}
            onRetry={() => analyse()}
            isSignedIn={Boolean(user)}
            showSignupGate={showSignupGate}
          />
        </div>
      </div>
    </section>
  );
}
