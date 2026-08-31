import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260831134207_exclude_admin_accounts_from_customer_analytics.sql'
  ),
  'utf8'
).toLowerCase();

const functionBody = (name: string) => {
  const start = migration.indexOf(`create or replace function public.${name}`);
  const end = migration.indexOf('$function$;', start);

  expect(start, `${name} must exist in the exclusion migration`).toBeGreaterThanOrEqual(0);
  expect(end, `${name} must have a complete function body`).toBeGreaterThan(start);

  return migration.slice(start, end);
};

describe('admin customer analytics exclusion contract', () => {
  it('excludes admin profiles and their sessions from every overview customer dataset', () => {
    const overview = functionBody('get_admin_overview(p_days integer default 7)');

    expect(overview.match(/role is distinct from 'admin'/g)?.length).toBeGreaterThanOrEqual(10);
    expect(overview).toContain("u.role = 'admin'");
    expect(overview).toContain('u.id = bh.user_id or u.auth_id = bh.auth_id');
    expect(overview).toContain('u.auth_id = pr.auth_id');
  });

  it('keeps all AI usage and reservation signals visible', () => {
    const overview = functionBody('get_admin_overview(p_days integer default 7)');
    const actions = functionBody('get_admin_overview_actions()');

    expect(overview).toContain('deliberately unfiltered: admin provider calls remain visible');
    expect(overview).toContain('from public.ai_api_usage;');
    expect(overview).toContain(
      'deliberately unfiltered: stuck reservations are ai-usage operations'
    );
    expect(overview).toContain('join public.users u on u.id = a.user_id');
    expect(overview).toContain('round(v_customer_ai_cost / v_completed_tests, 4)');
    expect(overview).toContain('round(v_customer_ai_cost / v_f_paid, 4)');
    expect(overview).toContain('round(v_customer_ai_cost / v_active, 4)');
    expect(actions).toContain('deliberately unfiltered ai-usage operational signal');
  });

  it('excludes admins from detailed user and revenue intelligence too', () => {
    const users = functionBody("get_admin_analytics_intelligence(p_range text default '30d')");
    const revenue = functionBody("get_revenue_intelligence(p_range text default '30d')");

    expect(users.match(/role is distinct from 'admin'/g)?.length).toBeGreaterThanOrEqual(5);
    expect(revenue).toContain("from public.users where role is distinct from 'admin'");
    expect(revenue.match(/u\.role='admin'|u\.role = 'admin'/g)?.length).toBeGreaterThanOrEqual(6);
  });

  it('preserves the admin-only execution boundary on every reporting RPC', () => {
    for (const signature of [
      'get_admin_overview(integer)',
      'get_admin_overview_with_signup_sources(integer)',
      'get_admin_overview_actions()',
      'get_admin_analytics_intelligence(text)',
      'get_revenue_intelligence(text)',
    ]) {
      expect(migration).toContain(`revoke all on function public.${signature} from public, anon`);
      expect(migration).toContain(`grant execute on function public.${signature} to authenticated`);
    }
  });
});
