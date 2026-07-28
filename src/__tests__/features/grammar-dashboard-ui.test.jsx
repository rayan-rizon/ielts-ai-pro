import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import GrammarDashboard from '@/features/grammar/components/GrammarDashboard';

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
          onResume={onResume}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Grammar Learning Path' })).toBeInTheDocument();
    expect(screen.getByText('Now: finish your active practice set')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Practise' })).toHaveAttribute(
      'aria-current',
      'step'
    );
    expect(screen.getByRole('button', { name: 'Diagnose' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('button', { name: 'Diagnose' })).toBeDisabled();
    expect(screen.queryByText(/completed/i)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View AI Learning Path/i })).toHaveAttribute(
      'href',
      '/learning-path'
    );

    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onStart).toHaveBeenCalledWith({
      mode: 'transfer',
      targetSkills: [dashboard.skills[0].skillCode],
    });

    fireEvent.click(screen.getByRole('button', { name: 'Practise' }));
    expect(onResume).toHaveBeenCalledWith('attempt-in-progress');
  });
});
