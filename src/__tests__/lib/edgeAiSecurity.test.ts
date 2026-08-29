import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isAllowedOrigin } from '../../../supabase/functions/_shared/originValidation.ts';

describe('AI edge security controls', () => {
  it('accepts exact production and preview origins', () => {
    expect(isAllowedOrigin('https://ieltsai.pro')).toBe(true);
    expect(
      isAllowedOrigin('https://ielts-ai-pro-preview-123-rayan-rizons-projects.vercel.app')
    ).toBe(true);
  });

  it('requires an explicit local-only opt-in before allowing loopback origins', () => {
    expect(isAllowedOrigin('http://localhost:5173', false)).toBe(false);
    expect(isAllowedOrigin('http://127.0.0.1:5174', false)).toBe(false);
    expect(isAllowedOrigin('http://localhost:5173', true)).toBe(true);
    expect(isAllowedOrigin('http://127.0.0.1:5174', true)).toBe(true);
  });

  it('rejects attacker domains containing trusted-looking text', () => {
    expect(isAllowedOrigin('https://localhost.attacker.example')).toBe(false);
    expect(isAllowedOrigin('https://127.0.0.1.attacker.example')).toBe(false);
    expect(isAllowedOrigin('https://ielts-ai-pro-preview-123.vercelx.app')).toBe(false);
    expect(isAllowedOrigin('https://ielts-ai-pro.attacker.vercel.app')).toBe(false);
  });

  it('keeps atomic quota reservation service-role-only and lock-backed', () => {
    const migration = readFileSync(
      resolve(process.cwd(), 'supabase/migrations/20260614123809_atomic_ai_quota_reservations.sql'),
      'utf8'
    );

    expect(migration).toContain('pg_advisory_xact_lock');
    expect(migration).toContain("auth.role() <> 'service_role'");
    expect(migration).toContain(
      'REVOKE ALL ON FUNCTION public.reserve_ai_api_usage(uuid, text, text, text, jsonb) FROM authenticated'
    );
    expect(migration).toContain(
      'GRANT EXECUTE ON FUNCTION public.reserve_ai_api_usage(uuid, text, text, text, jsonb) TO service_role'
    );
  });

  it('enforces speaking turn limits and self-only quota inspection', () => {
    const turnMigration = readFileSync(
      resolve(
        process.cwd(),
        'supabase/migrations/20260614124150_harden_speaking_turn_reservations.sql'
      ),
      'utf8'
    );
    const quotaMigration = readFileSync(
      resolve(process.cwd(), 'supabase/migrations/20260614124348_harden_ai_quota_rpc.sql'),
      'utf8'
    );

    expect(turnMigration).toContain("p_feature_type = 'speaking_turn'");
    expect(turnMigration).toContain('v_daily_limit := CASE v_part WHEN 2 THEN 4 ELSE 8 END');
    expect(turnMigration).toContain('v_monthly_limit := 20');
    expect(quotaMigration).toContain('v_caller_profile.id <> p_user_id');
    expect(quotaMigration).toContain("v_effective_tier := 'admin'");
    expect(quotaMigration).toContain(
      'REVOKE ALL ON FUNCTION public.check_user_rate_limit(uuid, text, text) FROM anon'
    );
  });

  it('does not present a per-test speaking turn guard as a monthly plan quota', () => {
    const securitySource = readFileSync(
      resolve(process.cwd(), 'supabase/functions/_shared/security.ts'),
      'utf8'
    );
    const apiSource = readFileSync(resolve(process.cwd(), 'src/utils/api.js'), 'utf8');
    const speakingProcessorSource = readFileSync(
      resolve(
        process.cwd(),
        'src/features/testing/speaking/hooks/useSpeakingRecordingProcessor.js'
      ),
      'utf8'
    );

    expect(securitySource).toContain(
      "limitScope: featureType === 'speaking_turn' ? 'speaking_turn' : 'plan'"
    );
    expect(securitySource).toContain(
      "rateLimitType: isSpeakingTurnLimit ? 'speaking_turn' : 'quota'"
    );
    expect(apiSource).toContain('parsedError?.rateLimitType ||');
    expect(speakingProcessorSource).toContain("error.rateLimitType === 'speaking_turn'");
    expect(speakingProcessorSource).toMatch(
      /if \(error\.rateLimitType === 'speaking_turn'\)[\s\S]*?else if \(error\.rateLimitType === 'quota' \|\| error\.status === 403\)[\s\S]*?setShowUpgradeDialog/
    );
  });

  it('allows admins to start the main Speaking V2 flow without a rollout-only override', () => {
    const speakingV2Source = readFileSync(
      resolve(process.cwd(), 'supabase/functions/processSpeakingSessionV2/index.ts'),
      'utf8'
    );
    const apiSource = readFileSync(resolve(process.cwd(), 'src/utils/api.js'), 'utf8');

    expect(speakingV2Source).not.toContain('consume_speaking_testing_override');
    expect(speakingV2Source).not.toContain('testing override is required');
    expect(speakingV2Source).toContain(".select('id')");
    expect(apiSource).not.toContain('error.status === 401 || error.status === 403');
  });

  it('does not expose an anonymous TTS warm-up path', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'supabase/functions/synthesizeSpeech/index.ts'),
      'utf8'
    );
    const ping = source.indexOf('if (isWarmupPing)');
    const auth = source.indexOf('if (authError || !user)');
    const burst = source.indexOf('if (!burstCheck.allowed)');

    expect(ping).toBeGreaterThan(auth);
    expect(ping).toBeGreaterThan(burst);
  });

  it('warms the legacy speaking worker only after auth and burst controls', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'supabase/functions/processSpeakingSession/index.ts'),
      'utf8'
    );
    const ping = source.indexOf('if (isWarmupPing)');
    const auth = source.indexOf('if (authError || !user)');
    const burst = source.indexOf('if (!burstCheck.allowed)');
    const turnValidation = source.indexOf('A valid testId and partNumber are required');

    expect(ping).toBeGreaterThan(auth);
    expect(ping).toBeGreaterThan(burst);
    expect(ping).toBeLessThan(turnValidation);
  });
});
