import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useWritingTestStore } from '@/features/testing/writing/store/useWritingTestStore';
import { User } from '@/features/auth/services/User';
import { Passage } from '@/features/testing/shared/services/Passage';
import { TestSession } from '@/features/testing/shared/services/TestSession';

/**
 * useWritingInitialization
 *
 * Handles all initialization logic for the Writing Test:
 * - Parsing URL parameters
 * - Fetching User
 * - Fetching Task/Session data (via RPC or fallback)
 * - Handling Session validity/tab-safety
 */
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

      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('sessionId');
      const taskId = urlParams.get('taskId');
      const isNewAttempt = urlParams.get('new_attempt') === 'true';
      const isResume = urlParams.get('resume') === 'true';
      const isView = urlParams.get('view') === 'true' || urlParams.get('view-results') === 'true';

      // Require either sessionId or taskId
      if (!sessionId && !taskId) {
        store.setError('No writing task selected. Please choose a task from the writing page.');
        return;
      }

      try {
        // 1. Fetch User - Use passed user if available to avoid redundant API call
        const userData = passedUser || (await User.me());
        if (!userData) throw new Error('User not authenticated');
        store.setCurrentUser(userData);

        // If it's a new attempt, clear any previous state
        if (isNewAttempt) {
          store.resetTest();
        } else if (sessionId) {
          // Tab safety: check if we're trying to load a different session
          // than what's in local storage. Reset if mismatch.
          store.validateSession(sessionId);
        }

        // 2. Try combined RPC for optimal performance
        let existingSession = null;
        let selectedTask = null;
        let effectiveTaskId = taskId;

        if (!isNewAttempt) {
          try {
            const { data: combinedResult, error: rpcError } = await supabase.rpc(
              'get_writing_session_with_task',
              {
                p_session_id: sessionId || null,
                p_task_id: taskId || null,
                p_user_id: userData.id,
              }
            );

            if (!rpcError && combinedResult && !combinedResult.error) {
              existingSession = combinedResult.session;
              selectedTask = combinedResult.task;
              effectiveTaskId = selectedTask?.id || taskId;
              console.info('[Writing] Loaded via optimized RPC:', {
                hasSession: !!existingSession,
                taskId: effectiveTaskId,
              });
            }
          } catch {
            console.info('[Writing] Combined RPC not available, using fallback');
          }
        }

        // Fallback: Load session directly
        if (!existingSession && sessionId && !isNewAttempt) {
          const { data: directSession, error: sessionError } = await supabase
            .from('test_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

          if (directSession && !sessionError) {
            existingSession = directSession;
            effectiveTaskId = directSession.passage_id || directSession.content_data?.id;
          } else {
            console.warn('[Writing] Failed to load session:', sessionId, sessionError);
          }
        }

        // Fallback: Fetch task if not loaded via RPC
        if (!selectedTask && effectiveTaskId) {
          try {
            selectedTask = await Passage.getById(effectiveTaskId);
          } catch (passageError) {
            console.warn('[Writing] Failed to fetch task by ID:', effectiveTaskId, passageError);
          }
        }

        if (!selectedTask) {
          store.setError('Task not found. Please choose a different task.');
          return;
        }

        // Standardize title
        const year = selectedTask.cambridge_year;
        const testNum = selectedTask.cambridge_test_number;
        if (year && testNum) {
          const bookNumber = year - 2005;
          selectedTask.title = `IELTS ${bookNumber} Academic ${year} Test ${testNum}`;
        }

        // Parse multi-task content and determine activeType
        let compositeTasks = {};
        let currentTaskData = {};
        let initialActiveType = selectedTask.task_type || 'Task 1';

        try {
          const parsed = JSON.parse(selectedTask.content);
          if (parsed && (parsed['Task 1'] || parsed['Task 2'])) {
            compositeTasks = parsed;

            if (compositeTasks['Task 2'] && !compositeTasks['Task 2'].prompt?.trim()) {
              delete compositeTasks['Task 2'];
            }
            if (compositeTasks['Task 1'] && !compositeTasks['Task 1'].prompt?.trim()) {
              delete compositeTasks['Task 1'];
            }

            if (parsed['Task 1']) initialActiveType = 'Task 1';
            else if (parsed['Task 2']) initialActiveType = 'Task 2';

            currentTaskData = parsed[initialActiveType] || {};
          } else if (typeof parsed === 'object' && parsed !== null) {
            currentTaskData = {
              prompt: parsed.prompt,
              instructions: parsed.instructions,
              image_url: parsed.image_url,
              sample_answer: parsed.sample_answer,
            };
          } else {
            currentTaskData = { prompt: selectedTask.content };
          }
        } catch {
          currentTaskData = { prompt: selectedTask.content };
        }

        // A resumed session can reopen on Task 2. Keep the displayed task data in
        // sync with that persisted tab instead of always retaining Task 1's media.
        const finalActiveType = compositeTasks[store.activeType]
          ? store.activeType
          : initialActiveType;
        const finalTaskData = compositeTasks[finalActiveType] || currentTaskData;

        // Set Task Data
        store.setTask(
          {
            ...selectedTask,
            ...finalTaskData,
            activeType: finalActiveType,
          },
          compositeTasks
        );

        // Only set activeType if not already set (preserves state on re-initialization/resume)
        if (!store.activeType || isNewAttempt) {
          store.setActiveType(finalActiveType);
        }

        // 4. Initialize Session (fallback search)
        if (!existingSession && !isNewAttempt) {
          let query = supabase
            .from('test_sessions')
            .select(
              'id, user_id, passage_id, test_type, is_completed, answers, band_score, score, content_data, created_at, completed_at, time_remaining, time_spent, feedback'
            )
            .eq('user_id', userData.id)
            .eq('test_type', 'writing')
            .eq('passage_id', selectedTask.id)
            .order('created_at', { ascending: false });

          if (isResume) query = query.eq('is_completed', false);
          else if (isView) query = query.eq('is_completed', true);

          const { data: sessions } = await query;
          if (sessions?.length) {
            existingSession = sessions[0];
          }
        }

        if (existingSession) {
          store.setSession(existingSession);

          // Validation helper locally scoped or duplicated for purity
          const isValidFeedback = (fb) => {
            if (!fb) return false;
            return (
              fb.overallBand !== undefined ||
              fb.overall_band !== undefined ||
              fb.band_score !== undefined ||
              fb.score !== undefined
            );
          };

          const hasValidFeedback =
            existingSession.content_data?.ai_feedbacks &&
            (isValidFeedback(existingSession.content_data.ai_feedbacks['Task 1']) ||
              isValidFeedback(existingSession.content_data.ai_feedbacks['Task 2']));

          const shouldBeCompleted = existingSession.is_completed || hasValidFeedback;
          store.setCompleted(shouldBeCompleted);

          // Restore responses
          if (existingSession.user_responses?.length > 0) {
            const item = existingSession.user_responses[0];
            let restoredDrafts = {};

            if (item.task1_response) restoredDrafts['Task 1'] = item.task1_response;
            if (item.task2_response) restoredDrafts['Task 2'] = item.task2_response;

            if (Object.keys(restoredDrafts).length === 0 && item.response) {
              try {
                const parsed = JSON.parse(item.response);
                if (typeof parsed === 'object' && (parsed['Task 1'] || parsed['Task 2'])) {
                  restoredDrafts = parsed;
                } else if (typeof parsed === 'string') {
                  restoredDrafts[initialActiveType] = parsed;
                }
              } catch {
                restoredDrafts[initialActiveType] = item.response;
              }
            }

            const currentStoreState = useWritingTestStore.getState();
            const isSameSession = currentStoreState.sessionId === existingSession.id;
            const hasLocalContent =
              currentStoreState.drafts &&
              (currentStoreState.drafts['Task 1'] || currentStoreState.drafts['Task 2']);

            if (isSameSession && hasLocalContent) {
              console.info('[Writing] Preserving local drafts from sessionStorage over API data');
            } else if (Object.keys(restoredDrafts).length > 0) {
              store.setDraftsBulk(restoredDrafts);
            }
          }

          // Restore timer
          if (existingSession.content_data?.time_remaining !== undefined) {
            store.setTime(existingSession.content_data.time_remaining);
          }

          // Restore feedbacks
          if (existingSession.content_data?.ai_feedbacks) {
            const aiFeedbacks = existingSession.content_data.ai_feedbacks;
            store.setFeedbacksBulk(aiFeedbacks);

            const savedFeedback =
              aiFeedbacks[initialActiveType] || aiFeedbacks['Task 1'] || aiFeedbacks['Task 2'];

            if (savedFeedback) {
              store.setCurrentFeedback(savedFeedback);
            }
          }
        } else {
          store.resetTest();
          const newSession = await TestSession.create({
            user_id: userData.id,
            test_type: 'writing',
            test_mode: 'practice',
            duration_minutes: 60,
            content_data: selectedTask,
            passage_id: selectedTask.id,
          });
          store.setSession(newSession);
          store.setTime(60 * 60);
        }
      } catch (err) {
        console.error('Initialization error:', err);
        store.setError('Failed to load task. Please try again.');
      } finally {
        store.setLoading(false);
        initializingRef.current = false;

        const currentSession = useWritingTestStore.getState().session;
        if (currentSession && (isNewAttempt || !sessionId)) {
          const newParams = new URLSearchParams();
          newParams.set('sessionId', currentSession.id);
          navigate(`?${newParams.toString()}`, { replace: true });
        }
      }
    },
    [navigate]
  );

  return { initialize };
}
