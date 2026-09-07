import React from 'react';
import { MICRO, MUTED, Pill } from '@/features/dashboard/components/primitives.jsx';
import {
  ReiconBookOpen,
  ReiconClock,
  ReiconHeadphones,
  ReiconLock,
  ReiconUsers,
} from '@/components/ui/reicon';
import { cn } from '@/lib/cn';
import SessionSteps from './SessionSteps';

function displayType(type) {
  return type === 'listening' ? 'Listening' : 'Reading';
}

function CompletedMetricStrip({ durationMinutes, memberCount, onlineCount }) {
  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-[#eceafa] pt-2 text-[11px] text-slate-500 dark:border-white/[0.06] dark:text-slate-400">
      <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
        <ReiconClock className="h-3.5 w-3.5 text-[#5a63df] dark:text-[#afb5ff]" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Duration:
        </span>
        <strong className="font-semibold tabular-nums text-slate-800 dark:text-slate-200">
          {durationMinutes} min
        </strong>
      </span>
      <span className="text-slate-300 dark:text-slate-700">•</span>
      <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
        <ReiconUsers className="h-3.5 w-3.5 text-[#5a63df] dark:text-[#afb5ff]" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Room:</span>
        <strong className="font-semibold tabular-nums text-slate-800 dark:text-slate-200">
          {memberCount}/2 completed
        </strong>
      </span>
      <span className="text-slate-300 dark:text-slate-700">•</span>
      <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Live:</span>
        <strong className="font-semibold tabular-nums text-slate-800 dark:text-slate-200">
          {onlineCount} connected
        </strong>
      </span>
      <span className="text-slate-300 dark:text-slate-700">•</span>
      <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
        <ReiconLock className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Privacy:
        </span>
        <strong className="font-medium text-slate-600 dark:text-slate-400">Answers private</strong>
      </span>
    </div>
  );
}

function InProgressMetricGrid({ durationMinutes, memberCount, onlineCount }) {
  return (
    <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5 border-t border-[#eceafa] pt-2.5 dark:border-white/[0.06]">
      <div className="flex items-center gap-2 rounded-lg border border-[#e8e6f5] bg-[#f8f7fd] px-2.5 py-1.5 dark:border-white/[0.06] dark:bg-white/[0.02]">
        <div className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-white border border-[#e8e6f5] text-[#5a63df] dark:border-white/10 dark:bg-white/[0.06] dark:text-[#afb5ff]">
          <ReiconClock className="h-3 w-3" />
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Duration</p>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 tabular-nums">
            {durationMinutes} min
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-[#e8e6f5] bg-[#f8f7fd] px-2.5 py-1.5 dark:border-white/[0.06] dark:bg-white/[0.02]">
        <div className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-white border border-[#e8e6f5] text-[#5a63df] dark:border-white/10 dark:bg-white/[0.06] dark:text-[#afb5ff]">
          <ReiconUsers className="h-3 w-3" />
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Room</p>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 tabular-nums">
            {memberCount}/2 joined
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-[#e8e6f5] bg-[#f8f7fd] px-2.5 py-1.5 dark:border-white/[0.06] dark:bg-white/[0.02]">
        <div className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-emerald-50 border border-emerald-200/60 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Live now</p>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 tabular-nums">
            {onlineCount} connected
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-[#e8e6f5] bg-[#f8f7fd] px-2.5 py-1.5 dark:border-white/[0.06] dark:bg-white/[0.02]">
        <div className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-white border border-[#e8e6f5] text-slate-500 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-400">
          <ReiconLock className="h-3 w-3" />
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Privacy</p>
          <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
            Answers private
          </p>
        </div>
      </div>
    </div>
  );
}

const STATE_MAP = {
  lobby: { label: 'Lobby open', tone: 'accent', step: 1 },
  running: { label: 'In progress', tone: 'warn', step: 2 },
  grading: { label: 'Locking scores', tone: 'warn', step: 3 },
  complete: { label: 'Results ready', tone: 'ok', step: 4 },
};

export default function PairedRoomHeader({ room, state, bothComplete, onlineCount }) {
  const roomStatus = state || STATE_MAP[room?.state] || STATE_MAP.lobby;
  const durationMinutes = Math.ceil((room.duration_seconds || 3600) / 60);

  return (
    <header className="overflow-hidden rounded-2xl border border-[#e4e2f0] bg-white shadow-xs dark:border-white/[0.08] dark:bg-[#121118]">
      <div className="border-t-2 border-[#5a63df] p-3.5 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-9 w-9 sm:h-10 sm:w-10 shrink-0 place-items-center rounded-xl bg-[#5a63df]/10 text-[#5a63df] dark:bg-[#5a63df]/20 dark:text-[#afb5ff]">
              {room.test_type === 'listening' ? (
                <ReiconHeadphones className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              ) : (
                <ReiconBookOpen className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              )}
            </div>
            <div className="min-w-0">
              <p
                className={cn(
                  MICRO,
                  'flex items-center gap-1.5 font-bold tracking-wider text-[#5a63df] dark:text-[#afb5ff]'
                )}
              >
                <span>Study partners</span>
                <span className="h-1 w-1 rounded-full bg-[#5a63df]/40" />
                <span>{displayType(room.test_type)}</span>
              </p>
              <h1 className="mt-0.5 text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                {room.title}
              </h1>
              {!bothComplete && (
                <p
                  className={cn(
                    MUTED,
                    'mt-0.5 max-w-xl text-[11px] leading-normal hidden sm:block'
                  )}
                >
                  Work independently, start together, and compare skills. Your submitted answers
                  stay private.
                </p>
              )}
            </div>
          </div>

          <Pill tone={roomStatus.tone}>
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                roomStatus.tone === 'ok'
                  ? 'bg-emerald-500'
                  : roomStatus.tone === 'accent'
                    ? 'bg-[#5a63df] animate-pulse'
                    : 'bg-amber-500 animate-pulse'
              )}
            />
            {roomStatus.label}
          </Pill>
        </div>

        {bothComplete ? (
          <CompletedMetricStrip
            durationMinutes={durationMinutes}
            memberCount={room.members.length}
            onlineCount={onlineCount}
          />
        ) : (
          <InProgressMetricGrid
            durationMinutes={durationMinutes}
            memberCount={room.members.length}
            onlineCount={onlineCount}
          />
        )}

        <SessionSteps state={room.state} />
      </div>
    </header>
  );
}
