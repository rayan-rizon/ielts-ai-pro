import { useState, useEffect, useCallback } from 'react';
import { fetchReadingData } from './readingDataService';

// ---------------------------------------------------------------------------
// Stable empty references — avoid allocation on every render
// ---------------------------------------------------------------------------
const EMPTY_ARRAY = [];
const EMPTY_OBJ = {};

/** Extracts the data slices the page needs from the raw readingData blob. */
function selectData(readingData) {
  if (!readingData) {
    return {
      passages: EMPTY_ARRAY,
      sessions: EMPTY_ARRAY,
      testCounts: EMPTY_OBJ,
      questionCounts: EMPTY_OBJ,
      durations: EMPTY_OBJ,
    };
  }
  return {
    passages: readingData.passages,
    sessions: readingData.sessions,
    testCounts: readingData.testCounts,
    questionCounts: readingData.questionCounts,
    durations: readingData.durations,
  };
}

// ---------------------------------------------------------------------------
// Focused hooks
// ---------------------------------------------------------------------------

/** Handles the initial (first-page) data load, waiting for auth to settle. */
export function useInitialReadingLoad(userData, authLoading) {
  const [readingData, setReadingData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (readingData?.currentUser?.id === userData?.id) return;

    const load = async () => {
      if (!readingData) setIsLoading(true);
      try {
        const data = await fetchReadingData(userData, 1, 32);
        setReadingData(data);
      } catch (err) {
        console.error('Error loading reading data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [userData, authLoading, readingData]);

  return { readingData, setReadingData, isLoading };
}

/** Handles paginated "load more" fetching on top of existing data. */
export function useReadingLoadMore(userData, readingData, setReadingData) {
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !readingData?.hasMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = (readingData.currentPage || 1) + 1;
      const moreData = await fetchReadingData(userData, nextPage, 32, readingData);
      setReadingData(moreData);
    } catch (err) {
      console.error('Error loading more reading tests:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, readingData, userData, setReadingData]);

  return { isLoadingMore, handleLoadMore };
}

/**
 * Composes the two focused hooks into a single convenient return object.
 * Contains zero branching — all logic lives in the focused hooks above.
 */
export function useReadingData(userData, authLoading) {
  const { readingData, setReadingData, isLoading } = useInitialReadingLoad(userData, authLoading);
  const { isLoadingMore, handleLoadMore } = useReadingLoadMore(
    userData,
    readingData,
    setReadingData
  );
  const slices = selectData(readingData);

  return { readingData, isLoading, isLoadingMore, handleLoadMore, ...slices };
}
