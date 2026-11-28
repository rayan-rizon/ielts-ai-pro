import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Passage } from '@/features/testing/shared/services/Passage';
import { useWritingInitialization } from '@/features/testing/writing/components/WritingTest/hooks/useWritingInitialization';
import { useWritingTestStore } from '@/features/testing/writing/store/useWritingTestStore';
import { supabase } from '@/lib/supabase';
import { CURRENT_EVALUATION_VERSION } from '@/features/testing/shared/evaluationVersion';

vi.mock('@/lib/supabase', () => ({ supabase: { rpc: vi.fn() } }));

vi.mock('@/features/testing/shared/services/Passage', () => ({
  Passage: { getById: vi.fn() },
}));

const task1 = {
  prompt: 'Task 1 prompt',
  sample_answer: 'Task 1 sample',
};

const task2 = {
  prompt: 'Task 2 prompt',
  sample_answer: 'Task 2 sample',
};

const selectedTask = {
  id: 'writing-task-1',
  title: 'Composite writing test',
  content: JSON.stringify({ 'Task 1': task1, 'Task 2': task2 }),
};

function RouterWrapper({ children }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

describe('Writing task initialization', () => {
  const originalUrl = window.location.href;

  beforeEach(() => {
    useWritingTestStore.getState().fullReset();
    vi.mocked(Passage.getById).mockResolvedValue(selectedTask);
  });

  afterEach(() => {
    window.history.replaceState({}, '', originalUrl);
    vi.clearAllMocks();
  });

  it('starts a fresh attempt with Task 1 data after a previous Task 2 selection', async () => {
    useWritingTestStore.setState({ activeType: 'Task 2' });
    window.history.replaceState({}, '', '/writing-task?taskId=writing-task-1&new_attempt=true');
    const { result } = renderHook(() => useWritingInitialization(), { wrapper: RouterWrapper });

    await act(async () => {
      await result.current.initialize({ id: 'learner-1' });
    });

    const state = useWritingTestStore.getState();
    expect(state.activeType).toBe('Task 1');
    expect(state.task).toMatchObject({
      activeType: 'Task 1',
      prompt: 'Task 1 prompt',
      sample_answer: 'Task 1 sample',
    });
  });

  it('opens the Learning Path recommended writing task for a fresh attempt', async () => {
    window.history.replaceState(
      {},
      '',
      '/writing-task?taskId=writing-task-1&new_attempt=true&writingTask=Task+2'
    );
    const { result } = renderHook(() => useWritingInitialization(), { wrapper: RouterWrapper });

    await act(async () => {
      await result.current.initialize({ id: 'learner-1' });
    });

    const state = useWritingTestStore.getState();
    expect(state.activeType).toBe('Task 2');
    expect(state.task).toMatchObject({
      activeType: 'Task 2',
      prompt: 'Task 2 prompt',
      sample_answer: 'Task 2 sample',
    });
  });

  it('restores partial pending reports without claiming the whole test is complete', async () => {
    window.history.replaceState({}, '', '/writing-task?sessionId=pending-session');
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: {
        task: selectedTask,
        session: {
          id: 'pending-session',
          evaluation_status: 'pending',
          is_completed: false,
          content_data: { ai_feedbacks: { 'Task 1': { overallBand: 8 } } },
          user_responses: [{ task1_response: 'saved report', task2_response: 'saved essay' }],
        },
      },
      error: null,
    });
    const { result } = renderHook(() => useWritingInitialization(), { wrapper: RouterWrapper });
    await act(async () => result.current.initialize({ id: 'learner-1' }));
    expect(useWritingTestStore.getState()).toMatchObject({
      isCompleted: false,
      drafts: { 'Task 1': 'saved report', 'Task 2': 'saved essay' },
      feedbacks: { 'Task 1': { overallBand: 8 } },
    });
  });

  const halfDone = {
    id: 'half-session',
    is_completed: true,
    score: 6.5,
    test_mode: 'practice',
    evaluation_status: 'complete',
    evaluation_version: CURRENT_EVALUATION_VERSION,
    content_data: { ai_feedbacks: { 'Task 2': { overallBand: 6.5 } } },
    user_responses: [{ task2_response: 'saved essay' }],
  };
  const openHalfDone = async (url) => {
    window.history.replaceState({}, '', url);
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: { task: selectedTask, session: halfDone },
      error: null,
    });
    const { result } = renderHook(() => useWritingInitialization(), { wrapper: RouterWrapper });
    await act(async () => result.current.initialize({ id: 'learner-1' }));
    return useWritingTestStore.getState();
  };

  it('opens "Write Task 1" on an empty Task 1, not on the Task 2 report', async () => {
    const state = await openHalfDone('/writing-task?sessionId=half-session&writingTask=Task%201');
    expect(state.activeType).toBe('Task 1');
    expect(state.currentFeedback).toBeNull();
    expect(state.task.prompt).toBe('Task 1 prompt');
  });

  it('opens View Feedback on the reviewed task with its own report', async () => {
    const state = await openHalfDone('/writing-task?sessionId=half-session&view=true');
    expect(state.activeType).toBe('Task 2');
    expect(state.currentFeedback).toEqual({ overallBand: 6.5 });
  });

  it('does not let an old empty draft in this tab erase an answer saved elsewhere', async () => {
    // This tab last saw the attempt before Task 1 was written on another device.
    useWritingTestStore.setState({
      sessionId: 'half-session',
      drafts: { 'Task 1': '', 'Task 2': 'saved essay' },
    });
    vi.spyOn(useWritingTestStore.getState(), 'validateSession');
    halfDone.user_responses = [
      { task1_response: 'written on the phone', task2_response: 'saved essay' },
    ];
    const state = await openHalfDone('/writing-task?sessionId=half-session&writingTask=Task%201');
    expect(state.drafts['Task 1']).toBe('written on the phone');
  });
});
