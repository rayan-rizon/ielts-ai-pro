import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Bell, CalendarClock, Megaphone, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import AnnouncementBanner from '@/components/shared/AnnouncementBanner';
import MarketingDelivery from '@/features/marketing/services/MarketingDelivery';
import {
  IconChip,
  MICRO,
  MUTED,
  PANEL,
  Pill,
  TITLE,
  WELL,
} from '@/features/dashboard/components/primitives';

const BODY = 'text-[11px] leading-relaxed text-slate-600 dark:text-slate-300';

const FEELINGS = [
  ['going_well', 'Going well'],
  ['stuck', 'Stuck'],
  ['short_on_time', 'Short on time'],
  ['taking_a_break', 'Taking a break'],
];

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

function useVisibleImpression(ref, delivery) {
  const recorded = useRef(new Set());
  useEffect(() => {
    const element = ref.current;
    if (!element || !delivery?.id || recorded.current.has(delivery.id)) return undefined;
    let timer;
    const observer = new IntersectionObserver(
      ([entry]) => {
        clearTimeout(timer);
        if (
          entry.isIntersecting &&
          entry.intersectionRatio >= 0.5 &&
          document.visibilityState === 'visible'
        ) {
          timer = window.setTimeout(() => {
            if (recorded.current.has(delivery.id) || document.visibilityState !== 'visible') return;
            recorded.current.add(delivery.id);
            Promise.allSettled([
              MarketingDelivery.record(delivery, 'viewed', {
                surface: delivery.channel,
                visibility: '50_percent_1_second',
              }),
              MarketingDelivery.feedback(delivery, 'viewed', {
                metadata: { surface: delivery.channel },
              }),
            ]);
          }, 1000);
        }
      },
      { threshold: [0.5] }
    );
    observer.observe(element);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [delivery, ref]);
}

export default function LearnerMarketingSurface({ user, dashboardOnly = false }) {
  const [deliveries, setDeliveries] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const [working, setWorking] = useState('');
  const cardRef = useRef(null);
  const bannerRef = useRef(null);

  const load = async () => {
    if (!user?.id) return;
    const [nextDeliveries, nextPreferences] = await Promise.all([
      MarketingDelivery.listActive(user.id),
      MarketingDelivery.getPreferences(user.id),
    ]);
    setDeliveries(nextDeliveries);
    setPreferences(nextPreferences);
  };

  useEffect(() => {
    let active = true;
    Promise.all([
      MarketingDelivery.listActive(user?.id),
      MarketingDelivery.getPreferences(user?.id),
    ])
      .then(([nextDeliveries, nextPreferences]) => {
        if (!active) return;
        setDeliveries(nextDeliveries);
        setPreferences(nextPreferences);
      })
      .catch((error) => console.warn('[marketing] Could not load learner guidance:', error));
    return () => {
      active = false;
    };
  }, [user?.id]);

  const primarySurface = dashboardOnly
    ? deliveries.find((delivery) => ['in_app', 'banner'].includes(delivery.channel))
    : null;
  const banner = primarySurface?.channel === 'banner' ? primarySurface : null;
  const notification = primarySurface?.channel === 'in_app' ? primarySurface : null;
  useVisibleImpression(cardRef, notification);
  useVisibleImpression(bannerRef, banner);

  const checkInDue = useMemo(() => {
    if (!preferences?.feeling_recorded_at) return true;
    return Date.now() - new Date(preferences.feeling_recorded_at).getTime() > 7 * 86_400_000;
  }, [preferences?.feeling_recorded_at]);

  const act = async (key, task, success) => {
    setWorking(key);
    try {
      await task();
      if (success) toast.success(success);
      await load();
    } catch (error) {
      toast.error(error.message || 'Could not save your preference');
    } finally {
      setWorking('');
    }
  };

  const feedback = (delivery, action, snoozedUntil = null) =>
    act(
      action,
      () => MarketingDelivery.feedback(delivery, action, { snoozedUntil }),
      action === 'snoozed' ? 'We will remind you next week' : null
    );

  const click = (delivery) => {
    Promise.allSettled([
      MarketingDelivery.record(delivery, 'clicked', {
        destination: delivery.content?.cta_url,
      }),
      MarketingDelivery.feedback(delivery, 'clicked', {
        metadata: { destination: delivery.content?.cta_url },
      }),
    ]);
  };

  const saveFeeling = (feeling) =>
    act(
      `feeling-${feeling}`,
      () =>
        MarketingDelivery.savePreferences(user.id, {
          feeling,
          feeling_recorded_at: new Date().toISOString(),
          ...(feeling === 'taking_a_break'
            ? {
                proactive_paused_until: new Date(Date.now() + 30 * 86_400_000).toISOString(),
              }
            : {}),
        }),
      'Practice preference saved'
    );

  if (!banner && !notification && !checkInDue) return null;

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-2 px-4 pt-4 md:px-6">
      {banner && (
        <div className="relative" ref={bannerRef}>
          <AnnouncementBanner
            announcement={{
              enabled: true,
              type: 'info',
              title: banner.content?.title,
              message: banner.content?.message,
              link_url: MarketingDelivery.linkFor(banner),
              link_label: banner.content?.cta_label,
              promo_code: banner.content?.promo_code,
              dismissible: false,
            }}
          />
          <button
            type="button"
            onClick={() => feedback(banner, 'dismissed')}
            aria-label="Dismiss message"
            className="absolute right-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full border border-stone-200 bg-white text-stone-500 dark:border-white/10 dark:bg-[#131315] dark:text-stone-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {notification && (
        <section
          ref={cardRef}
          className={cn(PANEL, 'overflow-hidden')}
          aria-labelledby={`guidance-${notification.id}`}
        >
          <div className="flex items-start gap-3 p-3.5 md:p-4">
            <IconChip icon={Megaphone} tone="accent" size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-2">
                    <Pill tone="accent">Suggested for you</Pill>
                    {notification.intervention?.playbook_key && (
                      <span className={cn(MICRO, MUTED)}>
                        {AUTOMATION_LABELS[notification.intervention.playbook_key] ||
                          'Learning support'}
                      </span>
                    )}
                  </div>
                  <h2 id={`guidance-${notification.id}`} className={cn(TITLE, 'mt-2')}>
                    {notification.content?.title}
                  </h2>
                  <p className={cn(BODY, 'mt-1')}>{notification.content?.message}</p>
                </div>
                {notification.content?.cta_url && (
                  <a
                    href={MarketingDelivery.linkFor(notification)}
                    onClick={() => click(notification)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#5a63df] px-3 text-[11px] font-extrabold text-white hover:bg-[#4d56ca]"
                  >
                    {notification.content?.cta_label || 'Open'}
                    <ArrowRight className="h-3 w-3" />
                  </a>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#e4e2f0] pt-2.5 dark:border-white/[0.07]">
                <button
                  type="button"
                  disabled={working === 'snoozed'}
                  onClick={() =>
                    feedback(
                      notification,
                      'snoozed',
                      new Date(Date.now() + 7 * 86_400_000).toISOString()
                    )
                  }
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-stone-500 hover:text-stone-800 disabled:opacity-50 dark:text-stone-400 dark:hover:text-stone-200"
                >
                  <CalendarClock className="h-3 w-3" /> Remind me next week
                </button>
                <span className="text-stone-300 dark:text-stone-700">·</span>
                <button
                  type="button"
                  disabled={working === 'not_interested'}
                  onClick={() => feedback(notification, 'not_interested')}
                  className="text-[10px] font-bold text-stone-500 hover:text-stone-800 disabled:opacity-50 dark:text-stone-400 dark:hover:text-stone-200"
                >
                  Not interested
                </button>
                <button
                  type="button"
                  disabled={working === 'dismissed'}
                  onClick={() => feedback(notification, 'dismissed')}
                  className="ml-auto inline-grid h-6 w-6 place-items-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                  aria-label="Dismiss suggestion"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {checkInDue && (
        <section
          className={cn(
            PANEL,
            'flex flex-col gap-3 p-3.5 md:flex-row md:items-center md:justify-between'
          )}
        >
          <div>
            <p className={cn(MICRO, MUTED)}>Optional check-in</p>
            <p className={cn(TITLE, 'mt-1')}>How does your practice feel today?</p>
            <p className={cn(BODY, 'mt-0.5')}>
              This adapts study support for seven days. It is not used to target upgrade offers.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FEELINGS.map(([value, label]) => (
              <button
                key={value}
                type="button"
                disabled={working.startsWith('feeling-')}
                onClick={() => saveFeeling(value)}
                className={cn(
                  WELL,
                  'rounded-md border border-[#e4e2f0] px-2.5 py-1.5 text-[10px] font-bold text-stone-600 hover:border-[#5a63df]/40 hover:text-[#5a63df] disabled:opacity-50 dark:border-white/[0.07] dark:text-stone-300'
                )}
              >
                {working === `feeling-${value}` ? 'Saving…' : label}
              </button>
            ))}
          </div>
          {typeof Notification !== 'undefined' && Notification.permission === 'default' && (
            <button
              type="button"
              disabled={working === 'push'}
              onClick={() =>
                act(
                  'push',
                  () => MarketingDelivery.enablePush(user.id),
                  'Practice reminders enabled'
                )
              }
              className="inline-flex items-center gap-1.5 text-[10px] font-bold text-stone-500 hover:text-[#5a63df] disabled:opacity-50 dark:text-stone-400"
            >
              <Bell className="h-3.5 w-3.5" /> Enable optional reminders
            </button>
          )}
        </section>
      )}
    </div>
  );
}
