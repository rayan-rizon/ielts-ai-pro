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
        'flex w-full flex-col gap-2.5 p-3 lg:w-[22rem] lg:shrink-0 xl:w-[23rem]',
        blocked && 'border-[rgb(var(--signal-warn)/0.35)]'
      )}
    >
      <div className="flex items-start justify-between gap-2 sm:items-center">
        <div className="flex min-w-0 items-center gap-2.5">
          <IconChip icon={blocked ? Lock : Ticket} tone={tone} size="md" />
          <div className="min-w-0">
            <p className={TITLE}>{title}</p>
            <p className={cn(MICRO, MUTED, 'mt-1 normal-case tracking-normal')}>{detail}</p>
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
