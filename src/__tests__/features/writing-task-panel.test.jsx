import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TaskPanel } from '@/features/testing/writing/components/WritingTest/components/TaskPanel';
import { useWritingTestStore } from '@/features/testing/writing/store/useWritingTestStore';

const task1 = {
  prompt: '<p>Task 1 prompt: describe the chart.</p>',
  instructions: '<p>Spend about 20 minutes and write at least 150 words.</p>',
  sample_answer: '<p>Task 1 sample answer.</p>',
};

const task2 = {
  prompt: '<p>Task 2 prompt: discuss both views.</p>',
  instructions: '<p>Spend about 40 minutes and write at least 250 words.</p>',
  sample_answer: '<p>Task 2 sample answer.</p>',
};

describe('Writing task panel', () => {
  beforeEach(() => {
    useWritingTestStore.setState({
      activeType: 'Task 1',
      compositeTasks: { 'Task 1': task1, 'Task 2': task2 },
    });
  });

  it('uses the active task data when a stale task prop is received', () => {
    const setShowSample = vi.fn();
    render(
      <TaskPanel
        task={{ ...task2, title: 'Writing test' }}
        showSample={false}
        setShowSample={setShowSample}
      />
    );

    expect(screen.getByText('Task 1 prompt: describe the chart.')).toBeInTheDocument();
    expect(screen.queryByText('Task 2 prompt: discuss both views.')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /sample answer/i }));
    expect(setShowSample).toHaveBeenCalledWith(true);
  });

  it('shows the active task sample answer', () => {
    render(<TaskPanel task={{ ...task2 }} showSample setShowSample={vi.fn()} />);

    expect(screen.getByText('Task 1 sample answer.')).toBeInTheDocument();
    expect(screen.queryByText('Task 2 sample answer.')).not.toBeInTheDocument();
  });
});
