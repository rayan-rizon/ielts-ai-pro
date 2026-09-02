import { describe, expect, it } from 'vitest';
import { buildLearningPathAnalytics } from '@/features/analytics/hooks/learningPathAnalytics';

describe('Learning Path evidence in Analytics', () => {
  it('preserves V2 evidence classes, sample sizes, and the shared fingerprint', () => {
    const result = buildLearningPathAnalytics({
      version: 2,
      input_fingerprint: 'evidence-v2',
      coach_summary: {
        headline: 'Repair the measured format first.',
        explanation: 'Keep early signals tentative.',
      },
      evidence_summary: {
        confidence_label: 'developing',
        counts: { measured: 1, early: 1, diagnostic: 3 },
        measured_priorities: [
          {
            skill_code: 'reading_matching_headings',
            module: 'reading',
            mastery: 0.45,
            observations: 12,
            correct_count: 5,
            evidence_class: 'measured_priority',
          },
        ],
        early_signals: [
          {
            skill_code: 'listening_map_labeling',
            module: 'listening',
            mastery: 0.5,
            observations: 3,
            correct_count: 1,
            evidence_class: 'early_signal',
          },
        ],
      },
    });

    expect(result.fingerprint).toBe('evidence-v2');
    expect(result.measuredPriorities[0]).toMatchObject({
      module: 'Matching Headings',
      evidenceClass: 'measured_priority',
      observations: 12,
    });
    expect(result.earlySignals[0]).toMatchObject({
      module: 'Map Labeling',
      evidenceClass: 'early_signal',
      observations: 3,
    });
    expect(result.earlySignals[0].strategy).toContain('keep measuring');
    expect(result.aiSuggestions.recommended_focus_areas).toHaveLength(2);
  });

  it('does not invent evidence for legacy paths', () => {
    expect(buildLearningPathAnalytics({ version: 1, motivation_message: 'Keep going' })).toBeNull();
    expect(buildLearningPathAnalytics(null)).toBeNull();
  });

  it('uses the same granular Grammar priorities, criterion provenance, reviews, and transfer result', () => {
    const result = buildLearningPathAnalytics({
      input_fingerprint: 'grammar-evidence',
      evidence_summary: {
        measured_priorities: [
          {
            skill_code: 'grammar_articles_determiners',
            module: 'grammar',
            mastery: 0.5,
            confidence: 0.6,
            observations: 10,
            correct_count: 5,
            evidence_class: 'measured_priority',
          },
        ],
        early_signals: [],
      },
      grammar_evidence: {
        criterion_signals: [
          {
            skill_code: 'writing_grammar',
            observations: 6,
            evidence_class: 'measured_priority',
            provenance: 'Writing grammatical range and accuracy criterion',
          },
        ],
        due_reviews: [{ skill_code: 'grammar_articles_determiners' }],
        recent_attempts: [{ mode: 'transfer', transfer_outcome: 'needs_repair' }],
      },
    });

    expect(result.grammar.measuredPriorities[0]).toMatchObject({
      module: 'Articles Determiners',
      observations: 10,
    });
    expect(result.grammar.criterionSignals[0]).toMatchObject({
      source: 'Writing',
      observations: 6,
    });
    expect(result.grammar.dueReviews).toBe(1);
    expect(result.grammar.latestTransferOutcome).toBe('needs_repair');
    expect(result.aiSuggestions.recommended_focus_areas[0].skillCode).toBe(
      'grammar_articles_determiners'
    );
  });
});
