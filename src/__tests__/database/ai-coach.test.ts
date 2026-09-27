import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260922014842_ai_coach.sql'),
  'utf8'
).toLowerCase();
const followUpMigration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260927021243_ai_coach_contextual_follow_ups.sql'),
  'utf8'
).toLowerCase();

describe('personalized AI Coach database contract', () => {
  it('stores each generated follow-up with its assistant reply', () => {
    expect(followUpMigration).toContain('add column follow_ups jsonb not null');
    expect(followUpMigration).toContain("coalesce(p_response->'followups','[]'::jsonb)");
    expect(followUpMigration).toContain('jsonb_array_length(follow_ups) <= 3');
  });

  it('ships disabled with the requested quota and budget limits', () => {
    expect(migration).toContain('enabled boolean not null default false');
    expect(migration).toContain('daily_budget_usd numeric not null default 3');
    expect(migration).toContain('warning_budget_usd numeric not null default 2.4');
    expect(migration).toContain('free_daily_replies integer not null default 5');
    expect(migration).toContain('pro_daily_replies integer not null default 10');
    expect(migration).toContain('premium_daily_replies integer not null default 20');
  });

  it('keeps provider operations private and user records owner scoped', () => {
    expect(migration).toContain('create schema if not exists ai_coach_private');
    expect(migration).toContain(
      'alter table public.ai_coach_conversations enable row level security'
    );
    expect(migration).toContain('alter table public.ai_coach_messages enable row level security');
    expect(migration).toContain(
      'revoke all on schema ai_coach_private from public, anon, authenticated'
    );
    expect(migration).toContain('grant execute on function public.ai_coach_reserve');
    expect(migration).toContain('to service_role');
  });

  it('serializes user and global admission and charges only persisted replies', () => {
    expect(migration).toContain('pg_advisory_xact_lock');
    expect(migration).toContain("state = 'pending'");
    expect(migration).toContain("date_trunc('day', now() at time zone 'utc')");
    expect(migration).toContain("state = 'complete'");
    expect(migration).toContain('if not p_ok or p_response is null then');
    expect(migration).toContain('coalesce(actual_cost, reserved_cost)');
  });

  it('retains conversations for 90 days and expires action previews after 15 minutes', () => {
    expect(migration).toContain('retention_days integer not null default 90');
    expect(migration).toContain(
      "expires_at timestamptz not null default now() + interval '15 minutes'"
    );
  });

  it('claims a proposed action under a row lock before executing it', () => {
    expect(migration).toContain('create or replace function public.ai_coach_claim_action');
    expect(migration).toContain('for update;');
    expect(migration).toContain("set status = 'executing'");
    expect(migration).toContain(
      'revoke all on function public.ai_coach_claim_action(uuid,uuid) from public, anon, authenticated'
    );
  });

  it('keeps objective exercise answers private and checks them without coach quota', () => {
    expect(migration).toContain('create table ai_coach_private.exercise_answers');
    expect(migration).toContain("safe_exercise := safe_exercise - 'answerindex' - 'explanation'");
    expect(migration).toContain('create or replace function public.ai_coach_check_exercise');
    expect(migration).toContain(
      'grant execute on function public.ai_coach_check_exercise(uuid,uuid,integer) to service_role'
    );
  });

  it('exposes the $2.40 warning only through an admin-authorized status function', () => {
    expect(migration).toContain('create or replace function public.get_ai_coach_budget_status()');
    expect(migration).toContain("auth_id = (select auth.uid()) and role = 'admin'");
    expect(migration).toContain("'warning', spend >= cfg.warning_budget_usd");
    expect(migration).toContain(
      'revoke all on function public.get_ai_coach_budget_status() from public, anon'
    );
  });

  it('adds coach budget and lifecycle telemetry to central admin system health', () => {
    expect(migration).toContain('rename to get_platform_health_core_v13');
    expect(migration).toContain("'key', 'personalized_ai_coach'");
    expect(migration).toContain("'dailyspendusd', round(spend, 6)");
    expect(migration).toContain("'pendingreservations', pending_count");
    expect(migration).toContain("'stuckreservations', stuck_count");
    expect(migration).toContain("'failedrequests', failed_count");
    expect(migration).toContain("'featureenabled', cfg.enabled");
    expect(migration).toContain("'{contractversion}', '13'::jsonb");
  });
});
