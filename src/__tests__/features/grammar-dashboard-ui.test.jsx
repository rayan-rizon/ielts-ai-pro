import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import GrammarDashboard from '@/features/grammar/components/GrammarDashboard';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const skillCodes = [
  'grammar_sentence_boundaries',
  'grammar_verb_forms',
  'grammar_agreement_number',
  'grammar_articles_determiners',
  'grammar_clause_control',
  'grammar_word_forms',
];

const dashboard = {
  access: {
    isPaid: true,
    dailyRemaining: 5,
    diagnosticAvailable: true,
  },
  dueReviews: 1,
  recentAttempts: [
    {
      id: 'attempt-in-progress',
      mode: 'practice',
      totalQuestions: 5,
      completionState: 'in_progress',
    },
  ],
  skills: skillCodes.map((skillCode) => ({
    skillCode,
    label: skillCode
      .replace('grammar_', '')
      .replaceAll('_', ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase()),
    evidenceClass: 'diagnostic',
    observations: 0,
    correctCount: 0,
    mastery: 0,
    isDue: false,
  })),
  criterionEvidence: [
    {
      skillCode: 'speaking_grammar',
      source: 'speaking',
      evidenceClass: 'measured',
      observations: 10,
      provenance: 'Speaking grammatical range and accuracy criterion · transcript-based',
    },
    {
      skillCode: 'writing_grammar',
      source: 'writing',
      evidenceClass: 'measured',
      observations: 9,
      provenance: 'Writing grammatical range and accuracy criterion',
    },
  ],
  resources: [],
};

describe('GrammarDashboard', () => {
  it('shows a functional grammar process without inventing completed steps', () => {
    const onStart = vi.fn();
    const onRetest = vi.fn();
    const onResume = vi.fn();

    render(
      <MemoryRouter>
        <GrammarDashboard
          dashboard={dashboard}
          recommendedSkill={dashboard.skills[0]}
          criterionDiagnosticNeeded={false}
          defaultMode={null}
          defaultSkill={null}
          isStarting={false}
          isResuming={false}
          onStart={onStart}
          onRetest={onRetest}
          onResume={onResume}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Grammar Learning Path' })).toBeInTheDocument();
    expect(screen.getByText('Now: finish your active practice set')).toBeInTheDocument();
    expect(
      screen.getByText(
        /Finish this practice set\. Your next step is one normal scored Speaking test/i
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(/^Retest opens/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Practise' })).toHaveAttribute(
      'aria-current',
      'step'
    );
    expect(screen.getByRole('button', { name: 'Check' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('button', { name: 'Check' })).toBeDisabled();
    expect(screen.queryByText(/completed/i)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View full AI Learning Path/i })).toHaveAttribute(
      'href',
      '/learning-path'
    );

    expect(screen.getByRole('button', { name: 'Retest' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Practise' }));
    expect(onResume).toHaveBeenCalledWith('attempt-in-progress');
  });

  it('retests through the existing scored module after two focused repairs', () => {
    const onRetest = vi.fn();
    const retestDashboard = {
      ...dashboard,
      recentAttempts: [
        {
          id: 'repair-2',
          mode: 'practice',
          completionState: 'completed',
          completedAt: '2026-08-02T12:00:00.000Z',
        },
        {
          id: 'repair-1',
          mode: 'review',
          completionState: 'completed',
          completedAt: '2026-08-01T12:00:00.000Z',
        },
      ],
      skills: dashboard.skills.map((skill, index) => ({
        ...skill,
        observations: 5,
        correctCount: index ? 4 : 2,
        mastery: index ? 0.8 : 0.4,
      })),
      criterionEvidence: dashboard.criterionEvidence.map((signal, index) => ({
        ...signal,
        mastery: index ? 0.7 : 0.5,
        lastPracticedAt: '2026-07-30T12:00:00.000Z',
      })),
    };

    render(
      <MemoryRouter>
        <GrammarDashboard
          dashboard={retestDashboard}
          recommendedSkill={retestDashboard.skills[0]}
          criterionDiagnosticNeeded={false}
          defaultMode={null}
          defaultSkill={null}
          isStarting={false}
          isResuming={false}
          onStart={vi.fn()}
          onRetest={onRetest}
          onResume={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: 'Retest' })).toHaveAttribute('aria-current', 'step');
    fireEvent.click(screen.getByRole('button', { name: 'Take a Speaking test' }));
    expect(onRetest).toHaveBeenCalledWith('speaking');
  });

  it('starts a review set from the hero due-reviews chip', () => {
    const onStart = vi.fn();

    render(
      <MemoryRouter>
        <GrammarDashboard
          dashboard={dashboard}
          recommendedSkill={dashboard.skills[0]}
          criterionDiagnosticNeeded={false}
          defaultMode={null}
          defaultSkill={null}
          isStarting={false}
          isResuming={false}
          onStart={onStart}
          onRetest={vi.fn()}
          onResume={vi.fn()}
        />
      </MemoryRouter>
    );

    const chip = screen.getByRole('button', { name: /Start a review of 1 review due/i });
    fireEvent.click(chip);
    expect(onStart).toHaveBeenCalledWith({ mode: 'review', targetSkills: null, questionCount: 5 });
  });

  it('explains the hero due-reviews chip instead of starting when the daily allowance is used', () => {
    const onStart = vi.fn();
    const cappedDashboard = {
      ...dashboard,
      access: { ...dashboard.access, isPaid: false, dailyRemaining: 0 },
    };

    render(
      <MemoryRouter>
        <GrammarDashboard
          dashboard={cappedDashboard}
          recommendedSkill={cappedDashboard.skills[0]}
          criterionDiagnosticNeeded={false}
          defaultMode={null}
          defaultSkill={null}
          isStarting={false}
          isResuming={false}
          onStart={onStart}
          onRetest={vi.fn()}
          onResume={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(
      screen.queryByRole('button', { name: /Start a review of 1 review due/i })
    ).not.toBeInTheDocument();
    expect(screen.getByTitle(/free questions for today are used/i)).toBeInTheDocument();
  });

  it('renders quota-exhausted states on skill cards and prompts upgrade on click', () => {
    const onStart = vi.fn();
    const cappedDashboard = {
      ...dashboard,
      access: { ...dashboard.access, isPaid: false, dailyRemaining: 0 },
    };

    render(
      <MemoryRouter>
        <GrammarDashboard
          dashboard={cappedDashboard}
          recommendedSkill={cappedDashboard.skills[0]}
          criterionDiagnosticNeeded={false}
          defaultMode={null}
          defaultSkill={null}
          isStarting={false}
          isResuming={false}
          onStart={onStart}
          onRetest={vi.fn()}
          onResume={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /Daily limit reached/i })).toBeInTheDocument();
    const sentenceBoundariesBtn = screen.getByRole('button', {
      name: /Sentence boundaries: daily practice limit reached/i,
    });
    expect(sentenceBoundariesBtn).toBeInTheDocument();

    fireEvent.click(sentenceBoundariesBtn);
    expect(onStart).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/pricing');
  });

  it('allows practicing a skill card when daily allowance is available', () => {
    const onStart = vi.fn();
    const freeDashboard = {
      ...dashboard,
      access: { ...dashboard.access, isPaid: false, dailyRemaining: 3 },
    };

    render(
      <MemoryRouter>
        <GrammarDashboard
          dashboard={freeDashboard}
          recommendedSkill={freeDashboard.skills[0]}
          criterionDiagnosticNeeded={false}
          defaultMode={null}
          defaultSkill={null}
          isStarting={false}
          isResuming={false}
          onStart={onStart}
          onRetest={vi.fn()}
          onResume={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByText(/3 of 5 free today/i)).toBeInTheDocument();
    const verbFormsBtn = screen.getByRole('button', {
      name: /Practise Verb forms/i,
    });
    expect(verbFormsBtn).toBeInTheDocument();

    fireEvent.click(verbFormsBtn);
    expect(onStart).toHaveBeenCalledWith({
      mode: 'practice',
      targetSkills: ['grammar_verb_forms'],
      questionCount: 5,
    });
  });
});
