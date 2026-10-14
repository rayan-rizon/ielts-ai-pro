import { describe, expect, it } from 'vitest';

import {
  buildChartCheck,
  buildCriteria,
  buildMistakeGroups,
  buildNextStep,
  buildPriorities,
  describeMarking,
} from './writingReportModel';
import { writingSourceForMarking } from './evaluationEvidence';
import { normalizeWritingEvaluation } from '../../../../../supabase/functions/_shared/evaluationUtils.ts';

const base = {
  taskType: 'Task 2',
  overallBand: 6,
  criteriaScores: {
    TaskResponse: 6.5,
    CoherenceAndCohesion: 6,
    LexicalResource: 6,
    GrammaticalRangeAndAccuracy: 5.5,
  },
};

describe('writing report model', () => {
  it("uses the official names, the marker's reason when saved, and flags only a real lowest score", () => {
    const criteria = buildCriteria({
      ...base,
      criterionNotes: { GrammaticalRangeAndAccuracy: 'Several verbs do not match their subjects.' },
    });
    expect(criteria.map((row) => row.label)).toEqual([
      'Task Response',
      'Coherence and Cohesion',
      'Lexical Resource',
      'Grammatical Range and Accuracy',
    ]);
    expect(criteria[3]).toMatchObject({
      isLowest: true,
      note: 'Several verbs do not match their subjects.',
    });
    expect(criteria[0].note).toBe('');

    const level = buildCriteria({
      ...base,
      criteriaScores: {
        TaskResponse: 7,
        CoherenceAndCohesion: 7,
        LexicalResource: 7,
        GrammaticalRangeAndAccuracy: 7,
      },
    });
    expect(level.some((row) => row.isLowest)).toBe(false);
  });

  it('never invents a score for a criterion that was not marked', () => {
    expect(buildCriteria({ ...base, criteriaScores: { TaskResponse: 6 } })).toHaveLength(1);
  });

  it('makes the word limit the next step when the essay is under length', () => {
    const priorities = buildPriorities({
      ...base,
      priorities: [{ criterion: 'Grammar', issue: 'Agreement errors.', action: 'Check verbs.' }],
    });
    const step = buildNextStep(
      { ...base, isBelowMinimumWordCount: true, wordCount: 196 },
      priorities
    );
    expect(step.title).toBe('Write at least 250 words');
    expect(step.rest).toHaveLength(1);
    expect(buildNextStep(base, priorities)).toMatchObject({
      title: 'Agreement errors.',
      body: 'Check verbs.',
      criterion: 'Grammatical Range and Accuracy',
    });
  });

  it('shows a replacement as a fix and advice as advice', () => {
    const groups = buildMistakeGroups({
      ...base,
      annotations: [
        {
          originalText: 'people is',
          type: 'grammar',
          severity: 'error',
          suggestion: 'people are',
          replacementText: 'people are',
          explanation: 'Plural.',
        },
        {
          originalText: 'nice',
          type: 'vocabulary',
          severity: 'suggestion',
          suggestion: 'Use a more exact word.',
          replacementText: '',
          explanation: '',
        },
        {
          originalText: 'clear view',
          type: 'positive',
          severity: 'positive',
          suggestion: 'Good.',
          explanation: '',
        },
      ],
    });
    expect(groups.map((group) => group.id)).toEqual(['grammar', 'words']);
    expect(groups[0].items[0]).toMatchObject({ replacement: 'people are', advice: '' });
    expect(groups[1].items[0]).toMatchObject({ replacement: '', advice: 'Use a more exact word.' });
  });

  it('describes marking agreement without examiner jargon', () => {
    expect(describeMarking({ sampleCount: 1, confidence: 'high' })).toBe(
      'Marked once. Every area was a clear fit for its band.'
    );
    expect(describeMarking({ sampleCount: 3, maxSpread: 1 })).toBe(
      'Marked 3 times. You see the middle mark for each area.'
    );
    expect(describeMarking(null)).toBe('');
  });

  it('turns Task 1 chart analysis into a plain status', () => {
    const analysis = {
      visualType: 'process diagram',
      responseVisualType: 'process diagram',
      alignment: 'aligned',
      visualReadable: true,
      observedFeatures: ['Seven numbered stages'],
      limitations: '',
    };
    expect(buildChartCheck({ taskType: 'Task 1', taskAnalysis: analysis })).toMatchObject({
      status: 'ok',
      message: 'The task shows a process diagram, and your answer describes it.',
    });
    expect(
      buildChartCheck({
        taskType: 'Task 1',
        taskAnalysis: { ...analysis, alignment: 'mismatched', responseVisualType: 'bar chart' },
      }).status
    ).toBe('fault');
    expect(buildChartCheck({ ...base, taskAnalysis: analysis })).toBeNull();
  });

  it('sends the marker the essay with its paragraph breaks', () => {
    expect(
      writingSourceForMarking('<p><span>First  idea.</span></p><p>Second &amp; last.</p><p></p>')
    ).toBe('First idea.\n\nSecond & last.');
  });

  it("keeps only paragraph notes that really start one of the learner's paragraphs", () => {
    const result = normalizeWritingEvaluation(
      {
        criteriaScores: base.criteriaScores,
        summary: 'Clear view.',
        criterionNotes: { TaskResponse: 'You answer both parts.', CoherenceAndCohesion: '' },
        paragraphNotes: [
          { opening: 'Nowadays many people believe', note: 'Clear introduction.' },
          { opening: 'This paragraph does not exist', note: 'Invented.' },
        ],
        annotations: [],
        strengths: [],
        priorities: [],
        vocabularyEnhancements: [],
      },
      'Task 2',
      'Nowadays many people believe transport should be free.\n\nFirstly it reduces traffic.'
    );
    expect(result.criterionNotes).toEqual({ TaskResponse: 'You answer both parts.' });
    expect(result.paragraphNotes).toEqual([
      { opening: 'Nowadays many people believe', note: 'Clear introduction.' },
    ]);
  });
});

describe('writing report polish', () => {
  it('ends text the server cut mid-word at the last whole word', async () => {
    const { tidyServerCut } = await import('./feedbackFormatting');
    expect(
      tidyServerCut(
        'Keep the report focused on the satisfaction figures rather than inferring a recommendat...'
      )
    ).toBe('Keep the report focused on the satisfaction figures rather than inferring a…');
    expect(tidyServerCut('The reason is...')).toBe('The reason is...');
  });

  it('says whether repetition matters and offers alternatives', async () => {
    const { adviceForRepeatedWord, alternativesFor } = await import('./repeatedWordAdvice');
    expect(alternativesFor('students')).toEqual(['learner', 'pupil', 'undergraduate']);
    expect(alternativesFor('increased')).toEqual(['rise', 'growth', 'climb']);
    const many = adviceForRepeatedWord({ word: 'people', count: 6 });
    expect(many.severity).toBe('high');
    expect(many.verdict).toMatch(/can lower your Lexical Resource score/);
    expect(many.alternatives).toContain('individuals');
    const unknown = adviceForRepeatedWord({ word: 'bamboo', count: 3 });
    expect(unknown.alternatives).toEqual([]);
    expect(unknown.tip).toMatch(/“it”, “they” or “this”/);
  });

  it('ticks chart features the answer mentions', async () => {
    const { featureMentioned } = await import('./writingReportModel');
    const essay =
      'Overall, the formation involves seven sequential stages: moist air rises and cools over the mountain.';
    expect(featureMentioned('Seven numbered stages', essay)).toBe(true);
    expect(featureMentioned('Moist air rises and cools on the windward slope', essay)).toBe(true);
    expect(featureMentioned('Pie chart presents five library-user categories', essay)).toBe(false);
  });
});
