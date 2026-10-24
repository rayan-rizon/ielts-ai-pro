import React, { useState, useEffect, useRef, useId } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Zap,
  Search,
  ChevronRight,
  Volume2,
  BookOpen,
  Pencil,
  Check,
  Loader2,
} from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';
import { useWordSuggestions, useWordDefinition } from '@/features/vocabulary/hooks';
import { isUsableDefinition as hasMeaning } from '../utils/dictionaryLookup';
import { playPronunciation } from '../utils/audioUtils';
import { IconChip, PANEL, TILE, MICRO, Pill } from '@/features/dashboard/components/primitives';

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
  // Looked up together with the meaning; saved so the list can show them later.
  const [lookupMeta, setLookupMeta] = useState({ partOfSpeech: '', ipa: '' });
  const [isEditingMeaning, setIsEditingMeaning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Academic');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const meaningInputId = useId();
  const definitionEditedRef = useRef(false);
  const definitionInputRef = useRef(null);

  const { suggestions, fetchSuggestions, clearSuggestions } = useWordSuggestions();
  const {
    fetchWordDetails: fetchDefinition,
    isFetchingDef,
    error: definitionError,
    clearWordData: clearDefinitionLookup,
  } = useWordDefinition();

  useEffect(() => {
    if (isEditingMeaning) definitionInputRef.current?.focus();
  }, [isEditingMeaning]);

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

  useEffect(() => {
    const word = newWord.trim();
    if (word.length < 2) return undefined;

    let isCurrentLookup = true;
    const lookupTimer = setTimeout(async () => {
      const details = await fetchDefinition(word);
      if (!isCurrentLookup || !details || !hasMeaning(details.definition)) return;

      if (!definitionEditedRef.current) applyLookup(details);
    }, 400);

    return () => {
      isCurrentLookup = false;
      clearTimeout(lookupTimer);
    };
  }, [newWord, fetchDefinition]);

  const applyLookup = (details) => {
    setNewDefinition(details.definition);
    setNewExample(details.example || '');
    setLookupMeta({ partOfSpeech: details.partOfSpeech || '', ipa: details.phonetic || '' });
  };

  const resetLookup = () => {
    setNewDefinition('');
    setNewExample('');
    setLookupMeta({ partOfSpeech: '', ipa: '' });
  };

  const handleSelectSuggestion = (word) => {
    setNewWord(word);
    resetLookup();
    setIsEditingMeaning(false);
    definitionEditedRef.current = false;
    clearDefinitionLookup();
    clearSuggestions();
    setShowSuggestions(false);
  };

  const handleAudio = (e) => {
    e.preventDefault();
    if (!newWord.trim()) return;
    setIsPlayingAudio(true);
    playPronunciation(newWord.trim()).finally(() => setIsPlayingAudio(false));
  };

  const handleAddWord = async () => {
    if (!newWord.trim()) return;
    if (isFetchingDef) return;
    if (!user) {
      alert('Please sign in to add words.');
      return;
    }

    if (checkWordLimit(user, allVocabularyCount, onShowAlert)) {
      return;
    }

    let finalDefinition = newDefinition.trim();
    let finalExample = newExample.trim();
    let finalMeta = lookupMeta;

    if (!finalDefinition) {
      try {
        const details = await fetchDefinition(newWord.trim());
        if (hasMeaning(details?.definition)) {
          finalDefinition = details.definition;
          finalExample = details.example || '';
          finalMeta = { partOfSpeech: details.partOfSpeech || '', ipa: details.phonetic || '' };
        }
      } catch (e) {
        console.error('[Vocab] Fetch definition error', e);
      }
    }

    // A word saved with the placeholder "Saved IELTS vocabulary word" is dead weight:
    // it cannot be reviewed, drilled or read back. Ask for a definition instead of
    // persisting a filler string the learner never sees the origin of.
    if (!hasMeaning(finalDefinition)) {
      setIsEditingMeaning(true);
      const message = {
        title: 'No definition found',
        message: `We could not look up "${newWord.trim()}". Enter its meaning below, then save it again.`,
      };
      if (onShowAlert) onShowAlert(message);
      else alert(message.message);
      return;
    }

    const result = await onAddWord({
      word: newWord.trim(),
      definition: finalDefinition,
      example: finalExample,
      partOfSpeech: finalMeta.partOfSpeech,
      ipa: finalMeta.ipa,
      source: selectedCategory,
    });

    if (result === true || result?.success === true) {
      setNewWord('');
      resetLookup();
      setIsEditingMeaning(false);
      definitionEditedRef.current = false;
      clearDefinitionLookup();
      clearSuggestions();
      setShowSuggestions(false);
      onSuccess?.();
    } else {
      alert('Failed to add word: ' + (result?.error || 'Unknown error'));
    }
  };

  return (
    <div className={cn(PANEL, 'relative z-30 overflow-visible p-4')}>
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
                definitionEditedRef.current = false;
                resetLookup();
                clearDefinitionLookup();
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
                aria-label="Look up meaning"
                onClick={async () => {
                  const details = await fetchDefinition(newWord.trim());
                  if (hasMeaning(details?.definition) && !definitionEditedRef.current) {
                    applyLookup(details);
                  }
                }}
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
                className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-[#e2e5f2] bg-white py-1 dark:border-white/10 dark:bg-[#131315]"
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

        <section aria-label="Word meaning" className={cn(TILE, 'overflow-hidden')}>
          <div className="flex items-center justify-between gap-2 border-b border-[#e4e2f0] px-3.5 py-2.5 dark:border-white/[0.07]">
            <div className="flex items-center gap-2">
              <BookOpen className="h-3.5 w-3.5 text-[#5a63df]" />
              <span className={cn(MICRO, 'text-slate-500 dark:text-slate-400')}>Meaning</span>
              {hasMeaning(newDefinition) && lookupMeta.partOfSpeech && (
                <Pill className="text-[8px]">{lookupMeta.partOfSpeech}</Pill>
              )}
            </div>
            {newWord.trim() && (
              <button
                type="button"
                onClick={() => setIsEditingMeaning((editing) => !editing)}
                aria-label={
                  isEditingMeaning
                    ? 'Done editing meaning'
                    : hasMeaning(newDefinition)
                      ? 'Edit meaning'
                      : 'Enter meaning'
                }
                className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-[10px] font-bold text-[#5a63df] hover:bg-[#5a63df]/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]"
              >
                {isEditingMeaning ? <Check className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
                {isEditingMeaning ? 'Done' : hasMeaning(newDefinition) ? 'Edit' : 'Enter meaning'}
              </button>
            )}
          </div>
          <div className="px-3.5 py-3">
            {isEditingMeaning ? (
              <>
                <label htmlFor={meaningInputId} className="sr-only">
                  Meaning
                </label>
                <Textarea
                  id={meaningInputId}
                  ref={definitionInputRef}
                  rows={3}
                  value={newDefinition}
                  onChange={(e) => {
                    definitionEditedRef.current = true;
                    setNewDefinition(e.target.value);
                  }}
                  placeholder="Enter the meaning in your own words…"
                  className="min-h-0 resize-y border-[#e4e2f0] bg-white text-xs leading-relaxed shadow-none dark:border-white/10 dark:bg-white/4"
                />
              </>
            ) : (
              <div aria-live="polite" aria-atomic="true">
                {hasMeaning(newDefinition) ? (
                  <>
                    <p className="text-[13px] font-medium leading-relaxed text-slate-900 dark:text-slate-100">
                      {newDefinition}
                    </p>
                    {newExample && (
                      <div className="mt-3 border-l-2 border-[#5a63df]/30 pl-2.5">
                        <span className={cn(MICRO, 'text-slate-400')}>Example</span>
                        <p className="mt-1 text-xs italic leading-relaxed text-slate-600 dark:text-slate-400">
                          {newExample}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="flex items-center gap-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {isFetchingDef && (
                      <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[#5a63df]" />
                    )}
                    {isFetchingDef
                      ? 'Looking up meaning…'
                      : definitionError
                        ? 'No dictionary meaning found. You can enter one manually.'
                        : newWord.trim()
                          ? 'Finding the meaning…'
                          : 'Type a word to see its meaning.'}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        <Button
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#5a63df] text-xs font-bold text-white transition-all hover:bg-[#4a52c9] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          onClick={handleAddWord}
          disabled={isAdding || isFetchingDef || !newWord.trim()}
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          {isAdding ? 'Adding Word...' : 'Save Word'}
        </Button>
      </div>
    </div>
  );
}
