import React from 'react';
import { CheckCircle2, LockKeyhole, Sparkles } from 'lucide-react';
import { ReiconAlertCircle, ReiconTrophy } from '@/components/ui/reicon';
import {
  IconChip,
  MICRO,
  NUM,
  PANEL,
  Pill,
  TILE,
} from '@/features/dashboard/components/primitives.jsx';
import { cn } from '@/lib/cn';
import Breakdown from './Breakdown';

function displayQuestionType(type) {
  return type.replaceAll('_', ' ');
}

function focusLabel(item) {
  return displayQuestionType(item.type);
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
      <section className={cn(PANEL, 'p-3 sm:p-3.5')}>
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
          <div className="flex items-center gap-1.5">
            <Pill tone="ok">
              <CheckCircle2 className="h-3 w-3" /> Both finished
            </Pill>
            <span
              className={cn(
                MICRO,
                'inline-flex items-center gap-1 text-slate-400 dark:text-slate-500'
              )}
            >
              <LockKeyhole className="h-3 w-3" /> Locked
            </span>
          </div>
        </div>

        <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5">
          <div className="rounded-lg border border-[#5a63df]/25 bg-[#5a63df]/[0.04] py-2 px-2.5 sm:py-2.5 sm:px-3 dark:border-[#8f97ff]/30 dark:bg-[#5a63df]/10">
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

          <div className="rounded-lg border border-[#e8e6f5] bg-[#f8f7fd] py-2 px-2.5 sm:py-2.5 sm:px-3 dark:border-white/[0.06] dark:bg-white/[0.02]">
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

          <div className="col-span-2 rounded-lg border border-[#e8e6f5] bg-[#f8f7fd] py-2 px-2.5 sm:col-span-1 sm:py-2.5 sm:px-3 dark:border-white/[0.06] dark:bg-white/[0.02]">
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
        </div>
      </section>

      {/* Side-by-side Participant Breakdowns */}
      <div className="grid gap-4 lg:grid-cols-2">
        {room.members.map((member) => (
          <Breakdown
            key={member.user_id}
            member={member}
            isMine={member.user_id === room.actor_id}
          />
        ))}
      </div>

      {commonWeak.length > 0 && (
        <section className={cn(PANEL, 'border-[#5a63df]/25 p-3.5 sm:p-4 dark:border-[#5a63df]/35')}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <IconChip icon={Sparkles} tone="accent" size="lg" />
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
                  <Pill tone="amber">
                    {commonWeak.length} shared focus {commonWeak.length === 1 ? 'area' : 'areas'}
                  </Pill>
                </div>
                <h3 className="mt-1 text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Choose one shared skill for your next practice
                </h3>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                  Each skill below is below the 60% practice target for both students.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#eceafa] pt-2.5 lg:grid-cols-3 dark:border-white/[0.06]">
            {commonWeak.map((item) => (
              <div key={item.type} className={cn(TILE, 'flex items-center gap-2 px-2.5 py-2')}>
                <ReiconAlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="min-w-0 flex-1">
                  <p
                    title={focusLabel(item)}
                    className="truncate text-[11px] font-bold capitalize text-slate-800 dark:text-slate-100"
                  >
                    {focusLabel(item)}
                  </p>
                  <p className={cn(MICRO, 'mt-0.5 text-amber-600 dark:text-amber-300')}>
                    Both below target
                  </p>
                </div>
                <span
                  className={cn(
                    NUM,
                    'shrink-0 text-[11px] font-bold text-slate-500 dark:text-slate-300'
                  )}
                >
                  {item.mine}% / {item.partner}%
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
