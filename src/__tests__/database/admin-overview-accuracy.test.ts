import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260801133539_fix_admin_overview_accuracy.sql'),
  'utf8'
).toLowerCase();

const overviewSections = readFileSync(
  resolve(process.cwd(), 'src/components/admin/overview/AdminOverviewSections.jsx'),
  'utf8'
);

const statusStrip = readFileSync(
  resolve(process.cwd(), 'src/components/admin/ServiceStatusStrip.jsx'),
  'utf8'
);

const actionQueueMigration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260801134932_reconcile_admin_overview_action_queue.sql'
  ),
  'utf8'
).toLowerCase();

const userManagement = readFileSync(
  resolve(process.cwd(), 'src/components/admin/UserManagement.jsx'),
  'utf8'
);

const userManagementFilters = readFileSync(
  resolve(process.cwd(), 'src/components/admin/users/UserManagementFilters.jsx'),
  'utf8'
);

describe('admin overview accuracy contract', () => {
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
