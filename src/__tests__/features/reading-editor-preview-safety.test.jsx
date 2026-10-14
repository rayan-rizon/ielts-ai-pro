import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { aiReadingFixture } from '../helpers/aiReadingFixture';
import {
  aiReadingDraftSections,
  validateAiReadingDraft,
} from '../../../supabase/functions/_shared/aiReadingDraft';
import ReadingTestEditor from '@/components/admin/tests/creation/ReadingTestEditor';
vi.mock('@/components/admin/tests/preview/ReadingStudentPreview', () => ({
  default: ({ onClose }) => <button onClick={onClose}>Close test preview</button>,
}));
vi.mock('@/lib/r2', () => ({ uploadToR2: vi.fn() }));
vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn() } }));
beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
  vi.useRealTimers();
});
const initialData = {
  id: 'existing-live-test',
  title: 'Live Reading',
  test_type: 'reading',
  is_active: true,
  content: JSON.stringify([
    {
      title: 'Passage 1',
      content: 'Original passage.',
      question_groups: [
        {
          id: 'group1',
          instructions: 'TRUE/FALSE/NOT GIVEN',
          questions: [
            {
              id: 'existing-question',
              type: 'true_false_not_given',
              question_text: 'Original statement',
              options: [],
              correct_answer: 'TRUE',
            },
          ],
        },
      ],
    },
  ]),
};
describe('Reading editor full preview safety', () => {
  it('does not save merely hydrating composite question editors', async () => {
    vi.useFakeTimers();
    const save = vi.fn();
    const content = JSON.stringify(
      aiReadingDraftSections(validateAiReadingDraft(aiReadingFixture(), { expectedQuestions: 13 }))
    );
    render(
      <ReadingTestEditor
        initialData={{ ...initialData, content }}
        onSave={save}
        onCancel={vi.fn()}
      />
    );
    await act(async () => {
      vi.advanceTimersByTime(6000);
    });
    expect(save).not.toHaveBeenCalled();
  });
  it('keeps an existing official title intact when merely opening the test', async () => {
    vi.useFakeTimers();
    const save = vi.fn();
    render(
      <ReadingTestEditor
        initialData={{
          ...initialData,
          title: 'Published custom Cambridge title',
          is_official_cambridge: true,
          cambridge_year: 2025,
          cambridge_test_number: 2,
        }}
        onSave={save}
        onCancel={vi.fn()}
      />
    );
    await act(async () => {
      vi.advanceTimersByTime(6000);
    });
    expect(screen.getByDisplayValue('Published custom Cambridge title')).toBeInTheDocument();
    expect(save).not.toHaveBeenCalled();
  });
  it('does not autosave an unchanged live test, including after opening and closing full preview', async () => {
    vi.useFakeTimers();
    const save = vi.fn();
    render(<ReadingTestEditor initialData={initialData} onSave={save} onCancel={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Preview', exact: true })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Full preview' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'AI explanations' })).toBeInTheDocument();
    await act(async () => {
      vi.advanceTimersByTime(6000);
    });
    expect(save).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Full preview' }));
    });
    await act(async () => {
      vi.advanceTimersByTime(6000);
    });
    expect(save).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Close test preview' }));
    });
    await act(async () => {
      vi.advanceTimersByTime(6000);
    });
    expect(save).not.toHaveBeenCalled();
  });
});
