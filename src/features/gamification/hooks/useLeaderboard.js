import React, { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { UserPoints } from '../services/UserPoints';

const PAGE_SIZE = 25;

export function useLeaderboard(timeFilter = 'all_time', currentUserId = null) {
  const { data, ...rest } = useInfiniteQuery({
    // Destructure data from the query result
    queryKey: ['leaderboard', timeFilter],
    queryFn: async ({ pageParam = 1 }) => {
      const from = (pageParam - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, count } = await UserPoints.getLeaderboard(from, to, timeFilter);

      // Transform data for UI
      const formattedData = data.map((item, index) => {
        const displayName = item.users?.full_name || 'Anonymous User';
        const avatarUrl =
          item.users?.avatar_url ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user_id}`;

        const bandScore = item.real_avg_score || '0.0';
        const streak = item.current_streak || 0;

        return {
          rank: from + index + 1,
          id: item.is_me && currentUserId ? currentUserId : item.user_id,
          isMe: item.is_me,
          name: displayName,
          avatar: avatarUrl,
          country: item.users?.country || 'Global',
          points: item.points || 0,
          streak: streak,
          bandScore: bandScore.toString(),
        };
      });

      return {
        users: formattedData,
        totalCount: count,
        nextPage:
          formattedData.length === PAGE_SIZE && from + PAGE_SIZE < (count || 0)
            ? pageParam + 1
            : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const users = useMemo(() => {
    return data?.pages.flatMap((page) => page.users) || [];
  }, [data]);

  return {
    users,
    isLoading: rest.isLoading,
    error: rest.error,
    hasNextPage: rest.hasNextPage,
    isFetchingNextPage: rest.isFetchingNextPage,
    fetchNextPage: rest.fetchNextPage,
    data,
  };
}
