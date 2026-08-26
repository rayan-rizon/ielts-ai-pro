import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import TestResultsModal from '@/components/results/TestResultsModal';

const baseResult = {
  bandScore: 6.5,
  correctAnswers: 22,
  totalQuestions: 40,
  typeStats: { multiple_choice: { correct: 22, total: 40 } },
  sectionStats: [{ correct: 22, total: 40 }],
};

function renderModal(props) {
  return render(
    <MemoryRouter>
      <TestResultsModal
        showResults
        testResults={baseResult}
        testData={{}}
        onClose={() => {}}
        onReviewAnswers={() => {}}
        celebrate={false}
        {...props}
      />
    </MemoryRouter>
  );
}

describe('TestResultsModal footer — XP and plan status', () => {
  it('shows the XP actually earned this attempt instead of dropping it silently', () => {
    renderModal({
      earnedXP: { xp: 220, bonus: 250, streak: 3 },
      user: { subscription_tier: 'free' },
    });

    expect(screen.getByText('+470 XP earned')).toBeInTheDocument();
    expect(screen.getByText('Includes a +250 perfect bonus')).toBeInTheDocument();
    // The XP figure takes priority over the plan-status chip when both apply.
    expect(screen.queryByText('Pro analysis')).not.toBeInTheDocument();
  });

  it('reports the account addition when there was no perfect bonus', () => {
    renderModal({
      earnedXP: { xp: 140, bonus: 0, streak: 1 },
      user: { subscription_tier: 'premium' },
    });

    expect(screen.getByText('+140 XP earned')).toBeInTheDocument();
    expect(screen.getByText('Added to your account')).toBeInTheDocument();
  });

  it('falls back to the upgrade prompt for a free account with no XP yet', () => {
    renderModal({ user: { subscription_tier: 'free' } });

    expect(screen.getByText('Pro analysis')).toBeInTheDocument();
    expect(screen.getByText('Unlock all insights')).toBeInTheDocument();
    expect(screen.queryByText(/XP earned/)).not.toBeInTheDocument();
  });

  it('falls back to plan status for a paid account with no XP yet', () => {
    renderModal({ user: { subscription_tier: 'pro' } });

    expect(screen.getByText('Premium unlocked')).toBeInTheDocument();
    expect(screen.getByText('Full analysis visible')).toBeInTheDocument();
  });

  it('never crashes when earnedXP is not provided at all', () => {
    renderModal({ user: { subscription_tier: 'free' }, earnedXP: undefined });
    expect(screen.getByText('Pro analysis')).toBeInTheDocument();
  });
});
