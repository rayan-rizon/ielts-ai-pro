import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Reading from '@/components/admin/tests/creation/ReadingTestEditor';
import Listening from '@/components/admin/tests/creation/ListeningTestEditor';
import Writing from '@/components/admin/tests/creation/WritingTestEditor';
import Speaking from '@/components/admin/tests/creation/SpeakingTestEditor';
vi.mock('react-quill-new', () => ({
  default: ({ value, onChange }) => (
    <textarea
      aria-label="Rich text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));
vi.mock('@/lib/r2', () => ({ uploadToR2: vi.fn() }));
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: () => ({ eq: () => ({ order: async () => ({ data: [], error: null }) }) }),
    })),
  },
}));
beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
describe('Undo/Redo in all actual editors', () => {
  it.each([
    ['reading', Reading],
    ['listening', Listening],
    ['writing', Writing],
    ['speaking', Speaking],
  ])('restores a %s title without submitting a save', async (test_type, Editor) => {
    const save = vi.fn();
    render(
      <Editor
        initialData={{
          id: 'existing',
          test_type,
          title: 'Original title',
          is_active: true,
          content:
            test_type === 'writing'
              ? '{}'
              : JSON.stringify([
                  {
                    title: 'Section 1',
                    content: '',
                    audio_url: '',
                    transcript: '',
                    question_groups: [],
                  },
                ]),
        }}
        onSave={save}
        onCancel={vi.fn()}
      />
    );
    await act(async () => {});
    const title = screen.getByRole('textbox', { name: 'Test title' });
    expect(title).toHaveValue('Original title');
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled();
    fireEvent.change(title, { target: { value: 'Updated title' } });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Undo' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(title).toHaveValue('Original title');
    fireEvent.click(screen.getByRole('button', { name: 'Redo' }));
    expect(title).toHaveValue('Updated title');
    expect(save).not.toHaveBeenCalled();
  });
});
