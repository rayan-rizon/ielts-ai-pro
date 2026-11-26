// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/skill-lab/skills', () => ({ SKILL_LAB_ENABLED: true }));
const { DEFAULT_PRICING_PLANS } = await import('@/features/subscription/config/pricingPlans');

const FREE_SETS = 5;
const read = (path) => readFileSync(join(process.cwd(), path), 'utf8');

describe('Free Practice Lab daily limit', () => {
  it('is set by a migration for both functions that enforce it', () => {
    const name = readdirSync(join(process.cwd(), 'supabase/migrations')).find((file) =>
      file.endsWith('_free_practice_lab_five_sets.sql')
    );
    expect(name).toBeDefined();
    const sql = read(`supabase/migrations/${name}`);
    expect(sql).toContain('public.practice_library_state(uuid,text,uuid,jsonb)');
    expect(sql).toContain('public.skill_lab_legacy_action(text,uuid,jsonb)');
    expect(sql).toContain(`$new$when 'pro' then 10 else ${FREE_SETS} end$new$`);
    expect(sql).toContain('raise exception');
  });

  it('matches what the pricing card promises', () => {
    const free = DEFAULT_PRICING_PLANS.find((plan) => plan.tier === 'free' || plan.name === 'Free');
    expect(free.features).toContain(`${FREE_SETS} Practice Lab Sets/Day`);
  });

  it.each(['src/features/core/pages/LandingPage.jsx', 'index.html'])(
    'matches the public copy in %s',
    (path) => {
      const counts = [...read(path).matchAll(/(\d+)\s+Practice\s+Lab\s+sets\s+per\s+day/gi)].map(
        (match) => Number(match[1])
      );
      expect(counts.length).toBeGreaterThan(0);
      expect(new Set(counts)).toEqual(new Set([FREE_SETS]));
    }
  );
});
