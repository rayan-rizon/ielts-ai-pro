import { describe, expect, it } from 'vitest';
import {
  questionFocus,
  practiceTips,
  libraryGroupSource,
  derivePassageTitle,
  rankPracticeNeeds,
  chooseLibraryGroups,
  scoreLibraryGroup,
  publicPracticeContent,
  buildLibraryGroups,
  buildLibraryTutorContext,
} from '../../../supabase/functions/_shared/skill-lab/libraryPractice.js';

const now = new Date('2026-09-07T12:00:00Z');
const attempt = (id, extra = {}) => ({
  focus: 'reading:matching_headings',
  sessionId: id,
  groupId: id,
  sourceId: id,
  completedAt: '2026-09-06T12:00:00Z',
  responses: [1, 2, 3].map((n) => ({ questionId: `${id}-${n}`, isCorrect: n === 1 })),
  ...extra,
});
describe('library-backed personal practice', () => {
  it('uses only the matching original section and never includes embedded answers as passage text', () => {
    const passage = {
      id: 'p',
      title: 'Original',
      test_type: 'reading',
      content: JSON.stringify([
        { section_number: 1, content: 'First passage' },
        { section_number: 2, content: 'Required passage', question_groups: [{ answer: 'secret' }] },
      ]),
    };
    expect(libraryGroupSource(passage, [{ section: 2 }])).toMatchObject({
      content: 'Required passage',
      section: 2,
    });
    expect(JSON.stringify(libraryGroupSource(passage, [{ section: 2 }]))).not.toContain('secret');
    expect(libraryGroupSource(passage, [{ section: 3 }]).content).toBe('');
    expect(
      libraryGroupSource(
        {
          ...passage,
          test_type: 'listening',
          audio_url: 'full.mp3',
          content: JSON.stringify([{ section_number: 2, audio_url: 'part2.mp3' }]),
        },
        [{ section: 2 }]
      )
    ).toMatchObject({ audio_url: 'part2.mp3', audio_scope: 'section', content: '' });
  });
  it('returns the real section passage title with safe fallbacks', () => {
    const passage = {
      id: 'p',
      title: 'IELTS library test',
      test_type: 'reading',
      content: JSON.stringify([
        {
          section_number: 3,
          title: 'The findings of psychological scientists reveal the importance of humour',
          content:
            '[center]The findings of psychological scientists reveal the importance of humour[/center]\n\nText',
        },
      ]),
    };
    expect(libraryGroupSource(passage, [{ section: 3 }])).toMatchObject({
      passage_title: 'The findings of psychological scientists reveal the importance of humour',
    });
    expect(
      derivePassageTitle(
        { title: 'Reading Passage 3' },
        '[center]*A short history of maps*[/center]\n\nText'
      )
    ).toBe('A short history of maps');
    expect(derivePassageTitle({ title: 'Part 3' }, 'Original text')).toBe(null);
  });
  it('removes answer-location markers from original passages before practice', () => {
    const source = libraryGroupSource(
      {
        id: 'p',
        title: 'Test',
        test_type: 'reading',
        content: '[answer q=14]Original evidence[/answer] remains.',
      },
      [{ section: 1 }]
    );
    expect(source.content).toBe('Original evidence remains.');
    expect(publicPracticeContent({ question_text: '[answer q=2]Text[/answer]' })).toEqual({
      question_text: 'Text',
    });
  });
  it('keeps question-type tips specific and practice evidence distinguishable from tests', () => {
    expect(practiceTips('reading:true_false_not_given').join(' ')).toContain(
      'Missing information means Not Given'
    );
    expect(practiceTips('listening:multiple_choice').join(' ')).toContain('speaker');
    const need = rankPracticeNeeds([attempt('p', { practice: true })], now)[0];
    expect(need.mistakes[0].practice).toBe(true);
    expect(need.sources[0].practice).toBe(true);
  });
  it('labels full-test history separately from new Practice Lab questions', () => {
    const fullTest = attempt('full-test');
    const practice = attempt('practice', { practice: true, completedAt: '2026-09-07T10:00:00Z' });
    const history = rankPracticeNeeds([fullTest, practice], now)[0].history;
    expect(history.map((entry) => entry.kind)).toEqual(['New questions', 'Full test']);
  });
  it('requires distinct sessions, groups and enough independent answers', () => {
    expect(rankPracticeNeeds([attempt('a')], now)[0].repeatedDifficulty).toBe(false);
    const result = rankPracticeNeeds([attempt('a'), attempt('b')], now)[0];
    expect(result).toMatchObject({ total: 6, correct: 2, repeatedDifficulty: true });
    expect(
      rankPracticeNeeds([attempt('a'), attempt('b', { groupId: 'a' })], now)[0].repeatedDifficulty
    ).toBe(false);
  });
  it('does not count helped, repeated or familiar practice as new performance', () => {
    for (const flag of ['assisted', 'repeated', 'familiar'])
      expect(rankPracticeNeeds([attempt('a'), attempt('b', { [flag]: true })], now)[0].total).toBe(
        3
      );
  });
  it('ignores old or future attempts and deduplicates questions across sessions', () => {
    expect(rankPracticeNeeds([attempt('a', { completedAt: '2026-01-01' })], now)).toEqual([]);
    expect(rankPracticeNeeds([attempt('a', { completedAt: '2027-01-01' })], now)).toEqual([]);
    expect(rankPracticeNeeds([attempt('a'), attempt('a', { sessionId: 'b' })], now)[0].total).toBe(
      3
    );
  });
  it('does not mislabel summary gaps as matching information', () => {
    expect(
      questionFocus('reading', {
        type: 'matching_features',
        matching_features: { mode: 'paragraph' },
      })
    ).toBe('reading:summary_completion');
    expect(questionFocus('reading', { type: 'matching_features' })).toBe(
      'reading:matching_features'
    );
    expect(questionFocus('reading', { type: 'matching_headings' })).toBe(
      'reading:matching_headings'
    );
  });
  it('distinguishes headings and information stored under the legacy matching type', () => {
    expect(
      questionFocus('reading', {
        type: 'matching_features',
        matching_features: { mode: 'list', box_title: 'List of Headings' },
      })
    ).toBe('reading:matching_headings');
    expect(
      questionFocus('reading', {
        type: 'matching_features',
        group_instructions: 'Which paragraph contains the following information?',
      })
    ).toBe('reading:matching_information');
    expect(
      questionFocus('listening', {
        type: 'matching_features',
        group_instructions: 'Match the features',
      })
    ).toBe('listening:matching_features');
  });
  it('prefers new context and never substitutes unavailable content', () => {
    const groups = ['a', 'b', 'c'].map((id) => ({ id, sourceId: id, focus: 'x', eligible: true }));
    expect(
      chooseLibraryGroups(groups, [{ groupId: 'a', sourceId: 'a' }, { sourceId: 'b' }], 'x').map(
        (g) => g.familiarity
      )
    ).toEqual(['new', 'familiar', 'repeated']);
    expect(chooseLibraryGroups(groups, [], 'missing')).toEqual([]);
  });
  it('uses shared scoring without returning a band claim', () => {
    const result = scoreLibraryGroup(
      'reading',
      [{ id: 'q', type: 'multiple_choice', correct_answer: 'A', question_number: 1 }],
      { q: 'A' }
    );
    expect(result).toMatchObject({ correct: 1, total: 1 });
    expect(result).not.toHaveProperty('bandScore');
  });
  it('removes nested answer keys, explanations and unknown provider fields', () => {
    const content = publicPracticeContent({
      id: 'q',
      correct_answer: 'A',
      explanation: 'secret',
      matching_data: { paragraphs: [{ label: 'A', text: 'Original', correct_heading: 'iv' }] },
      matching_features: {
        options: ['One'],
        answers: { 1: 'A' },
        questions: [{ id: 'sub', text: 'Original', answer: 'A' }],
      },
      provider_payload: { secret: true },
    });
    expect(content.matching_data.paragraphs).toEqual([{ label: 'A', text: 'Original' }]);
    expect(JSON.stringify(content)).not.toMatch(
      /secret|correct_heading|correct_answer|"answer"|"answers"/
    );
  });
  it('keeps library provenance and rejects missing context or keys', () => {
    const passage = {
      id: 'p',
      test_type: 'reading',
      is_active: true,
      content: 'Original passage',
      title: 'Library test',
    };
    const questions = [
      {
        id: 'q',
        passage_id: 'p',
        type: 'multiple_choice',
        correct_answer: 'A',
        question_number: 1,
      },
    ];
    expect(buildLibraryGroups(passage, questions)[0]).toMatchObject({
      sourceId: 'p',
      eligible: true,
      total: 1,
    });
    expect(buildLibraryGroups({ ...passage, content: '' }, questions)[0].eligible).toBe(false);
    expect(buildLibraryGroups(passage, [{ ...questions[0], correct_answer: '' }])[0].eligible).toBe(
      false
    );
    expect(buildLibraryGroups({ ...passage, is_active: false }, questions)).toEqual([]);
  });
  it('keeps verified answer context when the original passage is too long for the AI prompt', () => {
    const context = buildLibraryTutorContext(
      {
        focus: 'reading:matching_information',
        stage: 3,
        completed_at: '2026-09-08T12:00:00Z',
        source: { title: 'Original library test', section: 1, content: 'x'.repeat(30000) },
        questions: [
          {
            id: 'matching',
            question_number: 1,
            question_text: 'Which paragraph contains this information?',
            type: 'matching_features',
            matching_features: {
              questions: [
                { id: 'one', question_number: 1, text: 'a detail about food production' },
              ],
            },
          },
        ],
        result: {
          answers: {
            matching_one: {
              questionNumber: 1,
              userAnswer: 'B',
              correctAnswer: 'A',
              isCorrect: false,
            },
          },
        },
        explanations: [
          { id: 'matching', text: 'Question 1: Paragraph A states the exact detail.' },
        ],
      },
      [{ correct: 2, total: 5 }]
    );

    expect(JSON.stringify(context)).toContain('a detail about food production');
    expect(JSON.stringify(context)).toContain('Paragraph A states the exact detail.');
    expect(context.answer_review[0]).toMatchObject({
      question_number: 1,
      student_answer: 'B',
      correct_answer: 'A',
      is_correct: false,
    });
    expect(JSON.stringify(context)).not.toContain('x'.repeat(100));
    expect(JSON.stringify(context).length).toBeLessThan(12000);
  });
});
