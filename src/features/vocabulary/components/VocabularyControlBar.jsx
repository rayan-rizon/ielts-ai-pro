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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-gradient-to-r from-white via-[#faf9ff] to-[#f4f2ff] dark:from-[#10131f] dark:to-[#10131f] p-2 rounded-[20px] border border-[#e0e4f1] dark:border-white/10 shadow-xs">
      {/* Tabs: Horizontally Scrollable */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth flex-1 min-w-0 max-w-full py-0.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative px-3.5 py-1.5 rounded-xl text-[11px] font-extrabold uppercase tracking-wider transition-colors duration-200 flex items-center gap-2 shrink-0 cursor-pointer whitespace-nowrap z-10',
                isActive
                  ? 'text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-[#5661e9] rounded-xl shadow-md shadow-indigo-500/20 -z-10"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}
              <Icon
                className={cn(
                  'w-3.5 h-3.5 relative z-10 transition-colors',
                  isActive ? 'text-white' : 'text-[#5862df] dark:text-indigo-400'
                )}
              />
              <span className="relative z-10">{tab.label}</span>
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-[9.5px] font-black leading-none relative z-10 transition-colors',
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

      {/* Filters + View Switcher */}
      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 border-t sm:border-t-0 border-slate-200/60 dark:border-slate-800 pt-2 sm:pt-0">
        <div className="flex items-center gap-1.5">
          {/* Category Filter */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-8.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-[#d8dcfa] dark:border-white/10 text-slate-800 dark:text-slate-200 text-xs font-bold shadow-xs hover:border-[#5661e9] transition-all flex items-center gap-1.5 cursor-pointer">
              <Filter className="w-3.5 h-3.5 text-[#5862df] dark:text-indigo-400 shrink-0" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shadow-lg">
              <SelectItem value="all" className="font-semibold text-xs rounded-lg cursor-pointer">
                All Categories
              </SelectItem>
              <SelectItem
                value="academic"
                className="font-semibold text-xs rounded-lg cursor-pointer"
              >
                Academic
              </SelectItem>
              <SelectItem
                value="speaking"
                className="font-semibold text-xs rounded-lg cursor-pointer"
              >
                Speaking
              </SelectItem>
              <SelectItem
                value="writing"
                className="font-semibold text-xs rounded-lg cursor-pointer"
              >
                Writing
              </SelectItem>
              <SelectItem
                value="reading"
                className="font-semibold text-xs rounded-lg cursor-pointer"
              >
                Reading
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Filter */}
          <Select value={sortOption} onValueChange={setSortOption}>
            <SelectTrigger className="h-8.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-[#d8dcfa] dark:border-white/10 text-slate-800 dark:text-slate-200 text-xs font-bold shadow-xs hover:border-[#5661e9] transition-all flex items-center gap-1.5 cursor-pointer">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#5862df] dark:text-indigo-400 shrink-0" />
              <SelectValue placeholder="Recent" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shadow-lg">
              <SelectItem
                value="recent"
                className="font-semibold text-xs rounded-lg cursor-pointer"
              >
                Recent
              </SelectItem>
              <SelectItem
                value="alphabetical"
                className="font-semibold text-xs rounded-lg cursor-pointer"
              >
                A → Z
              </SelectItem>
              <SelectItem
                value="reverse"
                className="font-semibold text-xs rounded-lg cursor-pointer"
              >
                Z → A
              </SelectItem>
              <SelectItem
                value="mastery"
                className="font-semibold text-xs rounded-lg cursor-pointer"
              >
                Mastery
              </SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs font-extrabold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2 py-1 rounded-lg cursor-pointer transition-colors shrink-0"
            >
              Reset
            </button>
          )}
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-0.5 bg-white/80 dark:bg-white/5 p-0.5 rounded-xl border border-[#d8dcfa] dark:border-white/10 shrink-0">
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
