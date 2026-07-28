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
      accent: 'bg-indigo-500',
      text: 'text-indigo-600 dark:text-indigo-400',
      badge: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
    };
  }
  if (accuracy >= 70) {
    return {
      label: 'Strong',
      accent: 'bg-emerald-500',
      text: 'text-emerald-600 dark:text-emerald-400',
      badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    };
  }
  if (accuracy >= 50) {
    return {
      label: 'Developing',
      accent: 'bg-amber-500',
      text: 'text-amber-600 dark:text-amber-400',
      badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    };
  }
  return {
    label: 'Focus next',
    accent: 'bg-rose-500',
    text: 'text-rose-600 dark:text-rose-400',
    badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
  };
}

export function StatMiniCard({ icon: Icon, label, value, alert, alertColor, 'data-oid': dataOid }) {
  const colorStyles = alert
    ? alertColor === 'rose'
      ? 'bg-rose-50/70 border-rose-200/80 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-300'
      : 'bg-amber-50/70 border-amber-200/80 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300'
    : 'bg-slate-50/70 border-slate-200/70 text-slate-700 dark:bg-white/[0.03] dark:border-white/5 dark:text-slate-300';

  const iconColor = alert
    ? alertColor === 'rose'
      ? 'text-rose-500 dark:text-rose-400'
      : 'text-amber-500 dark:text-amber-400'
    : 'text-indigo-500 dark:text-indigo-400';

  const labelColor = alert
    ? alertColor === 'rose'
      ? 'text-rose-600/80 dark:text-rose-400/80'
      : 'text-amber-600/80 dark:text-amber-400/80'
    : 'text-slate-400 dark:text-slate-400';

  const valueColor = alert
    ? alertColor === 'rose'
      ? 'text-rose-600 dark:text-rose-400'
      : 'text-amber-600 dark:text-amber-400'
    : 'text-slate-950 dark:text-white';

  return (
    <div
      className={cn(
        'p-1.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all h-[56px]',
        colorStyles
      )}
      data-oid={dataOid || 'iykydqu'}
    >
      <div className="flex items-center gap-1" data-oid="qvxcv1p-wrap">
        <Icon className={cn('w-3 h-3', iconColor)} data-oid="qvxcv1p" />
        <span
          className={cn('text-[9px] font-extrabold uppercase tracking-wider truncate', labelColor)}
          data-oid="m2xsq81"
        >
          {label}
        </span>
      </div>
      <span className={cn('text-xs font-black truncate mt-0.5', valueColor)} data-oid="v8i5nvv">
        {value}
      </span>
    </div>
  );
}

export function SectionHeading({ icon: Icon, label, subLabel, color, 'data-oid': dataOid }) {
  return (
    <div className="flex items-center justify-between px-0.5" data-oid={dataOid || '4-fb8tb'}>
      <span
        className={cn(
          'text-xs font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5',
          color
        )}
        data-oid="xp9yc9d"
      >
        <Icon className="w-3.5 h-3.5 text-indigo-500" data-oid="qrnu9el" /> {label}
      </span>
      {subLabel && (
        <span
          className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400"
          data-oid="c070qju"
        >
          {subLabel}
        </span>
      )}
    </div>
  );
}

export function SkillGapItem({ skill, avg, 'data-oid': dataOid }) {
  const isHighRisk = avg < 40;
  const isMediumRisk = avg >= 40 && avg < 70;
  return (
    <div
      className="space-y-1 rounded-xl border border-slate-100 bg-slate-50/40 p-2 dark:border-white/5 dark:bg-white/[0.02]"
      data-oid={dataOid || 'bmdkccl'}
    >
      <div className="flex justify-between items-center text-xs" data-oid="2aleqd_">
        <span
          className="text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate"
          data-oid="9xf0ipf"
        >
          {skill}
        </span>
        <span
          className={cn(
            'font-black text-[9.5px] uppercase px-1.5 py-0.5 rounded-full border',
            isHighRisk
              ? 'bg-rose-50 text-rose-600 border-rose-200/60 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20'
              : isMediumRisk
                ? 'bg-amber-50 text-amber-600 border-amber-200/60 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20'
                : 'bg-emerald-50 text-emerald-600 border-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20'
          )}
          data-oid="my7m1nk"
        >
          {avg}%
        </span>
      </div>
      <div
        className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"
        data-oid="emij1sn"
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(avg, 4)}%` }}
          className={cn(
            'h-full rounded-full transition-all duration-1000',
            isHighRisk ? 'bg-rose-500' : isMediumRisk ? 'bg-amber-500' : 'bg-emerald-500'
          )}
          data-oid="5t6bmjl"
        />
      </div>
    </div>
  );
}

export function EvidencePriorityItem({ item, 'data-oid': dataOid }) {
  const isMeasured = item?.evidenceClass === 'measured_priority';
  const mastery =
    item?.mastery == null ? null : Math.round(Math.max(0, Math.min(1, item.mastery)) * 100);

  return (
    <div
      className="rounded-xl border border-slate-100 bg-slate-50/40 p-2 dark:border-white/5 dark:bg-white/[0.02]"
      data-oid={dataOid || 'evidence-priority'}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-extrabold text-slate-800 dark:text-slate-200">
            {item?.module || 'IELTS fundamentals'}
          </p>
          <p className="mt-0.5 text-[9.5px] font-semibold text-slate-400">
            {item?.observations || 0} graded answers
            {mastery == null ? '' : ` · ${mastery}% skill progress`}
          </p>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full border px-1.5 py-0.5 text-[8.5px] font-black uppercase',
            isMeasured
              ? 'border-emerald-200/60 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300'
              : 'border-indigo-200/60 bg-indigo-50 text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300'
          )}
        >
          {isMeasured ? 'Confirmed focus' : 'Needs more results'}
        </span>
      </div>
    </div>
  );
}

export function TroubleTag({ type, 'data-oid': dataOid }) {
  return (
    <div
      className="px-2.5 py-1 rounded-lg bg-rose-50/70 dark:bg-rose-500/10 border border-rose-200/60 dark:border-rose-500/20 flex items-center gap-1.5 transition-all cursor-default"
      data-oid={dataOid || '5ng.5bc'}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" data-oid="nwl26h4" />
      <span
        className="text-[10.5px] font-extrabold text-rose-700 dark:text-rose-300 capitalize tracking-tight"
        data-oid="gr0rke."
      >
        {type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
      </span>
    </div>
  );
}
