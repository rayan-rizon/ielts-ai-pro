import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readProjectFile = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('2026-08-27 audit follow-up contracts', () => {
  const migration = readProjectFile(
    'supabase/migrations/20260826224039_fix_audit_concurrency_and_idempotency.sql'
  );

  it('reactivates failed or abandoned reservations without duplicating active work', () => {
    expect(migration).toContain("= 'failed'");
    expect(migration).toContain("interval '15 minutes'");
    expect(migration).toContain("'reservationStatus', 'reserved'");
    expect(migration).toContain('RETURN QUERY SELECT v_existing.id, true, 0, 0, 0, 0, true');
  });

  it('keeps promo capacity accounting solely in redemption', () => {
    const stripeHandler = migration.slice(migration.indexOf('public.handle_stripe_event'));

    expect(stripeHandler).not.toContain('current_uses = current_uses + 1');
    expect(stripeHandler).not.toContain('v_applied_promo_id');
    expect(stripeHandler).toContain("WHEN p_event_type = 'checkout.session.completed' THEN NULL");
  });

  it.each([
    'evaluateSpeakingTest',
    'generateDetailedSpeakingFeedback',
    'processSpeakingSession',
    'evaluateGrammarTransfer',
  ])('stops duplicate provider work in %s', (functionName) => {
    const source = readProjectFile(`supabase/functions/${functionName}/index.ts`);

    expect(source).toContain('alreadyReserved');
    expect(source).toContain('duplicateReservationResponse');
  });

  it.each([
    'evaluateSpeakingTest',
    'generateDetailedSpeakingFeedback',
    'processSpeakingSession',
    'generateAdaptiveLearningPath',
  ])('recovers the finalized response in %s after a lost HTTP response', (functionName) => {
    const source = readProjectFile(`supabase/functions/${functionName}/index.ts`);

    expect(source).toContain('getFinalizedReservationResult');
    expect(source).toContain('response: responsePayload');
  });

  it('uses separate idempotency domains for evaluation and deep-dive work', () => {
    const evaluation = readProjectFile('supabase/functions/evaluateSpeakingTest/index.ts');
    const deepDive = readProjectFile(
      'supabase/functions/generateDetailedSpeakingFeedback/index.ts'
    );

    expect(evaluation).toContain('speaking-evaluation:${speakingSessionId}');
    expect(deepDive).toContain('speaking-deep-dive:${speakingSessionId}');
    expect(evaluation).not.toContain('speaking-session:${speakingSessionId}');
    expect(deepDive).not.toContain('speaking-session:${speakingSessionId}');
  });

  it('uses only session-persisted pronunciation evidence for speaking scores', () => {
    const evaluation = readProjectFile('supabase/functions/evaluateSpeakingTest/index.ts');

    expect(evaluation).toContain(
      ".select('id, passage_id, content_data, started_at, created_at, evaluation_status')"
    );
    expect(evaluation).toContain('ownedSession.content_data?.allPartsAcousticMetrics');
    expect(evaluation).not.toMatch(/aggregatePronunciationEvidence\(allPartsPronunciation\)/);
  });

  it('bounds learner uploads and avoids a second full-file allocation', () => {
    const upload = readProjectFile('supabase/functions/r2-upload/index.ts');

    expect(upload).toContain('CHECKER_MAX_FILE_SIZE = 8 * 1024 * 1024');
    expect(upload).toContain('writing-checker/${user.id}');
    expect(upload).toContain('crypto.randomUUID()');
    expect(upload).toContain('file.slice(0, 16).arrayBuffer()');
    expect(upload).toContain('Body: file');
    expect(upload).not.toContain('await file.arrayBuffer()');
  });

  it('keeps exactly one React Query provider and isolates the editor chunk', () => {
    const root = readProjectFile('src/components/RootProviders.jsx');
    const route = readProjectFile('src/components/shared/RouteProviders.jsx');
    const vite = readProjectFile('vite.config.js');

    expect(root).toContain('<QueryClientProvider');
    expect(route).not.toContain('<QueryClientProvider');
    expect(vite).toContain("id.includes('react-quill-new')");
    expect(vite).toContain("id.includes('/quill/')");
  });
});
