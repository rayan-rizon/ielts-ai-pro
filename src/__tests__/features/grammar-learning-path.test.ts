import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  aggregateReadiness,
  buildSevenDaySchedule,
  normalizeStudyAvailability,
  summarizeEvidence,
} from '../../../supabase/functions/_shared/learningPathV2';

const now = new Date('2026-07-28T12:00:00.000Z');
const grammarHook = readFileSync(
  resolve(process.cwd(), 'src/features/grammar/hooks/useGrammarLab.js'),
  'utf8'
);
const learningPathEdge = readFileSync(
  resolve(process.cwd(), 'supabase/functions/generateAdaptiveLearningPath/index.ts'),
  'utf8'
);

const scoredSession = (test_type: string, score: number, day: number) => ({
  test_type,
  score,
  completed_at: `2026-07-${String(day).padStart(2, '0')}T12:00:00.000Z`,
});

describe('Grammar completion refresh contract', () => {
  it('claims each attempt once before refreshing all shared consumers', () => {
    expect(grammarHook).toContain('refreshedAttempts.current.has(attemptId)');
    expect(grammarHook).toContain('refreshedAttempts.current.add(attemptId)');
    expect(grammarHook.split('generateAdaptiveLearningPath({')).toHaveLength(2);
    expect(grammarHook).toContain("queryKey: ['grammarLab']");
    expect(grammarHook).toContain("queryKey: ['learningPath']");
    expect(grammarHook).toContain("queryKey: ['analytics']");
  });

  it('includes completed deterministic and transfer attempts in the shared fingerprint', () => {
    expect(learningPathEdge).toContain('grammar_attempts: (grammarAttempts || []).map');
    expect(learningPathEdge).toContain('transfer_outcome: attempt.transfer_evaluation?.outcome');
    expect(learningPathEdge).toContain("'grammar_completed'");
  });
});

describe('Grammar evidence in the Learning Path', () => {
  it('keeps Grammar and Vocabulary separate from Reading and excludes legacy duplicates', () => {
    const evidence = summarizeEvidence(
      [
        {
          skill_code: 'grammar_articles_determiners',
          module: 'grammar',
          mastery_probability: 0.45,
          confidence_level: 0.6,
          practice_count: 10,
        },
        {
          skill_code: 'vocabulary_academic_collocations',
          module: 'vocabulary',
          mastery_probability: 0.5,
          confidence_level: 0.5,
          practice_count: 8,
        },
        {
          skill_code: 'grammar_writing',
          module: 'grammar',
          mastery_probability: 0.2,
          confidence_level: 0.9,
          practice_count: 30,
        },
      ],
      now
    );

    expect(evidence.measured_priorities.map((item) => item.module)).toEqual([
      'grammar',
      'vocabulary',
    ]);
    expect(evidence.measured_priorities.some((item) => item.skill_code === 'grammar_writing')).toBe(
      false
    );
  });

  it('uses a general Writing or Speaking criterion only to request a diagnostic', () => {
    const evidence = summarizeEvidence(
      [
        {
          skill_code: 'writing_grammar',
          module: 'writing',
          mastery_probability: 0.45,
          confidence_level: 0.7,
          practice_count: 8,
        },
      ],
      now
    );

    expect(evidence.grammar_diagnostic_requested).toBe(true);
    expect(evidence.grammar_diagnostic_source).toBe('writing_grammar');
    expect(evidence.measured_priorities).toEqual([]);
  });

  it('uses granular measured evidence for a named repair and never changes four-module readiness', () => {
    const evidence = summarizeEvidence(
      [
        {
          skill_code: 'grammar_clause_control',
          module: 'grammar',
          mastery_probability: 0.4,
          confidence_level: 0.6,
          practice_count: 12,
        },
      ],
      now
    );
    const readiness = aggregateReadiness(
      [
        scoredSession('reading', 7, 27),
        scoredSession('reading', 6.5, 25),
        scoredSession('grammar', 9, 27),
      ],
      now
    );

    expect(evidence.measured_priorities[0]).toMatchObject({
      skill_code: 'grammar_clause_control',
      module: 'grammar',
      evidence_class: 'measured_priority',
    });
    expect(readiness.modules).not.toHaveProperty('grammar');
    expect(readiness.missing_diagnostics).toEqual(['writing', 'listening', 'speaking']);
  });

  it('caps Grammar at 20% and inserts transfer after two repair activities', () => {
    const availability = normalizeStudyAvailability(
      {
        version: 1,
        timezone: 'Asia/Dhaka',
        days: {
          monday: 240,
          tuesday: 240,
          wednesday: 240,
          thursday: 240,
          friday: 240,
        },
      },
      5,
      'Asia/Dhaka'
    );
    const evidence = summarizeEvidence(
      [
        {
          skill_code: 'grammar_clause_control',
          module: 'grammar',
          mastery_probability: 0.35,
          confidence_level: 0.8,
          practice_count: 20,
        },
        {
          skill_code: 'speaking_grammar',
          module: 'speaking',
          mastery_probability: 0.5,
          confidence_level: 0.6,
          practice_count: 8,
        },
      ],
      now
    );
    const readiness = aggregateReadiness(
      ['reading', 'writing', 'listening', 'speaking'].flatMap((module) => [
        scoredSession(module, 6.5, 27),
        scoredSession(module, 7, 25),
      ]),
      now
    );
    const result = buildSevenDaySchedule({ availability, evidence, readiness, now });
    const grammarTasks = Object.values(result.schedule)
      .flat()
      .filter((task) => task.module === 'grammar');

    expect(result.grammar_minutes).toBeLessThanOrEqual(result.grammar_cap_minutes);
    expect(result.grammar_minutes).toBeLessThanOrEqual(result.weekly_planned_minutes * 0.2);
    expect(grammarTasks.map((task) => task.activity_type)).toEqual([
      'targeted_drill',
      'targeted_drill',
      'grammar_transfer',
    ]);
    expect(
      grammarTasks.find((task) => task.activity_type === 'grammar_transfer')?.routing
    ).toMatchObject({
      route: 'grammar',
      mode: 'transfer',
      transferTarget: 'speaking',
    });
  });

  it('preserves a legitimate zero score as present evidence', () => {
    const readiness = aggregateReadiness(
      [scoredSession('reading', 0, 27), scoredSession('reading', 1, 25)],
      now
    );
    expect(readiness.modules.reading.sample_count).toBe(2);
    expect(readiness.modules.reading.observed_range).toEqual([0, 1]);
  });
});
