import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Zap, Search, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';
import { useWordSuggestions, useWordDefinition } from '@/features/vocabulary/hooks';

// Helper for tier limits
const VOCABULARY_LIMITS = {
  free: 100,
  pro: 300,
  premium: Infinity,
};

const getWordLimit = (subscriptionTier) => {
  const tier = (subscriptionTier || 'free').toLowerCase();
  return VOCABULARY_LIMITS[tier] || VOCABULARY_LIMITS.free;
};

export default function QuickAddCard({
  onAddWord,
  isAdding,
  user,
  allVocabularyCount,
  onShowAlert,
  onSuccess,
}) {
  const [newWord, setNewWord] = useState('');
  const [newDefinition, setNewDefinition] = useState('');
  const [newExample, setNewExample] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { suggestions, fetchSuggestions, clearSuggestions } = useWordSuggestions();
  const { fetchWordDetails: fetchDefinition, isFetchingDef } = useWordDefinition();

  // Fetch Autosuggestions
  useEffect(() => {
    fetchSuggestions(newWord);
  }, [newWord, fetchSuggestions]);

  const handleSelectSuggestion = async (word) => {
    setNewWord(word);
    clearSuggestions();

    const details = await fetchDefinition(word);
    if (details) {
      setNewDefinition(details.definition);
      if (details.example) setNewExample(details.example);
    }
  };

  const handleAddWord = async () => {
    if (!newWord.trim()) return;
    if (!user) {
      alert('Please sign in to add words.');
      return;
    }

    // Check tier limits
    const wordLimit = getWordLimit(user?.subscription_tier);
    if (allVocabularyCount >= wordLimit) {
      const tierName = (user?.subscription_tier || 'free').toLowerCase();
      let message = '';
      if (tierName === 'free') {
        message = `Free accounts can save up to ${wordLimit} words. Upgrade to Pro for 50 words or Premium for unlimited storage.`;
      } else if (tierName === 'pro') {
        message = `Pro accounts can save up to ${wordLimit} words. Upgrade to Premium for unlimited storage.`;
      }

      onShowAlert({
        title: 'Word Limit Reached',
        message: message,
      });
      return;
    }

    let finalDefinition = newDefinition.trim();
    let finalExample = newExample.trim();

    // If no definition, try fetching from API
    if (!finalDefinition) {
      try {
        const details = await fetchDefinition(newWord.trim());
        if (details) {
          finalDefinition = details.definition;
          finalExample = details.example || '';
        }
      } catch (e) {
        console.error('[Vocab] Fetch failed', e);
      }
    }

    if (!finalDefinition) {
      finalDefinition = 'User added word';
    }

    // Call the mutation prop
    const result = await onAddWord({
      word: newWord.trim(),
      definition: finalDefinition,
      example: finalExample,
    });

    if (result.success) {
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
    <Card className="w-full border-none shadow-[0_20px_50px_rgba(79,70,229,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] bg-gradient-to-b from-white to-indigo-50/20 dark:from-slate-900 dark:to-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-white/[0.12] relative z-30 overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-emerald-500/5 to-teal-500/5 dark:from-emerald-500/10 dark:to-teal-500/10 border-b border-emerald-100/50 dark:border-emerald-900/20 p-6">
        <CardTitle className="flex items-center gap-3 text-lg font-black text-emerald-900 dark:text-emerald-100 uppercase tracking-tight">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Plus className="w-5 h-5 stroke-[2.5px]" />
          </div>
          Quick Add
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="space-y-2 relative">
          <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] pl-1">
            New Word
          </label>
          <div className="relative group">
            <Input
              placeholder="Search or add term..."
              className="bg-white dark:bg-slate-950 border-slate-200/60 dark:border-white/[0.12] focus:ring-emerald-500/20 h-12 pl-4 pr-12 rounded-xl font-bold tracking-tight text-base shadow-inner transition-all hover:border-emerald-500/30"
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

            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 transition-all opacity-0 group-focus-within:opacity-100"
                onClick={handleAddWord}
                disabled={isFetchingDef || !newWord}
              >
                <Zap className={cn('w-4 h-4', isFetchingDef && 'animate-spin')} />
              </Button>
            </div>
          </div>

          {/* Enhanced Autocomplete */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute z-50 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/60 dark:border-white/[0.12] rounded-2xl shadow-[0_20px_70px_-10px_rgba(0,0,0,0.2)] mt-2 overflow-hidden py-1.5"
              >
                {suggestions.map((sug, index) => (
                  <div
                    key={index}
                    className="px-4 py-2.5 hover:bg-emerald-500/5 dark:hover:bg-emerald-500/10 cursor-pointer text-sm font-bold text-slate-900 dark:text-slate-200 transition-all flex justify-between items-center group/item mx-1.5 rounded-lg"
                    onClick={() => handleSelectSuggestion(sug.word)}
                  >
                    <div className="flex items-center gap-3">
                      <Search className="w-3.5 h-3.5 text-slate-400 group-hover/item:text-emerald-500 transition-colors" />

                      <span>{sug.word}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 opacity-0 -translate-x-2 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all" />
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {newDefinition && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-2"
          >
            <label className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] pl-1 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              Logic Resolved
            </label>
            <div className="bg-emerald-500/5 dark:bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
              <p className="text-xs text-slate-700 dark:text-slate-200 font-medium leading-relaxed italic border-l-2 border-emerald-500/40 pl-3">
                "{newDefinition}"
              </p>
            </div>
          </motion.div>
        )}

        <Button
          className="w-full bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white h-11 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-xl transition-all active:scale-[0.98] border-b-4 border-slate-950 dark:border-emerald-800"
          onClick={handleAddWord}
          disabled={isAdding || !newWord.trim()}
        >
          {isAdding ? 'Processing...' : 'Add to Library'}
        </Button>
      </CardContent>
    </Card>
  );
}
