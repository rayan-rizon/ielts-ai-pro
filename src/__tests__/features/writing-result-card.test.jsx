import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ResultSlip } from '@/features/testing/writing/report/components/ResultSlip';
import { reportT } from '@/features/testing/writing/report/reportStrings';

const feedback = {
  overallBand: 6.5,
  wordCount: 268,
  summary: 'A clear opinion, thinly explained.',
  generatedAt: '2026-11-27T10:00:00Z',
};
const show = (props = {}) =>
  render(
    <ResultSlip
      t={reportT('en')}
      feedback={feedback}
      taskType="Task 2"
      criteria={[]}
      targetBand={7}
      {...props}
    />
  );
const card = () => screen.getByRole('region', { name: 'Your writing result' });
const fact = (label) => within(card()).getByText(label).closest('div');

describe('the Writing results card', () => {
  it('names the task, the kind of writing and the day it was marked', () => {
    show();
    expect(card()).toHaveTextContent('Task 2 · Essay · 27 Nov 2026');
    expect(card()).toHaveTextContent('Task 2 band');
    expect(within(card()).getByRole('img', { name: 'Band 6.5 out of 9' })).toBeInTheDocument();
  });

  it('puts the length, time and both-task band side by side', () => {
    show({ attempt: { seconds: 2292 }, combinedBand: 7 });
    expect(fact('Words')).toHaveTextContent('268over 250');
    expect(fact('Time used')).toHaveTextContent('38:12');
    expect(fact('Both tasks')).toHaveTextContent('7.0');
  });

  it('leaves out what this attempt does not have', () => {
    show({ attempt: { seconds: 8 } });
    expect(within(card()).queryByText('Time used')).not.toBeInTheDocument();
    expect(within(card()).queryByText('Both tasks')).not.toBeInTheDocument();
    expect(card()).not.toHaveTextContent('your last');
  });

  it('says how the band moved since the last essay', () => {
    show({ attempt: { previous: { band: 6, at: '2026-11-18T10:00:00Z' } } });
    expect(card()).toHaveTextContent('Up 0.5 from your last Task 2 (6.0, 18 Nov 2026)');
  });

  describe('why you got the band', () => {
    // Saved by the live marker, which cuts a long explanation.
    const cut = {
      ...feedback,
      summary:
        'Varied vocabulary and a firm opinion are let down by a very short answer that has no opening paragraph and leaves one side thinly developed...',
      strengths: [
        'The last paragraph says that “online lessons suit most adult learners.',
        'Each reason sits in its own part of the essay.',
      ],
      weaknesses: ['The answer is shorter than the 250-word minimum.'],
    };

    it('never stops mid-sentence: it gives the marker’s complete points instead', () => {
      show({ feedback: cut });
      expect(card()).toHaveTextContent(
        'Each reason sits in its own part of the essay. The answer is shorter than the 250-word minimum.'
      );
      expect(card()).not.toHaveTextContent('thinly developed');
      expect(card()).not.toHaveTextContent(/…|\.\.\./);
    });

    it('judges by the saved English text when the report is translated', () => {
      const translated = {
        ...cut,
        summary: 'অনুবাদ করা অসম্পূর্ণ বাক্য',
        strengths: ['প্রথম।', 'দ্বিতীয় শক্তি।'],
        weaknesses: ['দুর্বলতা।'],
      };
      show({ feedback: translated, original: cut });
      expect(card()).toHaveTextContent('দ্বিতীয় শক্তি। দুর্বলতা।');
      expect(card()).not.toHaveTextContent('অসম্পূর্ণ');
    });

    it('leaves the block out when no complete point was saved', () => {
      show({ feedback: { ...cut, strengths: [], weaknesses: [] } });
      expect(card()).not.toHaveTextContent('Why you got');
    });
  });

  it('shows a short answer as under the minimum', () => {
    show({ feedback: { ...feedback, wordCount: 154 } });
    expect(fact('Words')).toHaveTextContent('154under 250');
  });
});
