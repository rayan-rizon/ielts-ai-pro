import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(__dirname, '../../..');
const readProjectFile = (path: string) => readFileSync(resolve(root, path), 'utf8');

describe('XP award authority contract', () => {
  it('rejects browser-originated awards and records speaking XP inside the evaluator', () => {
    const edgeFunction = readProjectFile('supabase/functions/updateUserPoints/index.ts');
    const evaluator = readProjectFile('supabase/functions/evaluateSpeakingTest/index.ts');
    const userPoints = readProjectFile('src/features/gamification/services/UserPoints.ts');

    expect(edgeFunction).toContain('XP is recorded only by verified server workflows');
    expect(edgeFunction).not.toContain(".rpc('award_user_points'");
    expect(evaluator).toContain(".rpc('award_user_points'");
    expect(evaluator).toContain('sessionPersisted: true');
    expect(evaluator).toContain('buildAuthoritativeConversation');
    expect(evaluator).toContain(".eq('endpoint', 'processSpeakingSession')");
    expect(userPoints).not.toContain("callEdgeFunction('updateUserPoints'");
  });

  it('revokes the legacy authenticated points RPC and keeps the award RPC service-only', () => {
    const migration = readProjectFile(
      'supabase/migrations/20260828064515_secure_xp_award_boundary.sql'
    );

    expect(migration).toContain(
      'REVOKE ALL ON FUNCTION public.add_user_points(integer) FROM PUBLIC, anon, authenticated;'
    );
    expect(migration).toContain(
      'REVOKE ALL ON FUNCTION public.award_user_points(uuid, integer, text, text) FROM PUBLIC, anon, authenticated;'
    );
    expect(migration).toContain('GRANT EXECUTE ON FUNCTION public.award_user_points');
  });
});
