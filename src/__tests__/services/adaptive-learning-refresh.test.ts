import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  generateAdaptiveLearningPath: vi.fn(),
  invalidateQueries: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mocks.from },
}));

vi.mock('@/utils/api', () => ({
  generateAdaptiveLearningPath: mocks.generateAdaptiveLearningPath,
}));

vi.mock('@/lib/queryClient', () => ({
  queryClient: { invalidateQueries: mocks.invalidateQueries },
}));

import { refreshLearningPathAfterTest } from '@/services/adaptiveLearningService';

function mockSubscription(subscriptionTier: string) {
  mocks.from.mockReturnValue({
    select: () => ({
      eq: () => ({
        single: vi.fn().mockResolvedValue({
          data: { subscription_tier: subscriptionTier },
          error: null,
        }),
      }),
    }),
  });
}

describe('refreshLearningPathAfterTest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.generateAdaptiveLearningPath.mockResolvedValue({ success: true });
    mocks.invalidateQueries.mockResolvedValue(undefined);
  });

  it('accepts a present zero score and invalidates both shared consumers', async () => {
    mockSubscription('premium');

    await refreshLearningPathAfterTest('user-1', 'reading', 0);

    expect(mocks.generateAdaptiveLearningPath).toHaveBeenCalledWith({
      trigger: 'test_completed',
      module: 'reading',
    });
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['learningPath'] });
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['analytics'] });
  });

  it('does not generate a plan for an ineligible tier or an absent score', async () => {
    mockSubscription('free');
    await refreshLearningPathAfterTest('user-1', 'reading', 6);
    expect(mocks.generateAdaptiveLearningPath).not.toHaveBeenCalled();

    mockSubscription('premium');
    await refreshLearningPathAfterTest('user-1', 'reading', Number.NaN);
    expect(mocks.generateAdaptiveLearningPath).not.toHaveBeenCalled();
  });
});
