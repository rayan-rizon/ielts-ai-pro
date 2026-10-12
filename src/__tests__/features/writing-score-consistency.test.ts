import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildWritingConsensus,
  isRoundingEdge,
  medianOfNumbers,
  needsSecondMarker,
  normalizeBandSecurity,
  normalizeWritingEvaluation,
  WRITING_CALIBRATION_REVISION as SERVER_CALIBRATION_REVISION,
} from '../../../supabase/functions/_shared/evaluationUtils.ts';
import { WRITING_CALIBRATION_REVISION as CLIENT_CALIBRATION_REVISION } from '@/features/testing/shared/evaluationVersion';
import {
  isCurrentWritingFeedbackCache,
  normalizeTaskPrompt,
} from '@/features/testing/writing/utils/evaluationEvidence';

const writingFunction = readFileSync(
  resolve(process.cwd(), 'supabase/functions/_shared/writingEvaluation.ts'),
  'utf8'
);
const writingProvider = readFileSync(
  resolve(process.cwd(), 'supabase/functions/_shared/writingProvider.ts'),
  'utf8'
);

const sampleWith = (task: number, cc: number, lr: number, gra: number) => ({
  criteriaScores: {
    TaskResponse: task,
    CoherenceAndCohesion: cc,
    LexicalResource: lr,
    GrammaticalRangeAndAccuracy: gra,
  },
});

describe('writing score consistency', () => {
  describe('multi-pass consensus', () => {
    it('takes the median so one outlying pass cannot move the reported band', () => {
      // The real-world failure this guards: the same essay scoring 7.5 on one
      // pass and 8 on the next, with the learner unable to tell which is right.
      const consensus = buildWritingConsensus(
        [
          sampleWith(7.5, 7.5, 7.5, 7),
          sampleWith(7.5, 7.5, 7.5, 7),
          sampleWith(8, 8, 8, 8), // outlier
        ],
        'TaskResponse'
      );

      expect(consensus?.criteriaScores).toEqual({
        TaskResponse: 7.5,
        CoherenceAndCohesion: 7.5,
        LexicalResource: 7.5,
        GrammaticalRangeAndAccuracy: 7,
      });
      // The narrative must come from a pass that argues for 7.5, not the 8.
      expect(consensus?.representativeIndex).toBeLessThan(2);
    });

    it('keeps a split decision on a legal half band', () => {
      const consensus = buildWritingConsensus(
        [sampleWith(6, 6, 6, 6), sampleWith(7, 7, 7, 7)],
        'TaskResponse'
      );
      expect(consensus?.criteriaScores.TaskResponse).toBe(6.5);
      expect(Object.values(consensus?.criteriaScores ?? {})).toSatisfy((scores: number[]) =>
        scores.every((score) => Number.isInteger(score * 2))
      );
    });

    it('reports how far the passes disagreed', () => {
      const agreed = buildWritingConsensus(
        [sampleWith(7, 7, 7, 7), sampleWith(7, 7, 7, 7), sampleWith(7, 7, 7, 7)],
        'TaskResponse'
      );
      expect(agreed?.agreement).toMatchObject({
        sampleCount: 3,
        maxSpread: 0,
        confidence: 'high',
        escalated: true,
      });

      const split = buildWritingConsensus(
        [sampleWith(5, 6, 6, 6), sampleWith(7, 6, 6, 6), sampleWith(7, 6, 6, 6)],
        'TaskResponse'
      );
      expect(split?.agreement.maxSpread).toBe(2);
      expect(split?.agreement.confidence).toBe('low');
    });

    it('ignores passes that failed to produce a full set of criteria', () => {
      const consensus = buildWritingConsensus(
        [sampleWith(6, 6, 6, 6), { criteriaScores: { TaskResponse: 9 } }, sampleWith(6, 6, 6, 6)],
        'TaskResponse'
      );
      expect(consensus?.agreement.sampleCount).toBe(2);
      expect(consensus?.criteriaScores.TaskResponse).toBe(6);
    });

    it('returns null rather than inventing a band when no pass scored', () => {
      expect(buildWritingConsensus([], 'TaskResponse')).toBeNull();
      expect(buildWritingConsensus([{ criteriaScores: {} }], 'TaskResponse')).toBeNull();
    });

    it('medianOfNumbers averages the middle pair on an even sample', () => {
      expect(medianOfNumbers([7, 6, 8])).toBe(7);
      expect(medianOfNumbers([6, 7])).toBe(6.5);
      expect(medianOfNumbers([])).toBeNull();
    });
  });

  describe('agreed bands outrank the narrating pass', () => {
    it('publishes the consensus scores, not the scores of the pass that wrote the prose', () => {
      const narratingPass = {
        ...sampleWith(8, 8, 8, 8),
        summary: 'Strong response.',
        annotations: [],
        strengths: [],
        priorities: [],
        vocabularyEnhancements: [],
      };
      const consensus = buildWritingConsensus(
        [sampleWith(7, 7, 7, 7), sampleWith(7, 7, 7, 7), narratingPass],
        'TaskResponse'
      );

      const result = normalizeWritingEvaluation(
        narratingPass,
        'Task 2',
        'word '.repeat(300).trim(),
        { consensus }
      );

      expect(result.criteriaScores.TaskResponse).toBe(7);
      expect(result.overallBand).toBe(7);
      // Two passes said 7, one said 8: the band follows the majority and the
      // one-band spread is reported rather than hidden.
      expect(result.scoreAgreement).toMatchObject({
        sampleCount: 3,
        maxSpread: 1,
        confidence: 'moderate',
      });
    });
  });

  describe('cache key stability', () => {
    it('identifies the Task 1 visual by content, not by its re-uploaded URL', () => {
      // The checker uploads the chart under a fresh UUID on every submission,
      // so a URL in the hash guaranteed a cache miss on every resubmission.
      expect(writingFunction).toContain('imageContentHash');
      expect(writingFunction).toMatch(/crypto\.subtle\.digest\('SHA-256', arrayBuffer\)/);
      expect(writingFunction).not.toMatch(/hashInput = JSON\.stringify\(\{[^}]*\bimageUrl\b/s);
    });

    it('strips markup from the prompt before hashing so both surfaces share one entry', () => {
      expect(writingFunction).toMatch(/normalizeText = \(text: string\) =>[\s\S]*<\[\^>\]\*>/);
    });

    it('keeps the cache key pinned to the shared calibration revision', () => {
      expect(writingFunction).toContain('writingCalibrationRevision: WRITING_CALIBRATION_REVISION');
    });
  });

  describe('sampling is pinned', () => {
    it('uses Luna-compatible deterministic controls instead of unsupported sampling parameters', () => {
      expect(writingProvider).toContain('seed,');
      expect(writingProvider).not.toContain('temperature:');
      expect(writingProvider).not.toContain('top_p:');
      expect(writingProvider).toContain(
        "provider: { sort: 'throughput', require_parameters: true }"
      );
    });

    it('marks once and escalates only when a further marker could change the band', () => {
      expect(writingFunction).toContain('MAX_MARKING_PASSES = MARKING_SEEDS.length');
      expect(writingFunction).toContain('needsSecondMarker(running.criteriaScores');
      expect(writingFunction).toContain('running.agreement.maxSpread < DISAGREEMENT_BANDS');
    });

    it('bills every pass that returned and credits cached prompt tokens', () => {
      expect(writingFunction).toContain('cachedPromptTokens += pass.cachedPromptTokens');
      expect(writingProvider).toContain('prompt_tokens_details?.cached_tokens');
      expect(writingProvider).toContain('cachedPromptTokens');
    });

    it('never re-rolls the score on a JSON repair retry', () => {
      expect(writingFunction).not.toContain('buildGeminiRequest(0.3)');
    });
  });

  describe('adaptive escalation', () => {
    const secure = {
      TaskResponse: 'secure',
      CoherenceAndCohesion: 'secure',
      LexicalResource: 'secure',
      GrammaticalRangeAndAccuracy: 'secure',
    };

    it('accepts a single marking when the script sits clearly inside its bands', () => {
      // 6/6/6/6 averages exactly 6.0 — half a band either way on one criterion
      // still reports 6.0, so a second marker cannot change what is shown.
      expect(needsSecondMarker({ ...sampleWith(6, 6, 6, 6).criteriaScores }, secure)).toBe(false);
    });

    it('escalates when the marker itself called a criterion borderline', () => {
      expect(
        needsSecondMarker(sampleWith(6, 6, 6, 6).criteriaScores, {
          ...secure,
          LexicalResource: 'borderline',
        })
      ).toBe(true);
    });

    it('escalates when half a band on one criterion would flip the overall band', () => {
      // Mean 6.25 sits exactly on the rounding boundary: it reports 6.5, but
      // half a band off any one criterion gives 6.125 -> 6.0. The learner's
      // number is decided by the smallest possible marking difference.
      expect(isRoundingEdge({ a: 6.5, b: 6.5, c: 6, d: 6 })).toBe(true);

      // Mean 6.375 is not an edge — it reports 6.5 and stays 6.5 whichever way
      // a single criterion moves, so a second marker cannot change the band.
      expect(isRoundingEdge({ a: 6.5, b: 6.5, c: 6.5, d: 6 })).toBe(false);
      expect(isRoundingEdge({ a: 6, b: 6, c: 6, d: 6 })).toBe(false);
    });

    it('escalates on a rounding edge even when the marker reported no doubt', () => {
      expect(needsSecondMarker({ a: 6.5, b: 6.5, c: 6, d: 6 }, secure)).toBe(true);
    });

    it('falls back to the rounding-edge test when the marker omits bandSecurity', () => {
      expect(normalizeBandSecurity(undefined, ['TaskResponse'])).toBeNull();
      expect(normalizeBandSecurity({ TaskResponse: 'nonsense' }, ['TaskResponse'])).toBeNull();
      expect(needsSecondMarker(sampleWith(6, 6, 6, 6).criteriaScores, null)).toBe(false);
    });

    it('does not claim high confidence for an unescalated borderline marking', () => {
      const consensus = buildWritingConsensus([sampleWith(6, 6, 6, 6)], 'TaskResponse', {
        bandSecurity: { ...secure, LexicalResource: 'borderline' },
      });
      expect(consensus?.agreement).toMatchObject({
        sampleCount: 1,
        escalated: false,
        confidence: 'low',
      });
    });

    it('reports high confidence for a single secure marking', () => {
      const consensus = buildWritingConsensus([sampleWith(6, 6, 6, 6)], 'TaskResponse', {
        bandSecurity: secure,
      });
      expect(consensus?.agreement).toMatchObject({ sampleCount: 1, confidence: 'high' });
    });
  });

  describe('client and server stay calibrated together', () => {
    it('pins the same writing calibration revision on both sides', () => {
      expect(CLIENT_CALIBRATION_REVISION).toBe(SERVER_CALIBRATION_REVISION);
    });

    it('reuses a saved report when only the prompt markup differs', () => {
      const feedback = {
        evaluationVersion: '2026-07-29-v5',
        writingCalibrationRevision: CLIENT_CALIBRATION_REVISION,
        taskType: 'Task 2',
        overallBand: 7,
        originalSource: 'The essay body.',
        taskPrompt: '<p><strong>Discuss both views.</strong></p>',
      };

      expect(
        isCurrentWritingFeedbackCache({
          feedback,
          response: 'The essay body.',
          prompt: 'Discuss both views.',
        })
      ).toBe(true);
    });

    it('normalizes prompts to one canonical shape', () => {
      expect(normalizeTaskPrompt('<p><em>Discuss  both</em>\nviews.</p>')).toBe(
        'Discuss both views.'
      );
    });
  });
});
