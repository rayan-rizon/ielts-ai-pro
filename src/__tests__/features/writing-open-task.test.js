import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase', () => ({ supabase: {} }));

import { CURRENT_EVALUATION_VERSION } from '@/features/testing/shared/evaluationVersion';
import {
  markedWritingTasks,
  openWritingTask,
  planWritingMarking,
  saveOpenTaskDraft,
  taskToShow,
  writingTaskProgress,
} from '@/features/testing/writing/openWritingTask';

const session = (over = {}) => ({
  id: 's1',
  is_completed: true,
  score: 6.5,
  evaluation_status: 'complete',
  evaluation_version: CURRENT_EVALUATION_VERSION,
  test_mode: 'practice',
  ...over,
});
const tasks = { 'Task 1': { prompt: 'chart' }, 'Task 2': { prompt: 'essay' } };
const onlyTask2 = { 'Task 1': null, 'Task 2': { overallBand: 6.5 } };

describe('openWritingTask', () => {
  it('opens the unwritten task of a finished practice test', () => {
    expect(
      openWritingTask({ session: session(), feedbacks: onlyTask2, compositeTasks: tasks })
    ).toBe('Task 1');
  });

  it.each([
    ['an exam attempt', { test_mode: 'mock' }],
    ['a report saved by an older marker', { evaluation_version: 'old' }],
    ['a legacy report', { evaluation_status: 'legacy' }],
    ['a review still running', { evaluation_status: 'pending' }],
    ['an unfinished attempt', { is_completed: false }],
    ['an attempt without a score', { score: null }],
  ])('keeps %s closed', (_label, over) => {
    expect(
      openWritingTask({ session: session(over), feedbacks: onlyTask2, compositeTasks: tasks })
    ).toBeNull();
  });

  it('opens nothing once both tasks are marked', () => {
    const both = { 'Task 1': { overallBand: 7 }, 'Task 2': { overallBand: 6.5 } };
    expect(
      openWritingTask({ session: session(), feedbacks: both, compositeTasks: tasks })
    ).toBeNull();
  });

  it('opens nothing for a test with a single task', () => {
    expect(
      openWritingTask({
        session: session(),
        feedbacks: onlyTask2,
        compositeTasks: { 'Task 2': tasks['Task 2'] },
      })
    ).toBeNull();
  });
});

describe('planWritingMarking', () => {
  const essay = (words) => `<p>${Array(words).fill('word').join(' ')}</p>`;

  it('reuses the marked report and sends only the new task, whatever the old draft says now', () => {
    const plan = planWritingMarking({
      session: session(),
      feedbacks: onlyTask2,
      compositeTasks: tasks,
      drafts: { 'Task 1': essay(160), 'Task 2': essay(10) },
    });
    expect(plan.tasks).toEqual(['Task 1', 'Task 2']);
    expect(plan.reuse).toEqual(['Task 2']);
  });

  it('keeps the saved answer of a marked task instead of a later local edit', () => {
    const plan = planWritingMarking({
      session: session({ user_responses: [{ task2_response: '<p>as marked</p>' }] }),
      feedbacks: onlyTask2,
      compositeTasks: tasks,
      drafts: { 'Task 1': essay(160), 'Task 2': '<p>changed later</p>' },
    });
    expect(plan.drafts['Task 2']).toBe('<p>as marked</p>');
    expect(plan.drafts['Task 1']).toBe(essay(160));
  });

  it('marks nothing as reusable on a first review', () => {
    const plan = planWritingMarking({
      session: session({ score: null, evaluation_status: 'not_requested' }),
      feedbacks: onlyTask2,
      compositeTasks: tasks,
      drafts: { 'Task 1': essay(160), 'Task 2': essay(260) },
    });
    expect(plan.reuse).toEqual([]);
    expect(plan.tasks).toEqual(['Task 1', 'Task 2']);
  });

  it('still needs 50 words for Task 1 and 100 for Task 2', () => {
    const plan = planWritingMarking({
      session: null,
      feedbacks: {},
      compositeTasks: tasks,
      drafts: { 'Task 1': essay(49), 'Task 2': essay(99) },
    });
    expect(plan.tasks).toEqual([]);
  });

  it('lists the marked tasks of a second review that is still running', () => {
    expect(markedWritingTasks(session({ evaluation_status: 'pending' }), onlyTask2)).toEqual([
      'Task 2',
    ]);
  });
});

describe('writingTaskProgress', () => {
  const content = {
    content: JSON.stringify(tasks),
    ai_feedbacks: { 'Task 2': { overallBand: 6.5 } },
  };

  it('says which task is done and which is left, and offers to write it', () => {
    expect(writingTaskProgress(session({ content_data: content }))).toEqual({
      done: 'Task 2',
      missing: 'Task 1',
      canWrite: true,
    });
  });

  it('reports one of two for an exam attempt without offering to write', () => {
    expect(
      writingTaskProgress(session({ test_mode: 'mock', content_data: content }))
    ).toMatchObject({ missing: 'Task 1', canWrite: false });
  });

  it('returns nothing when both are marked or the test has one task', () => {
    const both = {
      ...content,
      ai_feedbacks: { 'Task 1': { overallBand: 7 }, 'Task 2': { overallBand: 6.5 } },
    };
    expect(writingTaskProgress(session({ content_data: both }))).toBeNull();
    expect(
      writingTaskProgress(session({ content_data: { ...content, content: 'Write an essay.' } }))
    ).toBeNull();
    expect(writingTaskProgress(null)).toBeNull();
  });
});

describe('saveOpenTaskDraft', () => {
  function fakeClient() {
    const calls = { eq: [] };
    const query = {
      update: (payload) => ((calls.payload = payload), query),
      eq: (column, value) => (calls.eq.push([column, value]), query),
      select: () => query,
      maybeSingle: async () => ({ data: { id: 's1' }, error: null }),
    };
    return { calls, client: { from: () => query } };
  }

  it('saves only the open task and leaves the marked answer as it was', async () => {
    const { calls, client } = fakeClient();
    const saved = await saveOpenTaskDraft(
      {
        session: session({
          user_responses: [{ task2_response: '<p>marked</p>', word_count: 154 }],
        }),
        taskType: 'Task 1',
        html: '<p>new answer</p>',
      },
      client
    );
    expect(calls.payload.user_responses).toEqual(saved);
    expect(saved[0]).toMatchObject({
      task1_response: '<p>new answer</p>',
      task2_response: '<p>marked</p>',
      word_count: 154,
    });
    expect(calls.eq).toContainEqual(['evaluation_status', 'complete']);
  });

  it('reports a failed save', async () => {
    const query = {
      update: () => query,
      eq: () => query,
      select: () => query,
      maybeSingle: async () => ({ data: null, error: new Error('offline') }),
    };
    await expect(
      saveOpenTaskDraft(
        { session: session(), taskType: 'Task 1', html: 'x' },
        { from: () => query }
      )
    ).rejects.toThrow('offline');
  });
});

describe('taskToShow', () => {
  const state = { activeType: 'Task 1', feedbacks: onlyTask2, compositeTasks: tasks };

  it('opens the marked report when the first task has nothing to show', () => {
    expect(taskToShow({ ...state, session: session() })).toBe('Task 2');
  });

  it('stays on the unwritten task when the learner asked to write it', () => {
    expect(taskToShow({ ...state, session: session(), requested: 'Task 1' })).toBe('Task 1');
  });

  it('ignores a request for a task that is closed', () => {
    expect(
      taskToShow({ ...state, session: session({ test_mode: 'mock' }), requested: 'Task 1' })
    ).toBe('Task 2');
  });
});
