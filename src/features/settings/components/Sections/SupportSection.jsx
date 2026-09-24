import { Flag, LifeBuoy, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { IconChip, MUTED, PANEL, TILE } from '@/features/dashboard/components/primitives';

const SUPPORT_EMAIL = 'support@ieltsai.pro';

export default function SupportSection() {
  return (
    <section className={cn(PANEL, 'space-y-4 p-4 sm:p-5')} aria-labelledby="settings-support-title">
      <div className="flex items-start gap-3">
        <IconChip icon={LifeBuoy} size="md" />
        <div className="min-w-0">
          <h2
            id="settings-support-title"
            className="text-sm font-extrabold text-slate-900 dark:text-white"
          >
            Help & support
          </h2>
          <p className={cn('mt-1 text-xs font-medium leading-relaxed', MUTED)}>
            Contact our team if you have a question or run into a problem with your account.
          </p>
        </div>
      </div>

      <div className={cn(TILE, 'flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center')}>
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#5a63df]" aria-hidden="true" />
          <div className="min-w-0">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white">Email support</h3>
            <p className="mt-0.5 text-xs font-semibold text-[#5a63df] dark:text-[#a5adff]">
              {SUPPORT_EMAIL}
            </p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('IELTS Ai Pro support')}`}>
            Contact support
          </a>
        </Button>
      </div>

      <div className={cn(TILE, 'flex items-start gap-3 p-3.5')}>
        <Flag className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" aria-hidden="true" />
        <p className={cn('text-xs font-medium leading-relaxed', MUTED)}>
          Found a mistake in a Reading or Listening test? Use the flag icon in the test header to
          send the test and section details to our review queue.
        </p>
      </div>
    </section>
  );
}
