import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { objectiveQuotaQuery } from '../quota/useObjectiveTestQuota';

const EMPTY_LIBRARY = {
  passages: [],
  sessions: [],
  testCounts: {},
  questionCounts: {},
  durations: {},
};

function resolveTab(activeTab, starterSetsAvailable) {
  return !starterSetsAvailable && activeTab === 'starter' ? 'all' : activeTab;
}

function useLoadMore(queryClient, fetchPage) {
  const { mutate, isPending } = useMutation({
    mutationFn: ({ previous, ownerId, onlyStarter, freeLimit }) =>
      fetchPage(
        { id: ownerId },
        {
          page: previous.currentPage + 1,
          existingData: previous,
          starterOnly: onlyStarter,
          freeLimit,
        }
      ),
    onSuccess: (next, { key, previous }) => {
      queryClient.setQueryData(key, (current) => (current === previous ? next : current));
    },
    onError: (error) => console.error('Error loading more tests:', error),
  });

  function handleLoadMore({ data, userId, starterOnly, queryKey, freeLimit }) {
    if (data?.hasMore && !isPending) {
      mutate({
        previous: data,
        ownerId: userId,
        onlyStarter: starterOnly,
        key: queryKey,
        freeLimit,
      });
    }
  }

  return { loadMore: handleLoadMore, isLoadingMore: isPending };
}

function libraryLoadStatus(catalogue, quota, authLoading) {
  return {
    loadError: catalogue.data ? null : (quota.error ?? catalogue.error),
    retryLoad: quota.error ? quota.refetch : catalogue.refetch,
    isLoading: authLoading || quota.isLoading || catalogue.isLoading,
  };
}

export function useObjectiveLibraryData({ testType, userData, authLoading, activeTab, fetchPage }) {
  const queryClient = useQueryClient();
  const userId = userData?.id;
  const quota = useQuery(objectiveQuotaQuery(userId));
  const freeLimit = quota.data?.[testType]?.limit ?? -1;
  const starterSetsAvailable = freeLimit > 0;
  const selectedTab = resolveTab(activeTab, starterSetsAvailable);
  const starterOnly = selectedTab === 'starter';
  const queryKey = ['objective-library', testType, userId, starterOnly, freeLimit];
  const catalogue = useQuery({
    queryKey,
    enabled: !authLoading && quota.isSuccess,
    queryFn: () => fetchPage({ id: userId }, { starterOnly, freeLimit }),
  });

  const { data } = catalogue;
  const { loadMore, isLoadingMore } = useLoadMore(queryClient, fetchPage);
  return {
    data,
    ...libraryLoadStatus(catalogue, quota, authLoading),
    starterSetsAvailable,
    selectedTab,
    isLoadingMore,
    handleLoadMore: () => loadMore({ data, userId, starterOnly, queryKey, freeLimit }),
    ...(data ?? EMPTY_LIBRARY),
  };
}
