import { describe, expect, it } from 'vitest';
import { createWritingReportPdf } from '@/features/testing/writing/utils/writingReportPdf';

// A 1×1 transparent PNG stands in for the browser's canvas.
const PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

function recordingRasterizer() {
  const drawn = [];
  return {
    drawn,
    text: () => drawn.map((line) => line.text).join(' '),
    measure: (text, font) => text.length * font.sizePx * 0.55,
    render(text, options) {
      drawn.push({ text, ...options });
      return {
        dataUrl: PIXEL,
        widthPx: this.measure(text, options.font),
        heightPx: options.font.sizePx * 1.4,
      };
    },
  };
}

const streamOf = (doc) =>
  doc.internal.pages
    .slice(1)
    .map((page) => (Array.isArray(page) ? page.join('\n') : ''))
    .join('\n');

// jsPDF writes one operator per line; this is what a reader can select and copy.
const vectorText = (doc) =>
  Array.from(streamOf(doc).matchAll(/\(((?:\\.|[^\\)])*)\) Tj/g), (m) =>
    m[1].replace(/\\(.)/g, '$1')
  ).join(' ');

const essay =
  '<p>Some people think university should be free for everyone in society today.</p>' +
  '<p>Firstly, free education give more people the chance to study well.</p>';

const feedback = {
  taskType: 'Task 2',
  overallBand: 6,
  wordCount: 268,
  summary: 'Your position is clear.',
  originalSource: essay,
  criteriaScores: { TaskResponse: 7, GrammaticalRangeAndAccuracy: 5.5 },
  priorities: [
    { criterion: 'Grammar', issue: 'Agreement errors recur.', action: 'Check each verb.' },
  ],
  annotations: [
    {
      originalText: 'give more people',
      type: 'grammar',
      severity: 'error',
      replacementText: 'gives more people',
      explanation: 'A singular subject needs a singular verb.',
    },
  ],
  strengths: ['A clear position.'],
};

const build = (options = {}) => {
  const rasterizer = recordingRasterizer();
  const result = createWritingReportPdf({
    feedbacks: { 'Task 2': feedback },
    generatedAt: new Date('2026-11-27T00:00:00Z'),
    rasterizer,
    ...options,
  });
  return { ...result, rasterizer };
};

describe('the Writing report PDF', () => {
  it('keeps an English report as selectable text, with no images', () => {
    const { doc, rasterizer } = build();
    expect(rasterizer.drawn).toHaveLength(0);
    const text = vectorText(doc);
    expect(text).toContain('Why you got 6.0');
    expect(text).toContain('Your four scores');
    expect(text).toContain('give more people [1]');
    expect(text).toContain('gives more people');
  });

  it('keeps the result card compact: the reason beside the band, one line per score', () => {
    const text = vectorText(build().doc);
    expect(text.indexOf('Why you got 6.0')).toBeLessThan(text.indexOf('Your four scores'));
    expect(text).not.toContain('Did you answer every part of the question?');
    // The card ends high enough for the next step to start in the top half of page 1.
    const placed = streamOf(build().doc).match(/([\d.]+) Td\n\(Your next step/);
    const fromBottomPt = Number(placed[1]);
    expect(842 - fromBottomPt).toBeLessThan(330);
  });

  it('prints the examiner’s reason for each score when the report has one', () => {
    const marked = { ...feedback, criterionNotes: { TaskResponse: 'You answer both views.' } };
    expect(vectorText(build({ feedbacks: { 'Task 2': marked } }).doc)).toContain(
      'Task Response: You answer both views.'
    );
    expect(vectorText(build().doc)).not.toContain('About these four scores');
  });

  it('shows the learner’s target on the score ladder only when one is set', () => {
    expect(vectorText(build({ targetBand: 7 }).doc)).toContain('Your target 7.0');
    expect(vectorText(build().doc)).not.toContain('Your target');
  });

  it.each([
    ['bn', 'কেন আপনি 6.0 পেলেন', 'আপনার অবস্থান স্পষ্ট।'],
    ['hi', 'आपको 6.0 क्यों मिला', 'आपका पक्ष स्पष्ट है।'],
    ['ru', 'Почему вы получили 6.0', 'Ваша позиция ясна.'],
  ])('keeps every %s character instead of dropping it', (language, heading, summary) => {
    const { doc, rasterizer } = build({
      language,
      feedbacks: { 'Task 2': { ...feedback, summary } },
    });
    expect(rasterizer.text()).toContain(heading);
    expect(rasterizer.text()).toContain(summary);
    // The learner's English stays real text in every language.
    expect(vectorText(doc)).toContain('gives more people');
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });

  it('lays Urdu out right to left', () => {
    const { rasterizer } = build({
      language: 'ur',
      feedbacks: { 'Task 2': { ...feedback, summary: 'آپ کا موقف واضح ہے۔' } },
    });
    const line = rasterizer.drawn.find((item) => item.text.includes('موقف'));
    expect(line.rtl).toBe(true);
  });

  it('keeps Uzbek and Indonesian as selectable text', () => {
    const { doc, rasterizer } = build({ language: 'uz' });
    expect(rasterizer.drawn).toHaveLength(0);
    expect(vectorText(doc)).toContain("To'rtta balingiz");
  });

  it('does not delete a non-Latin word the learner typed in an English report', () => {
    const { rasterizer } = build({
      feedbacks: {
        'Task 2': { ...feedback, originalSource: '<p>The word শিক্ষা means education.</p>' },
      },
    });
    expect(rasterizer.text()).toContain('শিক্ষা');
  });

  it('adds each Band comparison the learner opened, with numbered notes', () => {
    const { doc } = build({
      comparisons: {
        'Task 2': [
          {
            band: 8,
            notesTranslated: false,
            paragraphs: [
              {
                index: 1,
                original: 'Firstly, free education give more people the chance to study well.',
                model: 'To begin with, free education widens access to study.',
                notes: [
                  {
                    n: 1,
                    criterion: 'coherence',
                    phrase: 'To begin with',
                    why: 'It signals order.',
                  },
                ],
              },
            ],
          },
        ],
      },
    });
    const text = vectorText(doc);
    expect(text).toContain('Band 8 version');
    expect(text).toContain('To begin with [1], free education widens access to study.');
    expect(text).toContain('Coherence and Cohesion: It signals order.');
  });

  it('ends with what to practise next, taken from this essay', () => {
    const richer = {
      ...feedback,
      vocabularyEnhancements: [{ original: 'good', alternatives: ['beneficial', 'valuable'] }],
    };
    const text = vectorText(build({ feedbacks: { 'Task 2': richer } }).doc);
    expect(text.indexOf('Practise next')).toBeGreaterThan(text.indexOf('Your essay with marks'));
    expect(text).toContain('1. Rewrite');
    expect(text).toContain('Practise grammar and spelling');
    expect(text).toContain('good -> beneficial / valuable');
  });

  it('breaks a very long non-Latin word instead of letting it leave the page', () => {
    const { rasterizer } = build({
      language: 'bn',
      feedbacks: { 'Task 2': { ...feedback, summary: 'অ'.repeat(600) } },
    });
    const pieces = rasterizer.drawn.filter((line) => /^অ+$/.test(line.text));
    expect(pieces.length).toBeGreaterThan(1);
    expect(pieces.map((line) => line.text).join('')).toHaveLength(600);
  });
});
