import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import MarketingDelivery from '@/features/marketing/services/MarketingDelivery';
import useVisibleImpression from './useVisibleImpression';

function recordClick(delivery) {
  const destination = delivery?.content?.cta_url;
  Promise.allSettled([
    MarketingDelivery.record(delivery, 'clicked', { destination }),
    MarketingDelivery.feedback(delivery, 'clicked', {
      metadata: { destination },
    }),
  ]);
}

function selectPrimarySurface(deliveries, dashboardOnly) {
  if (!dashboardOnly) return null;
  const inApp = deliveries.find((delivery) => delivery.channel === 'in_app');
  if (inApp) return inApp;
  return deliveries.find((delivery) => delivery.channel === 'banner') || null;
}

function extractActiveSurfaces(deliveries, dashboardOnly) {
  const primary = selectPrimarySurface(deliveries, dashboardOnly);
  if (!primary) {
    return { banner: null, notification: null };
  }
  return {
    banner: primary.channel === 'banner' ? primary : null,
    notification: primary.channel === 'in_app' ? primary : null,
  };
}

function useLearnerMarketingData(userId) {
  const [deliveries, setDeliveries] = useState([]);

  const reload = useCallback(async () => {
    if (!userId) return;
    setDeliveries(await MarketingDelivery.listActive(userId));
  }, [userId]);

  useEffect(() => {
    let active = true;
    if (!userId) {
      return () => {
        active = false;
      };
    }

    MarketingDelivery.listActive(userId)
      .then((nextDeliveries) => {
        if (active) setDeliveries(nextDeliveries);
      })
      .catch((error) => console.warn('[marketing] Could not load learner guidance:', error));

    return () => {
      active = false;
    };
  }, [userId]);

  return { deliveries, reload };
}

function useMarketingActions(load) {
  const [working, setWorking] = useState('');

  const act = useCallback(
    async (key, task, successMessage) => {
      setWorking(key);
      try {
        await task();
        if (successMessage) {
          toast.success(successMessage);
        }
        await load();
      } catch (error) {
        toast.error(error.message || 'Could not save your preference');
      } finally {
        setWorking('');
      }
    },
    [load]
  );

  const handleFeedback = useCallback(
    (delivery, action, snoozedUntil = null) => {
      const successMessage = action === 'snoozed' ? 'We will remind you next week' : null;
      return act(
        action,
        () => MarketingDelivery.feedback(delivery, action, { snoozedUntil }),
        successMessage
      );
    },
    [act]
  );

  return {
    working,
    handleFeedback,
  };
}

export default function useLearnerMarketing({ user, dashboardOnly = false }) {
  const userId = user ? user.id : null;
  const cardRef = useRef(null);
  const bannerRef = useRef(null);

  const { deliveries, reload } = useLearnerMarketingData(userId);
  const { banner, notification } = extractActiveSurfaces(deliveries, dashboardOnly);

  useVisibleImpression(cardRef, notification);
  useVisibleImpression(bannerRef, banner);

  const actions = useMarketingActions(reload);

  return {
    banner,
    notification,
    cardRef,
    bannerRef,
    handleClick: recordClick,
    ...actions,
  };
}
