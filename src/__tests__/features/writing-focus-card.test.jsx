import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FocusCard } from '@/features/testing/writing/report/components/FocusCard';
import { bandGoal, goalTextKey } from '@/features/testing/writing/report/bandGoals';
import { reportT } from '@/features/testing/writing/report/reportStrings';

describe('bandGoal', () => {
  it('aims at 7 below 7, at 8 from 7, and nowhere from 8', () => {
    expect(bandGoal(5.5)).toBe(7);
    expect(bandGoal(6.5)).toBe(7);
    expect(bandGoal(7)).toBe(8);
    expect(bandGoal(7.5)).toBe(8);
    expect(bandGoal(8)).toBeNull();
    expect(bandGoal(null)).toBeNull();
  });

  it.each([
    [5.5, 6.5, 7],
    [5.5, 7, 7],
    [5.5, 8, 8],
    [6, 7.5, 8],
    [6, 9, 8],
    [6, 6, 7],
    [7, 7, 8],
    [6, null, 7],
    [8, 9, null],
  ])('from %s with a target of %s aims at %s', (score, target, goal) =>
    expect(bandGoal(score, target)).toBe(goal)
  );

  it.each([
    ['Task Response', 'Task 2', 7, 'goalTask7'],
    ['Task Achievement', 'Task 1', 8, 'goalReport8'],
    ['Coherence & Cohesion', 'Task 2', 7, 'goalCoherence7'],
    ['Lexical Resource', 'Task 2', 8, 'goalVocabulary8'],
    ['Grammatical Range and Accuracy', 'Task 1', 7, 'goalGrammar7'],
  ])('describes %s', (criterion, taskType, band, key) => {
    expect(goalTextKey(criterion, taskType, band)).toBe(key);
    expect(reportT('en')(key).length).toBeGreaterThan(40);
  });

  it('describes nothing it does not recognise', () => {
    expect(goalTextKey('Handwriting', 'Task 2', 7)).toBeNull();
  });
});

const step = {
  kind: 'priority',
  criterion: 'Coherence & Cohesion',
  title: 'Each body paragraph lists two reasons, then moves on.',
  body: 'Keep one main idea per body paragraph and explain it fully.',
  evidenceText: 'Also, tuition fees are a burden.',
  rest: [],
};
const show = (props = {}) =>
  render(<FocusCard t={reportT('en')} taskType="Task 2" step={step} score={6} {...props} />);
const card = () =>
  screen.getByRole('region', {
    name: 'Keep one main idea per body paragraph and explain it fully.',
  });

describe('the card that joins the next step to the comparison', () => {
  it('leads with what to do and shows the score it can raise', () => {
    show();
    expect(card()).toHaveTextContent('Coherence & Cohesion');
    expect(card()).toHaveTextContent('6.0 → 7.0');
  });

  it('sets what the learner does now beside what the goal band looks like', () => {
    show();
    expect(within(card()).getByText('What you do now')).toBeInTheDocument();
    expect(card()).toHaveTextContent(step.title);
    expect(card()).toHaveTextContent(step.evidenceText);
    expect(within(card()).getByText('What band 7 looks like')).toBeInTheDocument();
    expect(card()).toHaveTextContent(reportT('en')('goalCoherence7'));
  });

  it('offers to revise only when there is no comparison to carry that button', () => {
    const onRevise = vi.fn();
    const view = show({ onRevise });
    fireEvent.click(within(card()).getByRole('button', { name: 'Revise your answer' }));
    expect(onRevise).toHaveBeenCalled();
    view.unmount();

    show({ onRevise, children: <div>comparison</div> });
    expect(within(card()).getByText('comparison')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Revise your answer' })).not.toBeInTheDocument();
  });

  it('shows the length advice with its own heading', () => {
    show({
      step: {
        kind: 'length',
        criterion: 'Task Response',
        title: 'Write at least 250 words',
        body: 'Your essay has 154 words.',
        rest: [],
      },
      score: 5.5,
    });
    const region = screen.getByRole('region', { name: 'Write at least 250 words' });
    expect(region).toHaveTextContent('Your essay has 154 words.');
    expect(region).toHaveTextContent('What band 7 looks like');
  });

  it('drops the goal side for a score already at band 8', () => {
    show({ score: 8 });
    expect(screen.queryByText(/looks like/)).not.toBeInTheDocument();
    expect(card()).not.toHaveTextContent('→');
  });
});
