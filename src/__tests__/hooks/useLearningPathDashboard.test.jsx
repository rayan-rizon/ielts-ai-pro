import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const generate = vi.hoisted(() => vi.fn());
vi.mock('@/utils/api', () => ({ generateAdaptiveLearningPath: generate }));
vi.mock('@/entities', () => ({ User: { updateMyUserData: vi.fn() } }));
import { useLearningPathDashboard } from '@/features/learning/components/dashboard/useLearningPathDashboard';
const availability = { version: 1, timezone: 'UTC', days: { monday: 60 } };
const session = {
  score: 6,
  test_type: 'reading',
  test_mode: 'practice',
  completed_at: new Date(Date.now() - 86400000).toISOString(),
};
const base = {
  user: { id: 'learner', target_band_score: 7, study_availability: availability },
  stats: { sessions: [] },
  skillMap: { byModule: {} },
  activityByKey: {},
  isLoading: false,
  navigate: vi.fn(),
};
function wrapper({ children }) {
  const [client] = React.useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false } } })
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
beforeEach(() => {
  generate.mockReset();
  generate.mockResolvedValue({ cached: true });
});
describe('Learning Path refresh lifecycle', () => {
  it('does not generate a personalized plan before a scored test exists', async () => {
    const { result } = renderHook(() => useLearningPathDashboard(base), { wrapper });
    expect(result.current.hasTestEvidence).toBe(false);
    await act(async () => {});
    expect(generate).not.toHaveBeenCalled();
  });
  it('generates once after the first usable score is available', async () => {
    const { rerender } = renderHook(
      () => useLearningPathDashboard({ ...base, stats: { sessions: [session] } }),
      { wrapper }
    );
    await waitFor(() => expect(generate).toHaveBeenCalledTimes(1));
    rerender();
    await act(async () => {});
    expect(generate).toHaveBeenCalledTimes(1);
    expect(generate).toHaveBeenCalledWith({ trigger: 'first_plan', timezone: 'UTC' });
  });
  it('keeps an already-current page quiet until the learner checks for updates', async () => {
    const path = {
      version: 2,
      input_fingerprint: 'current',
      generator_version: '2.4.3',
      generated_at: new Date().toISOString(),
      goal_snapshot: { target_band: 7, study_availability: availability },
    };
    const { result } = renderHook(
      () =>
        useLearningPathDashboard({ ...base, learningPath: path, stats: { sessions: [session] } }),
      { wrapper }
    );
    expect(result.current.planUpdateAvailable).toBe(false);
    await act(async () => {});
    expect(result.current.refreshing).toBe(false);
    expect(generate).not.toHaveBeenCalled();
    await act(async () => result.current.refreshPlan());
    expect(generate).toHaveBeenCalledWith({ trigger: 'manual_refresh', timezone: 'UTC' });
  });
});
