import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Passage } from '@/features/testing/shared/services/Passage';
import { useWritingInitialization } from '@/features/testing/writing/components/WritingTest/hooks/useWritingInitialization';
import { useWritingTestStore } from '@/features/testing/writing/store/useWritingTestStore';

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
});
