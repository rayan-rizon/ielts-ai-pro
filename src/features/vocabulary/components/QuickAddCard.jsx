import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Zap, Search, ChevronRight, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';
import { useWordSuggestions, useWordDefinition } from '@/features/vocabulary/hooks';
import { playPronunciation } from '../utils/audioUtils';

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
        if (details) {
          finalDefinition = details.definition || 'Saved word';
          finalExample = details.example || '';
        }
      } catch (e) {
        console.error('[Vocab] Fetch definition error', e);
      }
    }

    const result = await onAddWord({
      word: newWord.trim(),
      definition: finalDefinition || 'Saved IELTS vocabulary word',
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
    <Card className="w-full overflow-visible border border-[#e0e4f1] dark:border-white/10 bg-gradient-to-br from-white via-[#faf9ff] to-[#f3f0ff] dark:from-[#10131f] dark:to-[#10131f] shadow-[0_20px_50px_-42px_rgba(48,58,128,0.72)] rounded-[22px] relative z-30">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#505bdd]/10 blur-xl" />
      <CardHeader className="p-4 pb-3 border-b border-slate-200/80 dark:border-white/10 flex flex-row items-center justify-between relative">
        <CardTitle className="flex items-center gap-2.5 text-sm font-black text-slate-900 dark:text-white">
          <div className="w-8 h-8 rounded-xl bg-[#efedff] text-[#5862df] dark:bg-indigo-500/20 dark:text-indigo-300 flex items-center justify-center ring-1 ring-[#5862df]/15 dark:ring-indigo-500/30 shadow-xs">
            <Plus className="w-4 h-4" strokeWidth={2.5} />
          </div>
          <span>Quick Add Word</span>
        </CardTitle>
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#505bdd] dark:text-indigo-300 bg-white/90 dark:bg-white/10 px-2.5 py-0.5 rounded-full border border-[#d8dcfa] dark:border-white/10 shadow-xs">
          AUTO LOOKUP
        </span>
      </CardHeader>

      <CardContent className="p-4 space-y-4 overflow-visible relative">
        {/* Category Pills */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-widest">
            CATEGORY
          </label>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer',
                  selectedCategory === cat
                    ? 'bg-[#5661e9] text-white shadow-md shadow-indigo-500/20'
                    : 'bg-white dark:bg-white/5 border border-[#d8dcfa] dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-[#6570ee]/40'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Input & Suggestions */}
        <div className="space-y-1.5 relative">
          <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-widest">
            WORD OR EXPRESSION
          </label>
          <div className="relative group">
            <Input
              placeholder="Type a word (e.g. ubiquitous)..."
              className="bg-white dark:bg-slate-900 border-[#d8dcfa] dark:border-white/10 focus:border-[#5661e9] h-11 pl-3.5 pr-16 rounded-xl font-semibold text-xs shadow-xs text-slate-900 dark:text-white"
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

            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {newWord.trim() && (
                <button
                  type="button"
                  onClick={handleAudio}
                  className={cn(
                    'p-1.5 rounded-lg text-slate-400 hover:text-[#5661e9] transition-colors',
                    isPlayingAudio && 'text-[#5661e9] animate-pulse bg-[#efedff]'
                  )}
                  title="Test audio"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-lg hover:bg-[#efedff] dark:hover:bg-indigo-950/40 text-[#505bdd]"
                onClick={handleAddWord}
                disabled={isFetchingDef || !newWord.trim()}
              >
                <Zap className={cn('w-4 h-4', isFetchingDef && 'animate-spin')} />
              </Button>
            </div>
          </div>

          {/* Autocomplete Dropdown */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                className="absolute z-50 w-full bg-white dark:bg-slate-900 border border-[#d8dcfa] dark:border-white/10 rounded-xl shadow-lg mt-1 overflow-hidden py-1"
              >
                {suggestions.map((sug, index) => (
                  <div
                    key={index}
                    className="px-3.5 py-2 hover:bg-[#efedff] dark:hover:bg-slate-800 cursor-pointer text-xs font-bold text-slate-900 dark:text-slate-200 transition-colors flex justify-between items-center group/item"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectSuggestion(sug.word);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Search className="w-3.5 h-3.5 text-[#505bdd]" />
                      <span>{sug.word}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {newDefinition && (
          <div className="bg-[#efedff]/80 dark:bg-indigo-950/40 p-3 rounded-xl border border-[#d8dcfa] dark:border-indigo-800/40 text-xs font-semibold text-[#505bdd] dark:text-indigo-200 italic leading-relaxed">
            "{newDefinition}"
          </div>
        )}

        <Button
          className="w-full bg-[#5661e9] hover:bg-[#4853da] text-white h-11 rounded-xl font-extrabold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleAddWord}
          disabled={isAdding || !newWord.trim()}
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          {isAdding ? 'Adding Word...' : 'Save Word'}
        </Button>
      </CardContent>
    </Card>
  );
}
