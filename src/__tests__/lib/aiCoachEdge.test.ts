import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const edge = readFileSync(resolve(process.cwd(), 'supabase/functions/ai-coach/index.ts'), 'utf8');

describe('personalized AI Coach Edge Function contract', () => {
  it('grounds personal answers and rejects forged or unfinished result context', () => {
    expect(edge).toContain('asksForPersonalEvidence(input.message)');
    expect(edge).toContain('value.evidenceRefs = value.evidenceRefs.map');
    expect(edge).toContain('answerNumbers.some');
    expect(edge).toContain('That completed result could not be loaded.');
    expect(edge).toContain(
      'AI Coach cannot help with answers during an unfinished Exam-mode test.'
    );
    expect(edge).toContain('That result does not have a valid finalized score yet.');
  });

  it('keeps the complete primary and fallback request inside one deadline', () => {
    expect(edge).toContain('const remainingMs = 20_000 - (Date.now() - started)');
    expect(edge).toContain('if (remainingMs < 1_000) throw error');
    expect(edge).toContain('timeoutMs: remainingMs');
  });

  it('retains the conservative reservation when any provider cost is unknown', () => {
    expect(edge).toContain('providerCallCount += 1');
    expect(edge).toContain('attempts.filter(hasKnownBilledCost).length < providerCallCount');
    expect(edge).toContain('p_cost: unknownProviderCost ? null : cost');
  });

  it('allows only eligible routes and claims confirmed actions before execution', () => {
    expect(edge).toContain('eligibleRoutes.has(action.payload?.route)');
    expect(edge).toContain("admin.rpc('ai_coach_claim_action'");
    expect(edge).toContain(".eq('status', 'executing')");
  });
});
