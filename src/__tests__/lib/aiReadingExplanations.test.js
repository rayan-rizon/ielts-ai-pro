import { describe, expect, it, vi } from 'vitest';
import {
  makeReadingExplanationInput,
  validateReadingExplanations,
} from '../../../supabase/functions/_shared/aiReadingExplanations';
import { generateAiReadingDraft } from '../../../supabase/functions/_shared/aiReadingProvider';
import {
  aiReadingDraftSections,
  validateAiReadingDraft,
} from '../../../supabase/functions/_shared/aiReadingDraft';
import { markReadingSourceHighlights } from '../../../supabase/functions/_shared/readingSourceHighlights';
import { buildReadingPreview } from '@/components/admin/tests/preview/readingPreviewData';
import { aiReadingFixture, aiReadingInput } from '../helpers/aiReadingFixture';

const source = () => {
  const snapshot = buildReadingPreview(
    aiReadingDraftSections(validateAiReadingDraft(aiReadingFixture(), { expectedQuestions: 13 }))
  );
  return makeReadingExplanationInput(snapshot.testData.sections, snapshot.allQuestions, 0);
};
const explanations = () =>
  Object.fromEntries(
    aiReadingFixture()
      .sections[0].groups.flatMap((group) => group.items)
      .map((item) => [item.number, item.explanation])
  );
describe('AI explanations preserve existing source and answer ownership', () => {
  it('extracts all composite answers and accepted multi-select choices without source mutation', () => {
    const input = source();
    expect(input.expectedQuestions).toBe(13);
    expect(input.passages[0].questions[5]).toMatchObject({
      number: 6,
      answer: 'A',
      accepted_answers: ['A', 'C'],
    });
    expect(input.passages[0].questions[9]).toMatchObject({ number: 10, answer: 'washing' });
    const result = validateReadingExplanations({ explanations: explanations() }, input);
    expect(result[12].correct_answer).toBe('1999');
  });
  it('uses the same cheap route for explanations only and never returns changed test content', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: { content: JSON.stringify({ issues: [], explanations: explanations() }) },
            },
          ],
          usage: { cost: 0.001, total_tokens: 100 },
        })
      )
    );
    const input = source(),
      before = JSON.stringify(input);
    const result = await generateAiReadingDraft(input, 'test-secret', fetcher);
    expect(result.explanations[1].correct_answer).toBe('TRUE');
    expect(result).not.toHaveProperty('draft');
    expect(JSON.stringify(input)).toBe(before);
    expect(JSON.parse(fetcher.mock.calls[0][1].body).model).toBe('openai/gpt-6-luna');
  });
  it('rejects missing explanations, invented evidence and accepted choices marked wrong', () => {
    const input = source();
    const missing = explanations();
    delete missing[1];
    expect(() => validateReadingExplanations({ explanations: missing }, input)).toThrow('every');
    const bad = explanations();
    bad[6].why_wrong = { C: 'Wrong' };
    expect(() => validateReadingExplanations({ explanations: bad }, input)).toThrow('accepted');
  });
});
describe('highlighted screenshots', () => {
  it('accepts only exact highlighted excerpts with numbers owned by their passage', () => {
    const raw = aiReadingFixture();
    raw.sections[0].highlights = [
      { text: 'Ada planted roses in spring.', question_numbers: [1, 3] },
    ];
    const clean = validateAiReadingDraft(raw, { expectedQuestions: 13 });
    const section = aiReadingDraftSections(clean)[0];
    expect(section.content).toContain('[answer q=1,3]Ada planted roses in spring.[/answer]');
    expect(raw.sections[0].content).not.toContain('[answer q=');
    raw.sections[0].highlights[0].text = 'Invented quote';
    expect(() => validateAiReadingDraft(raw, { expectedQuestions: 13 })).toThrow('exact passage');
    raw.sections[0].highlights = [{ text: 'Ada planted roses in spring.', question_numbers: [40] }];
    expect(() => validateAiReadingDraft(raw, { expectedQuestions: 13 })).toThrow('out of range');
  });
  it('merges overlapping source highlights without nesting or dropping question labels', () => {
    expect(
      markReadingSourceHighlights('abcdef', [
        { text: 'bcd', question_numbers: [1] },
        { text: 'cde', question_numbers: [2] },
      ])
    ).toBe('a[answer q=1,2]bcde[/answer]f');
  });
});
