/** React bindings for the task that stays open after a one-task review. */
import { useCallback, useEffect, useRef } from 'react';
import { removeFromCache } from '@/hooks/useDataQuery';
import { useWritingTestStore } from './store/useWritingTestStore';
import { flushPendingWritingDrafts } from './writingDraftFlush';
import { openWritingTask, responseFieldFor, saveOpenTaskDraft } from './openWritingTask';

const SAVE_DELAY_MS = 1500;

export function useOpenWritingTask() {
  return useWritingTestStore(openWritingTask);
}

/** Whether the task on screen is finished. The open task is not. */
export function useTaskLocked() {
  const isCompleted = useWritingTestStore((state) => state.isCompleted);
  const activeType = useWritingTestStore((state) => state.activeType);
  return useOpenWritingTask() !== activeType && isCompleted;
}

/** The answer waiting to be saved, or null when the database already has it. */
function unsavedAnswer(state) {
  const taskType = openWritingTask(state);
  if (!taskType) return null;
  const html = state.drafts[taskType] || '';
  const saved = state.session.user_responses?.[0]?.[responseFieldFor(taskType)] || '';
  return html === saved ? null : { session: state.session, taskType, html };
}

async function saveAnswer(answer) {
  const store = useWritingTestStore.getState();
  store.setSaving(true);
  try {
    const userResponses = await saveOpenTaskDraft(answer);
    const { session } = useWritingTestStore.getState();
    // The learner may have started a review or another attempt in the meantime.
    const stillOpen = session?.id === answer.session.id && session.evaluation_status === 'complete';
    if (!userResponses || !stillOpen) return false;
    store.setSession({ ...session, user_responses: userResponses });
    store.setLastSaved(new Date());
    removeFromCache('writing-tests-list');
    return true;
  } finally {
    useWritingTestStore.getState().setSaving(false);
  }
}

/** Saves the open task after a pause in typing, and when the learner leaves. */
export function useOpenTaskAutosave() {
  const openTask = useOpenWritingTask();
  const draft = useWritingTestStore((state) => (openTask ? state.drafts[openTask] : ''));
  const queue = useRef(Promise.resolve());

  const save = useCallback(() => {
    queue.current = queue.current.then(async () => {
      const state = useWritingTestStore.getState();
      const answer = unsavedAnswer(state);
      if (!answer) return Boolean(openWritingTask(state));
      return saveAnswer(answer).catch((error) => {
        console.error('[WritingTest] Could not save the second task:', error);
        return false;
      });
    });
    return queue.current;
  }, []);

  useEffect(() => {
    if (!openTask) return undefined;
    const timer = setTimeout(save, SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [openTask, draft, save]);

  useEffect(() => {
    const leave = () => {
      flushPendingWritingDrafts();
      return save();
    };
    const onHidden = () => document.visibilityState === 'hidden' && leave();
    document.addEventListener('visibilitychange', onHidden);
    return () => {
      document.removeEventListener('visibilitychange', onHidden);
      void leave();
    };
  }, [save]);

  return save;
}
