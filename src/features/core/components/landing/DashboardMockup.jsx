import { m } from 'framer-motion';
import Brain from 'lucide-react/icons/brain';
import BarChart3 from 'lucide-react/icons/bar-chart-3';
import Mic from 'lucide-react/icons/mic';
import BookOpen from 'lucide-react/icons/book-open';
import Award from 'lucide-react/icons/award';
import { cn } from '@/lib/cn';
import {
  PANEL,
  TILE,
  WELL,
  NUM,
  MICRO,
  TITLE,
  MUTED,
  IconChip,
  Pill,
  Stat,
  Bar,
} from '@/features/dashboard/components/primitives';

export default function DashboardMockup() {
  return (
    <m.div
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      className="relative block w-full"
    >
      {/* Main Container */}
      <div className={cn(PANEL, 'relative z-10 overflow-hidden')}>
        {/* Window Header */}
        <div className="flex items-center justify-between border-b border-[#eceafa] px-5 py-3 dark:border-white/[0.07]">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-[rgb(var(--signal-fault)/0.6)]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[rgb(var(--signal-warn)/0.6)]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[rgb(var(--signal-ok)/0.6)]" />
          </div>
          <div className="flex items-center gap-2">
            <Pill tone="ok">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[rgb(var(--signal-ok))] opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[rgb(var(--signal-ok))]" />
              </span>
              Live
            </Pill>
            <Pill tone="neutral" className="hidden sm:inline-flex">
              v2.0
            </Pill>
          </div>
        </div>

        <div className="space-y-2.5 p-4">
          {/* Performance Summary */}
          <div className={cn(TILE, 'p-3.5')}>
            <div className="mb-3 flex items-start justify-between">
              <div>
                <p className={cn(MICRO, 'text-[#5a63df] dark:text-[#a9afff]')}>
                  Current Proficiency
                </p>
                <h2 className={cn(TITLE, 'mt-0.5 text-base')}>Advanced Academic</h2>
              </div>
              <IconChip icon={BarChart3} tone="accent" size="md" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Stat size="sm" label="Writing" value="7.5" />
              <Stat size="sm" label="Speaking" value="8.0" />
              <Stat size="sm" label="Reading" value="8.5" />
            </div>
          </div>

          {/* Active Sessions */}
          <div className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-2">
            <div className={cn(TILE, 'space-y-1.5 p-2.5')}>
              <div className="flex items-center justify-between">
                <IconChip icon={Mic} tone="accent" size="sm" />
                <Pill tone="warn">Active</Pill>
              </div>
              <div>
                <p className="text-[12px] font-extrabold text-slate-800 dark:text-slate-100">
                  Fluency Drill
                </p>
                <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400">
                  Cue Cards
                </p>
              </div>
              <Bar value={65} />
            </div>

            <div className={cn(TILE, 'space-y-1.5 p-2.5')}>
              <div className="flex items-center justify-between">
                <IconChip icon={BookOpen} tone="accent" size="sm" />
                <Pill tone="ok">Live</Pill>
              </div>
              <div>
                <p className="text-[12px] font-extrabold text-slate-800 dark:text-slate-100">
                  Reading Lab
                </p>
                <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400">T/F/NG</p>
              </div>
              <Bar value={40} />
            </div>
          </div>

          {/* AI Feedback */}
          <div className={cn(WELL, 'rounded-lg p-3')}>
            <div className="mb-1 flex items-center gap-1.5">
              <Brain className="h-3.5 w-3.5 text-[#5a63df] dark:text-[#a9afff]" />
              <span className={cn(MICRO, 'text-[#5a63df] dark:text-[#a9afff]')}>
                AI Recommendation
              </span>
            </div>
            <p className="text-[12px] font-semibold leading-relaxed text-slate-700 dark:text-slate-200">
              Focus on{' '}
              <span className="text-[#5a63df] underline decoration-[#5a63df]/30 underline-offset-4 dark:text-[#a9afff]">
                connective devices
              </span>{' '}
              to hit a Band 8.5.
            </p>
          </div>
        </div>
      </div>

      {/* Floating Achievement Badge */}
      <div className="absolute -top-6 right-4 z-30 animate-float-slow lg:-top-6 lg:-right-2">
        <div className={cn(PANEL, 'flex scale-90 items-center gap-3 px-3.5 py-2.5 sm:scale-100')}>
          <IconChip icon={Award} tone="amber" size="md" />
          <div>
            <p className={cn(MICRO, MUTED, 'leading-none')}>Weekly Streak</p>
            <p
              className={cn(
                NUM,
                'mt-0.5 text-xs font-extrabold text-slate-800 dark:text-slate-100'
              )}
            >
              Level 12 reached
            </p>
          </div>
        </div>
      </div>

      {/* Floating Target Score */}
      <div className="absolute -bottom-6 -left-6 z-20 animate-float-delayed">
        <div className={cn(PANEL, 'flex scale-90 items-center gap-3 px-3 py-2.5 sm:scale-100')}>
          <div
            className="h-7 w-7 rounded-full border-2 border-[#5a63df]/30 border-t-[#5a63df] animate-spin"
            style={{ animationDuration: '3s' }}
          />
          <div>
            <p className={cn(MICRO, MUTED, 'leading-none')}>System Target</p>
            <p
              className={cn(
                NUM,
                'mt-0.5 text-xs font-extrabold text-slate-800 dark:text-slate-100'
              )}
            >
              Band 8.0 <span className="ml-1 text-[9px] text-[rgb(var(--signal-ok))]">↑ 0.5</span>
            </p>
          </div>
        </div>
      </div>
    </m.div>
  );
}
