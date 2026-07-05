import { QueryClient } from '@tanstack/react-query';

/**
 * Global QueryClient configuration for TanStack Query
 *
 * staleTime: How long data is considered fresh (won't refetch)
 * gcTime: How long inactive data stays in cache (formerly cacheTime)
 * retry: Number of times to retry failed requests
 * refetchOnWindowFocus: Refetch when window regains focus
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep unused data in cache for 30 minutes
      gcTime: 30 * 60 * 1000,
      // Retry failed requests up to 2 times
      retry: 2,
      // Don't refetch on window focus for better UX
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
});

// Query keys factory for consistent key management
export const queryKeys = {
  // User queries
  user: {
    me: () => ['user', 'me'] as const,
    profile: (userId: string) => ['user', 'profile', userId] as const,
  },

  // Dashboard queries
  dashboard: {
    stats: (userId: string) => ['dashboard', 'stats', userId] as const,
    recentSessions: (userId: string) => ['dashboard', 'recentSessions', userId] as const,
    cambridgeTests: () => ['dashboard', 'cambridgeTests'] as const,
  },

  // Learning path queries
  learningPath: {
    latest: (userId: string) => ['learningPath', 'latest', userId] as const,
    all: (userId: string) => ['learningPath', 'all', userId] as const,
  },

  // Analytics queries
  analytics: {
    stats: (userId: string, timeframe: string) =>
      ['analytics', 'stats', userId, timeframe] as const,
    sessions: (userId: string) => ['analytics', 'sessions', userId] as const,
  },

  // Vocabulary queries
  vocabulary: {
    list: (userId: string, page: number) => ['vocabulary', 'list', userId, page] as const,
    dueForReview: (userId: string) => ['vocabulary', 'dueForReview', userId] as const,
  },

  // Gamification queries
  gamification: {
    leaderboard: (timeFilter: string, page: number) => ['leaderboard', timeFilter, page] as const,
    userPoints: (userId: string) => ['userPoints', userId] as const,
  },
} as const;
