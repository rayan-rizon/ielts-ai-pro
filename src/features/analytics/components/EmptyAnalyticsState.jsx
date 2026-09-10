import React from 'react';
import { m } from 'framer-motion';
import { cn } from '@/lib/cn';
import { Award, BarChart3, Brain, TrendingUp } from 'lucide-react';
import { Empty, MICRO, MUTED, PANEL, TILE } from '@/features/dashboard/components/primitives';

/** Compact empty state — used inside an existing panel, so it takes no chrome of its own. */
function CompactState({ icon, title, description, action, className }) {
  return (
    <div className={cn('flex h-full min-h-[160px] flex-1 flex-col', className)}>
      <Empty icon={icon} className="flex-1 content-center">
        {title ? (
          <span className="block text-[13px] font-extrabold text-slate-800 dark:text-slate-100">
            {title}
          </span>
        ) : null}
        {description}
      </Empty>
      {action ? <div className="mt-1 flex justify-center">{action}</div> : null}
    </div>
  );
}

const WHAT_YOU_GET = [
  {
    icon: TrendingUp,
    title: 'Band trajectory',
    desc: 'Your score over time, per module, against the target you set.',
  },
  {
    icon: Award,
    title: 'Marking criteria',
    desc: 'Task Achievement, Coherence, Lexical Resource and Grammar — where marks are actually lost.',
  },
  {
    icon: Brain,
    title: 'Confirmed focus areas',
    desc: 'Skills your own graded answers point to, ranked by how much evidence backs each one.',
  },
];

/**
 * First-run empty state — the whole page before any test is scored.
 */
export default function EmptyAnalyticsState({
  icon: Icon = BarChart3,
  title,
  description,
  action,
  className,
  compact = false,
}) {
  if (compact) {
    return (
      <CompactState
        icon={Icon}
        title={title}
        description={description}
        action={action}
        className={className}
      />
    );
  }

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        PANEL,
        'mx-auto flex w-full max-w-xl flex-col items-center gap-5 p-6 text-center sm:p-8',
        className
      )}
    >
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#5a63df]/10 text-[#5a63df] dark:bg-[#5a63df]/20 dark:text-[#a9afff]">
        <Icon className="h-5 w-5" strokeWidth={2.25} />
      </span>

      <div className="space-y-1.5">
        <h3 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h3>
        <p className={cn('mx-auto max-w-md text-[13px] font-medium', MUTED)}>
          Once you complete a scored test, this page fills in with:
        </p>
      </div>

      <div className="grid w-full gap-2 text-left">
        {WHAT_YOU_GET.map((item) => (
          <div key={item.title} className={cn(TILE, 'flex items-start gap-3 p-3')}>
            <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#5a63df]/10 text-[#5a63df] dark:bg-[#5a63df]/20 dark:text-[#a9afff]">
              <item.icon className="h-3.5 w-3.5" strokeWidth={2.25} />
            </span>
            <div className="min-w-0">
              <p className="text-[12px] font-extrabold text-slate-800 dark:text-slate-100">
                {item.title}
              </p>
              <p className={cn(MICRO, MUTED, 'mt-0.5 normal-case leading-snug tracking-normal')}>
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {action ? <div className="w-full pt-1">{action}</div> : null}
    </m.div>
  );
}
