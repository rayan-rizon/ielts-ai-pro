import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const quotaMigration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260910120000_reading_assistant_per_action_quota_and_budget_alerts.sql'
  ),
  'utf8'
);
const healthMigration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260910120500_surface_reading_assistant_budget_to_admin_health.sql'
  ),
  'utf8'
);
const functionSource = readFileSync(
  resolve(process.cwd(), 'supabase/functions/reading-assistant/index.ts'),
  'utf8'
);

describe('Reading assistant free allowance', () => {
  it('meters Translate and Breakdown separately instead of sharing one pool', () => {
    // The old code counted `action in ('translate', 'breakdown')` as one bucket.
    expect(quotaMigration).toContain("p_action = 'translate' and left_translate <= 0");
    expect(quotaMigration).toContain("p_action = 'breakdown' and left_breakdown <= 0");
    expect(quotaMigration).toContain("'translate', left_translate, 'breakdown', left_breakdown");
    expect(quotaMigration).not.toContain("action in ('translate', 'breakdown')");
  });

  it('counts in-flight requests against the action that started them', () => {
    expect(quotaMigration).toContain("count(*) filter (where action = 'translate')");
    expect(quotaMigration).toContain("count(*) filter (where action = 'breakdown')");
    expect(quotaMigration).toContain("state = 'pending' and created_at >= day_start");
  });

  it('reports both remaining allowances to the client', () => {
    expect(quotaMigration).toContain("'remainingByAction'");
    expect(quotaMigration).toContain("'freeDailyAssists', cfg.free_daily_assists");
    expect(functionSource).toContain('remainingByAction: reservation.remainingByAction');
  });
});

describe('Reading assistant daily provider budget', () => {
  it('lowers the daily budget to $2', () => {
    expect(quotaMigration).toContain('alter column daily_budget set default 2');
    expect(quotaMigration).toContain(
      'update reading_assistant_private.settings set daily_budget = 2'
    );
  });

  it('records the budget stop instead of raising, so the event survives the transaction', () => {
    expect(quotaMigration).toContain('reading_assistant_private.budget_events');
    expect(quotaMigration).toContain("'exhausted', spend, cfg.daily_budget");
    expect(quotaMigration).toContain("'warning', spend, cfg.daily_budget");
    expect(quotaMigration).toContain("'state', 'budget_exhausted'");
    expect(quotaMigration).not.toContain(
      "raise exception 'New Reading explanations are taking a break today'"
    );
    expect(functionSource).toContain("reservation.state === 'budget_exhausted'");
  });

  it('escalates the admin health card when the budget is warned or spent', () => {
    expect(healthMigration).toContain('get_platform_health_core_v12');
    expect(healthMigration).toContain("'dailyBudgetUsd', v_budget");
    expect(healthMigration).toContain("'budgetSpentTodayUsd'");
    expect(healthMigration).toContain("WHEN v_exhausted_at IS NOT NULL THEN 'down'");
    expect(healthMigration).toContain("WHEN v_warned_at IS NOT NULL THEN 'attention'");
    expect(healthMigration).toContain('public.is_admin()');
    expect(healthMigration).toContain(
      'REVOKE ALL ON FUNCTION public.get_platform_health(integer) FROM PUBLIC, anon'
    );
  });

  it('never softens a fault the core health function already reported', () => {
    expect(healthMigration).toContain(
      "WHEN service->>'status' IN ('down', 'unconfigured', 'degraded') THEN service->>'status'"
    );
  });
});
