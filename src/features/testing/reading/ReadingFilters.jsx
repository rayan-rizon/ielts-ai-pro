import React from 'react';
import { cn } from '@/lib/cn';
import { Search, LayoutGrid, List, Clock, Award } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';

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
    <div className="flex flex-col lg:flex-row gap-3 items-center justify-between w-full">
      {/* Search box - Spacious & rounded */}
      <div className="relative w-full lg:w-[22rem] group">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-400 group-focus-within:text-[#5661e9] transition-all duration-300 group-focus-within:scale-110" />
        </div>
        <Input
          placeholder="Find a reading passage..."
          className="pl-10 pr-4 h-10 bg-white/90 dark:bg-white/5 border border-slate-200/90 dark:border-white/15 focus-visible:ring-2 focus-visible:ring-[#5661e9]/20 rounded-full text-xs md:text-sm font-medium placeholder:text-slate-400 transition-all shadow-2xs group-hover:border-[#6570ee]/40 dark:group-hover:border-white/30"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Tabs with Framer Motion Sliding Pill */}
      <div className="flex items-center bg-white/80 dark:bg-white/5 backdrop-blur-xl p-1 rounded-full gap-1 w-full lg:w-auto overflow-x-auto no-scrollbar border border-slate-200/80 dark:border-white/10 shadow-xs">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'relative flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black transition-colors whitespace-nowrap shrink-0 uppercase tracking-wider cursor-pointer z-10 select-none',
                isActive
                  ? 'text-white font-extrabold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="readingTabIndicator"
                  className="absolute inset-0 bg-[#5661e9] rounded-full shadow-md shadow-[#5661e9]/25 -z-10"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}
              <Icon
                className={cn(
                  'w-3.5 h-3.5 transition-transform duration-200',
                  isActive && 'scale-110'
                )}
              />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* View mode toggle */}
      <div className="hidden lg:flex items-center gap-1 bg-white/80 dark:bg-white/5 p-1 rounded-full border border-slate-200/80 dark:border-white/10 shadow-xs">
        <button
          onClick={() => onViewModeChange('grid')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer',
            viewMode === 'grid'
              ? 'bg-[#5661e9] text-white shadow-xs font-extrabold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          )}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Grid</span>
        </button>
        <button
          onClick={() => onViewModeChange('list')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer',
            viewMode === 'list'
              ? 'bg-[#5661e9] text-white shadow-xs font-extrabold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          )}
        >
          <List className="w-3.5 h-3.5" />
          <span>Volumes</span>
        </button>
      </div>
    </div>
  );
}
