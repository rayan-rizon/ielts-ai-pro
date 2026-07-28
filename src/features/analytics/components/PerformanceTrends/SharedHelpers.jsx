import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

export function getQuestionSuccessSummary(data = []) {
  const totals = data.reduce(
    (summary, item) => ({
      correct: summary.correct + (Number(item.correct) || 0),
      total: summary.total + (Number(item.total) || 0),
    }),
    { correct: 0, total: 0 }
  );

  return {
    ...totals,
    accuracy: totals.total ? Math.round((totals.correct / totals.total) * 100) : 0,
  };
}

export function questionSuccessTone(accuracy, sampleSize = 0) {
  if (sampleSize < 5) {
    return {
      label: 'Small sample',
      accent: 'bg-[#5661e9]',
      text: 'text-[#5661e9] dark:text-indigo-300',
      badge:
        'bg-[#efedff] text-[#5661e9] dark:bg-indigo-500/20 dark:text-indigo-300 ring-1 ring-[#5661e9]/20',
    };
  }
  if (accuracy >= 70) {
    return {
      label: 'Strong',
      accent: 'bg-emerald-500',
      text: 'text-emerald-700 dark:text-emerald-300',
      badge:
        'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 ring-1 ring-emerald-200/70',
    };
  }
  if (accuracy >= 50) {
    return {
      label: 'Developing',
      accent: 'bg-amber-500',
      text: 'text-amber-700 dark:text-amber-300',
      badge:
        'bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 ring-1 ring-amber-200/70',
    };
  }
  return {
    label: 'Focus next',
    accent: 'bg-[#5661e9]',
    text: 'text-[#5661e9] dark:text-indigo-300',
    badge:
      'bg-[#efedff] text-[#5661e9] dark:bg-indigo-500/20 dark:text-indigo-300 ring-1 ring-[#5661e9]/20',
  };
}

export function StatMiniCard({ icon: Icon, label, value }) {
  return (
    <div
      className={cn(
        'p-2 rounded-xl border border-indigo-100/80 bg-white/90 dark:bg-slate-900/80 dark:border-white/10 flex flex-col items-center justify-center text-center transition-all h-[58px] shadow-2xs'
      )}
    >
      <div className="flex items-center gap-1">
        <Icon className="w-3 h-3 text-[#5661e9] dark:text-indigo-300" />
        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400 truncate">
          {label}
        </span>
      </div>
      <span className="text-xs font-black text-slate-950 dark:text-white truncate mt-0.5">
        {value}
      </span>
    </div>
  );
}

export function SectionHeading({ icon: Icon, label, subLabel, color }) {
  return (
    <div className="flex items-center justify-between px-0.5">
      <span
        className={cn(
          'text-xs font-black text-slate-950 dark:text-white tracking-tight flex items-center gap-1.5',
          color
        )}
      >
        <Icon className="w-3.5 h-3.5 text-[#5661e9] dark:text-indigo-300" /> {label}
      </span>
      {subLabel && (
        <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-400">
          {subLabel}
        </span>
      )}
    </div>
  );
}

export function SkillGapItem({ skill, avg }) {
  const isHighRisk = avg < 40;
  const isMediumRisk = avg >= 40 && avg < 70;
  return (
    <div className="space-y-1 rounded-xl border border-indigo-100/80 bg-[#faf9ff] p-2.5 dark:border-white/10 dark:bg-slate-900/80 shadow-2xs">
      <div className="flex justify-between items-center text-xs">
        <span className="text-xs font-black text-slate-950 dark:text-white truncate">{skill}</span>
        <span
          className={cn(
            'font-black text-[9.5px] uppercase px-2 py-0.5 rounded-full border',
            isHighRisk
              ? 'bg-rose-50 text-rose-700 border-rose-200/70 dark:bg-rose-500/20 dark:text-rose-300'
              : isMediumRisk
                ? 'bg-amber-50 text-amber-700 border-amber-200/70 dark:bg-amber-500/20 dark:text-amber-300'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200/70 dark:bg-emerald-500/20 dark:text-emerald-300'
          )}
        >
          {avg}%
        </span>
      </div>
      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(avg, 4)}%` }}
          className={cn(
            'h-full rounded-full transition-all duration-1000',
            isHighRisk ? 'bg-rose-500' : isMediumRisk ? 'bg-amber-500' : 'bg-emerald-500'
          )}
        />
      </div>
    </div>
  );
}

export function getModulePrefix(item) {
  if (item?.skillModule) {
    const mod = String(item.skillModule).toLowerCase();
    if (mod === 'listening') return 'Listening';
    if (mod === 'reading') return 'Reading';
    if (mod === 'writing') return 'Writing';
    if (mod === 'speaking') return 'Speaking';
    if (mod === 'grammar') return 'Grammar';
  }
  if (item?.skillCode) {
    const code = String(item.skillCode).toLowerCase();
    if (code.startsWith('listening')) return 'Listening';
    if (code.startsWith('reading')) return 'Reading';
    if (code.startsWith('writing')) return 'Writing';
    if (code.startsWith('speaking')) return 'Speaking';
    if (code.startsWith('grammar')) return 'Grammar';
  }
  return null;
}

export function EvidencePriorityItem({ item }) {
  const isMeasured = item?.evidenceClass === 'measured_priority';
  const mastery =
    item?.mastery == null ? null : Math.round(Math.max(0, Math.min(1, item.mastery)) * 100);

  const modulePrefix = getModulePrefix(item);
  const rawTitle = item?.module || 'IELTS fundamentals';
  const fullTitle =
    modulePrefix && !rawTitle.toLowerCase().startsWith(modulePrefix.toLowerCase())
      ? `${modulePrefix} - ${rawTitle}`
      : rawTitle;

  return (
    <div className="rounded-xl border border-indigo-100/80 bg-[#faf9ff] p-2.5 dark:border-white/10 dark:bg-slate-900/80 shadow-2xs hover:border-[#5661e9]/50 hover:bg-white transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-black text-slate-950 dark:text-white">{fullTitle}</p>
          <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
            {item?.observations || 0} graded answers
            {mastery == null ? '' : ` · ${mastery}% skill progress`}
          </p>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider',
            isMeasured
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 ring-1 ring-emerald-200/70'
              : 'bg-[#efedff] text-[#5661e9] dark:bg-indigo-500/20 dark:text-indigo-300 ring-1 ring-[#5661e9]/20'
          )}
        >
          {isMeasured ? 'Confirmed focus' : 'Needs more results'}
        </span>
      </div>
    </div>
  );
}

export function TroubleTag({ type }) {
  return (
    <div className="px-2.5 py-1 rounded-lg bg-rose-50/80 dark:bg-rose-500/10 border border-rose-200/60 dark:border-rose-500/20 flex items-center gap-1.5 transition-all cursor-default">
      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
      <span className="text-[10.5px] font-black text-rose-700 dark:text-rose-300 capitalize tracking-tight">
        {type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
      </span>
    </div>
  );
}
