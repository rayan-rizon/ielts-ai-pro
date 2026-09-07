import React from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { ReiconAlertCircle, ReiconTrophy } from '@/components/ui/reicon';
import { MICRO, NUM, Pill } from '@/features/dashboard/components/primitives.jsx';
import { cn } from '@/lib/cn';
import Breakdown from './Breakdown';

function displayQuestionType(type) {
  return type.replaceAll('_', ' ');
}

export default function PairedRoomComparison({
  room,
  mine,
  partner,
  partnerName,
  bandDelta,
  correctDelta,
  commonWeak = [],
}) {
  return (
    <>
      <section className="rounded-2xl border border-[#e4e2f0] bg-white p-3 sm:p-3.5 shadow-xs dark:border-white/[0.08] dark:bg-[#121118]">
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-[#eceafa] dark:border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#5a63df]/10 text-[#5a63df] dark:bg-[#5a63df]/20 dark:text-[#afb5ff]">
              <ReiconTrophy className="h-3.5 w-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-none">
                Head-to-Head Comparison
              </h3>
              <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                Synchronized scoring & comparative summary
              </p>
            </div>
          </div>
          <Pill tone="ok">
            <CheckCircle2 className="h-3 w-3" /> Both finished
          </Pill>
        </div>

        <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5">
          {/* Tile 1: Your Result */}
          <div className="rounded-xl border border-[#5a63df]/25 bg-[#5a63df]/[0.04] py-2 px-2.5 sm:py-2.5 sm:px-3 dark:border-[#8f97ff]/30 dark:bg-[#5a63df]/10">
            <p className={cn(MICRO, 'text-[#5a63df] dark:text-[#afb5ff]')}>Your band</p>
            <p
              className={cn(
                NUM,
                'mt-0.5 text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white'
              )}
            >
              {mine.summary?.bandScore?.toFixed(1) || '—'}
            </p>
            <p className="mt-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
              {mine.summary?.correctAnswers ?? '—'}/40 correct ({mine.summary?.percentage ?? 0}%)
            </p>
          </div>

          {/* Tile 2: Partner's Result */}
          <div className="rounded-xl border border-[#e8e6f5] bg-[#f8f7fd] py-2 px-2.5 sm:py-2.5 sm:px-3 dark:border-white/[0.06] dark:bg-white/[0.02]">
            <p className={cn(MICRO, 'text-slate-400 dark:text-slate-400 truncate')}>
              {partnerName}'s band
            </p>
            <p
              className={cn(
                NUM,
                'mt-0.5 text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white'
              )}
            >
              {partner?.summary?.bandScore?.toFixed(1) || '—'}
            </p>
            <p className="mt-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">
              {partner?.summary?.correctAnswers ?? '—'}/40 correct (
              {partner?.summary?.percentage ?? 0}%)
            </p>
          </div>

          {/* Tile 3: Comparative Band Delta */}
          <div className="rounded-xl border border-[#e8e6f5] bg-[#f8f7fd] py-2 px-2.5 sm:py-2.5 sm:px-3 dark:border-white/[0.06] dark:bg-white/[0.02]">
            <p className={cn(MICRO, 'text-slate-400 dark:text-slate-400')}>Band delta</p>
            <p
              className={cn(
                NUM,
                'mt-0.5 text-xl sm:text-2xl font-extrabold',
                bandDelta > 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : bandDelta === 0
                    ? 'text-[#5a63df] dark:text-[#afb5ff]'
                    : 'text-amber-600 dark:text-amber-400'
              )}
            >
              {bandDelta > 0
                ? `+${bandDelta.toFixed(1)}`
                : bandDelta === 0
                  ? 'Tied'
                  : bandDelta.toFixed(1)}
            </p>
            <p className="mt-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">
              {bandDelta > 0
                ? `+${correctDelta} question lead`
                : bandDelta === 0
                  ? `${correctDelta === 0 ? 'Equal score' : `${Math.abs(correctDelta)} question diff`}`
                  : `${Math.abs(correctDelta)} questions gap`}
            </p>
          </div>

          {/* Tile 4: Room Status */}
          <div className="rounded-xl border border-[#e8e6f5] bg-[#f8f7fd] py-2 px-2.5 sm:py-2.5 sm:px-3 dark:border-white/[0.06] dark:bg-white/[0.02]">
            <p className={cn(MICRO, 'text-slate-400 dark:text-slate-400')}>Room status</p>
            <p className="mt-0.5 flex items-center gap-1 text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Complete
            </p>
            <p className="mt-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
              All answers locked
            </p>
          </div>
        </div>
      </section>

      {/* Side-by-side Participant Breakdowns */}
      <div className="grid gap-4 lg:grid-cols-2">
        {room.members.map((member) => (
          <Breakdown key={member.user_id} member={member} />
        ))}
      </div>

      {/* Shared Practice Signal for Common Weak Areas */}
      {commonWeak.length > 0 && (
        <section className="rounded-2xl border border-[#5a63df]/25 bg-gradient-to-br from-[#5a63df]/[0.05] via-white to-white p-3.5 sm:p-4 shadow-xs dark:border-[#5a63df]/35 dark:from-[#5a63df]/15 dark:via-[#121118] dark:to-[#121118]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#5a63df] text-white shadow-2xs">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      MICRO,
                      'rounded bg-[#5a63df]/15 px-1.5 py-0.5 text-[#5a63df] dark:bg-[#5a63df]/30 dark:text-[#afb5ff]'
                    )}
                  >
                    Shared Practice Signal
                  </span>
                  <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                    • Common focus areas
                  </span>
                </div>
                <h3 className="mt-1 text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Practice these question types together next
                </h3>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                  Both of you scored below 60% in{' '}
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {commonWeak.map(displayQuestionType).join(', ')}
                  </span>
                  . Reviewing these question types together will boost both of your band scores.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 border-t border-[#eceafa] pt-2.5 dark:border-white/[0.06]">
            {commonWeak.map((type) => (
              <div
                key={type}
                className="inline-flex items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-800 dark:border-amber-500/35 dark:bg-amber-500/15 dark:text-amber-300"
              >
                <ReiconAlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span className="capitalize">{displayQuestionType(type)}</span>
                <span
                  className={cn(
                    NUM,
                    'rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold'
                  )}
                >
                  &lt; 60% accuracy
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
