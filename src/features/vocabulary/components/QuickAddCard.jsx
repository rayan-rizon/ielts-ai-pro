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
    <Card className="w-full overflow-visible border border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] rounded-2xl relative z-30">
      <CardHeader className="p-4 pb-2.5 border-b border-slate-100 dark:border-slate-800/60 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
          <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
            <Plus className="w-3.5 h-3.5" />
          </div>
          <span>Quick Add Word</span>
        </CardTitle>
        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
          Auto Lookup
        </span>
      </CardHeader>

      <CardContent className="p-4 space-y-3.5 overflow-visible">
        {/* Category Pills */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Category
          </label>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'px-3 py-1 rounded-xl text-xs font-black transition-all duration-200',
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Input & Suggestions */}
        <div className="space-y-1.5 relative">
          <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Word or Expression
          </label>
          <div className="relative group">
            <Input
              placeholder="Type a word (e.g. ubiquitous)..."
              className="bg-white dark:bg-slate-950 border-slate-200/80 dark:border-slate-800 focus:ring-indigo-500/20 h-10 pl-3 pr-16 rounded-xl font-semibold text-xs shadow-inner"
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

            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {newWord.trim() && (
                <button
                  type="button"
                  onClick={handleAudio}
                  className={cn(
                    'p-1 rounded text-slate-400 hover:text-indigo-600 transition-colors',
                    isPlayingAudio && 'text-indigo-600 animate-pulse'
                  )}
                  title="Test audio"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-600"
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
                className="absolute z-50 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg mt-1 overflow-hidden py-1"
              >
                {suggestions.map((sug, index) => (
                  <div
                    key={index}
                    className="px-3 py-2 hover:bg-indigo-50 dark:hover:bg-slate-800 cursor-pointer text-xs font-semibold text-slate-900 dark:text-slate-200 transition-colors flex justify-between items-center group/item"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectSuggestion(sug.word);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Search className="w-3.5 h-3.5 text-indigo-500" />
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
          <div className="bg-indigo-50/80 dark:bg-indigo-950/40 p-3 rounded-xl border border-indigo-200/60 dark:border-indigo-800/40 text-xs font-semibold text-indigo-950 dark:text-indigo-200 italic leading-relaxed">
            "{newDefinition}"
          </div>
        )}

        <Button
          className="w-full bg-[#635BFF] hover:bg-[#5249E6] text-white h-10.5 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
          onClick={handleAddWord}
          disabled={isAdding || !newWord.trim()}
        >
          {isAdding ? 'Adding Word...' : 'Save Word'}
        </Button>
      </CardContent>
    </Card>
  );
}
