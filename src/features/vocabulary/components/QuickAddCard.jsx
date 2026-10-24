import React, { useState, useEffect, useRef, useId } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Sparkles,
  Search,
  ChevronRight,
  Volume2,
  BookOpen,
  Pencil,
  Check,
  Loader2,
  AlertCircle,
  Languages,
} from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';
import {
  useWordSuggestions,
  useWordDefinition,
  useVocabularyLanguage,
} from '@/features/vocabulary/hooks';
import { isUsableDefinition as hasMeaning } from '../utils/dictionaryLookup';
import { cardToItemFields } from '../utils/vocabCard';
import { describeLookupError } from '../utils/lookupMessages';
import { playPronunciation } from '../utils/audioUtils';
import { getCachedCard, resolveDefineLanguage } from '../services/vocabDefineService';
import { getLanguageName, SUPPORTED_LANGUAGES } from '../services/translateService';
import { WordCardBody, WordMetaRow } from './WordCardBody';
import { IconChip, PANEL, TILE, MICRO, Pill } from '@/features/dashboard/components/primitives';

const VOCABULARY_LIMITS = { free: 100, pro: 300, premium: Infinity };
const CATEGORIES = ['Academic', 'Speaking', 'Writing', 'Reading'];
// A pause this long after typing a word the suggestion list confirms is a lookup.
// Anything shorter would spend an AI lookup on every half-typed word.
const AUTO_LOOKUP_DELAY_MS = 900;
const QUOTA_HINT_THRESHOLD = 10;
const REFUSAL_KINDS = ['quota', 'burst', 'busy', 'budget'];

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

const LookupNotice = ({ error, retryIn }) => {
  const message = describeLookupError(error, retryIn);
  if (!message) return null;
  return (
    <p
      role="status"
      className="flex items-start gap-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300"
    >
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
      <span>{message}</span>
    </p>
  );
};

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
  const [exampleIndex, setExampleIndex] = useState(0);
  const [isEditingMeaning, setIsEditingMeaning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Academic');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const meaningInputId = useId();
  const definitionEditedRef = useRef(false);
  const definitionInputRef = useRef(null);
  const autoTriedRef = useRef('');

  const { suggestions, fetchSuggestions, clearSuggestions } = useWordSuggestions();
  const {
    lookup,
    isLooking,
    card,
    error: lookupError,
    quota,
    retryIn,
    clear: clearLookup,
  } = useWordDefinition();

  const word = newWord.trim();
  const [savedLanguage, setSavedLanguage] = useVocabularyLanguage();
  const language = resolveDefineLanguage(savedLanguage);
  const languageLabel = getLanguageName(language);
  const isRefused = retryIn > 0 && REFUSAL_KINDS.includes(lookupError?.kind);
  const hasAiMeaning = Boolean(card?.meaning);
  // Once the learner rewrites the meaning, the AI's translation, examples and
  // collocations describe a different sentence and stop being shown or saved.
  const isEdited = definitionEditedRef.current;
  const showsAiCard = hasAiMeaning && !isEdited;
  const meaningText = isEdited ? newDefinition : card?.meaning || newDefinition;
  const examples = showsAiCard ? card.examples || [] : [];

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

  const runLookup = async (entry) => {
    // Whatever the outcome, this word in this language has been tried: the automatic
    // lookup must not retry a failure on its own. Only the learner asks again.
    autoTriedRef.current = `${entry.toLowerCase()}|${language}`;
    const found = await lookup(entry, { language });
    if (found && !definitionEditedRef.current) setNewDefinition(found.meaning);
    return found;
  };

  // Automatic lookup only for a word the spelling list recognises, or one already
  // in the local cache (free). Typing "mitig" must not cost a generation, and a
  // failed lookup must not turn into a retry loop.
  useEffect(() => {
    if (word.length < 2 || card || isLooking || isRefused || definitionEditedRef.current)
      return undefined;
    if (autoTriedRef.current === `${word.toLowerCase()}|${language}`) return undefined;
    const confirmed =
      Boolean(getCachedCard(word, { language })) ||
      suggestions.some((item) => item.word?.toLowerCase() === word.toLowerCase());
    if (!confirmed) return undefined;
    const timer = setTimeout(() => runLookup(word), AUTO_LOOKUP_DELAY_MS);
    return () => clearTimeout(timer);
    // runLookup only closes over `language` and the stable `lookup`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word, suggestions, card, isLooking, isRefused, language]);

  const resetCard = () => {
    setNewDefinition('');
    setExampleIndex(0);
    definitionEditedRef.current = false;
    clearLookup();
  };

  const handleLanguageChange = (code) => {
    if (code === savedLanguage) return;
    // The card was written in the old language; the new one is a different card.
    resetCard();
    setIsEditingMeaning(false);
    setSavedLanguage(code);
  };

  const handleSelectSuggestion = (selected) => {
    setNewWord(selected);
    resetCard();
    setIsEditingMeaning(false);
    clearSuggestions();
    setShowSuggestions(false);
    // Picking a suggestion is an explicit choice of the word.
    runLookup(selected);
  };

  const handleAudio = (e) => {
    e.preventDefault();
    if (!word) return;
    setIsPlayingAudio(true);
    playPronunciation(word).finally(() => setIsPlayingAudio(false));
  };

  const handleAddWord = async () => {
    if (!word) return;
    if (isLooking) return;
    if (!user) {
      alert('Please sign in to add words.');
      return;
    }

    if (checkWordLimit(user, allVocabularyCount, onShowAlert)) {
      return;
    }

    let finalDefinition = meaningText.trim();
    let finalCard = card;

    // Pressing Save on a word that has not been looked up yet is a lookup request.
    if (!hasMeaning(finalDefinition) && !isRefused) {
      const found = await runLookup(word);
      if (found) {
        finalCard = found;
        finalDefinition = found.meaning;
      }
    }

    // A word saved with a filler meaning is dead weight: it cannot be reviewed,
    // drilled or read back. Ask for a definition instead of persisting a placeholder.
    if (!hasMeaning(finalDefinition)) {
      setIsEditingMeaning(true);
      const message = {
        title: 'No definition found',
        message: `We could not look up "${word}". Enter its meaning below, then save it again.`,
      };
      if (onShowAlert) onShowAlert(message);
      else alert(message.message);
      return;
    }

    const keepsAiCard = Boolean(finalCard) && !definitionEditedRef.current;
    const fields = finalCard ? cardToItemFields(finalCard, language) : {};
    if (finalCard && !keepsAiCard) {
      // Keep the learner's words and let enrichment translate them later.
      fields.translations = {};
      fields.enriched_at = null;
    }
    const cardExamples = finalCard?.examples || [];
    const savedExample = keepsAiCard
      ? cardExamples[Math.min(exampleIndex, cardExamples.length - 1)] || ''
      : '';

    const result = await onAddWord({
      word,
      definition: finalDefinition,
      example: savedExample,
      fields,
      source: selectedCategory,
    });

    if (result === true || result?.success === true) {
      setNewWord('');
      resetCard();
      setIsEditingMeaning(false);
      clearSuggestions();
      setShowSuggestions(false);
      onSuccess?.();
    } else {
      alert('Failed to add word: ' + (result?.error || 'Unknown error'));
    }
  };

  const translation =
    showsAiCard && card.translation
      ? {
          label: `${languageLabel} meaning`,
          lang: language,
          word: card.translation.word,
          meaning: card.translation.meaning,
        }
      : null;

  const showQuota =
    quota.remaining != null &&
    quota.remaining <= QUOTA_HINT_THRESHOLD &&
    (user?.subscription_tier || 'free').toLowerCase() === 'free';

  return (
    <div className={cn(PANEL, 'relative z-30 overflow-visible p-4')}>
      <div className="relative flex flex-wrap items-center justify-between gap-2 border-b border-[#eeedf7] pb-3 dark:border-white/[0.07]">
        <h3 className="flex min-w-0 items-center gap-2 text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
          <IconChip icon={Plus} />
          <span className="truncate">Quick Add Word</span>
        </h3>
        <Pill tone="accent" className="shrink-0 text-[8.5px]">
          AI word card
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
          <label
            htmlFor={`${meaningInputId}-word`}
            className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400"
          >
            Word or expression
          </label>
          <div className="group relative">
            <Input
              id={`${meaningInputId}-word`}
              placeholder="Type a word to save..."
              className="h-11 rounded-lg border-[#e2e5f2] bg-white pl-3.5 pr-20 text-xs font-semibold text-slate-900 focus:border-[#5a63df] dark:border-white/10 dark:bg-white/4 dark:text-white"
              value={newWord}
              maxLength={40}
              onChange={(e) => {
                resetCard();
                setNewWord(e.target.value);
                setShowSuggestions(true);
              }}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return;
                e.preventDefault();
                handleAddWord();
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onFocus={() => setShowSuggestions(true)}
              autoComplete="off"
            />

            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
              {word && (
                <button
                  type="button"
                  onClick={handleAudio}
                  className={cn(
                    'rounded-lg p-1.5 text-slate-400 transition-colors hover:text-[#5a63df]',
                    isPlayingAudio && 'animate-pulse bg-[#5a63df]/10 text-[#5a63df]'
                  )}
                  title="Listen to pronunciation"
                  aria-label="Listen to pronunciation"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-lg text-[#5a63df] hover:bg-[#5a63df]/10"
                aria-label="Look up with AI"
                title={isRefused ? `Available again in ${retryIn}s` : 'Look up with AI'}
                onClick={() => {
                  definitionEditedRef.current = false;
                  runLookup(word);
                }}
                disabled={isLooking || isRefused || !word}
              >
                <Sparkles className={cn('h-4 w-4', isLooking && 'animate-pulse')} />
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
                {suggestions.map((sug) => (
                  <div
                    key={sug.word}
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

        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor={`${meaningInputId}-language`}
            className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400"
          >
            <Languages className="h-3.5 w-3.5 text-[#5a63df]" />
            Meaning in
          </label>
          <Select value={savedLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger
              id={`${meaningInputId}-language`}
              className="h-8 w-[150px] rounded-lg border-[#e2e5f2] bg-[#fbfbfe] text-xs font-bold dark:border-white/10 dark:bg-white/4"
            >
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent className="max-h-72 rounded-lg">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code} className="text-xs font-semibold">
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <section aria-label="Word meaning" className={cn(TILE, 'overflow-hidden')}>
          <div className="flex items-center justify-between gap-2 border-b border-[#e4e2f0] px-3.5 py-2.5 dark:border-white/[0.07]">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <BookOpen className="h-3.5 w-3.5 shrink-0 text-[#5a63df]" />
              <span className={cn(MICRO, 'text-slate-500 dark:text-slate-400')}>Meaning</span>
              {hasAiMeaning && (
                <WordMetaRow
                  ipa={card.ipa}
                  partOfSpeech={card.partOfSpeech}
                  level={card.level}
                  register={card.register}
                />
              )}
            </div>
            {word && (
              <button
                type="button"
                onClick={() => {
                  if (!isEditingMeaning) setNewDefinition(meaningText);
                  setIsEditingMeaning((editing) => !editing);
                }}
                aria-label={
                  isEditingMeaning
                    ? 'Done editing meaning'
                    : hasMeaning(meaningText)
                      ? 'Edit meaning'
                      : 'Enter meaning'
                }
                className="inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-1 text-[10px] font-bold text-[#5a63df] hover:bg-[#5a63df]/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]"
              >
                {isEditingMeaning ? <Check className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
                {isEditingMeaning ? 'Done' : hasMeaning(meaningText) ? 'Edit' : 'Enter meaning'}
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
                {hasAiMeaning && isEdited && (
                  <p className="mt-2 text-[10px] text-slate-400">
                    Your wording is saved as written. The {languageLabel} line and AI examples
                    belong to the AI meaning, so they are not saved with it.
                  </p>
                )}
              </>
            ) : (
              <div aria-live="polite" aria-atomic="true" className="space-y-3">
                {hasMeaning(meaningText) ? (
                  <WordCardBody
                    meaning={meaningText}
                    translation={translation}
                    examples={examples}
                    selectedExample={exampleIndex}
                    onSelectExample={setExampleIndex}
                    synonyms={showsAiCard ? card.synonyms : []}
                    collocations={showsAiCard ? card.collocations : []}
                    wordFamily={showsAiCard ? card.wordFamily : []}
                    commonMistake={showsAiCard ? card.commonMistake : ''}
                  />
                ) : (
                  <p className="flex items-center gap-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {isLooking && (
                      <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[#5a63df]" />
                    )}
                    {isLooking
                      ? 'Writing your word card…'
                      : word
                        ? 'Pick a suggestion, press Enter, or tap the sparkle to look it up.'
                        : 'Type a word to see its meaning.'}
                  </p>
                )}
                {lookupError && <LookupNotice error={lookupError} retryIn={retryIn} />}
              </div>
            )}
          </div>
        </section>

        <Button
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#5a63df] text-xs font-bold text-white transition-all hover:bg-[#4a52c9] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          onClick={handleAddWord}
          disabled={isAdding || isLooking || !word}
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          {isAdding ? 'Adding Word...' : 'Save Word'}
        </Button>

        {showQuota && (
          <p className="text-center text-[10px] font-semibold text-slate-400">
            {quota.remaining === 0
              ? 'No AI lookups left today. You can still save words with your own meaning.'
              : `${quota.remaining} AI lookup${quota.remaining === 1 ? '' : 's'} left today. Words other learners already looked up don’t count.`}
          </p>
        )}
      </div>
    </div>
  );
}
