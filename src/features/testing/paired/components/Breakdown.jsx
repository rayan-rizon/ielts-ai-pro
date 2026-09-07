import React from 'react';
import { MICRO, NUM, Pill } from '@/features/dashboard/components/primitives.jsx';
import { cn } from '@/lib/cn';

function initials(name) {
  const cleaned = (name || '?').replace(/[()]/g, '').trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase();
}

function displayQuestionType(type) {
  return type.replaceAll('_', ' ');
}

function AccuracyMeterRow({ label, correct, total, meterLabel }) {
  const percent = total ? Math.round((correct / total) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-medium text-slate-700 dark:text-slate-300 truncate">{label}</span>
        <span className={cn(NUM, 'shrink-0 font-semibold text-slate-800 dark:text-slate-200')}>
          {correct}/{total} <span className="font-normal text-slate-400">({percent}%)</span>
        </span>
      </div>
      <div
        role="meter"
        aria-label={meterLabel}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`${correct} of ${total} correct, ${percent}%`}
        className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#eceaf6] dark:bg-white/[0.06]"
      >
        <div
          className="h-full rounded-full bg-[#5a63df] transition-all duration-500 dark:bg-[#7b84f7]"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default function Breakdown({ member, isMine = false }) {
  const summary = member.summary;
  if (!summary) return null;

  const displayName = (member.display_name || 'Anonymous').replace(/[()]/g, '').trim();

  return (
    <section className="rounded-xl border border-[#e4e2f0] bg-linear-to-b from-white to-[#faf9ff] p-3.5 sm:p-4 dark:border-white/[0.07] dark:from-[#141319] dark:to-[#100f15]">
      <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-[#eceafa] dark:border-white/[0.06]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-700 font-bold text-xs dark:bg-white/[0.08] dark:text-slate-200">
            {initials(displayName)}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              {displayName}'s skill breakdown
            </h3>
            <div className="mt-1 flex items-center gap-1.5">
              <Pill tone={isMine ? 'accent' : 'neutral'}>
                {isMine ? 'Your result' : 'Study partner'}
              </Pill>
              <span className={cn(MICRO, 'text-emerald-600 dark:text-emerald-400')}>Locked</span>
            </div>
          </div>
        </div>
        <span
          className={cn(
            NUM,
            'shrink-0 rounded-md border border-[#e4e2f0] bg-[#f8f7fd] px-2 py-0.5 text-[11px] font-bold text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300'
          )}
        >
          {summary.correctAnswers}/{summary.totalQuestions || 40} ({summary.percentage}%)
        </span>
      </div>

      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {/* By Part */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5a63df]" />
            <h4 className={cn(MICRO, 'text-slate-500 dark:text-slate-400')}>By test part</h4>
          </div>
          <div className="space-y-2.5">
            {summary.sectionStats.map((section, index) => (
              <AccuracyMeterRow
                key={`${section.title}-${index}`}
                label={section.title}
                correct={section.correct}
                total={section.total}
                meterLabel={`${displayName} ${section.title} score`}
              />
            ))}
          </div>
        </div>

        {/* By Question Type */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5a63df]" />
            <h4 className={cn(MICRO, 'text-slate-500 dark:text-slate-400')}>By question type</h4>
          </div>
          <div className="space-y-2.5">
            {Object.entries(summary.typeStats).map(([type, score]) => (
              <AccuracyMeterRow
                key={type}
                label={displayQuestionType(type)}
                correct={score.correct}
                total={score.total}
                meterLabel={`${displayName} ${displayQuestionType(type)} score`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
