import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import WritingStudentPreview from '@/components/admin/tests/preview/WritingStudentPreview';
import { useWritingTestStore } from '@/features/testing/writing/store/useWritingTestStore';
import { registerWritingDraftFlusher } from '@/features/testing/writing/writingDraftFlush';
vi.mock('react-quill-new', () => ({
  default: ({ value, onChange }) => (
    <textarea
      aria-label="Local essay"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));
vi.mock('@/features/testing/writing/writingDraftFlush', () => ({
  registerWritingDraftFlusher: vi.fn(),
}));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
});
describe('Writing student preview isolation', () => {
  it('preserves local drafts when switching tasks and never touches a live essay or draft flusher', async () => {
    const tasks = {
      'Task 1': { prompt: 'Describe the chart.', instructions: '150 words' },
      'Task 2': { prompt: 'Discuss public transport.', instructions: '250 words' },
    };
    useWritingTestStore.setState({
      drafts: { 'Task 1': 'Original live essay', 'Task 2': 'Another live essay' },
      activeType: 'Task 2',
      timeRemaining: 2345,
      session: { id: 'live-writing' },
    });
    const before = JSON.stringify(useWritingTestStore.getState());
    const view = render(<WritingStudentPreview tasks={tasks} title="Preview" onClose={vi.fn()} />);
    const input = await screen.findByLabelText('Local essay');
    fireEvent.change(input, { target: { value: 'My preview response.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Task 2', exact: true }));
    fireEvent.click(screen.getByRole('button', { name: 'Task 1', exact: true }));
    expect(await screen.findByLabelText('Local essay')).toHaveValue('My preview response.');
    expect(screen.getByText('Local preview only')).toBeInTheDocument();
    expect(registerWritingDraftFlusher).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Finish preview', exact: true }));
    expect(screen.getByRole('status')).toHaveTextContent('not submitted');
    view.unmount();
    expect(JSON.stringify(useWritingTestStore.getState())).toBe(before);
  });
});
