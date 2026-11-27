import { describe, expect, it } from 'vitest';
import {
  comparisonParagraphs,
  essayParagraphs,
  segmentModelParagraph,
  validateBandModels,
} from '../../../supabase/functions/_shared/writingBandModels';
import { writingSourceForMarking } from '@/features/testing/writing/utils/evaluationEvidence';

const words = (n: number, lead: string) =>
  [
    lead,
    ...Array.from({ length: n - 1 }, (_, i) => `word${String.fromCharCode(97 + (i % 26))}`),
  ].join(' ');

const html = (...paragraphs: string[]) => paragraphs.map((p) => `<p>${p}</p>`).join('');

describe('splitting an essay into paragraphs', () => {
  it('splits saved editor HTML the same way the marker did', () => {
    const source = '<p>One &amp; two.</p><p><br></p><p>Three<br>four.</p><div>Five</div>';
    expect(essayParagraphs(source)).toEqual(writingSourceForMarking(source).split('\n\n'));
    expect(essayParagraphs(source)).toEqual(['One & two.', 'Three', 'four.', 'Five']);
  });

  it('returns nothing for an empty essay', () => {
    expect(essayParagraphs('')).toEqual([]);
    expect(essayParagraphs('<p></p>')).toEqual([]);
  });
});

describe('choosing which paragraphs to compare with a stronger version', () => {
  const intro = words(30, 'Intro');
  const first = words(60, 'Firstly');
  const second = words(55, 'Secondly');
  const end = words(30, 'Conclusion');

  it('compares the body of a four-paragraph Task 2 essay', () => {
    expect(comparisonParagraphs(html(intro, first, second, end), 'Task 2')).toEqual([
      { index: 1, text: first },
      { index: 2, text: second },
    ]);
  });

  it('compares the middle paragraph of a three-paragraph essay', () => {
    expect(comparisonParagraphs(html(intro, first, end), 'Task 2').map((p) => p.index)).toEqual([
      1,
    ]);
  });

  it('includes the last paragraph of a Task 1 report, which has no conclusion', () => {
    expect(
      comparisonParagraphs(html(intro, first, second, words(40, 'Finally')), 'Task 1').map(
        (p) => p.index
      )
    ).toEqual([1, 2, 3]);
  });

  it('ignores headings and one-line fragments', () => {
    expect(
      comparisonParagraphs(html('Dear Sir', intro, first, second, end, 'Thanks'), 'Task 2').map(
        (p) => p.index
      )
    ).toEqual([2, 3]);
  });

  it('uses a short single paragraph, but not a whole essay written as one block', () => {
    expect(comparisonParagraphs(html(first), 'Task 2')).toEqual([{ index: 0, text: first }]);
    expect(comparisonParagraphs(html(words(300, 'All')), 'Task 2')).toEqual([]);
  });
});

const original =
  'Firstly, free education give more people the chance to study. Tuition fees are a heavy burden for 40% of poor families, and the country loses talented workers because many people cannot go to university for this reason.';

const goodModel = {
  paragraphs: [
    {
      index: 1,
      model:
        'To begin with, free education gives far more people the opportunity to study. Tuition fees place a heavy burden on 40% of poor families, so many capable young people never reach university and the country loses talented workers.',
      notes: [
        {
          criterion: 'grammar',
          phrase: 'so many capable young people never reach university',
          why: 'One clear result clause joins cause and effect.',
        },
        {
          criterion: 'coherence',
          phrase: 'To begin with',
          why: 'It signals the first argument clearly.',
        },
        {
          criterion: 'vocabulary',
          phrase: 'place a heavy burden on',
          why: 'This is a precise, natural collocation.',
        },
        {
          criterion: 'task',
          phrase: 'the country loses talented workers',
          why: 'The effect on society answers the question.',
        },
      ],
    },
  ],
};

const context = {
  paragraphs: [{ index: 1, text: original }],
  taskType: 'Task 2' as const,
  sourceText: original,
};

describe('checking a model paragraph before a learner sees it', () => {
  it('numbers the notes in the order their phrases appear', () => {
    const [paragraph] = validateBandModels(goodModel, context);
    expect(paragraph.original).toBe(original);
    expect(paragraph.notes.map((n) => [n.n, n.criterion])).toEqual([
      [1, 'coherence'],
      [2, 'vocabulary'],
      [3, 'grammar'],
      [4, 'task'],
    ]);
  });

  it('drops a note whose phrase is not in the model paragraph, or overlaps another', () => {
    const [paragraph] = validateBandModels(
      {
        paragraphs: [
          {
            ...goodModel.paragraphs[0],
            notes: [
              ...goodModel.paragraphs[0].notes.slice(0, 3),
              { criterion: 'task', phrase: 'a phrase that was never written', why: 'x' },
              { criterion: 'task', phrase: 'a heavy burden', why: 'Overlaps the vocabulary note.' },
              { criterion: 'spelling', phrase: 'free education', why: 'Unknown criterion.' },
            ],
          },
        ],
      },
      context
    );
    expect(paragraph.notes).toHaveLength(3);
  });

  it('rejects a reply that misses a paragraph or has fewer than two usable notes', () => {
    expect(() => validateBandModels({ paragraphs: [] }, context)).toThrow(/paragraph/i);
    expect(() =>
      validateBandModels(
        {
          paragraphs: [
            { ...goodModel.paragraphs[0], notes: goodModel.paragraphs[0].notes.slice(0, 1) },
          ],
        },
        context
      )
    ).toThrow(/notes/i);
    expect(() => validateBandModels(null, context)).toThrow();
  });

  it('rejects a paragraph that is far shorter or longer than the learner wrote', () => {
    const withModel = (model: string) => ({
      paragraphs: [{ ...goodModel.paragraphs[0], model }],
    });
    expect(() =>
      validateBandModels(withModel('To begin with, free education helps.'), context)
    ).toThrow(/length/i);
    expect(() => validateBandModels(withModel(words(200, 'To')), context)).toThrow(/length/i);
  });

  it('rejects invented figures in a Task 1 model', () => {
    const invented = {
      paragraphs: [
        {
          ...goodModel.paragraphs[0],
          model: goodModel.paragraphs[0].model.replace('40%', '65%'),
        },
      ],
    };
    expect(() => validateBandModels(invented, { ...context, taskType: 'Task 1' })).toThrow(
      /figure/i
    );
    // The same figure written with a separator is not an invented one.
    expect(() =>
      validateBandModels(
        {
          paragraphs: [
            {
              ...goodModel.paragraphs[0],
              model: `${goodModel.paragraphs[0].model} In total 1,200 took part.`,
            },
          ],
        },
        { ...context, taskType: 'Task 1', sourceText: `${original} 1200 people` }
      )
    ).not.toThrow();
  });
});

describe('splitting a model paragraph for highlighting', () => {
  it('returns plain and numbered pieces that rebuild the paragraph exactly', () => {
    const [paragraph] = validateBandModels(goodModel, context);
    const segments = segmentModelParagraph(paragraph.model, paragraph.notes);
    expect(segments.map((s) => s.text).join('')).toBe(paragraph.model);
    expect(segments.filter((s) => s.n).map((s) => [s.n, s.text])).toEqual([
      [1, 'To begin with'],
      [2, 'place a heavy burden on'],
      [3, 'so many capable young people never reach university'],
      [4, 'the country loses talented workers'],
    ]);
  });

  it('shows plain text when there are no notes', () => {
    expect(segmentModelParagraph('Just text.', [])).toEqual([{ text: 'Just text.', n: null }]);
  });
});

describe('stiff wording the model was told not to use', () => {
  const paragraph = { index: 1, text: words(30, 'Firstly') };
  const rewrite = (model: string, phrases: string[]) =>
    validateBandModels(
      {
        paragraphs: [
          {
            index: 1,
            model,
            notes: phrases.map((phrase) => ({ criterion: 'task', phrase, why: 'Clearer.' })),
          },
        ],
      },
      { paragraphs: [paragraph], taskType: 'Task 2', sourceText: paragraph.text }
    )[0];
  const filler =
    'People who study longer usually find better work and pay more tax over many years.';

  it('drops a stiff opener and capitalises what follows', () => {
    const result = rewrite(
      `Furthermore, free study widens access for poor families. Moreover, it helps firms. ${filler}`,
      ['free study widens access', 'it helps firms']
    );
    expect(
      result.model.startsWith('Free study widens access for poor families. It helps firms.')
    ).toBe(true);
  });

  it('removes empty emphasis wherever it sits', () => {
    const result = rewrite(
      `Free study would undoubtedly widen access. Fees, invariably, deter people. Undoubtedly, firms gain. ${filler}`,
      ['would undoubtedly widen access', 'Undoubtedly, firms gain']
    );
    expect(result.model).not.toMatch(/undoubtedly|invariably/i);
    expect(result.model).toContain('Free study would widen access. Fees deter people. Firms gain.');
    // Notes still point at the cleaned words.
    expect(result.notes.map((note) => note.phrase)).toEqual(['would widen access', 'Firms gain']);
  });

  it('keeps those letters inside other words and ordinary linking', () => {
    const text = `For example, an invariable rule helps. As a result, people gain. ${filler}`;
    expect(rewrite(text, ['an invariable rule', 'people gain']).model).toBe(text);
  });
});
