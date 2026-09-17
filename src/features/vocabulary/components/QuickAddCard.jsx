import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Zap, Search, ChevronRight, Volume2 } from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';
import { useWordSuggestions, useWordDefinition } from '@/features/vocabulary/hooks';
import { playPronunciation } from '../utils/audioUtils';
import { IconChip, PANEL, Pill } from '@/features/dashboard/components/primitives';

const VOCABULARY_LIMITS = { free: 100, pro: 300, premium: Infinity };
const CATEGORIES = ['Academic', 'Speaking', 'Writing', 'Reading'];

const getWordLimit = (subscriptionTier) => {
  const tier = (subscriptionTier || 'free').toLowerCase();
  return VOCABULARY_LIMITS[tier] || VOCABULARY_LIMITS.free;
};

function checkWordLimit(user, allVocabularyCount, onShowAlert) {
  const wordLimit = getWordLimit(user?.subscription_tier);
  if (allVocabularyCount >= wordLimit) {
    const tierName = (user?.subscription_tier || 'free').toLowerCase();
    let message = '';
    if (tierName === 'free') {
      message = `Free accounts can save up to ${wordLimit} words. Upgrade to Pro or Premium for unlimited storage.`;
    } else if (tierName === 'pro') {
      message = `Pro accounts can save up to ${wordLimit} words. Upgrade to Premium for unlimited storage.`;
    }

    onShowAlert?.({
      title: 'Word Limit Reached',
      message: message,
    });
    return true;
  }
  return false;
}

export default function QuickAddCard({
  onAddWord,
  isAdding,
  user,
  allVocabularyCount = 0,
  onShowAlert,
  onSuccess,
}) {
  const [newWord, setNewWord] = useState('');
  const [newDefinition, setNewDefinition] = useState('');
  const [newExample, setNewExample] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Academic');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const { suggestions, fetchSuggestions, clearSuggestions } = useWordSuggestions();
  const { fetchWordDetails: fetchDefinition, isFetchingDef } = useWordDefinition();

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (newWord.trim().length >= 2) {
        fetchSuggestions(newWord);
      } else {
        clearSuggestions();
      }
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [newWord, fetchSuggestions, clearSuggestions]);

  const handleSelectSuggestion = async (word) => {
    setNewWord(word);
    clearSuggestions();
    setShowSuggestions(false);

    const details = await fetchDefinition(word);
    if (details) {
      setNewDefinition(details.definition || '');
      if (details.example) setNewExample(details.example);
    }
  };

  const handleAudio = (e) => {
    e.preventDefault();
    if (!newWord.trim()) return;
    setIsPlayingAudio(true);
    playPronunciation(newWord.trim()).finally(() => setIsPlayingAudio(false));
  };

  const handleAddWord = async () => {
    if (!newWord.trim()) return;
    if (!user) {
      alert('Please sign in to add words.');
      return;
    }

    if (checkWordLimit(user, allVocabularyCount, onShowAlert)) {
      return;
    }

    let finalDefinition = newDefinition.trim();
    let finalExample = newExample.trim();

    if (!finalDefinition) {
      try {
        const details = await fetchDefinition(newWord.trim());
        if (details?.definition) {
          finalDefinition = details.definition;
          finalExample = details.example || '';
        }
      } catch (e) {
        console.error('[Vocab] Fetch definition error', e);
      }
    }

    // A word saved with the placeholder "Saved IELTS vocabulary word" is dead weight:
    // it cannot be reviewed, drilled or read back. Ask for a definition instead of
    // persisting a filler string the learner never sees the origin of.
    if (!finalDefinition) {
      onShowAlert?.({
        title: 'No definition found',
        message: `We could not look up "${newWord.trim()}". Add a short definition yourself and save it again.`,
      });
      return;
    }

    const result = await onAddWord({
      word: newWord.trim(),
      definition: finalDefinition,
      example: finalExample,
      source: selectedCategory,
    });

    if (result.success || result) {
      setNewWord('');
      setNewDefinition('');
      setNewExample('');
      clearSuggestions();
      setShowSuggestions(false);
      onSuccess?.();
    } else {
      alert('Failed to add word: ' + (result.error || 'Unknown error'));
    }
  };

  return (
    <div className={cn(PANEL, 'relative z-30 overflow-visible p-4')}>
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#5a63df]/10 blur-xl" />
      <div className="relative flex flex-wrap items-center justify-between gap-2 border-b border-[#eeedf7] pb-3 dark:border-white/[0.07]">
        <h3 className="flex min-w-0 items-center gap-2 text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
          <IconChip icon={Plus} />
          <span className="truncate">Quick Add Word</span>
        </h3>
        <Pill tone="accent" className="shrink-0 text-[8.5px]">
          Auto lookup
        </Pill>
      </div>

      <div className="relative space-y-4 overflow-visible pt-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
            Category
          </label>
          <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-200 text-center',
                  selectedCategory === cat
                    ? 'bg-[#5a63df] text-white'
                    : 'border border-[#e2e5f2] bg-white text-slate-700 hover:border-[#c9cdf3] dark:border-white/10 dark:bg-white/5 dark:text-slate-300'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="relative space-y-1.5">
          <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
            Word or expression
          </label>
          <div className="group relative">
            <Input
              placeholder="Type a word to save..."
              className="h-11 rounded-lg border-[#e2e5f2] bg-white pl-3.5 pr-16 text-xs font-semibold text-slate-900 focus:border-[#5a63df] dark:border-white/10 dark:bg-white/4 dark:text-white"
              value={newWord}
              onChange={(e) => {
                setNewWord(e.target.value);
                setShowSuggestions(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddWord();
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onFocus={() => setShowSuggestions(true)}
              autoComplete="off"
            />

            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
              {newWord.trim() && (
                <button
                  type="button"
                  onClick={handleAudio}
                  className={cn(
                    'rounded-lg p-1.5 text-slate-400 transition-colors hover:text-[#5a63df]',
                    isPlayingAudio && 'animate-pulse bg-[#5a63df]/10 text-[#5a63df]'
                  )}
                  title="Test audio"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-lg text-[#5a63df] hover:bg-[#5a63df]/10"
                onClick={handleAddWord}
                disabled={isFetchingDef || !newWord.trim()}
              >
                <Zap className={cn('h-4 w-4', isFetchingDef && 'animate-spin')} />
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <m.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-[#e2e5f2] bg-white py-1 shadow-lg dark:border-white/10 dark:bg-[#131315]"
              >
                {suggestions.map((sug, index) => (
                  <div
                    key={index}
                    className="group/item flex cursor-pointer items-center justify-between px-3.5 py-2 text-xs font-bold text-slate-900 transition-colors hover:bg-[#f4f3fb] dark:text-slate-200 dark:hover:bg-white/5"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectSuggestion(sug.word);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Search className="h-3.5 w-3.5 text-[#5a63df]" />
                      <span>{sug.word}</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400 opacity-0 transition-opacity group-hover/item:opacity-100" />
                  </div>
                ))}
              </m.div>
            )}
          </AnimatePresence>
        </div>

        {newDefinition && (
          <div className="rounded-lg border border-[#e2e5f2] bg-[#5a63df]/6 p-3 text-xs font-semibold italic leading-relaxed text-[#5a63df] dark:border-white/10 dark:bg-indigo-950/40 dark:text-indigo-200">
            &quot;{newDefinition}&quot;
          </div>
        )}

        <Button
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#5a63df] text-xs font-bold text-white transition-all hover:bg-[#4a52c9] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          onClick={handleAddWord}
          disabled={isAdding || !newWord.trim()}
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          {isAdding ? 'Adding Word...' : 'Save Word'}
        </Button>
      </div>
    </div>
  );
}
