import React from 'react';
import { motion } from 'framer-motion';
import {
  Layers,
  Sparkles,
  Brain,
  Award,
  Filter,
  ArrowUpDown,
  LayoutGrid,
  LayoutList,
} from 'lucide-react';
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
    { id: 'all', label: 'All', count: counts.total, icon: Layers },
    { id: 'new', label: 'New', count: counts.newCount, icon: Sparkles },
    { id: 'learning', label: 'Learning', count: counts.learning, icon: Brain },
    { id: 'mastered', label: 'Mastered', count: counts.mastered, icon: Award },
  ];

  return (
    <div className="flex items-center justify-between gap-2 bg-gradient-to-r from-white via-[#faf9ff] to-[#f4f2ff] dark:from-[#10131f] dark:to-[#10131f] px-1.5 py-1.5 rounded-[18px] border border-[#e0e4f1] dark:border-white/10 shadow-xs overflow-x-auto no-scrollbar">
      {/* Tabs */}
      <div className="flex items-center gap-1 shrink-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap',
                isActive
                  ? 'bg-[#5661e9] text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-white/10'
              )}
            >
              <Icon
                className={cn(
                  'w-3 h-3',
                  isActive ? 'text-white' : 'text-[#5862df] dark:text-indigo-400'
                )}
              />
              <span>{tab.label}</span>
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded-full text-[9px] font-black leading-none',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200/80 dark:bg-white/10 text-slate-700 dark:text-slate-300'
                )}
              >
                {tab.count}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-slate-200 dark:bg-white/10 shrink-0" />

      {/* Filters + View Switcher */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="relative flex items-center">
          <Filter className="w-3 h-3 absolute left-2.5 pointer-events-none text-[#5862df] dark:text-indigo-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-8 pl-7 pr-2 rounded-xl bg-white dark:bg-slate-900 border border-[#d8dcfa] dark:border-white/10 text-slate-800 dark:text-slate-200 text-[11px] font-bold focus:outline-none focus:border-[#5661e9] shadow-xs cursor-pointer appearance-none"
          >
            <option value="all">All Categories</option>
            <option value="academic">Academic</option>
            <option value="speaking">Speaking</option>
            <option value="writing">Writing</option>
            <option value="reading">Reading</option>
          </select>
        </div>

        <div className="relative flex items-center">
          <ArrowUpDown className="w-3 h-3 absolute left-2.5 pointer-events-none text-[#5862df] dark:text-indigo-400" />
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="h-8 pl-7 pr-2 rounded-xl bg-white dark:bg-slate-900 border border-[#d8dcfa] dark:border-white/10 text-slate-800 dark:text-slate-200 text-[11px] font-bold focus:outline-none focus:border-[#5661e9] shadow-xs cursor-pointer appearance-none"
          >
            <option value="recent">Recent</option>
            <option value="alphabetical">A → Z</option>
            <option value="reverse">Z → A</option>
            <option value="mastery">Mastery</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-[10px] font-extrabold text-rose-500 hover:text-rose-600 underline px-1 cursor-pointer transition-colors shrink-0"
          >
            Reset
          </button>
        )}

        {/* View switcher */}
        <div className="flex items-center gap-0.5 bg-white/80 dark:bg-white/5 p-0.5 rounded-xl border border-[#d8dcfa] dark:border-white/10 shrink-0 ml-0.5">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setViewMode('table')}
            className={cn(
              'p-1.5 rounded-lg transition-all flex items-center cursor-pointer',
              viewMode === 'table'
                ? 'bg-[#5661e9] text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            )}
            title="Table View"
          >
            <LayoutList className="w-3.5 h-3.5" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setViewMode('grid')}
            className={cn(
              'p-1.5 rounded-lg transition-all flex items-center cursor-pointer',
              viewMode === 'grid'
                ? 'bg-[#5661e9] text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            )}
            title="Cards View"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};
