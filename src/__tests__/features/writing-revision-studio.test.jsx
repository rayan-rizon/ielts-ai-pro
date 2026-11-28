import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({ record: null }));
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => {
      let patch = null;
      const query = {
        select: () => query,
        eq: () => query,
        update: (value) => ((patch = value), query),
        maybeSingle: async () => ({ data: db.record, error: null }),
        single: async () => {
          db.record = { ...db.record, ...patch };
          return { data: db.record, error: null };
        },
      };
      return query;
    },
  },
}));
const callCoach = vi.fn();
vi.mock('@/utils/api', () => ({ callEdgeFunction: (...args) => callCoach(...args) }));

import { WritingRevisionEditor } from '@/features/testing/writing/components/WritingTest/components/WritingCoach';

const ORIGINAL = 'Play matters for young children.\nSchools should protect it.';
const feedback = {
  overallBand: 6.5,
  evaluationVersion: 'v1',
  originalSource: '<p>Play matters for young children.</p><p>Schools should protect it.</p>',
  criteriaScores: { TaskResponse: 5.5, CoherenceAndCohesion: 6 },
  priorities: [{ criterion: 'Task Response', action: 'Explain why play matters.' }],
};
const open = () =>
  render(
    <WritingRevisionEditor
      session={{ id: 's1', user_id: 'u1' }}
      taskType="Task 2"
      feedback={feedback}
      originalHtml={feedback.originalSource}
      onBack={() => {}}
    />
  );
const type = async (text) => {
  const box = await screen.findByRole('textbox', { name: 'Your revised answer' });
  fireEvent.change(box, { target: { value: text } });
};
const checkButton = () => screen.getByRole('button', { name: 'Check my revision' });

describe('using the one revision check', () => {
  beforeEach(() => {
    callCoach.mockReset();
    db.record = { id: 'r1', revision_text: ORIGINAL, revision_history: [] };
  });

  it('waits for a change before it can be used', async () => {
    open();
    await screen.findByRole('textbox', { name: 'Your revised answer' });
    expect(checkButton()).toBeDisabled();
    expect(screen.getByText('Change your answer first.')).toBeInTheDocument();
  });

  it('will not spend the check on a cut-off sentence', async () => {
    open();
    await type(`${ORIGINAL} this is the most`);
    expect(checkButton()).toBeDisabled();
    expect(screen.getByText(/Finish your last sentence/)).toBeInTheDocument();
    expect(screen.getByText('+4 words')).toBeInTheDocument();
  });

  it('asks first, says what it costs, and warns that the edit is small', async () => {
    open();
    await type(`${ORIGINAL} This is vital.`);
    fireEvent.click(checkButton());
    expect(callCoach).not.toHaveBeenCalled();
    const confirm = screen.getByRole('group', { name: 'Use your one check?' });
    expect(confirm).toHaveTextContent('1 writing task review');
    expect(confirm).toHaveTextContent('rarely raises a score');
    expect(confirm).toHaveTextContent('under 250 words');

    fireEvent.click(within(confirm).getByRole('button', { name: 'Keep editing' }));
    expect(screen.queryByRole('group', { name: 'Use your one check?' })).not.toBeInTheDocument();
    expect(callCoach).not.toHaveBeenCalled();
  });

  it('checks only after the learner confirms', async () => {
    callCoach.mockResolvedValue({ data: { ...db.record } });
    open();
    await type(`${ORIGINAL} This is vital.`);
    fireEvent.click(checkButton());
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Use my check' })));
    await waitFor(() => expect(callCoach).toHaveBeenCalledTimes(1));
    expect(callCoach).toHaveBeenCalledWith('writing-coach', {
      operation: 'recheck',
      sessionId: 's1',
      taskType: 'Task 2',
    });
  });

  it('explains a lower score with the marker’s note and the words that changed', async () => {
    const draft = `${ORIGINAL} this is the most`;
    db.record = {
      id: 'r1',
      revision_text: draft,
      revision_scored_text: draft,
      revision_history: [{ version: 1, text: draft, feedback: { overallBand: 6 } }],
      revision_feedback: {
        overallBand: 6,
        evaluationVersion: 'v1',
        criteriaScores: { TaskResponse: 5.5, CoherenceAndCohesion: 5 },
        priorities: [
          {
            criterion: 'Coherence & Cohesion',
            issue: 'The response ends abruptly.',
            evidenceText: 'this is the most',
          },
        ],
      },
    };
    open();
    const result = await screen.findByRole('region', { name: 'Your revision check' });
    expect(result).toHaveTextContent('6.5');
    expect(result).toHaveTextContent('6.0');
    expect(within(result).getByText('The response ends abruptly.')).toBeInTheDocument();
    expect(result).toHaveTextContent('about half a band');

    const changes = screen.getByRole('region', { name: 'What you changed' });
    expect(changes.querySelector('ins')).toHaveTextContent('this is the most');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Check my revision' })).not.toBeInTheDocument();
    expect(screen.queryByText('Earlier checks')).not.toBeInTheDocument();
  });
});
