import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const migration = read('supabase/migrations/20260928180000_speaking_sessions_health.sql');
const turnFunction = read('supabase/functions/processSpeakingSessionV2/index.ts');
const voiceFunction = read('supabase/functions/synthesizePracticeSpeech/index.ts');

describe('Speaking sessions health telemetry', () => {
  it('adds an admin-only speaking_sessions service on top of the previous wrapper', () => {
    expect(migration).toContain('RENAME TO get_platform_health_core_v15');
    expect(migration).toContain('public.get_platform_health_core_v15(p_hours)');
    expect(migration).toContain("'key', 'speaking_sessions'");
    expect(migration).toContain('public.is_admin()');
    expect(migration).toContain(
      'REVOKE ALL ON FUNCTION public.get_platform_health(integer) FROM PUBLIC, anon, authenticated'
    );
  });

  it('separates unheard answers from system errors', () => {
    expect(migration).toContain("<> 'transcription_failed'");
    expect(migration).toContain("'unheardTurns', v_unheard");
    expect(migration).toContain("'errors', v_errors");
  });

  it('reads the same coach and voice markers the Edge Functions write', () => {
    for (const source of ["'ai'", "'fallback'", "'scripted'"]) {
      expect(turnFunction).toContain(source);
    }
    expect(migration).toContain("provider_metadata->'coach'->>'source' = 'fallback'");
    expect(migration).toContain("provider_metadata->'coach'->>'error'");
    expect(voiceFunction).toContain("route: 'practice-tts'");
    expect(migration).toContain("request_metadata->>'route' = 'practice-tts'");
    // A learner interrupting the coach is recorded as interrupted, not failed.
    expect(voiceFunction).toContain('interrupted: true');
    expect(migration).toContain("request_metadata->>'interrupted' = 'true'");
  });

  it('surfaces speaking incidents without replacing the existing ones', () => {
    expect(migration).toContain('RENAME TO get_platform_health_incidents_core_v5');
    expect(migration).toContain('public.get_platform_health_incidents_core_v5(p_hours, p_limit)');
    expect(migration).toContain("'service', 'speaking_sessions'");
  });
});
