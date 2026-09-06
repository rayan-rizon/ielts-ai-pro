import { createPortal } from 'react-dom';
import { ArrowRight, CalendarClock, Megaphone, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import MarketingDelivery from '@/features/marketing/services/MarketingDelivery';
import {
  IconChip,
  MICRO,
  MUTED,
  PANEL,
  Pill,
  TITLE,
} from '@/features/dashboard/components/primitives';

const BODY = 'text-[11px] leading-relaxed text-slate-600 dark:text-slate-300';

const AUTOMATION_LABELS = {
  first_practice: 'Getting started',
  next_practice: 'Your next step',
  subscriber_feature_help: 'Plan guidance',
  quota_upgrade: 'AI feedback access',
  re_engagement: 'Return support',
  cancellation_support: 'Plan ending support',
  referral_bonus_reminder: 'Referral bonus',
  score_plateau: 'Steady score support',
  incomplete_test: 'Saved test',
  exam_countdown: 'Exam plan',
  checkout_recovery: 'Checkout help',
};

function getPlaybookLabel(intervention) {
  if (!intervention) return null;
  const key = intervention.playbook_key;
  if (!key) return null;
  return AUTOMATION_LABELS[key] || 'Learning support';
}

function getNotificationContent(notification) {
  const content = notification?.content || {};
  return {
    title: content.title || '',
    message: content.message || '',
    ctaLabel: content.cta_label || 'Open',
    ctaUrl: content.cta_url || null,
  };
}

function PlaybookBadge({ label }) {
  if (!label) return null;
  return <span className={cn(MICRO, MUTED)}>{label}</span>;
}

function NotificationCtaButton({ ctaUrl, ctaLabel, notification, onClick }) {
  if (!ctaUrl) return null;
  return (
    <a
      href={MarketingDelivery.linkFor(notification)}
      onClick={() => onClick(notification)}
      className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#5a63df] px-3 text-[11px] font-extrabold text-white hover:bg-[#4d56ca]"
    >
      {ctaLabel}
      <ArrowRight className="h-3 w-3" />
    </a>
  );
}

function NotificationActions({ notification, working, onFeedback }) {
  const handleSnooze = () => {
    const snoozeDate = new Date(Date.now() + 7 * 86_400_000).toISOString();
    onFeedback(notification, 'snoozed', snoozeDate);
  };
  const handleNotInterested = () => onFeedback(notification, 'not_interested');
  const handleDismiss = () => onFeedback(notification, 'dismissed');

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#e4e2f0] pt-2.5 dark:border-white/[0.07]">
      <button
        type="button"
        disabled={working === 'snoozed'}
        onClick={handleSnooze}
        className="inline-flex items-center gap-1 text-[10px] font-bold text-stone-500 hover:text-stone-800 disabled:opacity-50 dark:text-stone-400 dark:hover:text-stone-200"
      >
        <CalendarClock className="h-3 w-3" /> Remind me next week
      </button>
      <span className="text-stone-300 dark:text-stone-700">·</span>
      <button
        type="button"
        disabled={working === 'not_interested'}
        onClick={handleNotInterested}
        className="text-[10px] font-bold text-stone-500 hover:text-stone-800 disabled:opacity-50 dark:text-stone-400 dark:hover:text-stone-200"
      >
        Not interested
      </button>
      <button
        type="button"
        disabled={working === 'dismissed'}
        onClick={handleDismiss}
        className="ml-auto inline-grid h-6 w-6 place-items-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
        aria-label="Dismiss suggestion"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function LearnerInAppNotification({
  notification,
  cardRef,
  working,
  onFeedback,
  onClick,
}) {
  if (!notification) return null;
  if (typeof document === 'undefined') return null;

  const { title, message, ctaLabel, ctaUrl } = getNotificationContent(notification);
  const automationLabel = getPlaybookLabel(notification.intervention);

  const content = (
    <section
      ref={cardRef}
      data-testid="learner-in-app-notification"
      className={cn(
        PANEL,
        'fixed inset-x-3 bottom-3 z-50 max-h-[min(80vh,28rem)] overflow-y-auto overflow-x-hidden md:inset-x-auto md:bottom-4 md:right-4 md:w-[min(26rem,calc(100vw-2rem))]'
      )}
      aria-labelledby={`guidance-${notification.id}`}
      aria-live="polite"
    >
      <div className="flex items-start gap-3 p-3.5 md:p-4">
        <IconChip icon={Megaphone} tone="accent" size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2">
                <Pill tone="accent">Suggested for you</Pill>
                <PlaybookBadge label={automationLabel} />
              </div>
              <h2 id={`guidance-${notification.id}`} className={cn(TITLE, 'mt-2')}>
                {title}
              </h2>
              <p className={cn(BODY, 'mt-1')}>{message}</p>
            </div>
            <NotificationCtaButton
              ctaUrl={ctaUrl}
              ctaLabel={ctaLabel}
              notification={notification}
              onClick={onClick}
            />
          </div>
          <NotificationActions
            notification={notification}
            working={working}
            onFeedback={onFeedback}
          />
        </div>
      </div>
    </section>
  );

  return createPortal(content, document.body);
}
