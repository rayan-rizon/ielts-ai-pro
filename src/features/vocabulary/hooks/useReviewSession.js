import { useState, useCallback } from 'react';
import { UserPoints } from '@/features/gamification/services/UserPoints';
import { VocabularyItem } from '@/features/vocabulary/services/VocabularyItem';
import { recordVocabularyReviewEvent } from '@/features/vocabulary/services/vocabularyRetention';

// Simple SRS algorithm
const calculateNextReview = (item, quality) => {
  const now = new Date();
  let interval = 1;
  let easeFactor = item.ease_factor || 2.5;
  const timesReviewed = item.times_reviewed || 0;

  if (quality >= 3) {
    if (timesReviewed === 0) {
      interval = 1;
    } else if (timesReviewed === 1) {
      interval = 6;
    } else {
      interval = Math.round((item.interval_days || 1) * easeFactor);
    }
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  } else {
    interval = 1;
  }

  if (easeFactor < 1.3) easeFactor = 1.3;

  const nextReviewDate = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

  return {
    next_review_date: nextReviewDate.toISOString(),
    interval_days: interval,
    ease_factor: easeFactor,
    times_reviewed: quality >= 3 ? timesReviewed + 1 : 0,
    last_reviewed: now.toISOString(),
  };
};

/**
 * Custom hook for vocabulary review session
 * Handles the SRS-based review session logic
 */
export function useReviewSession({
  dueForReview,
  setDueForReview,
  setAllVocabulary,
  user,
  onReviewRecorded,
  onSessionComplete,
}) {
  const [isReviewSessionOpen, setIsReviewSessionOpen] = useState(false);
  const [currentReviewItem, setCurrentReviewItem] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);

  const startReviewSession = useCallback(() => {
    if (dueForReview.length === 0) return false;
    setCurrentReviewItem(dueForReview[0]);
    setIsFlipped(false);
    setIsReviewSessionOpen(true);
    return true;
  }, [dueForReview]);

  const handleReviewSubmit = useCallback(
    async (quality) => {
      if (!currentReviewItem) return;

      const updates = calculateNextReview(currentReviewItem, quality);
      const newMasteryLevel =
        quality >= 4
          ? Math.min((currentReviewItem.mastery_level || 0) + 1, 5)
          : Math.max((currentReviewItem.mastery_level || 0) - 1, 0);

      try {
        await VocabularyItem.update(currentReviewItem.id, {
          ...updates,
          mastery_level: newMasteryLevel,
        });

        try {
          await recordVocabularyReviewEvent({
            userId: currentReviewItem.user_id || user?.id,
            vocabularyItemId: currentReviewItem.id,
            quality,
          });
          onReviewRecorded?.();
        } catch (reviewEventError) {
          // A review still counts for SRS if analytics persistence is temporarily unavailable.
          console.warn('Failed to record vocabulary review event:', reviewEventError);
        }

        // Update local state
        setAllVocabulary((prev) =>
          prev.map((item) =>
            item.id === currentReviewItem.id
              ? { ...item, ...updates, mastery_level: newMasteryLevel }
              : item
          )
        );

        // Award XP for review
        if (user?.id) {
          try {
            await UserPoints.addPoints(
              user.id,
              3,
              'vocabulary_review',
              `vocabulary-review:${currentReviewItem.id}:${updates.last_reviewed.slice(0, 10)}`
            );
          } catch (xpError) {
            console.warn('Failed to update XP:', xpError);
          }
        }

        // Move to next item
        const nextItems = dueForReview.filter((item) => item.id !== currentReviewItem.id);
        setDueForReview(nextItems);

        if (nextItems.length > 0) {
          setCurrentReviewItem(nextItems[0]);
          setIsFlipped(false);
        } else {
          setIsReviewSessionOpen(false);
          setCurrentReviewItem(null);
          await onSessionComplete?.();
        }
      } catch (error) {
        console.error('Review submit error:', error);
      }
    },
    [
      currentReviewItem,
      dueForReview,
      setDueForReview,
      setAllVocabulary,
      user,
      onReviewRecorded,
      onSessionComplete,
    ]
  );

  const closeReviewSession = useCallback(() => {
    setIsReviewSessionOpen(false);
    setCurrentReviewItem(null);
    setIsFlipped(false);
  }, []);

  const flipCard = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  return {
    isReviewSessionOpen,
    currentReviewItem,
    isFlipped,
    startReviewSession,
    handleReviewSubmit,
    closeReviewSession,
    flipCard,
    remainingCount: dueForReview.length,
  };
}
