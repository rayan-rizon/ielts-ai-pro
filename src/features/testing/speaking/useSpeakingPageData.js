import { useState, useEffect, useCallback } from 'react';
import { fetchSpeakingData } from './speakingDataService';

function getUserDataId(userData) {
  return userData ? userData.id : undefined;
}

function getCurrentUserDataId(speakingData) {
  return speakingData && speakingData.currentUser ? speakingData.currentUser.id : undefined;
}

function getNextPage(speakingData) {
  return speakingData ? (speakingData.currentPage || 1) + 1 : 2;
}

async function loadInitialData(userData, speakingData, setSpeakingData, setIsLoading) {
  if (!speakingData) setIsLoading(true);
  try {
    const data = await fetchSpeakingData(userData, 1, 12);
    setSpeakingData(data);
  } catch (err) {
    console.error('Error loading speaking data:', err);
  } finally {
    setIsLoading(false);
  }
}

async function loadMoreData(userData, speakingData, setSpeakingData, setIsLoadingMore) {
  setIsLoadingMore(true);
  try {
    const nextPage = getNextPage(speakingData);
    const more = await fetchSpeakingData(userData, nextPage, 12, speakingData);
    setSpeakingData(more);
  } catch (err) {
    console.error('Error loading more speaking tests:', err);
  } finally {
    setIsLoadingMore(false);
  }
}

function getSpeakingDataProperties(speakingData) {
  if (!speakingData) {
    return { passages: [], sessions: [], testCounts: {}, questionCounts: {}, durations: {} };
  }
  return {
    passages: speakingData.passages || [],
    sessions: speakingData.sessions || [],
    testCounts: speakingData.testCounts || {},
    questionCounts: speakingData.questionCounts || {},
    durations: speakingData.durations || {},
  };
}

export function useSpeakingPageData(userData, authLoading) {
  const [speakingData, setSpeakingData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Initial load — waits for auth
  useEffect(() => {
    if (authLoading) return;
    if (getCurrentUserDataId(speakingData) === getUserDataId(userData)) return;
    loadInitialData(userData, speakingData, setSpeakingData, setIsLoading);
  }, [userData, authLoading, speakingData]);

  const handleLoadMore = useCallback(() => {
    const hasMore = speakingData ? speakingData.hasMore : false;
    if (isLoadingMore) return;
    if (!hasMore) return;
    loadMoreData(userData, speakingData, setSpeakingData, setIsLoadingMore);
  }, [isLoadingMore, speakingData, userData]);

  const props = getSpeakingDataProperties(speakingData);

  return {
    speakingData,
    isLoading,
    isLoadingMore,
    handleLoadMore,
    ...props,
  };
}
