import { useEffect, useRef } from 'react';
import MarketingDelivery from '@/features/marketing/services/MarketingDelivery';

function isObservingCandidate(element, deliveryId, recordedSet) {
  if (!element) return false;
  if (!deliveryId) return false;
  return !recordedSet.has(deliveryId);
}

function isVisibleEnough(entry) {
  if (!entry?.isIntersecting) return false;
  if (entry.intersectionRatio >= 0.5) {
    return document.visibilityState === 'visible';
  }
  return false;
}

function canRecordView(deliveryId, recordedSet) {
  if (!deliveryId) return false;
  if (recordedSet.has(deliveryId)) return false;
  return document.visibilityState === 'visible';
}

function recordDeliveryImpression(delivery) {
  return Promise.allSettled([
    MarketingDelivery.record(delivery, 'viewed', {
      surface: delivery.channel,
      visibility: '50_percent_1_second',
    }),
    MarketingDelivery.feedback(delivery, 'viewed', {
      metadata: { surface: delivery.channel },
    }),
  ]);
}

export default function useVisibleImpression(ref, delivery) {
  const recorded = useRef(new Set());

  useEffect(() => {
    const element = ref?.current;
    const deliveryId = delivery?.id;

    if (!isObservingCandidate(element, deliveryId, recorded.current)) {
      return undefined;
    }

    let timer;
    const observer = new IntersectionObserver(
      ([entry]) => {
        clearTimeout(timer);
        if (!isVisibleEnough(entry)) {
          return;
        }

        timer = window.setTimeout(() => {
          if (!canRecordView(deliveryId, recorded.current)) {
            return;
          }
          recorded.current.add(deliveryId);
          recordDeliveryImpression(delivery);
        }, 1000);
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
