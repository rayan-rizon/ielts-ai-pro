import React, { memo, useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Star,
  Trash2,
  ChevronRight,
  Languages,
  Volume2,
  LayoutGrid,
  LayoutList,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { motion } from 'framer-motion';
import {
  translateText,
  getCachedTranslation,
} from '@/features/vocabulary/services/translateService';
import { playPronunciation } from '../utils/audioUtils';

const getPartOfSpeech = (item) => {
  if (item.pos || item.part_of_speech) return item.pos || item.part_of_speech;
  const def = (item.definition || '').toLowerCase();
  if (def.startsWith('a ') || def.startsWith('an ') || def.startsWith('the ')) return 'n.';
  if (def.includes('quality of') || def.includes('relating to') || def.includes('having'))
    return 'adj.';
  if (def.startsWith('to ') || def.includes('action of')) return 'v.';
  return 'word';
};

const getMemoryStrength = (masteryLevel = 0) => {
  if (masteryLevel >= 4)
    return {
      label: 'Mastered',
      percent: 85,
      color: 'bg-emerald-500',
      badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    };
  if (masteryLevel >= 2)
    return {
      label: 'Learning',
      percent: 55,
      color: 'bg-amber-500',
      badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    };
  return {
    label: 'New',
    percent: 30,
    color: 'bg-indigo-500',
    badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  };
};

const VocabularyTableRow = memo(
  ({ item, onViewWord, onToggleMastery, onDeleteWord, targetLanguage }) => {
    const [translatedDef, setTranslatedDef] = useState('');
    const [isTranslating, setIsTranslating] = useState(false);
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);

    useEffect(() => {
      const translateDefinition = async () => {
        if (!targetLanguage || targetLanguage === 'en') {
          setTranslatedDef('');
          return;
        }

        const cached = getCachedTranslation(item.definition || '', targetLanguage, 'en');
        if (cached) {
          setTranslatedDef(cached);
          return;
        }

        setIsTranslating(true);
        try {
          const translated = await translateText(item.definition || '', targetLanguage, 'en');
          setTranslatedDef(translated);
        } catch {
          setTranslatedDef('');
        } finally {
          setIsTranslating(false);
        }
      };

      translateDefinition();
    }, [item.definition, targetLanguage]);

    const handleSpeak = (e) => {
      e.stopPropagation();
      setIsPlayingAudio(true);
      playPronunciation(item.word).finally(() => setIsPlayingAudio(false));
    };

    const pos = getPartOfSpeech(item);
    const memory = getMemoryStrength(item.mastery_level || 0);

    return (
      <tr className="hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors border-b border-slate-200/60 dark:border-slate-800">
        {/* Word + IPA + Audio */}
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleSpeak}
              className={cn(
                'p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors flex-shrink-0',
                isPlayingAudio && 'text-indigo-600 animate-pulse bg-indigo-50'
              )}
              title="Listen audio pronunciation"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span
                className="font-black text-slate-900 dark:text-white cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm sm:text-base italic"
                onClick={() => onViewWord(item)}
              >
                {item.word}
              </span>
              <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300">
                {item.ipa || `/${item.word}/`}
              </span>
            </div>
          </div>
        </td>

        {/* Part of Speech */}
        <td className="px-3 py-3.5">
          <Badge
            variant="outline"
            className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 rounded-lg px-2 py-0.5 text-xs font-bold"
          >
            {pos}
          </Badge>
        </td>

        {/* Meaning / Definition */}
        <td className="px-4 py-3.5">
          <div className="space-y-1 max-w-lg">
            <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
              {item.definition}
            </p>
            {targetLanguage && targetLanguage !== 'en' && (
              <div className="flex items-center gap-1.5 pt-0.5">
                <Languages className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                {isTranslating ? (
                  <span className="text-xs text-indigo-400 italic animate-pulse">
                    Translating...
                  </span>
                ) : translatedDef ? (
                  <span className="text-xs text-indigo-700 dark:text-indigo-300 font-semibold bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md line-clamp-1">
                    {translatedDef}
                  </span>
                ) : null}
              </div>
            )}
          </div>
        </td>

        {/* Module Category */}
        <td className="px-3 py-3.5">
          <Badge
            variant="outline"
            className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 text-xs font-bold px-2.5 py-0.5"
          >
            {item.source || 'Academic'}
          </Badge>
        </td>

        {/* Memory Strength Meter */}
        <td className="px-3 py-3.5">
          <div className="flex flex-col items-center gap-1 w-24 mx-auto">
            <div className="flex items-center justify-between w-full text-[10px] font-bold text-slate-700 dark:text-slate-300">
              <span>{memory.label}</span>
              <span>{memory.percent}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', memory.color)}
                style={{ width: `${memory.percent}%` }}
              />
            </div>
          </div>
        </td>

        {/* Actions */}
        <td className="px-4 py-3.5 text-right">
          <div className="flex items-center justify-end gap-1">
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                'h-8 w-8 rounded-lg transition-all',
                (item.mastery_level || 0) >= 4
                  ? 'text-amber-500 hover:bg-amber-500/10'
                  : 'text-slate-400 hover:text-amber-500'
              )}
              onClick={(e) => {
                e.stopPropagation();
                onToggleMastery(item.id, item.mastery_level || 0);
              }}
              title="Toggle Favorite/Mastery"
            >
              <Star className={cn('w-4 h-4', (item.mastery_level || 0) >= 4 && 'fill-current')} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-lg text-slate-500 hover:text-indigo-600"
              onClick={() => onViewWord(item)}
              title="View Detail"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-lg text-slate-400 hover:text-rose-500"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteWord(item.id);
              }}
              title="Delete Word"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </td>
      </tr>
    );
  }
);
VocabularyTableRow.displayName = 'VocabularyTableRow';

const VocabularyCardItem = memo(({ item, onViewWord, onToggleMastery, onDeleteWord }) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const memory = getMemoryStrength(item.mastery_level || 0);

  const handleSpeak = (e) => {
    e.stopPropagation();
    setIsPlayingAudio(true);
    playPronunciation(item.word).finally(() => setIsPlayingAudio(false));
  };

  const pos = getPartOfSpeech(item);
  const isMastered = (item.mastery_level || 0) >= 4;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-sm hover:border-[#635BFF] dark:hover:border-indigo-700 transition-all duration-200 flex flex-col justify-between space-y-3 group relative overflow-hidden cursor-pointer"
      onClick={() => onViewWord(item)}
    >
      <div className="space-y-2.5">
        {/* Top Header: Word, Audio, Star & Delete */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h4 className="font-black text-slate-900 dark:text-white text-base group-hover:text-[#635BFF] dark:group-hover:text-indigo-400 transition-colors tracking-tight">
                {item.word}
              </h4>
              <button
                onClick={handleSpeak}
                className={cn(
                  'p-1 rounded-lg text-slate-400 hover:text-[#635BFF] dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer',
                  isPlayingAudio && 'text-[#635BFF] animate-pulse bg-indigo-50'
                )}
                title="Listen audio pronunciation"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-400">
                {item.ipa || `/${item.word}/`}
              </span>
              <Badge
                variant="outline"
                className="bg-indigo-50/80 dark:bg-indigo-950/60 text-[#635BFF] dark:text-indigo-300 border-none rounded-md px-2 py-0 text-[10px] font-black uppercase tracking-wider"
              >
                {pos}
              </Badge>
            </div>
          </div>

          {/* Action Control Icons */}
          <div className="flex items-center gap-0.5 shrink-0">
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                'h-7.5 w-7.5 rounded-xl transition-all cursor-pointer',
                isMastered
                  ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                  : 'text-slate-300 hover:text-amber-500 hover:bg-amber-50'
              )}
              onClick={(e) => {
                e.stopPropagation();
                onToggleMastery(item.id, item.mastery_level || 0);
              }}
              title={isMastered ? 'Mastered' : 'Mark as mastered'}
            >
              <Star className={cn('w-3.5 h-3.5', isMastered && 'fill-current text-amber-500')} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7.5 w-7.5 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteWord(item.id);
              }}
              title="Delete Word"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Word Definition */}
        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium line-clamp-2 leading-relaxed">
          {item.definition}
        </p>
      </div>

      {/* Footer: Category & Memory Strength Progress Bar */}
      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 mt-1">
        <div className="flex items-center justify-between text-[10px] font-bold">
          <Badge
            variant="outline"
            className="text-[9px] font-bold text-slate-500 dark:text-slate-400 border-slate-200/90 dark:border-slate-800 px-2 py-0.5 rounded-md"
          >
            {item.source || 'Academic'}
          </Badge>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
              {memory.label}
            </span>
            <span className="text-[11px] font-black text-slate-900 dark:text-white">
              {memory.percent}%
            </span>
          </div>
        </div>

        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-[#635BFF] transition-all duration-500"
            style={{ width: `${memory.percent}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
});
VocabularyCardItem.displayName = 'VocabularyCardItem';

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
    let list = filteredWords.filter((item) => {
      if (!item) return false;
      const mastery = item.mastery_level || 0;
      if (activeTab === 'mastered' && mastery < 4) return false;
      if (activeTab === 'learning' && (mastery === 0 || mastery >= 4)) return false;
      if (activeTab === 'new' && mastery > 0) return false;

      // Category filter
      if (categoryFilter !== 'all') {
        const itemCat = (item.source || 'Academic').toLowerCase();
        if (itemCat !== categoryFilter.toLowerCase()) return false;
      }

      // POS filter
      if (posFilter !== 'all') {
        const itemPos = getPartOfSpeech(item).toLowerCase();
        if (itemPos !== posFilter.toLowerCase()) return false;
      }

      return true;
    });

    // Sorting logic
    if (sortOption === 'alphabetical') {
      list = [...list].sort((a, b) => (a.word || '').localeCompare(b.word || ''));
    } else if (sortOption === 'reverse') {
      list = [...list].sort((a, b) => (b.word || '').localeCompare(a.word || ''));
    } else if (sortOption === 'mastery') {
      list = [...list].sort((a, b) => (b.mastery_level || 0) - (a.mastery_level || 0));
    }

    return list;
  }, [filteredWords, activeTab, categoryFilter, posFilter, sortOption]);

  const counts = useMemo(() => {
    const total = filteredWords.length;
    const mastered = filteredWords.filter((w) => (w?.mastery_level || 0) >= 4).length;
    const learning = filteredWords.filter(
      (w) => (w?.mastery_level || 0) > 0 && (w?.mastery_level || 0) < 4
    ).length;
    const newCount = filteredWords.filter((w) => (w?.mastery_level || 0) === 0).length;
    return { total, mastered, learning, newCount };
  }, [filteredWords]);

  const hasActiveFilters =
    categoryFilter !== 'all' ||
    posFilter !== 'all' ||
    sortOption !== 'recent' ||
    activeTab !== 'all';

  const resetFilters = () => {
    setActiveTab('all');
    setCategoryFilter('all');
    setPosFilter('all');
    setSortOption('recent');
  };

  return (
    <div className="space-y-4">
      {/* Unified Single Line Control Bar */}
      <div className="flex items-center justify-between gap-2 bg-slate-100/90 dark:bg-slate-900/90 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-x-auto no-scrollbar">
        {/* Left Side: Status Tabs + Filters in 1 single horizontal row */}
        <div className="flex items-center gap-2 flex-nowrap shrink-0">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 shrink-0">
            {[
              { id: 'all', label: 'All Words', count: counts.total },
              { id: 'new', label: 'New', count: counts.newCount },
              { id: 'learning', label: 'Learning', count: counts.learning },
              { id: 'mastered', label: 'Mastered', count: counts.mastered },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 shrink-0 cursor-pointer',
                  activeTab === tab.id
                    ? 'bg-[#635BFF] text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'px-1.5 py-0.2 rounded-full text-[10px] font-black',
                    activeTab === tab.id
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  )}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-0.5 shrink-0" />

          {/* Integrated Filter Selects */}
          <div className="flex items-center gap-1.5 flex-nowrap shrink-0">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-8 px-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold focus:outline-none focus:border-[#635BFF] shadow-2xs cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="academic">Academic</option>
              <option value="speaking">Speaking</option>
              <option value="writing">Writing</option>
              <option value="reading">Reading</option>
            </select>

            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="h-8 px-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold focus:outline-none focus:border-[#635BFF] shadow-2xs cursor-pointer"
            >
              <option value="recent">Sort: Recent</option>
              <option value="alphabetical">Sort: A to Z</option>
              <option value="reverse">Sort: Z to A</option>
              <option value="mastery">Sort: Mastery</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-[11px] font-extrabold text-rose-500 hover:text-rose-600 underline px-1 py-1 cursor-pointer transition-colors shrink-0"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Right Side: View Mode Toggle (Table / Cards) */}
        <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setViewMode('table')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0',
              viewMode === 'table'
                ? 'bg-white dark:bg-slate-900 text-[#635BFF] dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            )}
            title="Switch to Table View"
          >
            <LayoutList className="w-3.5 h-3.5" /> Table
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0',
              viewMode === 'grid'
                ? 'bg-white dark:bg-slate-900 text-[#635BFF] dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            )}
            title="Switch to Cards View"
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Cards
          </button>
        </div>
      </div>

      {/* Content Rendering: Table or Grid Cards */}
      {viewMode === 'table' ? (
        <div className="overflow-x-auto custom-scrollbar rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <table className="w-full text-xs text-left border-collapse min-w-[700px]">
            <thead className="text-[11px] text-slate-700 dark:text-slate-300 font-black uppercase tracking-wider bg-slate-50/90 dark:bg-slate-950 border-b border-slate-200/80 dark:border-slate-800">
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
                  <td colSpan="6" className="px-6 py-14 text-center text-slate-500 font-bold">
                    No vocabulary words match your current search or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <div className="col-span-full py-14 text-center text-slate-500 font-bold bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              No words match your current filters.
            </div>
          )}
        </div>
      )}

      {hasMore && (
        <div className="p-3 text-center">
          <Button
            variant="ghost"
            className="text-[#635BFF] dark:text-indigo-400 font-black text-xs uppercase tracking-wider hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl"
            onClick={onLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              'Loading...'
            ) : (
              <>
                Load More Words <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
