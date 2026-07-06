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
    <div className="sticky top-4 z-40 px-1" data-oid="-grkhau">
      <div
        className="bg-white/80 dark:bg-[#0c0c0c]/80 backdrop-blur-3xl p-1 rounded-[1.5rem] md:rounded-[2rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] border border-slate-200/60 dark:border-white/10 flex flex-col lg:flex-row gap-2 lg:gap-4 items-center justify-between"
        data-oid="xd1qy0_"
      >
        {/* Search */}
        <div className="relative w-full lg:w-96 group" data-oid="5kw.jjs">
          <div
            className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none"
            data-oid="use5357"
          >
            <Search
              className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-all duration-300 group-focus-within:scale-110"
              data-oid="r-0-fs9"
            />
          </div>
          <Input
            placeholder="Find a test..."
            className="pl-14 h-10 md:h-12 bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-transparent focus-visible:ring-2 focus-visible:ring-blue-500/20 rounded-[1.3rem] md:rounded-[1.8rem] text-sm md:text-base font-medium placeholder:text-slate-400 transition-all group-hover:bg-slate-100 dark:group-hover:bg-white/[0.08]"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            data-oid=".fh_dnl"
          />
        </div>

        {/* Tabs */}
        <div
          className="flex items-center bg-white/60 dark:bg-white/5 backdrop-blur-xl p-1 rounded-xl gap-1.5 w-full lg:w-auto overflow-x-auto no-scrollbar border border-slate-200/50 dark:border-white/10 px-2 lg:p-1"
          data-oid="1:8gpt2"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-1.5 md:px-5 md:py-2 rounded-xl md:rounded-2xl text-[10px] md:text-sm font-bold transition-all duration-300 whitespace-nowrap shrink-0 lg:flex-none uppercase tracking-wider',
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
              )}
              data-oid="h1xq3rz"
            >
              <tab.icon className="w-4 h-4" data-oid="ya.z1d1" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* View mode toggle */}
        <div
          className="hidden lg:flex items-center gap-4 px-6 border-l border-slate-200 dark:border-white/10 h-10"
          data-oid="01zsb50"
        >
          <button
            onClick={() => onViewModeChange('grid')}
            className={cn(
              'flex items-center gap-3 transition-colors cursor-pointer group/view bg-transparent border-0 p-0',
              viewMode === 'grid' ? 'text-blue-500' : 'text-slate-400 hover:text-blue-500'
            )}
            data-oid="sz4h8ye"
          >
            <LayoutGrid
              className="w-5 h-5 group-hover/view:scale-110 transition-transform"
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
              'flex items-center gap-3 transition-colors cursor-pointer group/view bg-transparent border-0 p-0',
              viewMode === 'list' ? 'text-blue-500' : 'text-slate-400 hover:text-blue-500'
            )}
            data-oid="wickpbq"
          >
            <List
              className="w-5 h-5 group-hover/view:scale-110 transition-transform"
              data-oid="2t:8lmq"
            />
            <span className="text-xs font-black uppercase tracking-[0.1em]" data-oid="cxwazf-">
              List
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
