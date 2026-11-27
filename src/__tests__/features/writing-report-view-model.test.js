import { describe, expect, it } from 'vitest';
import {
  buildEssayMap,
  buildLadder,
  buildPractice,
  markEssay,
  numberMistakes,
} from '@/features/testing/writing/report/reportViewModel';
import {
  buildChartCheck,
  buildCriteria,
  buildMistakeGroups,
  buildNextStep,
  describeMarking,
} from '@/features/testing/writing/utils/writingReportModel';
import { reportT } from '@/features/testing/writing/report/reportStrings';

const rows = [
  { id: 'task', score: 7 },
  { id: 'organisation', score: 6 },
];

describe('the band ladder', () => {
  it('places each score, the learner’s target and Band 8 on one 4–9 scale', () => {
    const ladder = buildLadder(rows, '7.0');
    expect([ladder.low, ladder.high]).toEqual([4, 9]);
    expect(ladder.ticks).toEqual([4, 5, 6, 7, 8, 9]);
    expect(ladder.targetAt).toBe(60);
    expect(ladder.eightAt).toBe(80);
    expect(ladder.rows.map((row) => [row.at, row.atTarget])).toEqual([
      [60, true],
      [40, false],
    ]);
  });

  it('widens the scale for a score below 4 instead of pinning it to the edge', () => {
    const ladder = buildLadder([{ id: 'task', score: 2.5 }], null);
    expect(ladder.low).toBe(2);
    expect(ladder.rows[0].at).toBeCloseTo(((2.5 - 2) / 7) * 100);
  });

  it('leaves the target out when the learner has not set one', () => {
    for (const target of [null, undefined, '', 0, 'abc']) {
      const ladder = buildLadder(rows, target);
      expect(ladder.target).toBeNull();
      expect(ladder.rows.every((row) => !row.atTarget)).toBe(true);
    }
  });
});

const essay =
  '<p>Some people think university should be free for everyone in society today.</p>' +
  '<p>Firstly, free education give more people the chance. It is more good for poor families.</p>' +
  '<p>Secondly, graduates pay more tax and that money come back later to help.</p>' +
  '<p>In conclusion, university should be free because it pays for itself.</p>';

const feedback = {
  taskType: 'Task 2',
  originalSource: essay,
  annotations: [
    {
      originalText: 'money come back',
      type: 'grammar',
      severity: 'error',
      replacementText: 'money comes back',
    },
    {
      originalText: 'give more people',
      type: 'grammar',
      severity: 'error',
      replacementText: 'gives more people',
    },
    {
      originalText: 'more good',
      type: 'vocabulary',
      severity: 'suggestion',
      replacementText: 'better',
    },
    { originalText: 'pays for itself', type: 'positive', severity: 'positive' },
    { originalText: 'a phrase that is not there', type: 'grammar', severity: 'error' },
  ],
  paragraphNotes: [{ opening: 'Firstly, free education', note: 'Add an example.' }],
};

describe('numbering mistakes and marking the essay', () => {
  const groups = numberMistakes(buildMistakeGroups(feedback));
  const items = groups.flatMap((group) => group.items);

  it('numbers the fixes in the order the list shows them', () => {
    expect(items.map((item) => [item.n, item.original])).toEqual([
      [1, 'money come back'],
      [2, 'give more people'],
      [3, 'a phrase that is not there'],
      [4, 'more good'],
    ]);
  });

  it('marks each phrase in the essay with the same number, and praised phrases', () => {
    const paragraphs = markEssay(essay, groups, ['pays for itself']);
    expect(paragraphs).toHaveLength(4);
    const marks = paragraphs.flat().filter((segment) => segment.kind);
    expect(marks.map((m) => [m.kind, m.n, m.text])).toEqual([
      ['error', 2, 'give more people'],
      ['suggestion', 4, 'more good'],
      ['error', 1, 'money come back'],
      ['good', null, 'pays for itself'],
    ]);
    expect(paragraphs[1].map((s) => s.text).join('')).toBe(
      'Firstly, free education give more people the chance. It is more good for poor families.'
    );
  });

  it('summarises each paragraph for the essay map', () => {
    const map = buildEssayMap(essay, 'Task 2', groups, feedback.paragraphNotes);
    expect(map.map((p) => [p.role, p.number, p.mistakes])).toEqual([
      ['intro', null, 0],
      ['body', 1, 2],
      ['body', 2, 1],
      ['conclusion', null, 0],
    ]);
    expect(map[1].note).toBe('Add an example.');
    expect(map[0].note).toBe('');
    expect(Math.round(map.reduce((sum, p) => sum + p.share, 0))).toBe(100);
  });

  it('does not guess roles for a Task 2 answer with fewer than three paragraphs', () => {
    const map = buildEssayMap('<p>One two three.</p><p>Four five.</p>', 'Task 2', [], []);
    expect(map.map((p) => [p.role, p.number])).toEqual([
      ['paragraph', 1],
      ['paragraph', 2],
    ]);
  });

  it('gives a Task 1 report no conclusion', () => {
    const map = buildEssayMap(essay, 'Task 1', [], []);
    expect(map.map((p) => p.role)).toEqual(['intro', 'body', 'body', 'body']);
  });

  it('copes with a report that kept no essay', () => {
    expect(buildEssayMap('', 'Task 2', groups, [])).toEqual([]);
    expect(markEssay(undefined, groups, [])).toEqual([]);
  });
});

describe('report sentences in the learner’s language', () => {
  const bn = reportT('bn');

  it('writes the criterion questions, marking note and fix groups in that language', () => {
    const [first] = buildCriteria({ taskType: 'Task 2', criteriaScores: { TaskResponse: 6 } }, bn);
    expect(first.label).toBe('Task Response');
    expect(first.help).toBe('আপনি কি প্রশ্নের প্রতিটি অংশের উত্তর দিয়েছেন?');
    expect(describeMarking({ sampleCount: 2, maxSpread: 0 }, bn)).toContain('2 বার');
    expect(buildMistakeGroups(feedback, bn)[0].label).toBe('ব্যাকরণ ও বানান');
  });

  it('writes the word-limit step in that language', () => {
    const step = buildNextStep(
      { taskType: 'Task 2', isBelowMinimumWordCount: true, wordCount: 190 },
      [],
      bn
    );
    expect(step.title).toBe('কমপক্ষে 250 শব্দ লিখুন');
    expect(step.body).toContain('190');
    expect(step.body).toContain('Task Response');
  });

  it('keeps chart names in English inside the translated chart check', () => {
    const check = buildChartCheck(
      {
        taskType: 'Task 1',
        originalSource: '<p>Car use rose.</p>',
        taskAnalysis: {
          visualType: 'line graph',
          responseVisualType: 'bar chart',
          alignment: 'mismatched',
          observedFeatures: ['Car use rose'],
          displayFeatures: ['গাড়ির ব্যবহার বেড়েছে'],
        },
      },
      bn
    );
    expect(check.message).toContain('line graph');
    expect(check.message).toContain('bar chart');
    expect(check.message).not.toContain('a line graph');
    // Shown translated, but matched against the English essay.
    expect(check.features).toEqual([{ text: 'গাড়ির ব্যবহার বেড়েছে', covered: true }]);
  });

  it('keeps the original English wording by default', () => {
    expect(describeMarking({ sampleCount: 1, confidence: 'high' })).toBe(
      'Marked once. Every area was a clear fit for its band.'
    );
    expect(
      buildNextStep({ taskType: 'Task 1', isBelowMinimumWordCount: true, wordCount: 120 }, []).title
    ).toBe('Write at least 150 words');
  });
});

describe('what to practise next', () => {
  const map = [
    { index: 0, role: 'intro', number: null, mistakes: 0 },
    { index: 1, role: 'body', number: 1, mistakes: 1 },
    { index: 2, role: 'body', number: 2, mistakes: 3 },
    { index: 3, role: 'conclusion', number: null, mistakes: 3 },
  ];
  const fixes = [
    { id: 'grammar', items: [{}, {}, {}] },
    { id: 'words', items: [{}] },
  ];
  const criteria = [
    { id: 'task', label: 'Task Response', score: 6.5 },
    { id: 'organisation', label: 'Coherence and Cohesion', score: 5.5 },
  ];
  const vocabulary = [
    { original: 'good', alternatives: ['beneficial', 'valuable', 'positive', 'useful'] },
    { original: '', alternatives: ['x'] },
    { original: 'bad', alternatives: [] },
  ];

  it('starts with the body paragraph that holds the most mistakes', () => {
    const [first] = buildPractice({ criteria, fixes, essayMap: map, vocabulary, canRevise: true });
    expect(first).toMatchObject({ id: 'rewrite', count: 3, action: 'revise' });
    // A body paragraph beats the conclusion on a tie: that is where marks are built.
    expect(first.paragraph.index).toBe(2);
  });

  it('then grammar from this essay’s own fixes, then words worth upgrading', () => {
    const drills = buildPractice({
      criteria,
      fixes,
      essayMap: map,
      vocabulary,
      comparable: [1, 2],
    });
    expect(drills.map((drill) => drill.id)).toEqual(['rewrite', 'grammar', 'vocabulary']);
    expect(drills[0].action).toBe('compare');
    expect(drills[1]).toMatchObject({ count: 3, total: 4, to: '/grammar' });
    expect(drills[2]).toMatchObject({ to: '/vocabulary' });
    expect(drills[2].words).toEqual([
      { original: 'good', alternatives: ['beneficial', 'valuable', 'positive'] },
    ]);
  });

  it('offers word-choice practice when the report has no word suggestions', () => {
    const drills = buildPractice({ criteria, fixes, essayMap: [], vocabulary: [] });
    expect(drills.map((drill) => drill.id)).toEqual(['grammar', 'words']);
    expect(drills[1]).toMatchObject({ count: 1, to: '/vocabulary' });
  });

  it('falls back to the lowest score when the essay gives little to go on', () => {
    const drills = buildPractice({ criteria, fixes: [], essayMap: [], vocabulary: null });
    expect(drills).toEqual([
      expect.objectContaining({ id: 'criterion', criterion: 'Coherence and Cohesion', score: 5.5 }),
    ]);
  });

  it('offers a stronger version only for a paragraph that has one', () => {
    const [first] = buildPractice({ criteria, fixes, essayMap: map, comparable: [1] });
    expect(first.action).toBeNull();
  });

  it('never offers a rewrite it cannot open, or invents a drill from nothing', () => {
    expect(buildPractice({ criteria: [], fixes: [], essayMap: [] })).toEqual([]);
    const [first] = buildPractice({ criteria, fixes: [], essayMap: map });
    expect(first).toMatchObject({ id: 'rewrite', action: null });
  });
});
