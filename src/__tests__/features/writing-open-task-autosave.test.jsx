import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({ updates: [] }));
vi.mock('@/lib/supabase', () => {
  const query = {
    update: (payload) => (db.updates.push(payload), query),
    eq: () => query,
    select: () => query,
    maybeSingle: async () => ({ data: { id: 's1' }, error: null }),
  };
  return { supabase: { from: () => query } };
});
vi.mock('@/hooks/useDataQuery', () => ({ removeFromCache: vi.fn() }));

import { CURRENT_EVALUATION_VERSION } from '@/features/testing/shared/evaluationVersion';
import { useWritingTestStore } from '@/features/testing/writing/store/useWritingTestStore';
import { useOpenTaskAutosave, useTaskLocked } from '@/features/testing/writing/useOpenWritingTask';

const finished = {
  id: 's1',
  is_completed: true,
  score: 6.5,
  evaluation_status: 'complete',
  evaluation_version: CURRENT_EVALUATION_VERSION,
  test_mode: 'practice',
  user_responses: [{ task2_response: '<p>marked</p>' }],
};

describe('writing the second task after the first review', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    db.updates = [];
    useWritingTestStore.getState().fullReset();
    useWritingTestStore.setState({
      session: { ...finished },
      isCompleted: true,
      activeType: 'Task 1',
      compositeTasks: { 'Task 1': { prompt: 'a' }, 'Task 2': { prompt: 'b' } },
      feedbacks: { 'Task 1': null, 'Task 2': { overallBand: 6.5 } },
      drafts: { 'Task 1': '', 'Task 2': '<p>marked</p>' },
    });
  });
  afterEach(() => vi.useRealTimers());

  it('leaves the unwritten task editable and the marked one locked', () => {
    const { result } = renderHook(() => useTaskLocked());
    expect(result.current).toBe(false);
    act(() => useWritingTestStore.setState({ activeType: 'Task 2' }));
    expect(result.current).toBe(true);
  });

  it('saves the new answer shortly after the learner stops typing', async () => {
    renderHook(() => useOpenTaskAutosave());
    act(() => useWritingTestStore.getState().setDraft('Task 1', '<p>my report</p>'));
    expect(db.updates).toHaveLength(0);
    await act(async () => vi.advanceTimersByTimeAsync(1600));
    expect(db.updates).toHaveLength(1);
    expect(db.updates[0].user_responses[0]).toMatchObject({
      task1_response: '<p>my report</p>',
      task2_response: '<p>marked</p>',
    });
    expect(useWritingTestStore.getState().session.user_responses[0].task1_response).toBe(
      '<p>my report</p>'
    );
  });

  it('saves what is left when the learner leaves before the pause ends', async () => {
    const view = renderHook(() => useOpenTaskAutosave());
    act(() => useWritingTestStore.getState().setDraft('Task 1', '<p>unsaved</p>'));
    await act(async () => view.unmount());
    expect(db.updates).toHaveLength(1);
  });

  it('writes nothing when there is nothing new or no open task', async () => {
    renderHook(() => useOpenTaskAutosave());
    await act(async () => vi.advanceTimersByTimeAsync(1600));
    act(() => useWritingTestStore.setState({ session: { ...finished, test_mode: 'mock' } }));
    act(() => useWritingTestStore.getState().setDraft('Task 1', '<p>exam</p>'));
    await act(async () => vi.advanceTimersByTimeAsync(1600));
    expect(db.updates).toHaveLength(0);
  });
});
