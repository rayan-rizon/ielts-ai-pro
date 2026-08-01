import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';
import SessionLog from '@/features/dashboard/components/SessionLog';
import SkillMasteryPanel from '@/features/dashboard/components/SkillMasteryPanel';
import StatBand from '@/features/dashboard/components/StatBand';

function Wrapper({ children }) {
  return (
    <MemoryRouter>
      <TooltipProvider>{children}</TooltipProvider>
    </MemoryRouter>
  );
}

describe('Learner dashboard accuracy', () => {
  it('opens Writing feedback with the query-string contract and shows measured time only', () => {
    const sessions = Array.from({ length: 8 }, (_, index) => ({
      id: `session-${index + 1}`,
      test_type: index === 0 ? 'writing' : 'reading',
      score: index < 6 ? 6 : 9,
      completed_at: `2026-08-0${index + 1}T10:00:00.000Z`,
      duration_seconds: index === 0 ? 75 : null,
      duration_minutes: 60,
      passage: { title: index === 0 ? 'Academic Task 2' : `Reading ${index}` },
    }));

    render(<SessionLog recentTests={sessions} />, { wrapper: Wrapper });

    const writingLink = screen.getByRole('link', { name: /Academic Task 2/i });
    expect(writingLink).toHaveAttribute('href', '/writing-task?sessionId=session-1&view=true');
    expect(writingLink).toHaveTextContent(/writing · Aug 1 · 1m/i);
    expect(writingLink).not.toHaveTextContent(/60m/i);
    expect(document.body).toHaveTextContent(/6\.0 average across the last 6/i);
  });

  it('marks mastery values as percentages', () => {
    render(
      <SkillMasteryPanel
        skillProficiency={[
          {
            module: 'reading',
            skill_code: 'reading_matching_features',
            mastery_probability: 0.25,
            practice_count: 20,
            correct_count: 5,
          },
        ]}
      />,
      { wrapper: Wrapper }
    );

    expect(screen.getByText('25%')).toBeInTheDocument();
  });

  it('keeps a missing target missing and displays a genuine measured zero band', () => {
    render(
      <StatBand
        stats={{
          avgScore: '0.0',
          targetScore: null,
          totalTests: 1,
          measuredTests: 1,
          abandonedTests: 0,
          streak: 0,
          todayMinutes: 0,
        }}
        weeklyProgress={[]}
        user={{}}
      />,
      { wrapper: Wrapper }
    );

    expect(screen.getByText('0.0')).toBeInTheDocument();
    expect(screen.getByText('set a target band')).toBeInTheDocument();
    expect(screen.queryByText('target 7.0')).not.toBeInTheDocument();
  });
});
