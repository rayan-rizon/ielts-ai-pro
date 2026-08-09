import { uploadFile } from '@/lib/supabase';
import { trackAppEvent } from '@/lib/tracking';
import { generateDetailedFeedback } from '@/utils/api';
import { stripHtml, countWords, normalizeFeedback } from './checkerUtils';
import { TASKS, ANALYSIS_STAGES } from './checkerConstants';
import { clearPendingCheckerDraft, saveCheckerDraft } from './checkerDraftStorage';

/**
 * Validate the submission before sending to the API.
 * Returns an error string if invalid, or null if valid.
 */
export function validateSubmission(selectedTask, selectedDraft, taskImageFile, user, setters) {
  const selectedConfig = TASKS[selectedTask];
  const selectedWordCount = countWords(selectedDraft.essay);

  if (!selectedDraft.prompt.trim()) {
    setters.setShowPromptField(true);
    return 'Paste the original Task 2 instructions so Task Response can be scored accurately.';
  }
  if (selectedTask === 'Task 1' && !taskImageFile) {
    setters.setShowTaskImageField(true);
    return 'Add the original Task 1 chart, graph, table, map or diagram so Task Achievement can be scored accurately.';
  }
  if (selectedWordCount < selectedConfig.feedbackMinimum) {
    return `Write at least ${selectedConfig.feedbackMinimum} words so the checker has enough evidence to assess your response.`;
  }
  if (!user) {
    return null; // silent return — no error, but don't proceed
  }
  return null;
}

/**
 * Start the analysis stage timer that cycles through ANALYSIS_STAGES.
 * Returns the interval ID for cleanup.
 */
function startStageTimer(setAnalysisStage) {
  return window.setInterval(() => {
    setAnalysisStage((currentStage) => {
      const currentIndex = ANALYSIS_STAGES.findIndex((stage) => stage.id === currentStage);
      return ANALYSIS_STAGES[Math.min(ANALYSIS_STAGES.length - 1, currentIndex + 1)].id;
    });
  }, 900);
}

/**
 * Execute the analysis request: upload image (Task 1), save draft, call the AI.
 */
async function executeAnalysis(selectedTask, selectedDrafts, taskImageFile) {
  let imageUrl = null;
  if (selectedTask === 'Task 1') {
    const uploaded = await uploadFile(taskImageFile);
    imageUrl = uploaded.file_url;
  }

  saveCheckerDraft({
    activeTask: selectedTask,
    drafts: selectedDrafts,
    pendingAnalysis: false,
    savedAt: Date.now(),
  });

  const selectedDraft = selectedDrafts[selectedTask];
  return generateDetailedFeedback({
    writingText: stripHtml(selectedDraft.essay),
    taskPrompt: stripHtml(selectedDraft.prompt),
    taskType: selectedTask,
    imageUrl,
  });
}

/**
 * Run the full analysis pipeline: validate → stage timer → API call → normalize.
 * This is the core logic extracted from CheckerWorkspace to reduce its cc.
 */
export async function runAnalysis({
  submission,
  activeTask,
  drafts,
  taskImageFile,
  user,
  setters,
}) {
  const selectedTask = submission?.activeTask || activeTask;
  const selectedDrafts = submission?.drafts || drafts;
  const selectedDraft = selectedDrafts[selectedTask];

  setters.setActiveTask(selectedTask);
  setters.setDrafts(selectedDrafts);
  setters.setFeedback(null);
  setters.setError('');

  const validationError = validateSubmission(
    selectedTask,
    selectedDraft,
    taskImageFile,
    user,
    setters
  );
  if (validationError) {
    setters.setError(validationError);
    return;
  }
  if (!user) return;

  setters.setIsAnalysing(true);
  setters.setAnalysisStage('preparing');
  const stageTimer = startStageTimer(setters.setAnalysisStage);

  try {
    const analysisRequest = executeAnalysis(selectedTask, selectedDrafts, taskImageFile);
    const minimumDisplayTime = new Promise((resolve) => window.setTimeout(resolve, 2400));
    const [result] = await Promise.all([analysisRequest, minimumDisplayTime]);

    setters.setAnalysisStage('feedback');
    const normalized = normalizeFeedback(result);
    if (!normalized.overallBand) {
      throw new Error('The report did not contain a valid band score.');
    }

    setters.setFeedback(normalized);
    await clearPendingCheckerDraft();
    trackAppEvent('writing_checker_feedback_revealed', {
      task_type: selectedTask,
      word_count: countWords(selectedDraft.essay),
    });

    window.setTimeout(() => {
      const resultsPanel = document.querySelector('#checker-results');
      if (typeof resultsPanel?.scrollIntoView === 'function') {
        resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 80);
  } catch (analysisError) {
    const quotaExceeded =
      analysisError?.name === 'RateLimitError' && analysisError?.rateLimitType === 'quota';
    setters.setError(
      quotaExceeded
        ? 'You have used the writing feedback available on your current plan. Your draft is still saved.'
        : analysisError?.userMessage ||
            analysisError?.message ||
            'We could not generate your report. Please try again.'
    );
  } finally {
    window.clearInterval(stageTimer);
    setters.setIsAnalysing(false);
  }
}
