import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { describe, expect, it, vi } from 'vitest';
import { DetailedAnalysisTab } from '@/components/results/test-results-modal/DetailedAnalysisTab';

vi.mock('@/services/premiumAnalysisService', () => ({
  fetchRecentResultSessions: vi.fn(() => Promise.resolve([])),
  saveResultFocusPlan: vi.fn(() => Promise.resolve({ path_id: 'p1' })),
}));

const result = {
  bandScore: 5.5,
  correctAnswers: 7,
  totalQuestions: 10,
  typeStats: {
    note_completion: { correct: 3, total: 6 },
    multiple_choice: { correct: 4, total: 4 },
  },
  sectionStats: [
    { correct: 3, total: 5 },
    { correct: 4, total: 5 },
  ],
  passageTimes: { 0: 1180, 1: 1220 },
  answerChangeCounts: { q1: 2, q3: 1 },
  errorPatterns: { confidenceIndex: 72, indecisionScore: 33 },
  responseDetails: [
    {
      questionId: 'q1',
      questionNumber: 1,
      type: 'note_completion',
      sectionIndex: 0,
      userAnswer: 'enviroment',
      correctAnswer: 'environment',
      isCorrect: false,
      wasFlagged: true,
    },
    {
      questionId: 'q2',
      questionNumber: 2,
      type: 'note_completion',
      sectionIndex: 0,
      userAnswer: '',
      correctAnswer: 'river',
      isCorrect: null,
      wasFlagged: false,
    },
    {
      questionId: 'q3',
      questionNumber: 3,
      type: 'note_completion',
      sectionIndex: 0,
      userAnswer: 'hill',
      correctAnswer: 'mountain',
      isCorrect: false,
      wasFlagged: false,
    },
    ...Array.from({ length: 7 }, (_, index) => ({
      questionId: `correct-${index}`,
      questionNumber: index + 4,
      type: index < 3 ? 'note_completion' : 'multiple_choice',
      sectionIndex: index < 2 ? 0 : 1,
      userAnswer: 'A',
      correctAnswer: 'A',
      isCorrect: true,
      wasFlagged: false,
    })),
  ],
};

/**
 * The real parent (`TestResultsModal`) mounts a `TooltipProvider`; rendering the
 * tab in isolation has to supply the same context.
 */
function renderAnalysis(props) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <TooltipProvider>
          <DetailedAnalysisTab
            testResults={result}
            testType="reading"
            onUpgrade={() => {}}
            onReviewQuestion={() => {}}
            {...props}
          />
        </TooltipProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('premium analysis UI', () => {
  it('answers why marks were lost, and leaves attribution to the Overview tab', () => {
    renderAnalysis({ isPremium: true });

    // Diagnosis, behaviour and pacing all live here.
    expect(screen.getByText('Your gap to target')).toBeInTheDocument();
    expect(screen.getByText('Review these answers first')).toBeInTheDocument();
    expect(screen.getByText('How you worked')).toBeInTheDocument();
    expect(screen.getByText('How the paper unfolded')).toBeInTheDocument();

    // The two headings that used to restate the Overview tab are gone: the type
    // loss grid ("Where you lost marks") and a "Passage performance" card that
    // duplicated the Overview card of the same name over the same sectionStats.
    expect(screen.queryByText('Where you lost marks')).not.toBeInTheDocument();
    expect(screen.queryByText('Passage performance')).not.toBeInTheDocument();
    expect(screen.queryByText('Answer mix')).not.toBeInTheDocument();
    expect(screen.queryByText('Best recovery opportunity')).not.toBeInTheDocument();
  });

  it('renders the working-habit signals the stored result already carried', () => {
    renderAnalysis({ isPremium: true });

    expect(screen.getByText('Answer confidence')).toBeInTheDocument();
    expect(screen.getByText('Second-guessing')).toBeInTheDocument();
    expect(screen.getByText('Answers changed')).toBeInTheDocument();
    expect(screen.getByText('Flagged for review')).toBeInTheDocument();
    expect(screen.getByText('Near misses')).toBeInTheDocument();
    expect(screen.getByText('Left blank')).toBeInTheDocument();
  });

  it('never lets the first card of a stacked pair claim the whole stretched row', () => {
    renderAnalysis({ isPremium: true });

    // `h-full` on the first item of a `flex-col` stack forces it to 100% of
    // whatever height the grid row stretched the *column* to — not its own
    // content height — leaving nothing for the card stacked below it. That
    // inflated "How you worked" and "Your score trend" into the oversized
    // boxes seen in review. Only the *second* card of each pair (the one
    // meant to absorb the leftover space) may carry `h-full`.
    const behaviourCard = screen.getByText('How you worked').closest('section');
    expect(behaviourCard.className).not.toMatch(/(?:^|\s)h-full(?:\s|$)/);

    const flowCard = screen.getByText('How the paper unfolded').closest('section');
    expect(flowCard.className).toMatch(/(?:^|\s)h-full(?:\s|$)/);

    const trendCard = screen.getByText('Your score trend').closest('section');
    expect(trendCard.className).not.toMatch(/(?:^|\s)h-full(?:\s|$)/);

    const planCard = screen.getByText('Your 7-day practice plan').closest('section');
    expect(planCard.className).toMatch(/(?:^|\s)h-full(?:\s|$)/);
  });

  it('keeps diagnosis free and puts coaching signals behind the paid gate', () => {
    const onUpgrade = vi.fn();
    renderAnalysis({ isPremium: false, onUpgrade });

    // Free learners keep enough to act on this result on their own.
    expect(screen.getByText('Your gap to target')).toBeInTheDocument();
    expect(screen.getByText('Review these answers first')).toBeInTheDocument();
    expect(screen.getByText('How the paper unfolded')).toBeInTheDocument();

    // Paid: working habits, skill trends, score trend, seven-day plan, and the
    // per-passage pacing detail inside the section-flow card.
    expect(screen.getByText('See how you worked, not just what you scored')).toBeInTheDocument();
    expect(screen.queryByText('How you worked')).not.toBeInTheDocument();
    expect(screen.getByText('See whether a weakness is new or permanent')).toBeInTheDocument();
    expect(screen.queryByText('Skills across your attempts')).not.toBeInTheDocument();
    expect(screen.getByText('Track this module across every attempt')).toBeInTheDocument();
    expect(screen.queryByText('Your score trend')).not.toBeInTheDocument();
    expect(screen.getByText('Turn this result into a longer-term plan')).toBeInTheDocument();
    expect(screen.queryByText('Your 7-day practice plan')).not.toBeInTheDocument();
    expect(screen.getByText('See where the clock went')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: /See upgrade/i })[0]);
    expect(onUpgrade).toHaveBeenCalled();
  });

  it('shows the trend card to paid learners, honestly empty without history', () => {
    renderAnalysis({ isPremium: true });

    expect(screen.getByText('Skills across your attempts')).toBeInTheDocument();
    // No prior sessions are loaded, so it must say so rather than invent a trend.
    expect(screen.getByText(/Not enough history yet/)).toBeInTheDocument();
  });

  it('renders the paid coaching flow and routes mistake review', () => {
    const onReviewQuestion = vi.fn();
    renderAnalysis({ isPremium: true, onReviewQuestion });

    expect(screen.getByText('Your 7-day practice plan')).toBeInTheDocument();
    expect(screen.getByText('Review 3 priority mistakes')).toBeInTheDocument();
    expect(screen.queryByText('Mini retest and result comparison')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show all 7 days' }));
    expect(screen.getByText('Mini retest and result comparison')).toBeInTheDocument();

    // This card lives in a narrower stacked column, not the full page width —
    // `lg:`/`xl:` breakpoints key off viewport size, so `xl:grid-cols-7` used
    // to cram all seven days into one row of that narrower column regardless
    // of how little space it actually had, truncating every title to a stray
    // character. The cap now tops out at 3 columns so a wide viewport can't
    // reintroduce that.
    const planGrid = screen.getByText('Mini retest and result comparison').closest('.grid');
    expect(planGrid.className).not.toMatch(/grid-cols-(4|7)/);

    fireEvent.click(screen.getAllByRole('button', { name: /^Review/i })[0]);
    expect(onReviewQuestion).toHaveBeenCalledWith(1);
  });

  it('backs every truncated title with a tooltip that carries the full text', () => {
    renderAnalysis({ isPremium: true });

    // Radix sets `data-state` on a tooltip trigger synchronously, before any
    // hover — a reliable, hover-timing-free way to confirm a tooltip actually
    // wraps a given truncated label, rather than just checking the text is
    // present (which the truncated version already satisfies on its own).
    const isTooltipTrigger = (el) => el?.getAttribute('data-state') === 'closed';

    // The 7-day plan cards: "Note Completion technique practice" truncates in
    // a 3-column grid, and used to have no way to read the full title.
    const planCardTitle = screen.getByText('Note Completion technique practice');
    expect(isTooltipTrigger(planCardTitle.closest('[data-state]'))).toBe(true);

    // The mistake queue's reason line, distinct from the "Near miss 1" style
    // summary counts in the bucket legend above it, which share the same words.
    const mistakeReason = screen.getByText('Possible spelling or format near miss');
    expect(isTooltipTrigger(mistakeReason.closest('[data-state]'))).toBe(true);
  });

  it('keeps legacy plans on-screen but disables saving', () => {
    renderAnalysis({ isPremium: true, sessionId: null });
    expect(screen.getByRole('button', { name: 'Save plan' })).toBeDisabled();
    expect(screen.getByText(/This older result can show the plan/)).toBeInTheDocument();
  });

  it('swaps passage pacing for part-level loss concentration on listening', () => {
    renderAnalysis({ isPremium: true, testType: 'listening' });

    expect(screen.getByText('How the paper unfolded')).toBeInTheDocument();
    // Listening is paced by the audio, so no clock is claimed for it.
    expect(screen.queryByText(/Time per part/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Per-passage timing/i)).not.toBeInTheDocument();
    expect(screen.getByText('Where the losses cluster')).toBeInTheDocument();
    expect(screen.getByText(/cost the most, at/)).toBeInTheDocument();
  });

  it('draws the trend chart with a readable band scale', async () => {
    const { fetchRecentResultSessions } = await import('@/services/premiumAnalysisService');
    fetchRecentResultSessions.mockResolvedValueOnce([
      { score: 6.5, completed_at: '2026-02-01T00:00:00Z' },
      { score: 5.0, completed_at: '2026-01-20T00:00:00Z' },
    ]);

    renderAnalysis({ isPremium: true, userId: 'u1', sessionId: 's1' });

    expect(await screen.findByText('Your score trend')).toBeInTheDocument();
    // The read-outs the line itself cannot state precisely.
    expect(await screen.findByText('Best')).toBeInTheDocument();
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Latest')).toBeInTheDocument();
    // Scores run 5.0–6.5, so the axis pads out to whole half-bands around them.
    expect(await screen.findByText('7.0')).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();
    // Each attempt is its own labelled, focusable point.
    expect(screen.getAllByRole('button', { name: /band \d\.\d$/i }).length).toBeGreaterThanOrEqual(
      3
    );
  });

  it('does not narrate a shape when the paper scored nothing', () => {
    renderAnalysis({
      isPremium: true,
      testResults: {
        ...result,
        correctAnswers: 0,
        sectionStats: [
          { correct: 0, total: 5 },
          { correct: 0, total: 5 },
        ],
      },
    });

    // "Passage 1 was your strongest at 0%" is true of the maximum and useless
    // to read, so an all-zero paper says so plainly instead.
    expect(screen.queryByText(/was your strongest at/)).not.toBeInTheDocument();
    expect(screen.getByText('Nothing scored')).toBeInTheDocument();
  });
});
