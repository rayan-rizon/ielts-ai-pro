import { useState, useEffect, useCallback } from 'react';
import { fetchWritingData } from './writingDataService';

function getUserDataId(userData) {
  return userData ? userData.id : undefined;
}

function getCurrentUserDataId(writingData) {
  return writingData && writingData.currentUser ? writingData.currentUser.id : undefined;
}

function getNextPage(writingData) {
  return writingData ? (writingData.currentPage || 1) + 1 : 2;
}

async function loadInitialData(userData, writingData, setWritingData, setIsLoading) {
  if (!writingData) setIsLoading(true);
  try {
    const data = await fetchWritingData(userData, 1, 12);
    setWritingData(data);
  } catch (err) {
    console.error('Error loading writing data:', err);
  } finally {
    setIsLoading(false);
  }
}

async function loadMoreData(userData, writingData, setWritingData, setIsLoadingMore) {
  setIsLoadingMore(true);
  try {
    const nextPage = getNextPage(writingData);
    const more = await fetchWritingData(userData, nextPage, 12, writingData);
    setWritingData(more);
  } catch (err) {
    console.error('Error loading more writing tests:', err);
  } finally {
    setIsLoadingMore(false);
  }
}

function getWritingDataProperties(writingData) {
  if (!writingData) {
    return { passages: [], sessions: [], testCounts: {}, durations: {}, wordLimits: {} };
  }
  return {
    passages: writingData.passages || [],
    sessions: writingData.sessions || [],
    testCounts: writingData.testCounts || {},
    durations: writingData.durations || {},
    wordLimits: writingData.wordLimits || {},
  };
}

export function useWritingData(userData, authLoading) {
  const [writingData, setWritingData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Initial load — waits for auth
  useEffect(() => {
    if (authLoading) return;
    if (getCurrentUserDataId(writingData) === getUserDataId(userData)) return;
    loadInitialData(userData, writingData, setWritingData, setIsLoading);
  }, [userData, authLoading, writingData]);

  const handleLoadMore = useCallback(() => {
    const hasMore = writingData ? writingData.hasMore : false;
    if (isLoadingMore) return;
    if (!hasMore) return;
    loadMoreData(userData, writingData, setWritingData, setIsLoadingMore);
  }, [isLoadingMore, writingData, userData]);

  const props = getWritingDataProperties(writingData);

  return {
    writingData,
    isLoading,
    isLoadingMore,
    handleLoadMore,
    ...props,
  };
}
