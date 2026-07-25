import React from 'react';
import { LayoutGrid, LayoutList } from 'lucide-react';
import { cn } from '@/lib/cn';

export const VocabularyControlBar = ({
  activeTab,
  setActiveTab,
  categoryFilter,
  setCategoryFilter,
  sortOption,
  setSortOption,
  hasActiveFilters,
  resetFilters,
  viewMode,
  setViewMode,
  counts,
}) => {
  const tabs = [
    { id: 'all', label: 'All Words', count: counts.total },
    { id: 'new', label: 'New', count: counts.newCount },
    { id: 'learning', label: 'Learning', count: counts.learning },
    { id: 'mastered', label: 'Mastered', count: counts.mastered },
  ];

  return (
    <div className="flex items-center justify-between gap-2 bg-slate-100/90 dark:bg-slate-900/90 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-2 flex-nowrap shrink-0">
        <div className="flex items-center gap-1.5 shrink-0">
          {tabs.map((tab) => (
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
  );
};
