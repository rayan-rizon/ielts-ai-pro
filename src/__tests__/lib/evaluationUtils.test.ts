import { describe, expect, it } from 'vitest';
import {
  aggregatePronunciationEvidence,
  buildSpeakingTranscript,
  normalizeBandScore,
  normalizeDetailedSpeakingEvaluation,
  normalizeSpeakingEvaluation,
  normalizeWritingEvaluation,
  parseStructuredJson,
} from '../../../supabase/functions/_shared/evaluationUtils.ts';
import { generateEvaluationPrompt } from '../../../supabase/functions/_shared/bandDescriptors.ts';

describe('evaluationUtils', () => {
  it('normalizes model scores to valid IELTS half bands', () => {
    expect(normalizeBandScore(6.24)).toBe(6);
    expect(normalizeBandScore('6.76')).toBe(7);
    expect(normalizeBandScore(12)).toBe(9);
    expect(normalizeBandScore('not-a-score')).toBeNull();
    expect(normalizeBandScore(0, false)).toBeNull();
  });

  it('accepts fenced structured JSON and rejects truncated model output', () => {
    expect(parseStructuredJson('```json\n{"overallBand":6.5}\n```')).toEqual({
      overallBand: 6.5,
    });
    expect(() => parseStructuredJson('{"overallBand":"unterminated}')).toThrow();
  });

  it('does not ask the speaking model to invent pronunciation from text', () => {
    const prompt = generateEvaluationPrompt('=== PART 1 ===\nCandidate: I live in Dhaka.', 'full');

    expect(prompt).toContain('set pronunciation to null');
    expect(prompt).toContain('must not claim evidence about speech rate');
    expect(prompt).not.toContain('Native-like');
  });

  it('recomputes writing overall band and removes unsupported source references', () => {
    const source =
      'Public transport reduces congestion, but governments must also improve service reliability. Reliable buses and trains can persuade more commuters to leave private cars at home each day.';
    const result = normalizeWritingEvaluation(
      {
        overallBand: 9,
        criteriaScores: {
          TaskResponse: 6.4,
          CoherenceAndCohesion: 6.6,
          LexicalResource: 6.4,
          GrammaticalRangeAndAccuracy: 6.6,
        },
        annotations: [
          {
            originalText: 'reduces congestion',
            type: 'positive',
            suggestion: 'Keep this precise phrase.',
            explanation: 'It states the benefit clearly.',
            severity: 'positive',
          },
          {
            originalText: 'invented phrase',
            type: 'grammar',
            suggestion: 'Change it.',
            explanation: 'Fabricated.',
            severity: 'error',
          },
        ],
        corrections: [
          {
            original: 'invented phrase',
            correction: 'replacement',
            explanation: 'Fabricated.',
          },
        ],
        strengths: ['Uses "reduces congestion" precisely.'],
        weaknesses: [],
        suggestions: ['Develop the government response with a concrete example.'],
      },
      'Task 2',
      source
    );

    expect(result.criteriaScores).toEqual({
      TaskResponse: 6.5,
      CoherenceAndCohesion: 6.5,
      LexicalResource: 6.5,
      GrammaticalRangeAndAccuracy: 6.5,
    });
    expect(result.overallBand).toBe(6.5);
    expect(result.evaluationVersion).toBe('2026-07-29-v5');
    expect(result.annotations).toHaveLength(1);
    expect(result.corrections).toEqual([]);
    expect(result.weaknesses[0]).toContain('below the 250-word minimum');
  });

  it('normalizes the compact writing contract and derives corrections from grounded annotations', () => {
    const source =
      'Public transport reduce congestion, and reliable services encourage commuters to leave their cars at home. Governments should improve routes, lower ticket prices, and provide dependable services across the city.';
    const result = normalizeWritingEvaluation(
      {
        criteriaScores: {
          TaskResponse: 6,
          CoherenceAndCohesion: 6.5,
          LexicalResource: 6.5,
          GrammaticalRangeAndAccuracy: 5.5,
        },
        summary:
          'The position is clear, but recurring agreement errors reduce grammatical accuracy. This sentence should be removed by the compact normalizer.',
        annotations: [
          {
            originalText: 'transport reduce',
            type: 'grammar',
            suggestion: 'transport reduces',
            explanation: 'A singular subject requires a singular verb.',
            severity: 'error',
          },
        ],
        strengths: [
          '**Task Response:** The position is clear from the opening clause.',
          'The cause-and-effect link is easy to follow.',
          'The phrase “reliable services” is precise.',
          'This fourth strength must be removed.',
        ],
        priorities: [
          {
            criterion: 'Grammar',
            issue: 'Subject–verb agreement is not consistently controlled.',
            action: 'Check every present-tense verb against its subject.',
          },
          {
            criterion: 'Unsupported criterion',
            issue: 'This item must be filtered.',
            action: 'Do nothing.',
          },
        ],
        vocabularyEnhancements: [],
      },
      'Task 2',
      source
    );

    expect(result.overallBand).toBe(6);
    expect(result.evaluationVersion).toBe('2026-07-29-v5');
    expect(result.summary).toBe(
      'The position is clear, but recurring agreement errors reduce grammatical accuracy.'
    );
    expect(result.strengths).toHaveLength(3);
    expect(result.strengths[0]).toBe(
      'Task Response: The position is clear from the opening clause.'
    );
    expect(result.priorities).toEqual([
      {
        criterion: 'Grammar',
        issue: 'Subject–verb agreement is not consistently controlled.',
        action: 'Check every present-tense verb against its subject.',
      },
    ]);
    expect(result.corrections).toEqual([
      {
        original: 'transport reduce',
        correction: 'transport reduces',
        explanation: 'A singular subject requires a singular verb.',
      },
    ]);
  });

  it('does not turn missing pronunciation evidence into a zero speaking score', () => {
    const transcript = buildSpeakingTranscript({
      1: [
        { speaker: 'ai', text: 'Where do you live?' },
        { speaker: 'user', text: 'I live in Dhaka, which is a busy and energetic city.' },
      ],
      2: [
        { speaker: 'ai', text: "Now it's time for Part 2." },
        { speaker: 'user', text: '...' },
      ],
      3: [],
    });
    const pronunciation = aggregatePronunciationEvidence({ 1: [], 2: [] });
    const result = normalizeSpeakingEvaluation(
      {
        fluency: 6.2,
        lexical: 6.7,
        grammar: 6.3,
        pronunciation: 7.5,
        feedback: 'The candidate gave one developed response.',
        criterionNotes: {
          fluency: 'The candidate answered without significant hesitation.',
        },
        strengths: [
          'The answer used a relevant relative clause.',
          'Connected speech was smooth without pauses.',
        ],
        partScores: {
          part1: {
            band: 6.4,
            keyObservation: 'A relevant developed answer with a natural flow of speech.',
          },
          part2: { band: 7, keyObservation: 'No answer.' },
          part3: { band: 7, keyObservation: 'No answer.' },
        },
      },
      transcript.partStats,
      pronunciation
    );

    expect(result.pronunciation).toBeNull();
    expect(result.overallBand).toBe(6.5);
    expect(result.provisionalOverallBand).toBe(6.5);
    expect(result.assessmentStatus).toBe('transcript');
    expect(result.evaluationVersion).toBe('2026-07-29-v5');
    expect(result.scoreBasis).toBe('transcript');
    expect(result.criterionNotes.pronunciation).toBe('');
    expect(result.partScores.part2.band).toBeNull();
    expect(result.partScores.part3.band).toBeNull();
    expect(result.partScores.part1.keyObservation).not.toContain('flow of speech');
    expect(result.criterionNotes.fluency).not.toContain('hesitation');
    expect(result.criterionNotes.fluency).toContain('visible in the transcript');
    expect(result.strengths).toEqual(['The answer used a relevant relative clause.']);
  });

  it('uses the rounded audio-sample average for pronunciation and overall speaking band', () => {
    const transcript = buildSpeakingTranscript({
      1: [{ speaker: 'user', text: 'I live in Dhaka and enjoy its busy atmosphere.' }],
      2: [{ speaker: 'user', text: 'I would like to describe a memorable family journey.' }],
      3: [{ speaker: 'user', text: 'Public transport can reduce congestion in large cities.' }],
    });
    const pronunciation = aggregatePronunciationEvidence({
      1: [{ provider: 'azure-speech', pronunciationScore: 6.2 }],
      2: [{ provider: 'azure-speech', pronunciationScore: 6.8 }],
      3: [{ provider: 'azure-speech', pronunciationScore: 6.7 }],
    });
    const result = normalizeSpeakingEvaluation(
      {
        fluency: 6.5,
        lexical: 6.5,
        grammar: 6,
        pronunciation: 9,
        partScores: {},
      },
      transcript.partStats,
      pronunciation
    );

    expect(pronunciation.score).toBe(6.5);
    expect(result.pronunciation).toBe(6.5);
    expect(result.overallBand).toBe(6.5);
    expect(result.assessmentStatus).toBe('complete');
    expect(result.evaluationVersion).toBe('2026-07-29-v5');
  });

  it('filters procedural messages and includes task context in speaking evidence', () => {
    const result = buildSpeakingTranscript(
      {
        2: [
          { speaker: 'ai', text: "Now it's time for Part 2, the Individual Long Turn." },
          { speaker: 'user', text: 'I travelled to Coxs Bazar with my family last summer.' },
          {
            speaker: 'ai',
            text: 'Thank you for your response. That brings us to the end of Part 2.',
          },
        ],
      },
      {
        2: {
          title: 'Describe a memorable journey',
          questions: 'Say where you went, who you went with, and why it was memorable.',
        },
      }
    );

    expect(result.transcript).toContain('Task context: Describe a memorable journey');
    expect(result.transcript).toContain('Candidate: I travelled to Coxs Bazar');
    expect(result.transcript).not.toContain("Now it's time for Part 2");
    expect(result.transcript).not.toContain('That brings us to the end');
  });

  it('removes detailed-speaking corrections not grounded in the candidate answer', () => {
    const result = normalizeDetailedSpeakingEvaluation(
      [
        {
          part: 1,
          question: 'Where do you live?',
          candidateAnswer: 'I live in Dhaka.',
          grammaticalErrors: [
            {
              incorrect: 'I live',
              correct: 'I am living',
              explanation: 'Fabricated correction.',
            },
            {
              incorrect: 'not in answer',
              correct: 'replacement',
              explanation: 'Fabricated source.',
            },
          ],
          topicDrift: 'null',
          suggestedAnswer: 'I live in Dhaka, a busy capital city.',
          feedback: 'The response is relevant.',
        },
      ],
      { 1: 'I live in Dhaka.' }
    );

    expect(result).toHaveLength(1);
    expect(result[0].grammaticalErrors).toHaveLength(1);
    expect(result[0].grammaticalErrors[0].incorrect).toBe('I live');
  });
});
