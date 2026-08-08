import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Megaphone, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import AnnouncementBanner from '@/components/shared/AnnouncementBanner';
import MarketingDelivery from '@/features/marketing/services/MarketingDelivery';
import { IconChip, MICRO, PANEL, Pill, TITLE } from '@/features/dashboard/components/primitives';

const DISMISSED_KEY = 'dismissed_marketing_deliveries';
const readDismissed = () => {
  try {
    const value = JSON.parse(window.localStorage.getItem(DISMISSED_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

export default function LearnerMarketingSurface({ user, dashboardOnly = false }) {
  const [deliveries, setDeliveries] = useState([]);
  const [dismissed, setDismissed] = useState(readDismissed);

  useEffect(() => {
    let active = true;
    MarketingDelivery.listActive(user?.id)
      .then((rows) => active && setDeliveries(rows))
      .catch((error) => console.warn('[marketing] Could not load learner deliveries:', error));
    return () => {
      active = false;
    };
  }, [user?.id]);

  const visible = useMemo(
    () => deliveries.filter((delivery) => !dismissed.includes(delivery.id)),
    [deliveries, dismissed]
  );
  const banner = dashboardOnly ? visible.find((delivery) => delivery.channel === 'banner') : null;
  const notification = dashboardOnly
    ? visible.find((delivery) => delivery.channel === 'in_app')
    : null;

  useEffect(() => {
    [banner, notification].filter(Boolean).forEach((delivery) => {
      MarketingDelivery.record(delivery, 'viewed', { surface: delivery.channel }).catch(() => {});
    });
  }, [banner, notification]);

  const dismiss = (delivery) => {
    const next = Array.from(new Set([...dismissed, delivery.id])).slice(-50);
    setDismissed(next);
    try {
      window.localStorage.setItem(DISMISSED_KEY, JSON.stringify(next));
    } catch {
      /* no-op */
    }
    MarketingDelivery.record(delivery, 'exited', { surface: delivery.channel }).catch(() => {});
  };

  const click = (delivery) => {
    MarketingDelivery.record(delivery, 'clicked', { destination: delivery.content?.cta_url }).catch(
      () => {}
    );
  };

  return (
    <>
      {banner && (
        <div
          className="relative z-20 w-full shrink-0"
          onClick={(event) => {
            if (event.target.closest('a')) click(banner);
          }}
        >
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
            onClick={() => dismiss(banner)}
            aria-label="Dismiss campaign banner"
            className="absolute right-3 top-1/2 z-10 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full border border-stone-200 bg-white/80 text-stone-500 dark:border-white/10 dark:bg-[#131315]/90 dark:text-stone-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <AnimatePresence>
        {notification && (
          <motion.aside
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            className={cn(PANEL, 'fixed bottom-4 right-4 z-70 w-[calc(100vw-2rem)] max-w-sm p-3.5')}
            role="status"
          >
            <div className="flex items-start gap-3">
              <IconChip icon={Megaphone} tone="accent" size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className={TITLE}>{notification.content?.title}</p>
                    <p className="mt-1 text-[12px] leading-relaxed text-slate-600 dark:text-slate-300">
                      {notification.content?.message}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => dismiss(notification)}
                    aria-label="Dismiss message"
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Pill tone="accent">For you</Pill>
                    {notification.content?.promo_code && (
                      <Pill tone="amber">{notification.content.promo_code}</Pill>
                    )}
                  </div>
                  {notification.content?.cta_url && (
                    <a
                      href={MarketingDelivery.linkFor(notification)}
                      onClick={() => click(notification)}
                      className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#5a63df] dark:text-[#afb5ff]"
                    >
                      {notification.content?.cta_label || 'Open'}
                      <ArrowRight className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <p className={cn(MICRO, 'mt-2 text-slate-400')}>Personalized campaign</p>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
