import { describe, expect, it } from 'vitest';
import {
  endsMidSentence,
  markingParagraphs,
  revisionProblem,
} from '../../../supabase/functions/_shared/writingRevisionText';
import {
  criterionChanges,
  diffWords,
  revisionSummary,
} from '@/features/testing/writing/revision/revisionChecks';

const ORIGINAL = 'Play matters for children.\nSchools should protect it.';

describe('endsMidSentence', () => {
  it('catches the unfinished ending that cost a learner two scores', () => {
    expect(endsMidSentence('it seeks to achieve. this is the most ')).toBe(true);
  });

  it.each(['They agree.', 'Is it fair?', 'It works!', 'He called it “play.”', '(see the table.)'])(
    'accepts a finished ending: %s',
    (text) => expect(endsMidSentence(text)).toBe(false)
  );
});

describe('revisionProblem', () => {
  const essay = `${'Children learn through play. '.repeat(30)}`.trim();
  const problem = (revision) => revisionProblem({ revision, source: essay, taskType: 'Task 2' });

  it('stops the check on a cut-off ending and says it is unused', () => {
    expect(problem(`${essay} this is the most`)).toMatch(/check has not been used/);
  });

  it('stops an unchanged or too short draft', () => {
    const paragraphs = essay.replace('. ', '.\n');
    const respaced = revisionProblem({
      revision: essay.replace('. ', '.\n\n'),
      source: paragraphs,
      taskType: 'Task 2',
    });
    expect(respaced).toMatch(/Revise your answer/);
    expect(problem(essay)).toMatch(/Revise your answer/);
    expect(problem('Too short.')).toMatch(/Revise your answer/);
  });

  it('allows a finished rewrite', () => {
    expect(problem(`${essay} Schools should protect it.`)).toBe('');
  });
});

describe('markingParagraphs', () => {
  it('separates paragraphs the same way the first review did', () => {
    expect(markingParagraphs('First part.\nSecond part.\n\n\n Third. ')).toBe(
      'First part.\n\nSecond part.\n\nThird.'
    );
  });
});

describe('diffWords', () => {
  it('shows exactly the words that were added', () => {
    const parts = diffWords(ORIGINAL, `${ORIGINAL} this is the most`);
    expect(parts.filter((part) => part.type === 'added').map((part) => part.text)).toEqual([
      'this is the most',
    ]);
    expect(parts.some((part) => part.type === 'removed')).toBe(false);
  });

  it('shows a replaced word as one removal and one addition', () => {
    const parts = diffWords('Play matters a lot.', 'Play helps a lot.');
    expect(parts.map((part) => [part.type, part.text])).toEqual([
      ['same', 'Play'],
      ['removed', 'matters'],
      ['added', 'helps'],
      ['same', 'a lot.'],
    ]);
  });
});

describe('revisionSummary', () => {
  it('counts splitting the answer into paragraphs as a real change', () => {
    expect(revisionSummary('One idea. Two idea.', 'One idea.\nTwo idea.', 'Task 2').changed).toBe(
      true
    );
  });

  it('counts the edit and warns about an unfinished ending', () => {
    expect(revisionSummary(ORIGINAL, `${ORIGINAL} this is the most`, 'Task 2')).toMatchObject({
      words: 12,
      added: 4,
      removed: 0,
      changed: true,
      unfinished: true,
      small: true,
      minimum: 250,
      belowMinimum: true,
    });
  });

  it('treats new paragraph spacing alone as no change', () => {
    expect(revisionSummary(ORIGINAL, ORIGINAL.replace('\n', '\n\n'), 'Task 1').changed).toBe(false);
  });

  it('stops calling a real rewrite small', () => {
    const more = `${ORIGINAL} ${'Children learn by doing things with others. '.repeat(3)}`;
    expect(revisionSummary(ORIGINAL, more, 'Task 2')).toMatchObject({
      small: false,
      unfinished: false,
    });
  });
});

describe('criterionChanges', () => {
  const before = { TaskResponse: 5.5, CoherenceAndCohesion: 6, LexicalResource: 7 };
  const after = { TaskResponse: 5, CoherenceAndCohesion: 5, LexicalResource: 7 };
  const priorities = [
    {
      criterion: 'Coherence & Cohesion',
      issue: 'The response ends abruptly.',
      evidenceText: 'this is the most',
    },
    { criterion: 'Task Response', issue: 'The response is underlength.' },
    { criterion: 'Lexical Resource', issue: 'Vary a few words.' },
  ];

  it('pairs each score that moved with the marker’s note and the words it quoted', () => {
    expect(criterionChanges(before, after, priorities)).toEqual([
      {
        key: 'TaskResponse',
        label: 'Task Response',
        before: 5.5,
        after: 5,
        delta: -0.5,
        note: 'The response is underlength.',
        evidence: '',
      },
      {
        key: 'CoherenceAndCohesion',
        label: 'Coherence and Cohesion',
        before: 6,
        after: 5,
        delta: -1,
        note: 'The response ends abruptly.',
        evidence: 'this is the most',
      },
      {
        key: 'LexicalResource',
        label: 'Lexical Resource',
        before: 7,
        after: 7,
        delta: 0,
        note: '',
        evidence: '',
      },
    ]);
  });
});
