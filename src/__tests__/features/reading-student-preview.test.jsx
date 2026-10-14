import React from 'react';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ReadingStudentPreview from '@/components/admin/tests/preview/ReadingStudentPreview';
import {
  buildReadingPreview,
  previewPassageEvidence,
} from '@/components/admin/tests/preview/readingPreviewData';
import { aiReadingFixture } from '../helpers/aiReadingFixture';
import {
  aiReadingDraftSections,
  validateAiReadingDraft,
} from '../../../supabase/functions/_shared/aiReadingDraft';
import { useReadingTestStore } from '@/features/testing/reading/store/useReadingTestStore';
const dbCalls = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error('Preview must not access a database.');
  })
);
vi.mock('@/lib/supabase', () => ({
  supabase: { from: dbCalls, rpc: dbCalls, functions: { invoke: dbCalls } },
  getSupabaseClient: dbCalls,
}));
beforeEach(() => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
  );
  vi.stubGlobal('scrollTo', vi.fn());
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});
const sections = () =>
  aiReadingDraftSections(validateAiReadingDraft(aiReadingFixture(), { expectedQuestions: 13 }));

describe('full Reading student preview', () => {
  it('keeps screenshot evidence visible on opening full preview', () => {
    const raw = aiReadingFixture();
    raw.sections[0].highlights = [{ text: 'Ada planted roses in spring.', question_numbers: [1] }];
    const source = aiReadingDraftSections(validateAiReadingDraft(raw, { expectedQuestions: 13 }));
    const view = render(
      <ReadingStudentPreview
        sections={source}
        showSourceHighlights
        title="Garden"
        onClose={vi.fn()}
      />
    );
    expect(view.container.ownerDocument.querySelector('.answer-marker-badge')).toHaveTextContent(
      'Q1'
    );
  });
  it('uses the student passage, question and table/flowchart renderers without writes', () => {
    render(
      <ReadingStudentPreview sections={sections()} title="Garden Reading" onClose={vi.fn()} />
    );
    expect(
      screen.getByRole('dialog', { name: 'Full Reading student preview' })
    ).toBeInTheDocument();
    expect(screen.getByText('The garden')).toBeInTheDocument();
    expect(screen.getByText('Garden Reading')).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getAllByTestId('flowchart-step')).toHaveLength(2);
    expect(screen.getByText('60:00')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Report/ })).not.toBeInTheDocument();
    expect(dbCalls).not.toHaveBeenCalled();
  });
  it('keeps reset and close independent of the active learner session and input snapshot', () => {
    const source = sections();
    const before = JSON.stringify(source);
    useReadingTestStore.setState({
      answers: { 'live-question': 'Original' },
      session: { id: 'live-session' },
      timeRemaining: 1234,
    });
    const state = useReadingTestStore.getState();
    const close = vi.fn();
    render(<ReadingStudentPreview sections={source} title="Garden Reading" onClose={close} />);
    fireEvent.click(screen.getByRole('button', { name: 'Reset preview' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close student preview' }));
    expect(close).toHaveBeenCalled();
    expect(useReadingTestStore.getState().answers).toBe(state.answers);
    expect(useReadingTestStore.getState().session).toBe(state.session);
    expect(useReadingTestStore.getState().timeRemaining).toBe(1234);
    expect(JSON.stringify(source)).toBe(before);
    expect(dbCalls).not.toHaveBeenCalled();
  });
  it('preserves all passages and globally numbered groups in the preview snapshot', () => {
    const source = sections();
    const second = structuredClone(source[0]);
    source[0].question_groups = source[0].question_groups.slice(0, 2);
    second.title = 'Second passage';
    second.question_groups = second.question_groups.slice(2);
    const output = buildReadingPreview([source[0], second]);
    expect(output.testData.sections).toHaveLength(2);
    expect(output.allQuestions[2].question_number).toBe(3);
    expect(output.allQuestions[2].section).toBe(2);
    expect(output.testData.total_questions).toBe(13);
  });
  it('adds explanation evidence markers only to the local rendered passage', () => {
    const snapshot = buildReadingPreview(sections());
    const source = snapshot.testData.sections[0].content;
    expect(previewPassageEvidence(snapshot.testData.sections[0], snapshot.allQuestions)).toContain(
      '[answer q='
    );
    expect(snapshot.testData.sections[0].content).toBe(source);
    expect(source).not.toContain('[answer q=');
  });
});
