import React from 'react';
import { m } from 'framer-motion';
import { cn } from '@/lib/cn';
import { LayoutGrid, List, Search, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { MUTED, Pill, TILE } from '@/features/dashboard/components/primitives';

function SpeakingControls({
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  tabs,
  viewMode,
  onViewModeChange,
}) {
  return (
    <div
      className={cn(
        TILE,
        'flex flex-col gap-2.5 p-2.5 lg:flex-row lg:items-center lg:justify-between'
      )}
    >
      <div className="group relative w-full lg:max-w-xs">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#5a63df]" />
        <Input
          placeholder="Find a speaking practice..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-9 rounded-lg border-[#e2e5f2] bg-white pl-9 text-xs font-semibold dark:border-white/10 dark:bg-[#131218]"
        />
      </div>

      <div className="no-scrollbar flex flex-1 items-center gap-1 overflow-x-auto rounded-lg border border-[#e2e5f2] bg-white p-0.5 dark:border-white/10 dark:bg-white/[0.04] lg:flex-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <m.button
              key={tab.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'relative z-10 flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wider transition-colors duration-200',
                isActive
                  ? 'text-white'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white'
              )}
            >
              {isActive && (
                <m.div
                  layoutId="speakingTabIndicator"
                  className="absolute inset-0 -z-10 rounded-md bg-[#5a63df]"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}
              <Icon className="relative z-10 h-3.5 w-3.5 shrink-0" />
              <span className="relative z-10">{tab.label}</span>
            </m.button>
          );
        })}
      </div>

      <div className="hidden shrink-0 items-center gap-0.5 rounded-lg border border-[#e2e5f2] bg-white p-0.5 dark:border-white/10 dark:bg-white/[0.04] lg:flex">
        <button
          type="button"
          onClick={() => onViewModeChange('grid')}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wider transition-all',
            viewMode === 'grid'
              ? 'bg-[#5a63df] text-white'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          )}
        >
          <LayoutGrid className="h-3.5 w-3.5" /> Grid
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange('volumes')}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wider transition-all',
            viewMode === 'volumes'
              ? 'bg-[#5a63df] text-white'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          )}
        >
          <List className="h-3.5 w-3.5" /> Volumes
        </button>
      </div>
    </div>
  );
}

export default function SpeakingHeader({
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  tabs,
  viewMode,
  onViewModeChange,
}) {
  return (
    <header className="mb-1 flex flex-col gap-3 border-b border-[#eeedf7] pb-4 dark:border-white/[0.07]">
      <div className="max-w-2xl">
        <Pill tone="accent">
          <Sparkles className="h-3 w-3" />
          Interaction hub
        </Pill>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Speaking Library
        </h1>
        <p className={cn('mt-1 text-sm font-medium', MUTED)}>
          Build speaking confidence with real-world scenarios and instant AI-driven feedback.
        </p>
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <Pill tone="sky">Official Cambridge content</Pill>
        </div>
      </div>

      {tabs && (
        <SpeakingControls
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          activeTab={activeTab}
          onTabChange={onTabChange}
          tabs={tabs}
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
        />
      )}
    </header>
  );
}
