import { describe, expect, it } from 'vitest';
import {
  buildDashboardViewModel,
  createEmptyDashboardData,
  isPremiumTier,
  normalizeTargetScore,
} from '@/features/dashboard/hooks/dashboardDataUtils';

describe('dashboard data helpers', () => {
  it('preserves missing targets and measured zero scores', () => {
    expect(normalizeTargetScore(undefined)).toBeNull();
    expect(normalizeTargetScore(0)).toBeNull();
    expect(normalizeTargetScore(9.5)).toBeNull();
    expect(normalizeTargetScore('7.5')).toBe(7.5);

    const viewModel = buildDashboardViewModel(
      {
        serverStats: {
          totalTests: 1,
          measuredTests: 1,
          avgScore: 0,
          moduleAverages: { reading: 0 },
        },
        recentSessions: [],
      },
      null
    );

    expect(viewModel.stats.avgScore).toBe('0.0');
    expect(viewModel.stats.targetScore).toBeNull();
    expect(viewModel.stats.measuredTests).toBe(1);
  });

  it('builds passage links without mutating the server session shape', () => {
    const session = {
      id: 'session-1',
      passage_id: 'passage-1',
      passage_title: 'Urban Farming',
    };
    const viewModel = buildDashboardViewModel({ serverStats: {}, recentSessions: [session] }, 7);

    expect(viewModel.recentTests[0].passage).toEqual({
      id: 'passage-1',
      title: 'Urban Farming',
    });
    expect(session).not.toHaveProperty('passage');
  });

  it('keeps premium gating and empty dashboard defaults explicit', () => {
    expect(isPremiumTier('Pro')).toBe(true);
    expect(isPremiumTier('premium')).toBe(true);
    expect(isPremiumTier('free')).toBe(false);
    expect(createEmptyDashboardData(null).skillProficiency).toEqual([]);
  });
});
