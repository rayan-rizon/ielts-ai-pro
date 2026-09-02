import { readMigrationSource } from '../helpers/migrationSource';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readMigrationSource(
  '20260831224146_add_admin_country_market_analytics.sql'
).toLowerCase();

const overview = readFileSync(
  resolve(process.cwd(), 'src/components/admin/overview/AdminOverviewSections.jsx'),
  'utf8'
);
const userAnalytics = readFileSync(
  resolve(process.cwd(), 'src/components/admin/UserAnalytics.jsx'),
  'utf8'
);
const adminPanel = readFileSync(
  resolve(process.cwd(), 'src/features/admin/pages/AdminPanel.jsx'),
  'utf8'
);

describe('admin country and acquisition intelligence contract', () => {
  it('normalizes first-touch country and keeps unknown coverage visible', () => {
    expect(migration).toContain("upper(trim(u.country)) ~ '^[a-z]{2}$'");
    expect(migration).toContain("not in ('xx', 't1')");
    expect(migration).toContain("'basis', 'first_touch_signup_country'");
    expect(migration).toContain("'unknownsignups'");
    expect(migration).toContain("'coveragerate'");
    expect(overview).toContain('Signup markets');
    expect(overview).toContain('not proof of residence or nationality');
    expect(overview).toContain('data-testid="signup-country-map"');
    expect(overview).toContain('New user signup country map');
    expect(overview).toContain('max-w-[34rem]');
    expect(overview).toContain('grid-rows-8');
    expect(overview).toContain('lg:h-[448px]');
    expect(overview.match(/className="col-span-12 xl:col-span-4"/g)?.length).toBe(3);
  });

  it('reports cohort quality by country and acquisition channel', () => {
    for (const field of [
      "'geography'",
      "'acquisitionchannels'",
      "'activationrate'",
      "'practicerate'",
      "'paidrate'",
      "'repeatrate'",
      "'completionrate'",
    ]) {
      expect(migration).toContain(field);
    }
    expect(userAnalytics).toContain('Signup country');
    expect(userAnalytics).toContain('Acquisition quality');
    expect(userAnalytics).toContain('minimum-sample and coverage guards');
    expect(userAnalytics).toContain('max-h-[440px]');
    expect(userAnalytics).toContain('overflow-y-auto');
    expect(adminPanel).toContain('acquisitionChannels: data.acquisitionChannels || []');
  });

  it('preserves the admin authorization and execution boundary', () => {
    expect(migration.match(/if not public\.is_admin\(\)/g)?.length).toBe(2);
    expect(migration).toContain('security definer');
    expect(migration).toContain("set search_path to ''");
    expect(migration).toContain(
      'revoke all on function public.get_admin_overview_with_signup_sources(integer) from public, anon'
    );
    expect(migration).toContain(
      'revoke all on function public.get_admin_analytics_intelligence(text) from public, anon'
    );
  });

  it('excludes admin profiles from every new market and acquisition cohort', () => {
    expect(migration.match(/role is distinct from 'admin'/g)?.length).toBeGreaterThanOrEqual(8);
  });
});
