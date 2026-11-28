import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase', () => ({ supabase: {} }));
vi.mock('@/features/testing/shared/quota/useObjectiveTestQuota', () => ({
  useQuotaLock: () => ({ locked: false, open: vi.fn() }),
}));

import { CURRENT_EVALUATION_VERSION } from '@/features/testing/shared/evaluationVersion';
import { MemoizedWritingCard } from '@/features/testing/writing/WritingGrid';
import WritingCardListView from '@/features/testing/writing/WritingCardListView';

const paper = { id: 'p1', title: 'Test 4', cambridge_test_number: 4, access_tier: 'free' };
const content = (feedbacks) => ({
  content: JSON.stringify({ 'Task 1': { prompt: 'a' }, 'Task 2': { prompt: 'b' } }),
  ai_feedbacks: feedbacks,
});
const attempt = (feedbacks, over = {}) => ({
  id: 's1',
  passage_id: 'p1',
  is_completed: true,
  score: 6.5,
  evaluation_status: 'complete',
  evaluation_version: CURRENT_EVALUATION_VERSION,
  test_mode: 'practice',
  content_data: content(feedbacks),
  ...over,
});
const onlyTask2 = { 'Task 2': { overallBand: 6.5 } };
const both = { 'Task 1': { overallBand: 7 }, 'Task 2': { overallBand: 6.5 } };

const card = (latestSession) =>
  render(
    <MemoryRouter>
      <MemoizedWritingCard
        test={paper}
        latestSession={latestSession}
        takenCount={0}
        duration={60}
        wordLimit={400}
        user={{ id: 'u1', subscription_tier: 'premium' }}
        hasMounted
      />
    </MemoryRouter>
  );

describe('a library card for a half-finished test', () => {
  it('says one of two tasks is done and which one is left', () => {
    card(attempt(onlyTask2));
    expect(screen.getByText('1 of 2 tasks')).toBeInTheDocument();
    expect(screen.queryByText('Completed')).not.toBeInTheDocument();
    expect(screen.getByText('Task 2 score')).toBeInTheDocument();
    expect(screen.getByText('Task 1 not written yet')).toBeInTheDocument();
  });

  it('links straight to the unwritten task in the same attempt', () => {
    card(attempt(onlyTask2));
    expect(screen.getByRole('link', { name: 'Write Task 1' })).toHaveAttribute(
      'href',
      '/writing-task?sessionId=s1&writingTask=Task%201'
    );
    expect(screen.getByRole('link', { name: /View Feedback/ })).toBeInTheDocument();
  });

  it('shows the count for an exam attempt without offering to write', () => {
    card(attempt(onlyTask2, { test_mode: 'mock' }));
    expect(screen.getByText('1 of 2 tasks')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Write Task 1' })).not.toBeInTheDocument();
  });

  it('stays Completed when both tasks are reviewed', () => {
    card(attempt(both));
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Your score')).toBeInTheDocument();
    expect(screen.queryByText('1 of 2 tasks')).not.toBeInTheDocument();
  });

  it('does not call a book done while a test has a task left', () => {
    render(
      <MemoryRouter>
        <WritingCardListView
          group={{ label: 'Book 21', subtitle: '2026', tests: [paper] }}
          sessions={[attempt(onlyTask2)]}
          userData={{ id: 'u1', subscription_tier: 'premium' }}
          hasMounted
        />
      </MemoryRouter>
    );
    expect(screen.queryByText('All Done')).not.toBeInTheDocument();
    expect(screen.getByText('0/1 Completed')).toBeInTheDocument();
  });

  it('shows the same in the volume list', () => {
    render(
      <MemoryRouter>
        <WritingCardListView
          group={{ label: 'Book 21', subtitle: '2026', tests: [paper] }}
          sessions={[attempt(onlyTask2)]}
          userData={{ id: 'u1', subscription_tier: 'premium' }}
          hasMounted
        />
      </MemoryRouter>
    );
    expect(screen.getByText('1/2 tasks')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Write Task 1' })).toHaveAttribute(
      'href',
      '/writing-task?sessionId=s1&writingTask=Task%201'
    );
  });
});
