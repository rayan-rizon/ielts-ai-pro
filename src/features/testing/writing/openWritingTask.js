/**
 * A Writing test has two tasks, and each one is reviewed (and charged) on its
 * own. A practice test reviewed with only one task written keeps the other one
 * open, so the learner can finish it later in the same attempt.
 */
import { supabase } from '@/lib/supabase';
import { CURRENT_EVALUATION_VERSION } from '@/features/testing/shared/evaluationVersion';
import { PRACTICE_MODE, normalizeTestMode } from '@/features/testing/shared/testMode';
import { getWritingFeedbacks, isValidFeedback } from './writingFeedbackHelpers';

const WRITING_TASKS = ['Task 1', 'Task 2'];
const MINIMUM_WORDS = { 'Task 1': 50, 'Task 2': 100 };
const RESPONSE_FIELD = { 'Task 1': 'task1_response', 'Task 2': 'task2_response' };

const countWords = (html) =>
  String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

const isScoredAttempt = (session) => Boolean(session?.is_completed) && session.score != null;

/** The tasks a finished attempt already has a report for. They are never marked again. */
export function markedWritingTasks(session, feedbacks) {
  if (!isScoredAttempt(session)) return [];
  return WRITING_TASKS.filter((type) => isValidFeedback(feedbacks?.[type]));
}

/** An exam is over once reviewed, and older reports are kept as they were. */
const acceptsAnotherTask = (session) =>
  isScoredAttempt(session) &&
  [
    session.evaluation_status === 'complete',
    session.evaluation_version === CURRENT_EVALUATION_VERSION,
    normalizeTestMode(session.test_mode) === PRACTICE_MODE,
  ].every(Boolean);

function onlyUnmarkedTask(feedbacks) {
  const missing = WRITING_TASKS.filter((type) => !isValidFeedback(feedbacks?.[type]));
  return missing.length === 1 ? missing[0] : null;
}

const hasBothTasks = (compositeTasks) => WRITING_TASKS.every((type) => compositeTasks?.[type]);

/** The one task a learner can still write in a finished practice attempt, or null. */
export function openWritingTask({ session, feedbacks, compositeTasks }) {
  if (!acceptsAnotherTask(session) || !hasBothTasks(compositeTasks)) return null;
  return onlyUnmarkedTask(feedbacks);
}

function savedResponse(session, type) {
  return session?.user_responses?.[0]?.[RESPONSE_FIELD[type]];
}

/**
 * Which tasks a review request covers. A task that already has a report is
 * reused as it is, so it can never be charged or re-scored a second time.
 */
export function planWritingMarking({ session, feedbacks, compositeTasks, drafts }) {
  const reuse = markedWritingTasks(session, feedbacks);
  const written = (type) => countWords(drafts[type]) >= MINIMUM_WORDS[type];
  const tasks = WRITING_TASKS.filter(
    (type) =>
      reuse.includes(type) || ((type === 'Task 1' || compositeTasks?.[type]) && written(type))
  );
  const markedDrafts = Object.fromEntries(
    reuse.map((type) => [
      type,
      savedResponse(session, type) || feedbacks[type].originalSource || drafts[type],
    ])
  );
  return { tasks, reuse, drafts: { ...drafts, ...markedDrafts } };
}

function bothTasksInContent(content) {
  try {
    return hasBothTasks(JSON.parse(content));
  } catch {
    return false;
  }
}

/** For the library: the done and missing task of a half-finished attempt. */
export function writingTaskProgress(session) {
  const content = session?.content_data;
  if (!isScoredAttempt(session) || !bothTasksInContent(content?.content)) return null;
  const feedbacks = getWritingFeedbacks(content);
  const missing = onlyUnmarkedTask(feedbacks);
  if (!missing) return null;
  return {
    done: WRITING_TASKS.find((type) => type !== missing),
    missing,
    canWrite: acceptsAnotherTask(session),
  };
}

/**
 * Autosave stops once a test is finished, so the open task saves itself. Only
 * its own answer changes; the marked task's saved answer is left alone.
 */
export async function saveOpenTaskDraft({ session, taskType, html }, client = supabase) {
  const answer = { ...(session.user_responses?.[0] || {}), [RESPONSE_FIELD[taskType]]: html };
  answer.response = JSON.stringify({
    'Task 1': answer.task1_response || '',
    'Task 2': answer.task2_response || '',
  });
  const userResponses = [answer];
  const { data, error } = await client
    .from('test_sessions')
    .update({ user_responses: userResponses })
    .eq('id', session.id)
    .eq('evaluation_status', 'complete')
    .select('id')
    .maybeSingle();
  if (error) throw error;
  return data ? userResponses : null;
}

const asksForOpenTask = ({ requested, ...attempt }) =>
  Boolean(requested) && requested === openWritingTask(attempt);

/**
 * The tab to open a saved attempt on. A learner is moved off an empty tab to the
 * report they have, unless they asked to write the task that is still open.
 */
export function taskToShow(attempt) {
  const { activeType, feedbacks, compositeTasks } = attempt;
  if (asksForOpenTask(attempt)) return attempt.requested;
  const other = WRITING_TASKS.find((type) => type !== activeType);
  const reportIsElsewhere =
    !isValidFeedback(feedbacks?.[activeType]) && isValidFeedback(feedbacks?.[other]);
  return reportIsElsewhere && compositeTasks?.[other] ? other : activeType;
}

export const responseFieldFor = (taskType) => RESPONSE_FIELD[taskType];
