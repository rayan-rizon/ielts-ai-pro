import React from 'react';
import { Search, LayoutGrid, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';

export default function SpeakingFilters({
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  tabs,
}) {
  return (
    <div className="sticky top-4 z-40 px-1" data-oid="byc4r65">
      <div
        className="bg-white/80 dark:bg-[#0c0c0c]/80 backdrop-blur-3xl p-1 rounded-[1.5rem] md:rounded-[2rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] border border-slate-200/60 dark:border-white/10 flex flex-col lg:flex-row gap-2 lg:gap-4 items-center justify-between"
        data-oid="sqrqf27"
      >
        <div className="relative w-full lg:max-w-md group" data-oid=":27klze">
          <div
            className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none"
            data-oid=".j1xgc."
          >
            <Search
              className="h-5 w-5 text-slate-400 group-focus-within:text-rose-500 transition-all duration-300 group-focus-within:scale-110"
              data-oid="pjdla74"
            />
          </div>
          <Input
            placeholder="Find a speaking practice..."
            className="pl-14 h-10 md:h-12 bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-transparent focus-visible:ring-2 focus-visible:ring-rose-500/20 rounded-[1.3rem] md:rounded-[1.8rem] text-sm md:text-base font-medium placeholder:text-slate-400 transition-all group-hover:bg-slate-100 dark:group-hover:bg-white/[0.08]"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            data-oid="w7teu3z"
          />
        </div>

        <div
          className="flex items-center bg-white/60 dark:bg-white/5 backdrop-blur-xl p-1 rounded-xl gap-1.5 w-full lg:w-auto overflow-x-auto no-scrollbar border border-slate-200/50 dark:border-white/10 px-2 lg:p-1"
          data-oid="ql-ky:c"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-1.5 md:px-5 md:py-2 rounded-xl md:rounded-2xl text-[10px] md:text-sm font-bold transition-all duration-300 whitespace-nowrap shrink-0 lg:flex-none uppercase tracking-wider',
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-lg shadow-rose-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
              )}
              data-oid="g948a2q"
            >
              <tab.icon className="w-4 h-4" data-oid="i6rrr_d" />
              {tab.label}
            </button>
          ))}
        </div>

        <div
          className="hidden lg:flex items-center gap-4 px-6 border-l border-slate-200 dark:border-white/10 h-10"
          data-oid="qr:_z5g"
        >
          <div
            className="flex items-center gap-3 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer group/view"
            data-oid="e4fsof6"
          >
            <LayoutGrid
              className="w-5 h-5 group-hover/view:scale-110 transition-transform"
              data-oid="iheum.h"
            />

            <span className="text-xs font-black uppercase tracking-[0.1em]" data-oid="3mhqyd6">
              Grid
            </span>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-rose-500/20" data-oid="5uzb.uw" />
          <div
            className="flex items-center gap-3 text-slate-300 dark:text-slate-700 cursor-not-allowed"
            data-oid="8itbfh_"
          >
            <List className="w-5 h-5" data-oid="cwdw7j5" />
            <span className="text-xs font-black uppercase tracking-[0.1em]" data-oid="-o22g2y">
              List
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
