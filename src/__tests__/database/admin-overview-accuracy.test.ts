import { readMigrationSource } from '../helpers/migrationSource';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readMigrationSource(
  '20260801133539_fix_admin_overview_accuracy.sql'
).toLowerCase();

const overviewSections = readFileSync(
  resolve(process.cwd(), 'src/components/admin/overview/AdminOverviewSections.jsx'),
  'utf8'
);

const statusStrip = readFileSync(
  resolve(process.cwd(), 'src/components/admin/ServiceStatusStrip.jsx'),
  'utf8'
);

const actionQueueMigration = readMigrationSource(
  '20260801134932_reconcile_admin_overview_action_queue.sql'
).toLowerCase();

const activityHistoryMigration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260919202000_accurate_admin_active_user_history.sql'
  ),
  'utf8'
).toLowerCase();
const payingUsersMigration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20261109201156_count_verified_paying_users_in_admin_overview.sql'
  ),
  'utf8'
).toLowerCase();

const userService = readFileSync(
  resolve(process.cwd(), 'src/features/auth/services/User.ts'),
  'utf8'
);

const userManagement = readFileSync(
  resolve(process.cwd(), 'src/components/admin/UserManagement.jsx'),
  'utf8'
);

const userManagementFilters = readFileSync(
  resolve(process.cwd(), 'src/components/admin/users/UserManagementFilters.jsx'),
  'utf8'
);

describe('admin overview accuracy contract', () => {
  it('counts paying users only when a successful payment is recorded', () => {
    expect(payingUsersMigration).toContain("bh.status = 'paid'");
    expect(payingUsersMigration).toContain("pr.status = 'approved'");
    expect(payingUsersMigration).toContain("subscription_tier = 'pro'");
    expect(payingUsersMigration).toContain("subscription_tier = 'premium'");
    expect(overviewSections).toContain('with a recorded successful payment');
  });

  it('aligns selected-window active users, completions, and trend length', () => {
    expect(migration).toContain('count(*) filter (where last_active >= v_since)');
    expect(migration).toContain("'value', v_active");
    expect(migration).toContain('coalesce(ts.completed_at, ts.created_at) >= v_since');
    expect(migration).toContain("'testusers', coalesce(testers.n, 0)");
    expect(migration).toContain('make_interval(days => v_days - 1)');
    expect(migration).toContain('count(distinct ts.user_id) filter (where u.onboarding_completed)');
    expect(migration).toContain("'users',v_f_subscribed");
  });

  it('keeps currencies separate and uses Bangladesh-local activity buckets', () => {
    expect(migration).toContain('upper(bh.currency) as currency');
    expect(migration).toContain('upper(pr.currency) as currency');
    expect(migration).toContain("where currency = 'usd'");
    expect(migration).toContain("where currency = 'bdt'");
    expect(migration).toContain("created_at at time zone 'asia/dhaka'");
    expect(migration).toContain("'hourtimezone', 'asia/dhaka'");
  });

  it('distinguishes future cohort weeks from observed zero retention', () => {
    expect(migration).toMatch(
      /'w1', case when rolled\.cohort_wk <= current_week\.wk - 7 then rolled\.w1 end/
    );
    expect(overviewSections).toContain('This cohort has not reached this week yet');
    expect(overviewSections).toContain("{isMature ? `${percentage}%` : '—'}");
  });

  it('renders range-aware labels and never hides an unavailable health check', () => {
    expect(overviewSections).toContain('Active users · ${displayDays}d');
    expect(overviewSections).toContain('Revenue · ${displayDays}d');
    expect(overviewSections).toContain("data.trendMetric === 'testUsers'");
    expect(statusStrip).toContain('Status unavailable — service health could not be verified');
  });

  it('uses complete daily activity history for prior-period comparisons', () => {
    expect(activityHistoryMigration).toContain(
      'create table admin_analytics_private.user_activity_days'
    );
    expect(activityHistoryMigration).toContain('create trigger capture_user_activity_day');
    expect(activityHistoryMigration).toContain('after update of last_active on public.users');
    expect(activityHistoryMigration).toContain('count(distinct activity.user_id)');
    expect(activityHistoryMigration).toContain("'comparisonready', v_comparison_ready");
    expect(activityHistoryMigration).toContain("'comparisonbasis', 'daily_activity_history'");
    expect(activityHistoryMigration).toContain(
      'revoke all on function public.get_admin_active_users(integer) from public, anon'
    );
  });

  it('records activity atomically and labels exact calendar windows', () => {
    expect(activityHistoryMigration).toContain('user_auth_id is distinct from auth.uid()');
    expect(activityHistoryMigration).toContain("at time zone 'asia/dhaka'");
    expect(userService).toContain("supabase.rpc('update_user_last_active'");
    expect(overviewSections).toContain('today BDT');
    expect(overviewSections).toContain('last 30d');
    expect(overviewSections).toContain('baseline building');
  });

  it('keeps the action queue current and sends subscription alerts to an exact filter', () => {
    expect(actionQueueMigration).toContain(
      "coalesce(updated_at, created_at) >= now() - interval '24 hours'"
    );
    expect(actionQueueMigration).toContain('and subscription_end_date > now()');
    expect(actionQueueMigration).toContain("'subscriptionstatus', 'cancelling'");
    expect(userManagement).toContain("searchParams.get('subscriptionStatus')");
    expect(userManagementFilters).toContain('Cancelling at period end');
  });
});
