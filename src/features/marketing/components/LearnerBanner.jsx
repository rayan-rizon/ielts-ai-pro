import { X } from 'lucide-react';
import AnnouncementBanner from '@/components/shared/AnnouncementBanner';
import MarketingDelivery from '@/features/marketing/services/MarketingDelivery';

function createAnnouncementPayload(banner) {
  const content = banner?.content || {};
  return {
    enabled: true,
    type: 'info',
    title: content.title,
    message: content.message,
    link_url: MarketingDelivery.linkFor(banner),
    link_label: content.cta_label,
    promo_code: content.promo_code,
    dismissible: false,
  };
}

export default function LearnerBanner({ banner, bannerRef, onDismiss }) {
  if (!banner) return null;

  const announcement = createAnnouncementPayload(banner);

  return (
    <div className="relative" ref={bannerRef}>
      <AnnouncementBanner announcement={announcement} />
      <button
        type="button"
        onClick={() => onDismiss(banner, 'dismissed')}
        aria-label="Dismiss message"
        className="absolute right-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full border border-stone-200 bg-white text-stone-500 dark:border-white/10 dark:bg-[#131315] dark:text-stone-300"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
