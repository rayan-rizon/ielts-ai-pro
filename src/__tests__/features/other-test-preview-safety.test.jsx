import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ListeningTestEditor from '@/components/admin/tests/creation/ListeningTestEditor';
import WritingTestEditor from '@/components/admin/tests/creation/WritingTestEditor';
import SpeakingTestEditor from '@/components/admin/tests/creation/SpeakingTestEditor';
import ListeningStudentPreview from '@/components/admin/tests/preview/ListeningStudentPreview';
import { useListeningTestStore } from '@/features/testing/listening/store/useListeningTestStore';
import {
  aiListeningDraftSections,
  validateAiListeningDraft,
} from '../../../supabase/functions/_shared/aiListeningDraft';
import { aiListeningFixture } from '../helpers/aiListeningFixture';
vi.mock('react-quill-new', () => ({
  default: ({ value, onChange }) => (
    <textarea
      aria-label="Writing content"
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
vi.mock('@/components/admin/tests/preview/WritingStudentPreview', () => ({
  default: ({ onClose }) => <button onClick={onClose}>Close writing preview</button>,
}));
vi.mock('@/components/admin/tests/preview/SpeakingStudentPreview', () => ({
  default: ({ onClose }) => <button onClick={onClose}>Close speaking preview</button>,
}));
beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  Element.prototype.scrollIntoView = vi.fn();
  window.matchMedia = vi.fn(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});
const metadata = {
  id: 'existing',
  title: 'Existing published title',
  is_active: true,
  is_official_cambridge: true,
  cambridge_year: 2025,
  cambridge_test_number: 2,
  access_tier: 'pro',
};
describe('all editor previews preserve existing publication and content', () => {
  it.each([true, false])(
    'does not autosave Writing on open/preview and preserves is_active=%s on save',
    async (active) => {
      vi.useFakeTimers();
      const save = vi.fn().mockResolvedValue({ id: 'existing' });
      const initial = {
        ...metadata,
        is_active: active,
        test_type: 'writing',
        content: JSON.stringify({
          'Task 1': { prompt: 'Describe the chart.', instructions: '150 words' },
          'Task 2': { prompt: 'Discuss transport.', instructions: '250 words' },
        }),
      };
      render(<WritingTestEditor initialData={initial} onSave={save} onCancel={vi.fn()} />);
      await act(async () => {
        vi.advanceTimersByTime(11000);
      });
      expect(save).not.toHaveBeenCalled();
      expect(screen.getByDisplayValue(metadata.title)).toBeInTheDocument();
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Full preview' }));
      });
      await act(async () => {
        vi.advanceTimersByTime(11000);
      });
      expect(save).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole('button', { name: 'Close writing preview' }));
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));
      });
      expect(save.mock.calls[0][0].is_active).toBe(active);
    }
  );
  it('opens Listening unchanged and its full preview cannot mutate the learner store', async () => {
    const sections = aiListeningDraftSections(
      validateAiListeningDraft(aiListeningFixture(), { expectedQuestions: 8 })
    );
    const save = vi.fn();
    render(
      <ListeningTestEditor
        initialData={{ ...metadata, test_type: 'listening', content: JSON.stringify(sections) }}
        onSave={save}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByDisplayValue(metadata.title)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Preview', exact: true })).not.toBeInTheDocument();
    const before = JSON.stringify(useListeningTestStore.getState());
    fireEvent.click(screen.getByRole('button', { name: 'Full preview' }));
    await screen.findByRole('dialog', { name: 'Full Listening student preview' });
    fireEvent.click(screen.getByRole('button', { name: 'Finish preview' }));
    expect(await screen.findByRole('status')).toHaveTextContent('0/8');
    expect(JSON.stringify(useListeningTestStore.getState())).toBe(before);
    expect(save).not.toHaveBeenCalled();
  });
  it('preserves Speaking title and offers full preview without starting a session', async () => {
    const save = vi.fn();
    render(
      <SpeakingTestEditor
        initialData={{ ...metadata, test_type: 'speaking' }}
        onSave={save}
        onCancel={vi.fn()}
      />
    );
    expect(await screen.findByDisplayValue(metadata.title)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Full preview' }));
    await screen.findByRole('button', { name: 'Close speaking preview' });
    expect(save).not.toHaveBeenCalled();
  });
});
