import { useState, useEffect, useCallback } from 'react';
import { fetchListeningData } from './listeningDataService';

// ---------------------------------------------------------------------------
// Default empty values — defined once to avoid allocation on every render
// ---------------------------------------------------------------------------
const EMPTY_ARRAY = [];
const EMPTY_OBJ = {};

/** Extracts the data slices needed by the page from the raw listeningData blob. */
function selectData(listeningData) {
  if (!listeningData) {
    return {
      passages: EMPTY_ARRAY,
      sessions: EMPTY_ARRAY,
      testCounts: EMPTY_OBJ,
      questionCounts: EMPTY_OBJ,
      durations: EMPTY_OBJ,
    };
  }
  return {
    passages: listeningData.passages,
    sessions: listeningData.sessions,
    testCounts: listeningData.testCounts,
    questionCounts: listeningData.questionCounts,
    durations: listeningData.durations,
  };
}

// ---------------------------------------------------------------------------
// Focused hooks
// ---------------------------------------------------------------------------

/** Handles the initial (first-page) data load, waiting for auth to settle. */
export function useInitialLoad(userData, authLoading) {
  const [listeningData, setListeningData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (listeningData?.currentUser?.id === userData?.id) return;

    const load = async () => {
      if (!listeningData) setIsLoading(true);
      try {
        const data = await fetchListeningData(userData, 1, 32);
        setListeningData(data);
      } catch (err) {
        console.error('Error loading listening data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [userData, authLoading, listeningData]);

  return { listeningData, setListeningData, isLoading };
}

/** Handles paginated "load more" fetching on top of existing data. */
export function useLoadMore(userData, listeningData, setListeningData) {
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !listeningData?.hasMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = (listeningData.currentPage || 1) + 1;
      const moreData = await fetchListeningData(userData, nextPage, 32, listeningData);
      setListeningData(moreData);
    } catch (err) {
      console.error('Error loading more tests:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, listeningData, userData, setListeningData]);

  return { isLoadingMore, handleLoadMore };
}

/**
 * Composes useInitialLoad + useLoadMore into a single convenient return object.
 * Contains zero branching — all logic lives in the focused hooks above.
 */
export function useListeningData(userData, authLoading) {
  const { listeningData, setListeningData, isLoading } = useInitialLoad(userData, authLoading);
  const { isLoadingMore, handleLoadMore } = useLoadMore(userData, listeningData, setListeningData);
  const slices = selectData(listeningData);

  return { listeningData, isLoading, isLoadingMore, handleLoadMore, ...slices };
}
