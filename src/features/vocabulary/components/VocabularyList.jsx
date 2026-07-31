import React, { useState, useMemo } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Empty, TILE } from '@/features/dashboard/components/primitives';
import { VocabularyTableRow } from './VocabularyTableRow';
import { VocabularyCardItem } from './VocabularyCardItem';
import { VocabularyControlBar } from './VocabularyControlBar';
import {
  computeCounts,
  matchesTabFilter,
  matchesCategory,
  matchesPos,
  sortWordList,
  isFilterActive,
} from './vocabularyUtils';

const VocabularyTableView = ({
  displayedWords,
  onViewWord,
  onToggleMastery,
  onDeleteWord,
  targetLanguage,
}) => (
  <div className={cn(TILE, 'custom-scrollbar overflow-x-auto')}>
    <table className="w-full min-w-[700px] border-collapse text-left text-xs">
      <thead className="border-b border-[#ebeaf7] bg-[#fbfbfe] text-[11px] font-black uppercase tracking-wider text-slate-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300">
        <tr>
          <th className="px-4 py-3.5">Term & Phonetics</th>
          <th className="px-3 py-3.5">POS</th>
          <th className="px-4 py-3.5">Meaning / Definition</th>
          <th className="px-3 py-3.5">Module</th>
          <th className="px-3 py-3.5 text-center">Memory Strength</th>
          <th className="px-4 py-3.5 text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        {displayedWords.map((item) => (
          <VocabularyTableRow
            key={item.id}
            item={item}
            onViewWord={onViewWord}
            onToggleMastery={onToggleMastery}
            onDeleteWord={onDeleteWord}
            targetLanguage={targetLanguage}
          />
        ))}

        {displayedWords.length === 0 && (
          <tr>
            <td colSpan="6" className="px-6 py-14">
              <Empty>No vocabulary words match your current search or filters.</Empty>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

const VocabularyCardGrid = ({ displayedWords, onViewWord, onToggleMastery, onDeleteWord }) => (
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {displayedWords.map((item) => (
      <VocabularyCardItem
        key={item.id}
        item={item}
        onViewWord={onViewWord}
        onToggleMastery={onToggleMastery}
        onDeleteWord={onDeleteWord}
      />
    ))}

    {displayedWords.length === 0 && (
      <div className={cn(TILE, 'col-span-full py-14')}>
        <Empty>No words match your current filters.</Empty>
      </div>
    )}
  </div>
);

const LoadMoreButton = ({ isLoadingMore, onLoadMore }) => (
  <div className="p-3 text-center">
    <Button
      variant="ghost"
      className="rounded-lg text-xs font-bold uppercase tracking-wider text-[#5a63df] hover:bg-[#5a63df]/10 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
      onClick={onLoadMore}
      disabled={isLoadingMore}
    >
      {isLoadingMore ? (
        'Loading...'
      ) : (
        <>
          Load More Words <ChevronRight className="ml-1 h-4 w-4" />
        </>
      )}
    </Button>
  </div>
);

export default function VocabularyList({
  filteredWords = [],
  hasMore,
  isLoadingMore,
  onViewWord,
  onToggleMastery,
  onDeleteWord,
  onLoadMore,
  targetLanguage,
}) {
  const [viewMode, setViewMode] = useState('table');
  const [activeTab, setActiveTab] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [posFilter, setPosFilter] = useState('all');
  const [sortOption, setSortOption] = useState('recent');

  const displayedWords = useMemo(() => {
    const filtered = filteredWords.filter((item) => {
      if (!item) return false;
      const mastery = item.mastery_level || 0;
      return (
        matchesTabFilter(mastery, activeTab) &&
        matchesCategory(item.source, categoryFilter) &&
        matchesPos(item, posFilter)
      );
    });
    return sortWordList(filtered, sortOption);
  }, [filteredWords, activeTab, categoryFilter, posFilter, sortOption]);

  const counts = useMemo(() => computeCounts(filteredWords), [filteredWords]);

  const hasActiveFilters = isFilterActive(categoryFilter, posFilter, sortOption);

  const resetFilters = () => {
    setCategoryFilter('all');
    setPosFilter('all');
    setSortOption('recent');
  };

  return (
    <div className="space-y-4">
      <VocabularyControlBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        sortOption={sortOption}
        setSortOption={setSortOption}
        hasActiveFilters={hasActiveFilters}
        resetFilters={resetFilters}
        viewMode={viewMode}
        setViewMode={setViewMode}
        counts={counts}
      />

      <AnimatePresence mode="wait">
        <m.div
          key={`${activeTab}-${categoryFilter}-${sortOption}-${viewMode}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          {viewMode === 'table' ? (
            <VocabularyTableView
              displayedWords={displayedWords}
              onViewWord={onViewWord}
              onToggleMastery={onToggleMastery}
              onDeleteWord={onDeleteWord}
              targetLanguage={targetLanguage}
            />
          ) : (
            <VocabularyCardGrid
              displayedWords={displayedWords}
              onViewWord={onViewWord}
              onToggleMastery={onToggleMastery}
              onDeleteWord={onDeleteWord}
            />
          )}
        </m.div>
      </AnimatePresence>

      {hasMore && <LoadMoreButton isLoadingMore={isLoadingMore} onLoadMore={onLoadMore} />}
    </div>
  );
}
