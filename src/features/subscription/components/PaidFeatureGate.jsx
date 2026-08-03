import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, LockKeyhole } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MICRO, MUTED, PANEL, PanelTitle, TILE } from '@/features/dashboard/components/primitives';

const DEFAULT_BENEFITS = ['Personalised from your results', 'Included in Pro and Premium'];

/**
 * A compact paid-feature boundary shared by Dashboard and Analytics.
 *
 * Locked content is deliberately not mounted behind a blur. That keeps real
 * personalised values out of the DOM while giving free learners a precise,
 * dashboard-native explanation of what the paid feature adds.
 */
export default function PaidFeatureGate({
  hasAccess,
  children,
  label,
  title,
  description,
  benefits = DEFAULT_BENEFITS,
  className,
  inset = false,
  onUpgrade,
}) {
  if (hasAccess) return children;

  return (
    <section
      className={cn(inset ? TILE : PANEL, 'flex h-full min-h-[230px] flex-col p-4', className)}
      aria-label={`${label} requires Pro`}
    >
      <PanelTitle
        label={label}
        action={
          <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#5a63df] dark:text-[#a9afff]">
            Pro
          </span>
        }
      />

      <div className="flex flex-1 flex-col justify-center py-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#dcdff5] bg-[#f3f3fb] text-[#5a63df] dark:border-white/10 dark:bg-white/[0.06] dark:text-[#a9afff]">
          <LockKeyhole className="h-4 w-4" strokeWidth={2.2} />
        </span>

        <h3 className="mt-3 text-[14px] font-extrabold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h3>
        <p className={cn('mt-1 max-w-md text-[11.5px] font-medium leading-relaxed', MUTED)}>
          {description}
        </p>

        <ul className="mt-3 space-y-1.5">
          {benefits.slice(0, 2).map((benefit) => (
            <li
              key={benefit}
              className="flex items-center gap-2 text-[10.5px] font-semibold text-slate-600 dark:text-slate-300"
            >
              <Check className="h-3 w-3 shrink-0 text-[rgb(var(--signal-ok))]" strokeWidth={2.75} />
              {benefit}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#eceafa] pt-3 dark:border-white/[0.07]">
        <span className={cn(MICRO, MUTED)}>Pro and Premium</span>
        {onUpgrade ? (
          <button
            type="button"
            onClick={onUpgrade}
            className={cn(
              MICRO,
              'inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[#5a63df] px-3 text-white',
              'transition-colors hover:bg-[#4a52c9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]/40'
            )}
          >
            See upgrade
            <ArrowRight className="h-3 w-3" />
          </button>
        ) : (
          <Link
            to="/upgrade"
            className={cn(
              MICRO,
              'inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[#5a63df] px-3 text-white',
              'transition-colors hover:bg-[#4a52c9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]/40'
            )}
          >
            See upgrade
            <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </section>
  );
}
