import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { VocabularyItem } from '@/features/vocabulary/services/VocabularyItem';
import {
  ITEMS_PER_PAGE,
  VOCABULARY_LIST_FIELDS,
  fetchCuratedLists,
  fetchVocabularyItems,
  fetchDueItems,
  calculateStats,
} from '@/features/vocabulary/services/vocabularyDataService';

function useVocabularyState() {
  const [allVocabulary, setAllVocabulary] = useState([]);
  const [dueForReview, setDueForReview] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [curatedLists, setCuratedLists] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  return {
    allVocabulary,
    setAllVocabulary,
    dueForReview,
    setDueForReview,
    isLoading,
    setIsLoading,
    curatedLists,
    setCuratedLists,
    currentPage,
    setCurrentPage,
    totalCount,
    setTotalCount,
    isLoadingMore,
    setIsLoadingMore,
  };
}

function useVocabularyLoadItems({ user, state, allVocabularyLength }) {
  const {
    setIsLoading,
    setCuratedLists,
    setAllVocabulary,
    setTotalCount,
    setDueForReview,
    setCurrentPage,
  } = state;
  const allVocabLengthRef = useRef(0);

  useEffect(() => {
    allVocabLengthRef.current = allVocabularyLength;
  }, [allVocabularyLength]);

  return useCallback(async () => {
    if (!user?.id) return;
    setIsLoading((prev) => prev && allVocabLengthRef.current === 0);

    try {
      const [curated, vocabRes] = await Promise.all([
        fetchCuratedLists(),
        fetchVocabularyItems(user.id),
      ]);

      const dueItems = await fetchDueItems(vocabRes.items);

      setCuratedLists(curated);
      setAllVocabulary(vocabRes.items);
      setTotalCount(vocabRes.count);
      setDueForReview(dueItems);
      setCurrentPage(1);
    } catch (error) {
      console.error('Load items error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [
    user?.id,
    setIsLoading,
    setCuratedLists,
    setAllVocabulary,
    setTotalCount,
    setDueForReview,
    setCurrentPage,
  ]);
}

function useVocabularyLoadMore({ user, state, hasMoreItems }) {
  const { setIsLoadingMore, setAllVocabulary, setCurrentPage, isLoadingMore, currentPage } = state;
  return useCallback(async () => {
    if (isLoadingMore || !hasMoreItems) return;
    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const result = await VocabularyItem.list(
        { user_id: user?.id },
        '-created_at',
        100,
        nextPage,
        ITEMS_PER_PAGE,
        VOCABULARY_LIST_FIELDS
      );

      if (result.data && result.data.length > 0) {
        setAllVocabulary((prev) => [...prev, ...result.data]);
        setCurrentPage(nextPage);
      }
    } catch (error) {
      console.error('Load more error:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    isLoadingMore,
    hasMoreItems,
    currentPage,
    user?.id,
    setIsLoadingMore,
    setAllVocabulary,
    setCurrentPage,
  ]);
}

export function useVocabularyData(user) {
  const state = useVocabularyState();

  const loadItems = useVocabularyLoadItems({
    user,
    state,
    allVocabularyLength: state.allVocabulary.length,
  });
  const stats = useMemo(() => calculateStats(state.allVocabulary), [state.allVocabulary]);
  const hasMoreItems = state.allVocabulary.length < state.totalCount;
  const handleLoadMore = useVocabularyLoadMore({ user, state, hasMoreItems });

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  return {
    allVocabulary: state.allVocabulary,
    setAllVocabulary: state.setAllVocabulary,
    dueForReview: state.dueForReview,
    setDueForReview: state.setDueForReview,
    isLoading: state.isLoading,
    curatedLists: state.curatedLists,
    stats,
    hasMoreItems,
    isLoadingMore: state.isLoadingMore,
    handleLoadMore,
    loadItems,
  };
}
