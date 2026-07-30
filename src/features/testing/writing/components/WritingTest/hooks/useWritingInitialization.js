import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useWritingTestStore } from '@/features/testing/writing/store/useWritingTestStore';
import { User } from '@/features/auth/services/User';
import { Passage } from '@/features/testing/shared/services/Passage';

function parseWritingUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const viewParam = urlParams.get('view');
  const viewResultsParam = urlParams.get('view-results');
  const isViewMode = viewParam === 'true' || viewResultsParam === 'true';

  return {
    sessionId: urlParams.get('sessionId'),
    taskId: urlParams.get('taskId'),
    isNewAttempt: urlParams.get('new_attempt') === 'true',
    isResume: urlParams.get('resume') === 'true',
    isView: isViewMode,
  };
}

async function tryFetchWritingRpc(sessionId, taskId, userId) {
  try {
    const { data: result, error } = await supabase.rpc('get_writing_session_with_task', {
      p_session_id: sessionId || null,
      p_task_id: taskId || null,
      p_user_id: userId,
    });
    const isValidRpcResult = !error && result?.error == null && result?.session != null;
    if (isValidRpcResult) {
      return { session: result.session, task: result.task };
    }
  } catch {
    console.info('[Writing] Combined RPC not available, using fallback');
  }
  return null;
}

async function fetchDirectSession(sessionId) {
  if (!sessionId) return null;
  const { data, error } = await supabase
    .from('test_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();
  return !error ? data : null;
}

async function searchFallbackSession(userId, taskId, isResume, isView) {
  let query = supabase
    .from('test_sessions')
    .select(
      'id, user_id, passage_id, test_type, test_mode, is_completed, answers, band_score, score, content_data, created_at, started_at, completed_at, duration_minutes, user_responses, learning_path_activity_id, evaluation_status, evaluation_version, evaluated_at, actual_duration_seconds'
    )
    .eq('user_id', userId)
    .eq('test_type', 'writing')
    .eq('passage_id', taskId)
    .order('created_at', { ascending: false });

  if (isResume) {
    query = query.eq('is_completed', false);
  } else if (isView) {
    query = query.eq('is_completed', true);
  }

  const { data } = await query;
  return data?.[0] || null;
}

async function fetchExistingSession(userData, params, initialRpcRes, initialTask) {
  const { sessionId, taskId, isNewAttempt, isResume, isView } = params;
  if (initialRpcRes?.session) return initialRpcRes.session;
  if (isNewAttempt) return null;

  let directSession = await fetchDirectSession(sessionId);
  if (directSession) return directSession;

  const targetTaskId = initialTask?.id || taskId;
  if (targetTaskId) {
    return searchFallbackSession(userData.id, targetTaskId, isResume, isView);
  }
  return null;
}

async function resolveSelectedTask(existingSession, taskId, initialTask) {
  if (initialTask) return initialTask;
  const effectiveId = existingSession?.passage_id || existingSession?.content_data?.id || taskId;
  if (!effectiveId) return null;
  try {
    return await Passage.getById(effectiveId);
  } catch {
    console.warn('[Writing] Failed to fetch task by ID:', effectiveId);
    return null;
  }
}

async function fetchWritingSessionAndTask(userData, params) {
  const { sessionId, taskId, isNewAttempt } = params;

  const rpcRes = isNewAttempt ? null : await tryFetchWritingRpc(sessionId, taskId, userData.id);

  const rpcTask = rpcRes?.task || null;
  const existingSession = await fetchExistingSession(userData, params, rpcRes, rpcTask);
  const selectedTask = await resolveSelectedTask(existingSession, taskId, rpcTask);

  return { existingSession, selectedTask };
}

function sanitizeTaskPrompts(tasks) {
  if (tasks['Task 2'] && !tasks['Task 2'].prompt?.trim()) delete tasks['Task 2'];
  if (tasks['Task 1'] && !tasks['Task 1'].prompt?.trim()) delete tasks['Task 1'];
}

function parseParsedContent(parsed) {
  const hasTask1Or2 = parsed && (parsed['Task 1'] || parsed['Task 2']);
  if (hasTask1Or2) {
    const composite = { ...parsed };
    sanitizeTaskPrompts(composite);
    const initialType = parsed['Task 1'] ? 'Task 1' : 'Task 2';
    return {
      compositeTasks: composite,
      currentTaskData: composite[initialType] || {},
      initialActiveType: initialType,
    };
  }

  if (typeof parsed === 'object' && parsed !== null) {
    return {
      compositeTasks: {},
      currentTaskData: {
        prompt: parsed.prompt,
        instructions: parsed.instructions,
        image_url: parsed.image_url,
        sample_answer: parsed.sample_answer,
      },
      initialActiveType: 'Task 1',
    };
  }

  return {
    compositeTasks: {},
    currentTaskData: { prompt: String(parsed) },
    initialActiveType: 'Task 1',
  };
}

function parseCompositeWritingTask(selectedTask) {
  const { cambridge_year: year, cambridge_test_number: testNum } = selectedTask;
  if (year && testNum) {
    selectedTask.title = `IELTS ${year - 2005} Academic ${year} Test ${testNum}`;
  }

  const defaultType = selectedTask.task_type || 'Task 1';
  try {
    const parsed = JSON.parse(selectedTask.content);
    return parseParsedContent(parsed);
  } catch {
    return {
      compositeTasks: {},
      currentTaskData: { prompt: selectedTask.content },
      initialActiveType: defaultType,
    };
  }
}

function isValidFeedback(fb) {
  if (!fb) return false;
  const hasBand = fb.overallBand !== undefined || fb.overall_band !== undefined;
  const hasScore = fb.band_score !== undefined || fb.score !== undefined;
  return hasBand || hasScore;
}

function isParsedComposite(parsed) {
  return typeof parsed === 'object' && Boolean(parsed['Task 1'] || parsed['Task 2']);
}

function parseJsonDrafts(rawResponse, fallbackType) {
  try {
    const parsed = JSON.parse(rawResponse);
    if (isParsedComposite(parsed)) return parsed;
    if (typeof parsed === 'string') return { [fallbackType]: parsed };
  } catch {
    return { [fallbackType]: rawResponse };
  }
  return {};
}

function parseResponseItem(item, initialActiveType) {
  const fromColumns = {};
  if (item.task1_response) fromColumns['Task 1'] = item.task1_response;
  if (item.task2_response) fromColumns['Task 2'] = item.task2_response;
  if (Object.keys(fromColumns).length > 0) return fromColumns;

  return item.response ? parseJsonDrafts(item.response, initialActiveType) : {};
}

function hasLocalDraftForSession(sessionId) {
  const s = useWritingTestStore.getState();
  const sameSession = s.sessionId === sessionId;
  const hasDraft = Boolean(s.drafts?.['Task 1'] || s.drafts?.['Task 2']);
  return sameSession && hasDraft;
}

function restoreUserResponses(store, existingSession, initialActiveType) {
  if (!existingSession.user_responses?.length) return;
  const item = existingSession.user_responses[0];
  const restoredDrafts = parseResponseItem(item, initialActiveType);

  if (hasLocalDraftForSession(existingSession.id)) {
    console.info('[Writing] Preserving local drafts from sessionStorage over API data');
  } else if (Object.keys(restoredDrafts).length > 0) {
    store.setDraftsBulk(restoredDrafts);
  }
}

function restoreFeedbacks(store, feedbacks, initialActiveType) {
  if (!feedbacks) return;
  store.setFeedbacksBulk(feedbacks);
  const saved = feedbacks[initialActiveType] || feedbacks['Task 1'] || feedbacks['Task 2'];
  if (saved) store.setCurrentFeedback(saved);
}

function restoreWritingSessionState(store, existingSession, initialActiveType) {
  store.setSession(existingSession);

  const feedbacks = existingSession.content_data?.ai_feedbacks;
  const hasValidFeedback =
    feedbacks && (isValidFeedback(feedbacks['Task 1']) || isValidFeedback(feedbacks['Task 2']));
  store.setCompleted(existingSession.is_completed || Boolean(hasValidFeedback));

  restoreUserResponses(store, existingSession, initialActiveType);

  const timeRemaining = existingSession.content_data?.time_remaining;
  if (timeRemaining !== undefined) store.setTime(timeRemaining);

  restoreFeedbacks(store, feedbacks, initialActiveType);
}

function updateUrlWithSession(navigate, isNewAttempt, sessionId) {
  const currentSession = useWritingTestStore.getState().session;
  const shouldUpdateUrl = currentSession && (isNewAttempt || !sessionId);
  if (shouldUpdateUrl) {
    const newParams = new URLSearchParams();
    newParams.set('sessionId', currentSession.id);
    navigate(`?${newParams.toString()}`, { replace: true });
  }
}

/**
 * useWritingInitialization
 *
 * Handles all initialization logic for the Writing Test:
 * - Parsing URL parameters
 * - Fetching User
 * - Fetching Task/Session data (via RPC or fallback)
 * - Handling Session validity/tab-safety
 */
function applyTaskToStore(store, selectedTask) {
  const { compositeTasks, currentTaskData, initialActiveType } =
    parseCompositeWritingTask(selectedTask);
  const activeType = useWritingTestStore.getState().activeType;
  const finalActiveType = compositeTasks[activeType] ? activeType : initialActiveType;
  const finalTaskData = compositeTasks[finalActiveType] || currentTaskData;
  store.setTask(
    { ...selectedTask, ...finalTaskData, activeType: finalActiveType },
    compositeTasks,
    finalActiveType
  );
  return initialActiveType;
}

function syncSessionState(store, params) {
  if (params.isNewAttempt) store.resetTest();
  else if (params.sessionId) store.validateSession(params.sessionId);
}

async function loadUserAndData(store, params, passedUser) {
  const userData = passedUser || (await User.me());
  if (!userData) throw new Error('User not authenticated');
  store.setCurrentUser(userData);
  syncSessionState(store, params);
  const sessionAndTask = await fetchWritingSessionAndTask(userData, params);
  return { ...sessionAndTask, userData };
}

async function applySessionOrCreate({ store, selectedTask, existingSession }) {
  if (!existingSession) {
    // Reset before deriving the active task. Resetting after setTask used to leave
    // Task 2's prompt/sample in `task` while the UI had switched back to Task 1.
    store.resetTest();
    store.setSession(null);
  }

  const initialActiveType = applyTaskToStore(store, selectedTask);
  if (existingSession) {
    restoreWritingSessionState(store, existingSession, initialActiveType);
  }
}

async function runInitialize(store, navigate, passedUser) {
  const params = parseWritingUrlParams();
  if (!params.sessionId && !params.taskId) {
    store.setError('No writing task selected. Please choose a task from the writing page.');
    return;
  }

  try {
    const { existingSession, selectedTask } = await loadUserAndData(store, params, passedUser);
    if (!selectedTask) {
      store.setError('Task not found. Please choose a different task.');
      return;
    }
    await applySessionOrCreate({
      store,
      selectedTask,
      existingSession,
    });
  } catch (err) {
    console.error('Initialization error:', err);
    store.setError('Failed to load task. Please try again.');
  } finally {
    store.setLoading(false);
    updateUrlWithSession(navigate, params.isNewAttempt, params.sessionId);
  }
}

export function useWritingInitialization() {
  const navigate = useNavigate();
  const initializingRef = useRef(false);

  const initialize = useCallback(
    async (passedUser = null) => {
      if (initializingRef.current) return;
      const store = useWritingTestStore.getState();
      store.setLoading(true);
      store.setError(null);
      initializingRef.current = true;
      await runInitialize(store, navigate, passedUser);
      initializingRef.current = false;
    },
    [navigate]
  );

  return { initialize };
}
