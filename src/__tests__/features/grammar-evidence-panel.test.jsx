import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import GrammarEvidencePanel from '@/features/grammar/components/GrammarEvidencePanel';

const writingEvidence = {
  skillCode: 'writing_grammar',
  source: 'writing',
  evidenceClass: 'measured',
  observations: 9,
  mastery: 0.68,
  lastPracticedAt: '2026-07-28T12:00:00.000Z',
};

describe('GrammarEvidencePanel', () => {
  it('shows both evidence sources and converts broad evidence into a Grammar level check', () => {
    const onStartDiagnostic = vi.fn();
    render(
      <MemoryRouter>
        <GrammarEvidencePanel
          criterionEvidence={[writingEvidence]}
          access={{ isPaid: true, diagnosticAvailable: true }}
          inProgressAttempt={null}
          isStarting={false}
          onStartDiagnostic={onStartDiagnostic}
          onResume={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('1/2 connected')).toBeInTheDocument();
    expect(screen.getByText('68%')).toBeInTheDocument();
    expect(
      screen.getByRole('progressbar', { name: 'Writing grammar estimated grammar control' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Take a Writing test' })).toHaveAttribute(
      'href',
      '/writing'
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Speaking' }));
    expect(screen.getByText('Not connected')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Take a Speaking test' })).toHaveAttribute(
      'href',
      '/speaking'
    );

    fireEvent.click(screen.getByRole('button', { name: 'Find what to practise' }));
    expect(onStartDiagnostic).toHaveBeenCalledTimes(1);
  });

  it('resumes an active attempt instead of starting competing diagnostic work', () => {
    const onResume = vi.fn();
    render(
      <MemoryRouter>
        <GrammarEvidencePanel
          criterionEvidence={[writingEvidence]}
          access={{ isPaid: true, diagnosticAvailable: true }}
          inProgressAttempt={{ id: 'attempt-1' }}
          isStarting={false}
          onStartDiagnostic={vi.fn()}
          onResume={onResume}
        />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Resume active grammar practice' }));
    expect(onResume).toHaveBeenCalledWith('attempt-1');
  });
});
