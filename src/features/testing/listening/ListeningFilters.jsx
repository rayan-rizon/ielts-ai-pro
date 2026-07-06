import React from 'react';
import { cn } from '@/lib/cn';
import { Search, LayoutGrid, List, Award, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';

const TABS = [
  { id: 'all', label: 'All Tests', icon: LayoutGrid },
  { id: 'cambridge', label: 'Cambridge', icon: Award },
  { id: 'in-progress', label: 'In Progress', icon: Clock },
];

/**
 * Sticky filter/search bar for the Listening page.
 */
export default function ListeningFilters({
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  viewMode,
  onViewModeChange,
}) {
  return (
    <div className="sticky top-4 z-40 px-1">
      <div className="bg-white/80 dark:bg-[#0c0c0c]/80 backdrop-blur-3xl p-1 rounded-[1.5rem] md:rounded-[2rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] border border-slate-200/60 dark:border-white/10 flex flex-col lg:flex-row gap-2 lg:gap-4 items-center justify-between">
        {/* Search input */}
        <div className="relative w-full lg:w-96 group">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-purple-500 transition-all duration-300 group-focus-within:scale-110" />
          </div>
          <Input
            placeholder="Find a test..."
            className="pl-14 h-10 md:h-12 bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-transparent focus-visible:ring-2 focus-visible:ring-purple-500/20 rounded-[1.3rem] md:rounded-[1.8rem] text-sm md:text-base font-medium placeholder:text-slate-400 transition-all group-hover:bg-slate-100 dark:group-hover:bg-white/[0.08]"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Tab buttons */}
        <div className="flex items-center bg-white/60 dark:bg-white/5 backdrop-blur-xl p-1 rounded-xl gap-1.5 w-full lg:w-auto overflow-x-auto no-scrollbar border border-slate-200/50 dark:border-white/10 px-2 lg:p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-1.5 md:px-5 md:py-2 rounded-xl md:rounded-2xl text-[10px] md:text-sm font-bold transition-all duration-300 whitespace-nowrap shrink-0 lg:flex-none uppercase tracking-wider',
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* View toggle (Grid / Volumes) */}
        <div className="hidden lg:flex items-center gap-4 px-6 border-l border-slate-200 dark:border-white/10 h-10">
          <button
            onClick={() => onViewModeChange('grid')}
            className={cn(
              'flex items-center gap-3 transition-colors group/view',
              viewMode === 'grid'
                ? 'text-purple-500 font-black cursor-default'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer'
            )}
          >
            <LayoutGrid className="w-5 h-5 group-hover/view:scale-110 transition-transform" />
            <span className="text-xs font-black uppercase tracking-[0.1em]">Grid</span>
          </button>
          <div
            className={cn(
              'w-1.5 h-1.5 rounded-full transition-colors',
              viewMode === 'grid' ? 'bg-purple-500/20' : 'bg-indigo-500/20'
            )}
          />
          <button
            onClick={() => onViewModeChange('volumes')}
            className={cn(
              'flex items-center gap-3 transition-colors group/view',
              viewMode === 'volumes'
                ? 'text-indigo-500 font-black cursor-default'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer'
            )}
          >
            <List className="w-5 h-5 group-hover/view:scale-110 transition-transform" />
            <span className="text-xs font-black uppercase tracking-[0.1em]">Volumes</span>
          </button>
        </div>
      </div>
    </div>
  );
}
