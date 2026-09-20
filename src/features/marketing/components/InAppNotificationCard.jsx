import { forwardRef } from 'react';
import {
  ArrowRight,
  BookmarkCheck,
  CalendarClock,
  CalendarDays,
  Compass,
  CreditCard,
  Gauge,
  Gift,
  Megaphone,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import ExpiryTimer from '@/components/shared/ExpiryTimer';
import {
  IconChip,
  MICRO,
  MUTED,
  PANEL,
  Pill,
  TITLE,
} from '@/features/dashboard/components/primitives';

const PRESENTATION = {
  first_practice: {
    label: 'Your starting point',
    context: 'Matched to your IELTS goal',
    icon: Compass,
    tone: 'accent',
  },
  next_practice: {
    label: 'Your next step',
    context: 'Based on your saved result',
    icon: TrendingUp,
    tone: 'emerald',
  },
  subscriber_feature_help: {
    label: 'Included in your plan',
    context: 'Selected from your unused benefits',
    icon: Sparkles,
    tone: 'accent',
  },
  quota_upgrade: {
    label: 'Feedback access',
    context: 'Based on your recent usage',
    icon: Gauge,
    tone: 'amber',
  },
  re_engagement: {
    label: 'Continue from here',
    context: 'Your progress is still saved',
    icon: RotateCcw,
    tone: 'sky',
  },
  cancellation_support: {
    label: 'Plan support',
    context: 'Before your current access ends',
    icon: ShieldCheck,
    tone: 'amber',
  },
  referral_bonus_reminder: {
    label: 'Available reward',
    context: 'Based on your verified balance',
    icon: Gift,
    tone: 'emerald',
  },
  score_plateau: {
    label: 'Focused improvement',
    context: 'Based on comparable results',
    icon: TrendingUp,
    tone: 'accent',
  },
  incomplete_test: {
    label: 'Saved test',
    context: 'Your answers are waiting',
    icon: BookmarkCheck,
    tone: 'sky',
  },
  exam_countdown: {
    label: 'Exam plan',
    context: 'Built around your confirmed date',
    icon: CalendarDays,
    tone: 'rose',
  },
  checkout_recovery: {
    label: 'Plan help',
    context: 'Your selected plan is still available',
    icon: CreditCard,
    tone: 'accent',
  },
};

function notificationPresentation(playbookKey) {
  return (
    PRESENTATION[playbookKey] || {
      label: 'Picked for you',
      context: 'Based on your latest activity',
      icon: Megaphone,
      tone: 'accent',
    }
  );
}

const InAppNotificationCard = forwardRef(function InAppNotificationCard(
  {
    id = 'preview',
    playbookKey,
    title,
    message,
    ctaLabel = 'Open',
    ctaHref,
    expiresAt,
    urgent = false,
    onPrimary,
    onSnooze,
    onNotInterested,
    onDismiss,
    working,
    preview = false,
    className,
    ...rest
  },
  ref
) {
  const presentation = notificationPresentation(playbookKey);
  const Icon = presentation.icon;
  const headingId = `guidance-${id}`;
  const ctaClass =
    'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md bg-[#5a63df] px-3.5 text-[11px] font-extrabold text-white transition-colors hover:bg-[#4d56ca] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#131315]';

  return (
    <section
      ref={ref}
      className={cn(PANEL, 'relative overflow-hidden', className)}
      aria-labelledby={headingId}
      aria-live={preview ? undefined : 'polite'}
      {...rest}
    >
      <div className="h-1 bg-[#5a63df] dark:bg-[#8f97ff]" aria-hidden="true" />
      <div className="p-4 sm:p-[18px]">
        <div className="flex items-start gap-3">
          <IconChip icon={Icon} tone={presentation.tone} size="md" className="mt-0.5" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={presentation.tone}>{presentation.label}</Pill>
              <span className={cn(MICRO, MUTED)}>IELTS AI Pro</span>
              {expiresAt && (
                <ExpiryTimer
                  expiresAt={expiresAt}
                  prefix={urgent ? 'Offer available' : 'Available'}
                  urgent={urgent}
                />
              )}
            </div>
            <h2 id={headingId} className={cn(TITLE, 'mt-2 text-[15px] leading-snug')}>
              {title}
            </h2>
            <p className="mt-1.5 text-[12px] leading-[1.55] text-slate-600 dark:text-slate-300">
              {message}
            </p>
          </div>
          {onDismiss && (
            <button
              type="button"
              disabled={working === 'dismissed'}
              onClick={onDismiss}
              className="-mr-1 -mt-1 inline-grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 dark:hover:bg-white/[0.07] dark:hover:text-slate-200"
              aria-label="Dismiss suggestion"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {ctaHref ? (
            <a href={ctaHref} onClick={onPrimary} className={ctaClass}>
              {ctaLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          ) : (
            <button type="button" onClick={onPrimary} className={ctaClass}>
              {ctaLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
          {onSnooze && (
            <button
              type="button"
              aria-label="Remind me next week"
              disabled={working === 'snoozed'}
              onClick={onSnooze}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2.5 text-[10px] font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-white/[0.07] dark:hover:text-slate-100"
            >
              <CalendarClock className="h-3.5 w-3.5" /> Later
            </button>
          )}
          {onNotInterested && (
            <button
              type="button"
              aria-label="Not interested"
              disabled={working === 'not_interested'}
              onClick={onNotInterested}
              className="ml-auto min-h-9 rounded-md px-2 text-[10px] font-bold text-slate-500 transition-colors hover:text-slate-800 disabled:opacity-50 dark:text-slate-400 dark:hover:text-slate-100"
            >
              Not for me
            </button>
          )}
        </div>
      </div>
    </section>
  );
});

export default InAppNotificationCard;
