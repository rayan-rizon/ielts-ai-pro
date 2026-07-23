import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import SpeakingReport from '@/features/testing/speaking/components/SpeakingReport';

const finalEvaluation = {
  overallBand: 6.5,
  scoreBasis: 'audio',
  fluency: 6,
  lexical: 7,
  grammar: 6.5,
  pronunciation: 6.5,
  feedback: 'You communicate clearly, but your longer answers need more supporting detail.',
  targetBandTips: 'Develop each main idea with a reason and a specific example.',
  criterionNotes: {
    fluency: 'Generally fluent with occasional hesitation.',
    lexical: 'A useful range with some repetition.',
    grammar: 'Complex forms are attempted with mixed accuracy.',
    pronunciation: 'Usually clear and easy to understand.',
  },
  strengths: ['Answered questions directly.'],
  improvements: [{ criterion: 'Development', suggestion: 'Add a concrete example.' }],
  partScores: {
    part1: { band: 6.5, keyObservation: 'Direct answers.' },
    part2: { band: 6, keyObservation: 'Needs more detail.' },
    part3: { band: 6.5, keyObservation: 'Relevant ideas.' },
  },
};

describe('speaking report', () => {
  it('renders one continuous concise report with a PDF action and no tabs', () => {
    render(
      <MemoryRouter>
        <SpeakingReport
          finalEvaluation={finalEvaluation}
          isEvaluating={false}
          showConfetti={false}
          showXPNotification={false}
          testTitle="Cambridge IELTS 21 - Speaking Test 1"
          detailedFeedback={null}
          allPartsPronunciation={{}}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Speaking Report' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download PDF/ })).toBeInTheDocument();
    expect(screen.getByText('Performance at a Glance')).toBeInTheDocument();
    expect(screen.getByText('Part-by-Part Performance')).toBeInTheDocument();
    expect(screen.queryAllByRole('tab')).toHaveLength(0);
  });

  it('keeps all three part cards visible for a historical report without saved part scores', () => {
    const { partScores: _partScores, ...historicalEvaluation } = finalEvaluation;

    render(
      <MemoryRouter>
        <SpeakingReport
          finalEvaluation={historicalEvaluation}
          isEvaluating={false}
          showConfetti={false}
          showXPNotification={false}
          testTitle="Historical Speaking Test"
          detailedFeedback={null}
          allPartsPronunciation={{}}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Part-by-Part Performance')).toBeInTheDocument();
    expect(screen.getAllByText('N/A')).toHaveLength(3);
    expect(
      screen.getByText('Individual part scores were not saved for this completed test.')
    ).toBeInTheDocument();
  });
});
