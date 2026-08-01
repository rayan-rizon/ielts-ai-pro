import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readFunction = (name: string) =>
  readFileSync(resolve(process.cwd(), `supabase/functions/${name}/index.ts`), 'utf8');

describe('speaking quota reservation lifecycle', () => {
  it('finalizes the session-start reservation after a successful speaking turn', () => {
    const source = readFunction('processSpeakingSession');
    const successPath = source.slice(
      source.indexOf('await finalizeApiUsage(supabase, activeReservationId')
    );

    expect(source).toContain('sessionReservationId = sessionReservation.reservationId');
    expect(successPath).toContain('await finalizeApiUsage(supabase, sessionReservationId');
    expect(source).toContain("{ failureReason: error?.message || 'Internal server error' }");
  });

  it.each(['evaluateSpeakingTest', 'generateDetailedSpeakingFeedback'])(
    'finalizes reused session reservations in %s on success and failure',
    (functionName) => {
      const source = readFunction(functionName);

      expect(source).toContain('finalizeApiUsage,');
      expect(source).toContain('quotaReservationId = quotaReservation.reservationId');
      expect(source).toMatch(/await finalizeApiUsage\(supabase, quotaReservationId, tokensUsed/);
      expect(source).toContain("{ failureReason: error?.message || 'Internal server error' }");
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
