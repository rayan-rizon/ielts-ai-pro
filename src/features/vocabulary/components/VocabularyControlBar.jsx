import React from 'react';
import { m } from 'framer-motion';
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
import { TILE } from '@/features/dashboard/components/primitives';

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
    <div
      className={cn(
        TILE,
        'flex flex-col gap-2.5 p-2.5 lg:flex-row lg:items-center lg:justify-between'
      )}
    >
      <div className="no-scrollbar flex min-w-0 max-w-full flex-1 items-center gap-1.5 overflow-x-auto scroll-smooth py-0.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <m.button
              key={tab.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative z-10 flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider transition-colors duration-200',
                isActive
                  ? 'text-white'
                  : 'text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
              )}
            >
              {isActive && (
                <m.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 -z-10 rounded-lg bg-[#5a63df]"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}
              <Icon
                className={cn(
                  'relative z-10 h-3.5 w-3.5 transition-colors',
                  isActive ? 'text-white' : 'text-[#5a63df] dark:text-indigo-400'
                )}
              />
              <span className="relative z-10">{tab.label}</span>
              <span
                className={cn(
                  'relative z-10 rounded-full px-2 py-0.5 text-[9.5px] font-black leading-none transition-colors',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200/80 text-slate-700 dark:bg-white/10 dark:text-slate-300'
                )}
              >
                {tab.count}
              </span>
            </m.button>
          );
        })}
      </div>

      <div className="flex w-full flex-wrap items-center justify-between gap-2 border-t border-[#eeedf7] pt-2 dark:border-white/[0.07] lg:w-auto lg:justify-end lg:border-t-0 lg:pt-0">
        <div className="flex flex-1 items-center gap-1.5 sm:flex-none">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-8.5 w-auto min-w-[130px] flex-1 shrink-0 gap-1.5 rounded-lg border border-[#e2e5f2] bg-white px-2.5 text-xs font-bold text-slate-800 transition-all hover:border-[#c9cdf3] dark:border-white/10 dark:bg-[#131315] dark:text-slate-200 sm:w-[140px] sm:flex-none">
              <Filter className="h-3.5 w-3.5 shrink-0 text-[#5a63df]" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="rounded-lg border border-[#e2e5f2] bg-white p-1 shadow-lg dark:border-white/10 dark:bg-[#131315]">
              <SelectItem value="all" className="rounded-md text-xs font-semibold">
                All Categories
              </SelectItem>
              <SelectItem value="academic" className="rounded-md text-xs font-semibold">
                Academic
              </SelectItem>
              <SelectItem value="speaking" className="rounded-md text-xs font-semibold">
                Speaking
              </SelectItem>
              <SelectItem value="writing" className="rounded-md text-xs font-semibold">
                Writing
              </SelectItem>
              <SelectItem value="reading" className="rounded-md text-xs font-semibold">
                Reading
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortOption} onValueChange={setSortOption}>
            <SelectTrigger className="h-8.5 w-auto min-w-[110px] flex-1 shrink-0 gap-1.5 rounded-lg border border-[#e2e5f2] bg-white px-2.5 text-xs font-bold text-slate-800 transition-all hover:border-[#c9cdf3] dark:border-white/10 dark:bg-[#131315] dark:text-slate-200 sm:w-[120px] sm:flex-none">
              <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-[#5a63df]" />
              <SelectValue placeholder="Recent" />
            </SelectTrigger>
            <SelectContent className="rounded-lg border border-[#e2e5f2] bg-white p-1 shadow-lg dark:border-white/10 dark:bg-[#131315]">
              <SelectItem value="recent" className="rounded-md text-xs font-semibold">
                Recent
              </SelectItem>
              <SelectItem value="alphabetical" className="rounded-md text-xs font-semibold">
                A → Z
              </SelectItem>
              <SelectItem value="reverse" className="rounded-md text-xs font-semibold">
                Z → A
              </SelectItem>
              <SelectItem value="mastery" className="rounded-md text-xs font-semibold">
                Mastery
              </SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="shrink-0 rounded-lg px-2 py-1 text-xs font-extrabold text-[rgb(var(--signal-fault))] transition-colors hover:bg-[rgba(var(--signal-fault),0.08)]"
            >
              Reset
            </button>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-[#e2e5f2] bg-white p-0.5 dark:border-white/10 dark:bg-white/4">
          <m.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setViewMode('table')}
            className={cn(
              'relative z-10 flex items-center rounded-md p-1.5 transition-colors duration-200',
              viewMode === 'table'
                ? 'text-white'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            )}
            title="Table View"
          >
            {viewMode === 'table' && (
              <m.div
                layoutId="vocabViewToggleIndicator"
                className="absolute inset-0 -z-10 rounded-md bg-[#5a63df] shadow-sm"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              />
            )}
            <LayoutList className="relative z-10 h-3.5 w-3.5" />
          </m.button>
          <m.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setViewMode('grid')}
            className={cn(
              'relative z-10 flex items-center rounded-md p-1.5 transition-colors duration-200',
              viewMode === 'grid'
                ? 'text-white'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            )}
            title="Cards View"
          >
            {viewMode === 'grid' && (
              <m.div
                layoutId="vocabViewToggleIndicator"
                className="absolute inset-0 -z-10 rounded-md bg-[#5a63df] shadow-sm"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              />
            )}
            <LayoutGrid className="relative z-10 h-3.5 w-3.5" />
          </m.button>
        </div>
      </div>
    </div>
  );
};
