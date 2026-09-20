import { createPortal } from 'react-dom';
import MarketingDelivery from '@/features/marketing/services/MarketingDelivery';
import InAppNotificationCard from './InAppNotificationCard';

function getNotificationContent(notification) {
  const content = notification?.content || {};
  return {
    title: content.title || '',
    message: content.message || '',
    ctaLabel: content.cta_label || 'Open',
    ctaUrl: content.cta_url || null,
    offerExpiresAt: content.offer_expires_at || null,
    urgent: Number(content.discount_percent || 0) > 0,
  };
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

  const { title, message, ctaLabel, ctaUrl, offerExpiresAt, urgent } =
    getNotificationContent(notification);
  const snooze = () => {
    const snoozeDate = new Date(Date.now() + 7 * 86_400_000).toISOString();
    onFeedback(notification, 'snoozed', snoozeDate);
  };

  const content = (
    <InAppNotificationCard
      ref={cardRef}
      data-testid="learner-in-app-notification"
      id={notification.id}
      playbookKey={notification.intervention?.playbook_key}
      title={title}
      message={message}
      ctaLabel={ctaLabel}
      ctaHref={ctaUrl ? MarketingDelivery.linkFor(notification) : null}
      expiresAt={offerExpiresAt || (urgent ? notification.intervention?.expires_at : undefined)}
      urgent={urgent}
      onPrimary={() => onClick(notification)}
      onSnooze={snooze}
      onNotInterested={() => onFeedback(notification, 'not_interested')}
      onDismiss={() => onFeedback(notification, 'dismissed')}
      working={working}
      className="fixed inset-x-3 bottom-3 z-50 max-h-[min(80vh,32rem)] overflow-y-auto overflow-x-hidden md:inset-x-auto md:bottom-4 md:right-4 md:w-[min(27rem,calc(100vw-2rem))]"
    />
  );

  return createPortal(content, document.body);
}
