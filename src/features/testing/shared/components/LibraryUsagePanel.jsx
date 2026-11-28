import { Lock, Ticket } from 'lucide-react';
import { IconChip, MICRO, MUTED, PANEL, TITLE } from '@/features/dashboard/components/primitives';
import { cn } from '@/lib/cn';

export default function LibraryUsagePanel({
  label,
  title,
  detail,
  blocked,
  tone = blocked ? 'amber' : 'accent',
  action,
  children,
}) {
  return (
    <section
      aria-label={label}
      className={cn(
        PANEL,
        'flex w-[10.75rem] shrink-0 flex-col gap-1.5 p-2 min-[400px]:w-[11.75rem] @[560px]:w-[16.5rem] @[560px]:gap-2 @[560px]:p-2.5 @[720px]:w-[17.5rem]',
        blocked && 'border-[rgb(var(--signal-warn)/0.35)]'
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 @[560px]:gap-2">
          <IconChip icon={blocked ? Lock : Ticket} tone={tone} size="sm" />
          <div className="min-w-0">
            <p className={cn(TITLE, 'truncate text-[11px] @[560px]:text-xs')}>{title}</p>
            <p className={cn(MICRO, MUTED, 'mt-0.5 truncate tracking-normal normal-case')}>
              {detail}
            </p>
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
