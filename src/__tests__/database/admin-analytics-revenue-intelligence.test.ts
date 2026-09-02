import { readMigrationSource } from '../helpers/migrationSource';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readMigrationSource(
  '20260809175250_admin_analytics_revenue_intelligence.sql'
).toLowerCase();
const service = readFileSync(
  resolve(process.cwd(), 'src/features/admin/services/AnalyticsService.js'),
  'utf8'
);
const userAnalytics = readFileSync(
  resolve(process.cwd(), 'src/components/admin/UserAnalytics.jsx'),
  'utf8'
);
const revenueAnalytics = readFileSync(
  resolve(process.cwd(), 'src/components/admin/RevenueAnalytics.jsx'),
  'utf8'
);

describe('admin analytics and revenue intelligence contract', () => {
  it('uses a range-aware signup cohort and practice data rather than a client estimate', () => {
    expect(migration).toContain("get_admin_analytics_intelligence(p_range text default '30d')");
    expect(migration).toContain("'activationrate'");
    expect(migration).toContain("'completedtests'");
    expect(migration).toContain("'started practice'");
    expect(migration).toContain("'funnel'");
    expect(service).toContain("rpc('get_admin_analytics_intelligence'");
    expect(userAnalytics).toContain('Activation funnel');
  });

  it('keeps USD and BDT independent while exposing settlement and renewal risk', () => {
    expect(migration).toContain("get_revenue_intelligence(p_range text default '30d')");
    expect(migration).toContain("currency = 'usd'");
    expect(migration).toContain("currency = 'bdt'");
    expect(migration).toContain("'cancellingsubscribers'");
    expect(migration).toContain("'failedpayments'");
    expect(service).toContain("rpc('get_revenue_intelligence'");
    expect(revenueAnalytics).toContain('Renewal risk');
    expect(revenueAnalytics).toContain('Settlement methods');
  });

  it('does not expose either admin intelligence function through public execution', () => {
    expect(migration).toContain(
      'revoke all on function public.get_admin_analytics_intelligence(text) from public'
    );
    expect(migration).toContain(
      'revoke all on function public.get_revenue_intelligence(text) from public'
    );
    expect(migration).toContain(
      'grant execute on function public.get_revenue_intelligence(text) to authenticated'
    );
  });
});
