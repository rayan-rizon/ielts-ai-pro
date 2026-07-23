import React from 'react';
import { cn } from '@/lib/cn';
import { Search, LayoutGrid, List, Clock, Award } from 'lucide-react';
import { Input } from '@/components/ui/input';

// ---------------------------------------------------------------------------
// Sticky filter bar: search + tabs + view-mode toggle
// ---------------------------------------------------------------------------

const TABS = [
  { id: 'all', label: 'All Tests', icon: LayoutGrid },
  { id: 'cambridge', label: 'Cambridge', icon: Award },
  { id: 'in-progress', label: 'In Progress', icon: Clock },
];

export default function ReadingFilters({
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  viewMode,
  onViewModeChange,
}) {
  return (
    <div
      className="flex flex-col lg:flex-row gap-3 items-center justify-between w-full"
      data-oid="xd1qy0_"
    >
      {/* Search box - Spacious & rounded */}
      <div className="relative w-full lg:w-[24rem] group" data-oid="5kw.jjs">
        <div
          className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"
          data-oid="use5357"
        >
          <Search
            className="h-4.5 w-4.5 text-slate-400 group-focus-within:text-blue-500 transition-all duration-300 group-focus-within:scale-110"
            data-oid="r-0-fs9"
          />
        </div>
        <Input
          placeholder="Find a test..."
          className="pl-11 pr-4 h-10 md:h-11 bg-white/90 dark:bg-white/5 border border-slate-200/90 dark:border-white/15 focus-visible:ring-2 focus-visible:ring-blue-500/25 rounded-full text-xs md:text-sm font-medium placeholder:text-slate-400 transition-all shadow-2xs group-hover:border-blue-400 dark:group-hover:border-white/30"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          data-oid=".fh_dnl"
        />
      </div>

      {/* Tabs with rounded-full pills */}
      <div
        className="flex items-center bg-white/70 dark:bg-white/5 backdrop-blur-xl p-0.5 rounded-full gap-0.5 w-full lg:w-auto overflow-x-auto no-scrollbar border border-slate-200/70 dark:border-white/10 px-1"
        data-oid="1:8gpt2"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 md:px-3.5 md:py-1.5 rounded-full text-xs font-black transition-all duration-200 whitespace-nowrap shrink-0 lg:flex-none uppercase tracking-wider hover:scale-105 active:scale-95 cursor-pointer',
              activeTab === tab.id
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
            )}
            data-oid="h1xq3rz"
          >
            <tab.icon
              className={cn(
                'w-3.5 h-3.5 transition-transform',
                activeTab === tab.id && 'scale-110'
              )}
              data-oid="ya.z1d1"
            />
            {tab.label}
          </button>
        ))}
      </div>

      {/* View mode toggle */}
      <div
        className="hidden lg:flex items-center gap-3.5 px-4 border-l border-slate-200/80 dark:border-white/10 h-9"
        data-oid="01zsb50"
      >
        <button
          onClick={() => onViewModeChange('grid')}
          className={cn(
            'flex items-center gap-2 transition-colors cursor-pointer group/view bg-transparent border-0 p-0',
            viewMode === 'grid' ? 'text-blue-500 font-black' : 'text-slate-400 hover:text-blue-500'
          )}
          data-oid="sz4h8ye"
        >
          <LayoutGrid
            className="w-4.5 h-4.5 group-hover/view:scale-110 transition-transform"
            data-oid="j1di5cd"
          />
          <span className="text-xs font-black uppercase tracking-[0.1em]" data-oid="b2eu3g3">
            Grid
          </span>
        </button>
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500/20" data-oid="7njz_rt" />
        <button
          onClick={() => onViewModeChange('list')}
          className={cn(
            'flex items-center gap-2 transition-colors cursor-pointer group/view bg-transparent border-0 p-0',
            viewMode === 'list' ? 'text-blue-500 font-black' : 'text-slate-400 hover:text-blue-500'
          )}
          data-oid="wickpbq"
        >
          <List
            className="w-4.5 h-4.5 group-hover/view:scale-110 transition-transform"
            data-oid="j1di5cd_2"
          />
          <span className="text-xs font-black uppercase tracking-[0.1em]" data-oid="b2eu3g3_2">
            Volumes
          </span>
        </button>
      </div>
    </div>
  );
}
