import { describe, expect, it } from 'vitest';
import { buildResultRecommendations } from '@/features/recommendations/resultRecommendations';
import { GRAMMAR_GUIDES } from '@/features/grammar/data/grammarGuideCatalog';
import { VOCABULARY_KITS } from '@/features/vocabulary/data/vocabularyKits';

const NOW = new Date('2026-08-18T12:00:00.000Z').getTime();

function session(overrides = {}) {
  return {
    id: 'session-1',
    test_type: 'writing',
    is_completed: true,
    evaluation_status: 'complete',
    completed_at: '2026-08-17T12:00:00.000Z',
    score: 5.5,
    content_data: {},
    ...overrides,
  };
}

function recommendations(input) {
  return buildResultRecommendations({
    grammarGuides: GRAMMAR_GUIDES,
    vocabularyKits: VOCABULARY_KITS,
    ...input,
  });
}

describe('result-based learning recommendations', () => {
  it('maps grounded grammar corrections and lexical gaps to existing curriculum items', () => {
    const model = recommendations({
      now: NOW,
      targetBand: 7,
      sessions: [
        session({
          passage: { title: 'The future of education' },
          content_data: {
            criteriaScores: { grammar: 5.5, lexicalResource: 5.5 },
            ai_feedbacks: {
              'Task 2': {
                annotations: [
                  {
                    type: 'grammar',
                    originalText: 'Many student is affected',
                    suggestion: 'Many students are affected',
                    explanation: 'The plural subject needs a plural verb.',
                  },
                ],
              },
            },
          },
        }),
      ],
    });

    expect(model.grammar.map((item) => item.slug)).toContain('subject-verb-agreement');
    expect(model.vocabulary.map((item) => item.slug)).toEqual(
      expect.arrayContaining([
        'band-7-vocabulary-builder',
        'high-value-academic-verbs-usable-in-every-topic-vocabulary-for-ielts',
        'education-vocabulary-for-ielts',
      ])
    );
    expect(model.evidence).toMatchObject({ resultCount: 1, hasResultEvidence: true });
  });

  it('does not invent a specific grammar topic from a broad criterion score', () => {
    const model = recommendations({
      now: NOW,
      targetBand: 7,
      sessions: [
        session({
          content_data: {
            criteriaScores: { grammar: 5, lexicalResource: 7 },
          },
        }),
      ],
    });

    expect(model.grammar).toEqual([]);
  });

  it('reads speaking grammar evidence from the normalized deep-dive envelope', () => {
    const model = recommendations({
      now: NOW,
      targetBand: 7,
      sessions: [
        session({
          test_type: 'speaking',
          content_data: {
            criteriaScores: { grammar: 5.5 },
            detailedFeedback: {
              questions: [
                {
                  part: 1,
                  question: 'Tell me about your neighbourhood.',
                  grammaticalErrors: [
                    {
                      originalText: 'My neighbourhood have many parks.',
                      suggestion: 'My neighbourhood has many parks.',
                    },
                  ],
                },
              ],
              model: 'gemini-test',
            },
          },
        }),
      ],
    });

    expect(model.grammar.map((item) => item.slug)).toContain('subject-verb-agreement');
  });

  it('uses measured Grammar Lab results and advances past a completed guide', () => {
    const model = recommendations({
      now: NOW,
      grammarSkills: [
        {
          skillCode: 'grammar_sentence_boundaries',
          label: 'Sentence boundaries',
          evidenceClass: 'measured',
          observations: 8,
          mastery: 0.4,
        },
      ],
      completedGrammarSlugs: ['complete-sentences-and-clauses'],
    });

    expect(model.grammar[0]).toMatchObject({
      slug: 'coordination-and-parallel-structure',
      sources: ['grammar-lab'],
    });
    expect(model.grammar[0].reason).toContain('40% mastery');
  });

  it('keeps the guide badge eligible for a directly observed weak skill near the mastery cutoff', () => {
    const model = recommendations({
      now: NOW,
      grammarSkills: [
        {
          skillCode: 'grammar_articles_determiners',
          label: 'Articles and determiners',
          evidenceClass: 'measured',
          observations: 5,
          mastery: 0.7,
        },
      ],
    });

    expect(model.grammar).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          slug: 'articles-a-an-the-and-zero',
          sources: ['grammar-lab'],
        }),
      ])
    );
  });

  it('maps a sufficiently observed weak Reading type without treating one question as a pattern', () => {
    const model = recommendations({
      now: NOW,
      targetBand: 7,
      sessions: [
        session({
          test_type: 'reading',
          evaluation_status: null,
          score: 5,
          content_data: {
            typeStats: {
              'Matching Headings': { correct: 1, total: 4 },
              'Sentence Completion': { correct: 0, total: 1 },
            },
          },
        }),
      ],
    });

    expect(model.vocabulary.map((item) => item.slug)).toEqual(
      expect.arrayContaining(['ielts-reading-argument-and-evidence', 'band-7-vocabulary-builder'])
    );
  });

  it('ignores stale, incomplete, and failed evaluation records', () => {
    const model = recommendations({
      now: NOW,
      targetBand: 7,
      sessions: [
        session({ is_completed: false }),
        session({ id: 'failed', evaluation_status: 'failed' }),
        session({ id: 'stale', completed_at: '2025-12-01T12:00:00.000Z' }),
      ],
    });

    expect(model.grammar).toEqual([]);
    expect(model.vocabulary).toEqual([]);
    expect(model.evidence.resultCount).toBe(0);
  });

  it('suppresses completed resources and caps catalog noise', () => {
    const model = recommendations({
      now: NOW,
      targetBand: 7,
      completedVocabularySlugs: ['band-7-vocabulary-builder'],
      sessions: [
        session({
          passage: { title: 'Education and technology in cities' },
          content_data: {
            criteriaScores: { grammar: 7, lexicalResource: 5 },
          },
        }),
      ],
    });

    expect(model.vocabulary.length).toBeGreaterThan(0);
    expect(model.vocabulary.length).toBeLessThanOrEqual(3);
    expect(model.vocabulary.map((item) => item.slug)).not.toContain('band-7-vocabulary-builder');
  });
});
