import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useGrammarLab } from '@/features/grammar/hooks/useGrammarLab';

const state = vi.hoisted(() => ({ errorToast: vi.fn() }));
vi.mock('sonner', () => ({ toast: { error: state.errorToast, success: vi.fn() } }));
vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'learner', subscription_tier: 'free' } }),
}));
vi.mock('@/features/recommendations/useResultRecommendations', () => ({
  useResultRecommendations: () => [],
}));
vi.mock('@/utils/api', () => ({ generateAdaptiveLearningPath: vi.fn() }));
vi.mock('@/features/grammar/services/grammarLabService', () => ({
  getGrammarDashboard: async () => ({ skills: [] }),
  getGrammarAttempt: async () => {
    throw new Error('Attempt is unavailable');
  },
  completeGrammarAttempt: async () => {
    throw new Error('Could not save completion');
  },
  setGrammarGuideCompletion: async () => {
    throw new Error('Could not save guide');
  },
  startGrammarAttempt: vi.fn(),
  submitGrammarResponse: vi.fn(),
}));

describe('Grammar event mutations', () => {
  afterEach(() => vi.clearAllMocks());

  it.each([
    ['resumeAttempt', 'attempt', 'Could not resume Grammar practice', 'Attempt is unavailable'],
    [
      'completeAttempt',
      'attempt',
      'Could not complete Grammar practice',
      'Could not save completion',
    ],
    [
      'setGuideCompletion',
      { guideSlug: 'verb-forms', completed: true },
      'Could not update guide completion',
      'Could not save guide',
    ],
  ])(
    'handles %s failures without an unhandled click rejection',
    async (action, input, title, message) => {
      const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      const wrapper = ({ children }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      );
      const { result, unmount } = renderHook(() => useGrammarLab(), { wrapper });
      act(() => {
        result.current[action](input);
      });
      await waitFor(() =>
        expect(state.errorToast).toHaveBeenCalledWith(title, { description: message })
      );
      expect(result.current.activeAttempt).toBeNull();
      expect(result.current.result).toBeNull();
      unmount();
      client.clear();
    }
  );
});
