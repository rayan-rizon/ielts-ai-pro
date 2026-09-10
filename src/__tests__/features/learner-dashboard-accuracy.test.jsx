import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';
import SessionLog from '@/features/dashboard/components/SessionLog';
import SkillMasteryPanel from '@/features/dashboard/components/SkillMasteryPanel';
import StatBand from '@/features/dashboard/components/StatBand';

import ModuleMeters from '@/features/dashboard/components/ModuleMeters';
import OverallBandPanel from '@/features/dashboard/components/OverallBandPanel';
import BandTrajectoryChart from '@/features/dashboard/components/BandTrajectoryChart';
import WeeklyMomentumChart from '@/features/dashboard/components/WeeklyMomentumChart';

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

  it('renders all 4 module meters in zero-state with direct navigation and guidance', () => {
    render(<ModuleMeters stats={{ moduleAverages: {} }} recentTests={[]} />, { wrapper: Wrapper });

    expect(screen.getByText('Choose any skill to establish your baseline')).toBeInTheDocument();
    expect(screen.getByText('Reading')).toBeInTheDocument();
    expect(screen.getByText('Listening')).toBeInTheDocument();
    expect(screen.getByText('Writing')).toBeInTheDocument();
    expect(screen.getByText('Speaking')).toBeInTheDocument();
    expect(screen.getByText('complete any test to begin module comparison')).toBeInTheDocument();
  });

  it('renders OverallBandPanel zero-state with 0 of 4 pill and clickable module chips', () => {
    render(<OverallBandPanel stats={{ moduleAverages: {} }} />, { wrapper: Wrapper });

    expect(screen.getByText('0 of 4')).toBeInTheDocument();
    expect(screen.getByText('awaiting module scores')).toBeInTheDocument();
    expect(
      screen.getByText('overall band = mean of the four modules, rounded to the nearest half')
    ).toBeInTheDocument();
  });

  it('renders BandTrajectoryChart milestone progression in zero-state', () => {
    render(<BandTrajectoryChart recentTests={[]} stats={{}} />, { wrapper: Wrapper });

    expect(screen.getByText('Take first test to set baseline')).toBeInTheDocument();
    expect(screen.getByText('Plot score trajectory & deltas')).toBeInTheDocument();
  });

  it('renders WeeklyMomentumChart 7-day velocity and today indicator in zero-state', () => {
    render(<WeeklyMomentumChart weeklyProgress={[]} />, { wrapper: Wrapper });

    expect(screen.getByText('Daily practice velocity')).toBeInTheDocument();
    expect(screen.getByText('Now')).toBeInTheDocument();
    expect(screen.getByText(/start your 7-day practice streak/i)).toBeInTheDocument();
  });

  it('renders starter test papers in SessionLog zero-state', () => {
    render(<SessionLog recentTests={[]} />, { wrapper: Wrapper });

    expect(screen.getByText('Starter tests')).toBeInTheDocument();
    expect(screen.getByText('ready to sit')).toBeInTheDocument();
    expect(screen.getByText(/Academic Reading · Diagnostic Set/i)).toBeInTheDocument();
    expect(screen.getByText(/start any paper above to build your review log/i)).toBeInTheDocument();
  });

  it('renders question type previews and diagnostic CTA in SkillMasteryPanel zero-state', () => {
    render(<SkillMasteryPanel skillProficiency={[]} />, { wrapper: Wrapper });

    expect(
      screen.getByText('Ranks your weak spots once questions are answered')
    ).toBeInTheDocument();
    expect(screen.getByText('True / False / Not Given')).toBeInTheDocument();
    expect(screen.getByText('Matching Headings')).toBeInTheDocument();
    expect(screen.getByText('Start diagnostic test to rank weak spots')).toBeInTheDocument();
  });
});
