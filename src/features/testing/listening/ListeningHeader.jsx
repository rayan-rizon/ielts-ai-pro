import React from 'react';
import { motion } from 'framer-motion';
import { Headphones, TrendingUp, Award, Target, Users } from 'lucide-react';
import ListeningFilters from './ListeningFilters';

function StatChip({ icon: Icon, iconColor, label, sub }) {
  return (
    <div className="inline-flex items-center gap-2.5 bg-white/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 px-3.5 py-1.5 rounded-full shadow-2xs backdrop-blur-xl">
      <div
        className={`w-7 h-7 rounded-full text-white flex items-center justify-center shrink-0 shadow-xs ${iconColor}`}
      >
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex flex-col justify-center">
        <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-none">
          {label}
        </span>
        <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-tight mt-0.5">
          {sub}
        </span>
      </div>
    </div>
  );
}

function MiniStat({ icon: Icon, iconColor, value, label }) {
  return (
    <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-2 border border-slate-100 dark:border-white/5">
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
        <span className="text-base font-black text-slate-900 dark:text-white leading-none">
          {value}
        </span>
      </div>
      <span className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

export default function ListeningHeader({
  totalPassages,
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  viewMode,
  onViewModeChange,
}) {
  return (
    <div className="relative group overflow-hidden rounded-2xl md:rounded-3xl px-4 sm:px-6 pt-3 sm:pt-3.5 pb-1.5 sm:pb-2 border border-indigo-200/60 dark:border-indigo-800/40 bg-gradient-to-br from-indigo-50/80 via-white to-violet-50/80 dark:from-indigo-500/5 dark:via-transparent dark:to-violet-500/5 backdrop-blur-3xl shadow-xl shadow-indigo-500/5 dark:shadow-indigo-500/10 space-y-2">
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-indigo-500/5 to-transparent -z-10" />
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-400/10 dark:bg-indigo-500/10 rounded-full blur-[80px] -z-10 group-hover:scale-110 transition-transform duration-1000" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
        {/* Left: title + stats */}
        <div className="space-y-2 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-600/10 dark:bg-indigo-400/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] backdrop-blur-md"
          >
            <Headphones className="w-3 h-3" />
            <span>Premium Audio Hub</span>
          </motion.div>

          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-none sm:leading-tight">
              Listening{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 dark:from-indigo-400 dark:via-violet-400 dark:to-purple-400">
                Library
              </span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium leading-relaxed max-w-xl">
              Improve your listening skills with authentic, Cambridge-style curated audio tests.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 items-center pt-0.5">
            <StatChip
              icon={TrendingUp}
              iconColor="bg-purple-500 shadow-purple-500/20"
              label="92%"
              sub="Success Rate"
            />
            <StatChip
              icon={Award}
              iconColor="bg-amber-500 shadow-amber-500/20"
              label="Official"
              sub="Cambridge Content"
            />
          </div>
        </div>

        {/* Right: insights card (desktop only) */}
        <div className="lg:block hidden">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative p-0.5"
          >
            <div className="absolute -inset-1.5 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-2xl blur-lg opacity-50 group-hover:opacity-100 transition-opacity" />

            <div className="relative w-64 bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl border border-white dark:border-white/10 rounded-2xl p-3 shadow-xl overflow-hidden space-y-2">
              <div className="absolute top-0 right-0 p-3">
                <div className="w-7 h-7 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                  <Target className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-0.5">
                    Weekly Target
                  </span>
                  <h4 className="text-base font-black text-slate-900 dark:text-white">
                    Listening skill progress
                  </h4>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-end">
                    <span className="text-[11px] font-bold text-slate-500">
                      8 of 12 Tests Completed
                    </span>
                    <span className="text-xs font-black text-purple-600">75%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden p-[1px] border border-slate-200 dark:border-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '75%' }}
                      className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full shadow-[0_0_10px_rgba(147,51,234,0.4)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <MiniStat
                    icon={Headphones}
                    iconColor="text-indigo-500"
                    value={totalPassages}
                    label="Total Tests"
                  />
                  <MiniStat
                    icon={Users}
                    iconColor="text-emerald-500"
                    value="2.4k"
                    label="Active Users"
                  />
                </div>
              </div>

              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Unified Filter Row */}
      <div className="pt-1.5 sm:pt-2 border-t border-indigo-100/80 dark:border-white/10 relative z-10">
        <ListeningFilters
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          activeTab={activeTab}
          onTabChange={onTabChange}
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
        />
      </div>
    </div>
  );
}
