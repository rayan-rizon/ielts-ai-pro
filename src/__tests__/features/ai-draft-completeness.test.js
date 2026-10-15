import { describe, expect, it } from 'vitest';
import { aiDraftCompleteness } from '@/components/admin/tests/ai/aiDraftCompleteness';
import { aiReadingFixture } from '../helpers/aiReadingFixture';

describe('AI completeness warnings', () => {
  it('reports every missing required component rather than a review checkbox', () => {
    const draft = aiReadingFixture();
    draft.sections[0].content = '';
    const item = draft.sections[0].groups[0].items[0];
    item.text = '';
    item.answer = '';
    item.explanation.why_correct = '';
    expect(
      aiDraftCompleteness(draft, 13)
        .filter((w) => w.blocking)
        .map((w) => w.code)
    ).toEqual(['passages', 'questions', 'answers', 'explanations']);
  });
  it('warns about absent highlights without blocking and exempts NOT GIVEN', () => {
    const draft = aiReadingFixture();
    draft.sections[0].groups[0].items[0].answer = 'NOT GIVEN';
    const warnings = aiDraftCompleteness(draft, 13);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].blocking).toBe(false);
    expect(warnings[0].message).not.toMatch(/Q1(?:,|\.)/);
    expect(warnings[0].message).toContain('Q2');
    draft.sections[0].highlights = [
      {
        text: draft.sections[0].content,
        question_numbers: Array.from({ length: 13 }, (_, i) => i + 1),
      },
    ];
    expect(aiDraftCompleteness(draft, 13)).toEqual([]);
  });
  it('does not count highlights removed from the passage as present', () => {
    const draft = aiReadingFixture();
    draft.sections[0].highlights = [{ text: 'Unrelated source phrase', question_numbers: [1] }];
    expect(aiDraftCompleteness(draft, 13)[0].message).toContain('Q1,');
  });
});
