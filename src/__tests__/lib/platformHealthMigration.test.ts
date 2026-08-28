import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260801131058_harden_platform_health_contracts.sql'),
  'utf8'
);
const providerHealthMigration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260801222509_add_text_ai_provider_health.sql'),
  'utf8'
);
const coverageMigration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260801134131_expand_platform_health_coverage.sql'),
  'utf8'
);
const clarificationMigration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260801140617_clarify_platform_health_operations.sql'
  ),
  'utf8'
);
const schedulerMigration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260801144159_secure_scheduled_email_cron.sql'),
  'utf8'
);
const recoveryMigration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260801144922_reflect_scheduled_email_recovery.sql'),
  'utf8'
);
const provisioningMigration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260801145252_classify_auth_provisioning_health.sql'
  ),
  'utf8'
);
const ttsCacheMigration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260803223000_correct_tts_health_cache_reporting.sql'
  ),
  'utf8'
);
const correctedHealthMigration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260808155732_correct_platform_health_classification_and_timestamps.sql'
  ),
  'utf8'
);
const recoveredProviderQueueMigration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260819135225_reconcile_recovered_ai_provider_action_queue.sql'
  ),
  'utf8'
);
const writingFeedbackSource = readFileSync(
  resolve(process.cwd(), 'supabase/functions/generateDetailedFeedback/index.ts'),
  'utf8'
);
const synthesizeSpeechSource = readFileSync(
  resolve(process.cwd(), 'supabase/functions/synthesizeSpeech/index.ts'),
  'utf8'
);
const resendSource = readFileSync(
  resolve(process.cwd(), 'supabase/functions/_shared/resend.ts'),
  'utf8'
);
const scheduledEmailsSource = readFileSync(
  resolve(process.cwd(), 'supabase/functions/scheduled-emails/index.ts'),
  'utf8'
);
const supabaseConfig = readFileSync(resolve(process.cwd(), 'supabase/config.toml'), 'utf8');

describe('platform health database contracts', () => {
  it('exposes provider routing health without probing or exposing secrets', () => {
    expect(providerHealthMigration).toContain('get_ai_provider_health');
    expect(providerHealthMigration).toContain('SECURITY DEFINER');
    expect(providerHealthMigration).toContain('public.is_admin()');
    expect(providerHealthMigration).toContain("'openrouter-deepseek'");
    expect(providerHealthMigration).toContain("'directDeepseekCalls'");
    expect(providerHealthMigration).toContain("'estimatedCostUsd'");
    expect(providerHealthMigration).toContain('never probes providers');
    expect(providerHealthMigration).toContain(
      'REVOKE ALL ON FUNCTION public.get_ai_provider_health(integer) FROM anon'
    );
  });
  it('finalizes reservations atomically and keeps the RPC service-role-only', () => {
    expect(migration).toContain('CREATE OR REPLACE FUNCTION public.finalize_ai_api_usage');
    expect(migration).toContain('SECURITY INVOKER');
    expect(migration).toContain(
      'REVOKE ALL ON FUNCTION public.finalize_ai_api_usage(uuid, integer, boolean, jsonb, text) FROM authenticated'
    );
    expect(migration).toContain('request_metadata = COALESCE(request_metadata,');
    expect(migration).toContain("AND request_metadata->>'reservationStatus' = 'reserved'");
    expect(migration).toContain('must never overwrite or downgrade');
  });

  it('uses real readiness and capacity evidence rather than hard-coded green states', () => {
    expect(migration).toContain("'readyPassages', c.ready_passages");
    expect(migration).toContain("m.test_type = 'listening'");
    expect(migration).toContain("current_setting('max_connections')");
    expect(migration).not.toContain(
      "'status', 'operational',\n        'metrics', jsonb_build_object('size'"
    );
  });

  it('tracks all-time stuck reservations and real Stripe failures', () => {
    const stuckSection = migration.slice(
      migration.indexOf('-- Stuck reservations'),
      migration.indexOf('-- Stripe:')
    );
    expect(stuckSection).not.toContain('created_at >= v_since');
    expect(migration).toContain("count(*) FILTER (WHERE status = 'failed')");
    expect(migration).toContain("SELECT 'payments_stripe'");
  });

  it('extends health coverage with actionable app-level contracts', () => {
    expect(coverageMigration).toContain("'key', 'auth_provisioning'");
    expect(coverageMigration).toContain("'key', 'test_result_delivery'");
    expect(coverageMigration).toContain("'key', 'email_dispatch'");
    expect(coverageMigration).toContain("'key', 'scheduled_automation'");
    expect(coverageMigration).toContain("'{contractVersion}', '3'::jsonb");
    expect(coverageMigration).toContain("evaluation_status, '')) = 'failed'");
    expect(coverageMigration).toContain("j.jobname = 'daily-scheduled-emails'");
  });

  it('keeps email telemetry private and records every dispatch/run outcome', () => {
    expect(coverageMigration).toContain(
      'REVOKE ALL ON TABLE public.email_delivery_events FROM PUBLIC, anon, authenticated'
    );
    expect(coverageMigration).toContain(
      'REVOKE ALL ON TABLE public.scheduled_email_runs FROM PUBLIC, anon, authenticated'
    );
    expect(resendSource).toContain("status: 'accepted'");
    expect(resendSource).toContain("status: 'failed'");
    expect(resendSource).toContain("status: 'skipped'");
    expect(scheduledEmailsSource).toContain(".from('scheduled_email_runs')");
    expect(scheduledEmailsSource).toContain('status: runStatus');
  });

  it('does not duplicate profile gaps as incidents and distinguishes an unrecorded run', () => {
    expect(clarificationMigration).toContain('get_platform_health_core_v3');
    expect(clarificationMigration).toContain("'lastRunRecorded', v_has_recorded_run");
    expect(clarificationMigration).toContain("WHERE i.service <> 'auth_provisioning'");
  });

  it('uses a dedicated Vault credential for scheduled messaging and exposes a safe probe', () => {
    expect(schedulerMigration).toContain("name = 'scheduled_email_token'");
    expect(schedulerMigration).toContain('extensions.digest');
    expect(schedulerMigration).toContain("'X-Scheduler-Secret'");
    expect(schedulerMigration).toContain("body := '{}'::jsonb");
    expect(schedulerMigration).not.toContain("key = 'service_role_key'");
    expect(scheduledEmailsSource).toContain("req.headers.get('X-Scheduler-Secret')");
    expect(scheduledEmailsSource).toContain('requestBody?.healthCheck === true');
  });

  it('allows the scheduler through the gateway only to the custom Vault-secret check', () => {
    expect(supabaseConfig).toMatch(/\[functions\.scheduled-emails\]\s*verify_jwt\s*=\s*false/);
    expect(scheduledEmailsSource).toContain("req.headers.get('X-Scheduler-Secret')");
    expect(scheduledEmailsSource).toContain("supabase.rpc('verify_scheduled_email_token'");
    expect(schedulerMigration).toContain(
      'GRANT EXECUTE ON FUNCTION public.verify_scheduled_email_token(text)\n    TO service_role'
    );
    expect(schedulerMigration).not.toContain("'Authorization'");
  });

  it('reports a repaired scheduler as pending verification until its first real run', () => {
    expect(recoveryMigration).toContain("'status', 'degraded'");
    expect(recoveryMigration).toContain("'{contractVersion}', '5'::jsonb");
  });

  it('alerts only on established accounts with missing profiles', () => {
    expect(provisioningMigration).toContain("'actionableProfileGaps', v_actionable");
    expect(provisioningMigration).toContain("'unactivatedAccounts', v_unactivated");
    expect(provisioningMigration).toContain("'{contractVersion}', '6'::jsonb");
  });

  it('never shows a cache-hit count the TTS usage table cannot produce', () => {
    // synthesizeSpeech returns a cached phrase before reserving quota, so no
    // ai_api_usage row exists for it and `cached` is always finalised false.
    expect(ttsCacheMigration).toContain("(service->'metrics') - 'cacheHits'");
    expect(ttsCacheMigration).toContain("'{contractVersion}', '7'::jsonb");
    expect(ttsCacheMigration).toContain('cache misses only');
    expect(ttsCacheMigration).toContain('does not mean the examiner voice was silent');
    expect(synthesizeSpeechSource).toContain('cached: true');
    expect(synthesizeSpeechSource).not.toMatch(/finalizeApiUsage\([^)]*,\s*true,/);
  });

  it('separates scoring failures from recovered text-provider fallbacks', () => {
    expect(correctedHealthMigration).toContain("'generateDetailedFeedback'");
    expect(correctedHealthMigration).toContain("'generateAdaptiveLearningPath'");
    expect(correctedHealthMigration).toContain("'recoveredFallbacks', v_recovered");
    expect(correctedHealthMigration).toContain("'deterministicFallback' = 'true'");
    expect(correctedHealthMigration).toContain("THEN 'ai_text_providers'");
    expect(correctedHealthMigration).toContain("'{contractVersion}', '8'::jsonb");
  });

  it('keeps a small number of recovered provider events out of the action queue', () => {
    expect(recoveredProviderQueueMigration).toContain(
      'v_errors = 0 AND v_upstream_failures >= 3 AND v_upstream_rate >= 10'
    );
    expect(recoveredProviderQueueMigration).not.toContain(
      "WHEN v_upstream_failures > 0 AND v_upstream_rate >= 10 THEN 'attention'"
    );
    expect(recoveredProviderQueueMigration).toContain(
      "WHEN v_recovery_needs_review THEN 'attention'"
    );
    expect(recoveredProviderQueueMigration).toContain(
      'WHEN v_recovery_needs_review THEN\n                    v_upstream_failures'
    );
    expect(recoveredProviderQueueMigration).toContain(
      'No learner was blocked and no action is required.'
    );
    expect(recoveredProviderQueueMigration).toContain(
      'No learner was blocked, but provider reliability needs review.'
    );
  });

  it('preserves exact incident timestamps and accepts legitimate IELTS response lengths', () => {
    expect(correctedHealthMigration).toContain('max(created_at)');
    expect(correctedHealthMigration).toContain('min(created_at)');
    expect(correctedHealthMigration).toContain('first_seen timestamptz');
    expect(correctedHealthMigration).toContain('last_seen timestamptz');
    expect(writingFeedbackSource).toContain("taskType === 'Task 1' ? 5000 : 8000");
  });
});
