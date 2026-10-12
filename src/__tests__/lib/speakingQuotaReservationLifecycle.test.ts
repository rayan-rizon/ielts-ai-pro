import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readFunction = (name: string) =>
  readFileSync(
    resolve(
      process.cwd(),
      name === 'generateDetailedFeedback'
        ? 'supabase/functions/_shared/writingEvaluation.ts'
        : `supabase/functions/${name}/index.ts`
    ),
    'utf8'
  );

describe('speaking quota reservation lifecycle', () => {
  it('finalizes the session-start reservation before per-turn provider work', () => {
    const source = readFunction('processSpeakingSession');
    const sessionFinalizationIndex = source.indexOf(
      'await finalizeApiUsage(supabase, sessionReservationId'
    );
    const turnReservationIndex = source.indexOf(
      'const turnReservation = await reserveDatabaseQuota'
    );

    expect(source).toContain('sessionReservationId = sessionReservation.reservationId');
    expect(sessionFinalizationIndex).toBeGreaterThan(-1);
    expect(sessionFinalizationIndex).toBeLessThan(turnReservationIndex);
    expect(source).toContain("throw new Error('Failed to finalize speaking session reservation')");
    expect(source).toContain("{ failureReason: error?.message || 'Internal server error' }");
  });

  it('retries transient reservation finalization failures', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'supabase/functions/_shared/security.ts'),
      'utf8'
    );

    expect(source).toContain('for (let attempt = 1; attempt <= 3; attempt += 1)');
    expect(source).toContain('await new Promise((resolve) => setTimeout(resolve, attempt * 50))');
  });

  it.each(['evaluateSpeakingTest', 'generateDetailedSpeakingFeedback'])(
    'finalizes reused session reservations in %s on success and failure',
    (functionName) => {
      const source = readFunction(functionName);

      expect(source).toContain('finalizeApiUsage,');
      expect(source).toContain('quotaReservationId = quotaReservation.reservationId');
      // Speaking deep dives finalize with the summed usage of every provider attempt.
      expect(source).toMatch(
        /await finalizeApiUsage\(supabase, quotaReservationId, (?:totalProviderUsage\.)?tokensUsed/
      );
      expect(source).toMatch(/failureReason: error\?\.message \|\| 'Internal server error'/);
      expect(source).toContain("'failed'");
    }
  );

  it.each([
    'transcribeAudio',
    'synthesizeSpeech',
    'generateDetailedFeedback',
    'generateStudyRecommendations',
  ])('settles provider reservations on both success and failure in %s', (functionName) => {
    const source = readFunction(functionName);

    expect(source).toContain('quotaReservationId = quotaReservation.reservationId');
    expect(source).toMatch(/await finalizeApiUsage\([\s\S]{0,120}quotaReservationId/);
    expect(source).toContain("'failed'");
  });
});
