import { describe, expect, it, vi } from 'vitest';
import {
  validateAiListeningInput,
  validateAiListeningDraft,
  aiListeningDraftSections,
} from '../../../supabase/functions/_shared/aiListeningDraft';
import { validateAiReadingDraft } from '../../../supabase/functions/_shared/aiReadingValidation';
import { generateAiReadingDraft } from '../../../supabase/functions/_shared/aiReadingProvider';
import { AI_READING_SYSTEM_PROMPT } from '../../../supabase/functions/_shared/aiReadingPrompt';
import { aiListeningFixture, aiListeningInput } from '../helpers/aiListeningFixture';
import { buildListeningPreview } from '@/components/admin/tests/preview/listeningPreviewData';
import {
  makeListeningExplanationInput,
  applyListeningExplanations,
} from '@/components/admin/tests/preview/listeningExplanationData';
import { calculateListeningTestResults } from '@/features/testing/listening/components/ListeningTest/utils/scoreCalculator';
describe('Listening AI contract and learner compatibility', () => {
  it('imports four parts in one batch with local audio assignment and valid scoring keys', () => {
    const raw = aiListeningFixture(),
      before = JSON.stringify(raw),
      input = validateAiListeningInput(aiListeningInput());
    const draft = validateAiListeningDraft(raw, input);
    expect(() => validateAiReadingDraft(raw, input)).toThrow('passages');
    const sections = aiListeningDraftSections(draft, input.audioUrls);
    expect(sections).toHaveLength(4);
    expect(sections[0].audio_url).toBe(input.audioUrls[0]);
    expect(sections[0].question_groups[0].questions[0].gap_fill.answers).toEqual({
      0: '1999',
      1: 'glass jars',
    });
    const snapshot = buildListeningPreview(sections);
    expect(snapshot.questions.map((q) => q._displayStartNumber)).toEqual([1, 3, 5, 7]);
    const empty = calculateListeningTestResults(snapshot.questions, {}, snapshot.displaySections);
    const answers = Object.fromEntries(
      Object.entries(empty.answersMap).map(([key, answer]) => [key, answer.correctAnswer])
    );
    const result = calculateListeningTestResults(
      snapshot.questions,
      answers,
      snapshot.displaySections
    );
    expect(result.correctAnswers).toBe(8);
    expect(result.totalQuestions).toBe(8);
    expect(JSON.stringify(raw)).toBe(before);
  });
  it('uses existing SRT-only audioscripts as exact explanation source', () => {
    const draft = validateAiListeningDraft(aiListeningFixture(), { expectedQuestions: 8 });
    const sections = aiListeningDraftSections(draft).map((section) => ({
      ...section,
      transcript: '',
      srt_content: '1\n00:00:01,000 --> 00:00:05,000\nGUIDE: The library opened in 1999.',
      groups: section.question_groups,
    }));
    const input = makeListeningExplanationInput(sections, 0);
    expect(input.passages[0].content).toBe('The library opened in 1999.');
    expect(input.passages[0].content).not.toContain('00:00:');
  });
  it('rejects missing transcripts, unsupported types, wrong keys and unsafe audio URLs', () => {
    expect(() => validateAiListeningInput({ ...aiListeningInput(), passageText: '' })).toThrow(
      'passage'
    );
    expect(() =>
      validateAiListeningInput({ ...aiListeningInput(), audioUrls: ['javascript:alert(1)'] })
    ).toThrow('HTTPS');
    const raw = aiListeningFixture();
    raw.sections[0].groups[0] = {
      type: 'true_false_not_given',
      instructions: 'TRUE/FALSE',
      items: [
        { ...raw.sections[0].groups[0].items[0], answer: 'TRUE' },
        { ...raw.sections[0].groups[0].items[1], answer: 'FALSE' },
      ],
    };
    expect(() => validateAiListeningDraft(raw, { expectedQuestions: 8 })).toThrow(
      'Unsupported Listening'
    );
  });
  it('generates on its own cheap route and extracts four-part explanation scope without mutations', async () => {
    const input = validateAiListeningInput(aiListeningInput());
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify(aiListeningFixture()) } }],
          usage: { cost: 0.001 },
        })
      )
    );
    const result = await generateAiReadingDraft(input, 'test', fetcher, {
      routeId: 'admin-listening-draft',
      systemPrompt: AI_READING_SYSTEM_PROMPT,
      validateDraft: validateAiListeningDraft,
    });
    expect(JSON.parse(fetcher.mock.calls[0][1].body).model).toBe('openai/gpt-6-luna');
    const sections = aiListeningDraftSections(result.draft).map((section) => ({
      ...section,
      groups: section.question_groups,
    }));
    const before = JSON.stringify(sections),
      explanationInput = makeListeningExplanationInput(sections, null);
    expect(explanationInput.passages).toHaveLength(4);
    expect(explanationInput.expectedQuestions).toBe(8);
    const updated = applyListeningExplanations(sections, { 1: { why_correct: 'New explanation' } });
    expect(updated[0].groups[0].questions[0].explanation_data.blanks[1].why_correct).toBe(
      'New explanation'
    );
    expect(updated[0].groups[0].questions[0].gap_fill).toEqual(
      sections[0].groups[0].questions[0].gap_fill
    );
    expect(JSON.stringify(sections)).toBe(before);
  });
});
