import { useState, useCallback } from 'react';
import { UserPoints } from '@/features/gamification/services/UserPoints';
import { VocabularyItem } from '@/features/vocabulary/services/VocabularyItem';

/** First review one day after saving, matching the SRS interval for a new item. */
const nextDayIso = () => new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

/**
 * Custom hook for vocabulary CRUD operations
 * Handles adding, deleting, and toggling mastery of vocabulary items
 */
export function useVocabularyMutations({ user, allVocabulary, setAllVocabulary }) {
  const [isAdding, setIsAdding] = useState(false);

  const handleAddWord = useCallback(
    async ({ word, definition, example, source = 'Manual' }) => {
      if (!word.trim()) return { success: false, error: 'Word is required' };

      // Check limit
      const tier = (user?.subscription_tier || 'free').toLowerCase();
      const limits = { free: 100, pro: 300, premium: Infinity };
      const limit = limits[tier] || limits.free;

      if (allVocabulary.length >= limit) {
        return {
          success: false,
          error: `You've reached your limit of ${limit} words. Upgrade to add more!`,
        };
      }

      setIsAdding(true);
      try {
        const newItem = await VocabularyItem.create({
          word: word.trim(),
          definition: definition || '',
          example: example || '',
          user_id: user?.id,
          created_by: user?.id,
          mastery_level: 0,
          // Due tomorrow, not "null". A null date read as due-right-now for every
          // word ever saved, so the review queue never emptied and never ordered.
          next_review_date: nextDayIso(),
          source,
        });

        setAllVocabulary((prev) => [newItem, ...prev]);

        // Award XP for adding vocabulary
        if (user?.id) {
          try {
            await UserPoints.addPoints(
              user.id,
              5,
              'vocabulary_add',
              `vocabulary-add:${newItem.id}`
            );
          } catch (xpError) {
            console.warn('Failed to update XP:', xpError);
          }
        }

        return { success: true, item: newItem };
      } catch (error) {
        console.error('Add word error:', error);
        return { success: false, error: error.message };
      } finally {
        setIsAdding(false);
      }
    },
    [user, allVocabulary, setAllVocabulary]
  );

  const handleDeleteWord = useCallback(
    async (id) => {
      try {
        await VocabularyItem.delete(id);
        setAllVocabulary((prev) => prev.filter((item) => item.id !== id));
        return { success: true };
      } catch (error) {
        console.error('Delete word error:', error);
        return { success: false, error: error.message };
      }
    },
    [setAllVocabulary]
  );

  const handleToggleMastery = useCallback(
    async (id, currentLevel) => {
      const newLevel = currentLevel >= 4 ? 0 : 4;
      try {
        await VocabularyItem.update(id, { mastery_level: newLevel });
        setAllVocabulary((prev) =>
          prev.map((item) => (item.id === id ? { ...item, mastery_level: newLevel } : item))
        );

        // No XP here on purpose. Marking a word known is the learner's own claim,
        // not a measured result — awarding points for it made every word worth 10
        // points for one click. Review XP is granted in useReviewSession, where a
        // recall attempt actually happened.

        return { success: true, newLevel };
      } catch (error) {
        console.error('Toggle mastery error:', error);
        return { success: false, error: error.message };
      }
    },
    [setAllVocabulary]
  );

  const handleClearAllWords = useCallback(async () => {
    try {
      // Delete all words for this user
      const deletePromises = allVocabulary
        .filter(Boolean)
        .map((item) => VocabularyItem.delete(item.id));
      await Promise.all(deletePromises);
      setAllVocabulary([]);
      return { success: true };
    } catch (error) {
      console.error('Clear all error:', error);
      return { success: false, error: error.message };
    }
  }, [allVocabulary, setAllVocabulary]);

  const handleExportWords = useCallback(() => {
    if (allVocabulary.length === 0) {
      return { success: false, error: 'No words to export' };
    }

    const csvContent = [
      ['Word', 'Definition', 'Example', 'Mastery Level', 'Source'].join(','),
      ...allVocabulary
        .filter((item) => item && item.word)
        .map((item) =>
          [
            `"${item.word}"`,
            `"${(item.definition || '').replace(/"/g, '""')}"`,
            `"${(item.example || '').replace(/"/g, '""')}"`,
            item.mastery_level || 0,
            `"${item.source || 'Manual'}"`,
          ].join(',')
        ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `vocabulary_export_${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true };
  }, [allVocabulary]);

  return {
    isAdding,
    handleAddWord,
    handleDeleteWord,
    handleToggleMastery,
    handleClearAllWords,
    handleExportWords,
  };
}
