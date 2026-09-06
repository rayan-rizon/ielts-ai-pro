import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import MarketingDelivery from '@/features/marketing/services/MarketingDelivery';
import useVisibleImpression from './useVisibleImpression';

function loadLearnerData(userId) {
  return Promise.all([
    MarketingDelivery.listActive(userId),
    MarketingDelivery.getPreferences(userId),
  ]);
}

function saveLearnerFeeling(userId, feeling) {
  const pauseExtension =
    feeling === 'taking_a_break'
      ? { proactive_paused_until: new Date(Date.now() + 30 * 86_400_000).toISOString() }
      : {};

  return MarketingDelivery.savePreferences(userId, {
    feeling,
    feeling_recorded_at: new Date().toISOString(),
    ...pauseExtension,
  });
}

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

function isCheckInDue(recordedAt) {
  if (!recordedAt) return true;
  const recordedTime = new Date(recordedAt).getTime();
  const elapsed = Date.now() - recordedTime;
  return elapsed > 7 * 86_400_000;
}

function shouldShowCheckIn({ loadedUserId, userId, checkInDue, banner, notification }) {
  if (!userId) return false;
  if (loadedUserId !== userId) return false;
  if (!checkInDue) return false;
  if (banner) return false;
  if (notification) return false;
  return true;
}

function useLearnerMarketingData(userId) {
  const [deliveries, setDeliveries] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const [loadedUserId, setLoadedUserId] = useState(null);

  const reload = useCallback(async () => {
    if (!userId) return;
    const [nextDeliveries, nextPreferences] = await loadLearnerData(userId);
    setDeliveries(nextDeliveries);
    setPreferences(nextPreferences);
  }, [userId]);

  useEffect(() => {
    let active = true;
    setLoadedUserId(null);
    if (!userId) {
      return () => {
        active = false;
      };
    }

    loadLearnerData(userId)
      .then(([nextDeliveries, nextPreferences]) => {
        if (!active) return;
        setDeliveries(nextDeliveries);
        setPreferences(nextPreferences);
        setLoadedUserId(userId);
      })
      .catch((error) => console.warn('[marketing] Could not load learner guidance:', error));

    return () => {
      active = false;
    };
  }, [userId]);

  return { deliveries, preferences, loadedUserId, reload };
}

function useMarketingActions(userId, load) {
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

  const handleSaveFeeling = useCallback(
    (feeling) => {
      if (!userId) return;
      act(
        `feeling-${feeling}`,
        () => saveLearnerFeeling(userId, feeling),
        'Practice preference saved'
      );
    },
    [act, userId]
  );

  const handleEnablePush = useCallback(() => {
    if (!userId) return;
    act('push', () => MarketingDelivery.enablePush(userId), 'Practice reminders enabled');
  }, [act, userId]);

  return {
    working,
    handleFeedback,
    handleSaveFeeling,
    handleEnablePush,
  };
}

export default function useLearnerMarketing({ user, dashboardOnly = false }) {
  const userId = user ? user.id : null;
  const cardRef = useRef(null);
  const bannerRef = useRef(null);

  const { deliveries, preferences, loadedUserId, reload } = useLearnerMarketingData(userId);
  const { banner, notification } = extractActiveSurfaces(deliveries, dashboardOnly);

  useVisibleImpression(cardRef, notification);
  useVisibleImpression(bannerRef, banner);

  const recordedAt = preferences ? preferences.feeling_recorded_at : null;
  const checkInDue = useMemo(() => isCheckInDue(recordedAt), [recordedAt]);

  const showCheckIn = shouldShowCheckIn({
    loadedUserId,
    userId,
    checkInDue,
    banner,
    notification,
  });

  const actions = useMarketingActions(userId, reload);

  return {
    banner,
    notification,
    showCheckIn,
    cardRef,
    bannerRef,
    handleClick: recordClick,
    ...actions,
  };
}
