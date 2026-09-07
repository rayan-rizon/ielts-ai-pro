import React from 'react';
import { MICRO, MUTED, NUM } from '@/features/dashboard/components/primitives.jsx';
import { ReiconClock, ReiconTrophy, ReiconUsers } from '@/components/ui/reicon';
import { cn } from '@/lib/cn';

function getSteps(invitation) {
  return [
    {
      step: '01',
      title: invitation ? 'Join lobby' : 'Create & invite',
      desc: invitation ? 'Enter room with partner' : 'Get private room link',
      icon: ReiconUsers,
      current: true,
      stageLabel: 'Active',
    },
    {
      step: '02',
      title: 'Start together',
      desc: 'Synced timer & questions',
      icon: ReiconClock,
      current: false,
      stageLabel: 'In test',
    },
    {
      step: '03',
      title: 'Compare scores',
      desc: 'Band score & breakdown',
      icon: ReiconTrophy,
      current: false,
      stageLabel: 'Results',
    },
  ];
}

export default function PairedEntrySteps({ invitation }) {
  const steps = getSteps(invitation);

  return (
    <div className="mt-2.5 rounded-xl border border-[#e8e6f5] bg-[#f8f7fd] p-2.5 dark:border-white/[0.07] dark:bg-white/[0.03]">
      <div className="mb-2 flex items-center justify-between px-0.5">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#5a63df]" />
          <span className={cn(MICRO, MUTED, 'text-[9px] tracking-wider')}>Session steps</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-md border border-[#e4e2f2] bg-white/90 px-1.5 py-0.5 shadow-2xs dark:border-white/[0.08] dark:bg-[#15141d]">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-[9px] font-semibold text-slate-600 dark:text-slate-300">
            40 Questions · Real-time Sync
          </span>
        </div>
      </div>

      <ol className="grid grid-cols-3 gap-2" aria-label="How paired practice works">
        {steps.map(({ step, title, desc, icon: Icon, current, stageLabel }) => (
          <li
            key={step}
            className={cn(
              'group relative flex flex-col justify-between rounded-lg border p-2 transition-all duration-200',
              current
                ? 'border-[#5a63df]/45 bg-white shadow-xs ring-1 ring-[#5a63df]/20 dark:border-[#5a63df]/50 dark:bg-[#15141d]'
                : 'border-[#e4e2f2] bg-white/80 hover:border-slate-300 hover:bg-white dark:border-white/[0.08] dark:bg-[#131218]/80 dark:hover:bg-[#16151f]'
            )}
          >
            <div>
              {/* Step Number + Icon Header */}
              <div className="mb-1 flex items-center justify-between">
                <span
                  className={cn(
                    NUM,
                    'inline-flex h-4 px-1 items-center justify-center rounded text-[8.5px] font-extrabold tracking-tight',
                    current
                      ? 'bg-[#5a63df] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-500 dark:bg-white/[0.08] dark:text-slate-400'
                  )}
                >
                  {step}
                </span>
                <div
                  className={cn(
                    'grid h-4 w-4 place-items-center rounded transition-colors',
                    current
                      ? 'text-[#5a63df] dark:text-[#afb5ff]'
                      : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'
                  )}
                >
                  <Icon className="h-3 w-3" />
                </div>
              </div>

              {/* Step Title */}
              <h2 className="text-[11px] font-bold leading-tight text-slate-800 dark:text-slate-100">
                {title}
              </h2>

              {/* Step Description */}
              <p className="mt-0.5 text-[9.5px] leading-tight text-slate-500 text-balance dark:text-slate-400">
                {desc}
              </p>
            </div>

            {/* Step Stage Tag */}
            <div className="mt-1.5 flex items-center gap-1 border-t border-[#eceafa] pt-1 dark:border-white/[0.06]">
              <span
                className={cn(
                  'h-1 w-1 rounded-full',
                  current ? 'bg-[#5a63df]' : 'bg-slate-300 dark:bg-slate-600'
                )}
              />
              <span
                className={cn(
                  'font-mono text-[7.5px] font-bold uppercase tracking-wider',
                  current
                    ? 'text-[#5a63df] dark:text-[#afb5ff]'
                    : 'text-slate-400 dark:text-slate-500'
                )}
              >
                {stageLabel}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
