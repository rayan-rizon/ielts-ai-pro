import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ListPlus, LoaderCircle, Lock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';
import { contentTierLabel, hasContentAccess } from '@/features/subscription/config/contentAccess';

const LockedContent = ({ resource }) => (
  <div className="mx-auto max-w-lg space-y-5 p-8 text-center sm:p-10">
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600 ring-8 ring-indigo-50/70 dark:bg-indigo-500/10 dark:text-indigo-300">
      <Lock className="h-7 w-7" />
    </div>
    <div className="space-y-2">
      <h2 className="text-xl font-black tracking-tight text-slate-800 dark:text-white">
        {contentTierLabel(resource.access_tier)} vocabulary kit
      </h2>
      <p className="mx-auto max-w-sm text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
        Upgrade to {contentTierLabel(resource.access_tier)} to study this kit and save its words.
      </p>
    </div>
    <Button
      onClick={() => (window.location.href = '/pricing')}
      className="h-11 rounded-xl bg-indigo-600 px-7 text-xs font-extrabold text-white hover:bg-indigo-700"
    >
      View plans
    </Button>
  </div>
);

function CompactWordCard({ item, index, isAdded, isAdding, onAdd }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.018, 0.16) }}
      className="group relative min-h-[132px] rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-[0_10px_26px_-24px_rgba(67,56,202,0.6)] transition hover:border-indigo-200 hover:shadow-sm dark:border-white/10 dark:bg-slate-900"
    >
      <div className="flex items-start gap-2 pr-9">
        <div className="min-w-0">
          <h3 className="text-[15px] font-black leading-5 tracking-tight text-indigo-600 dark:text-indigo-300">
            {item.word}
          </h3>
          <p className="mt-1 text-xs font-semibold leading-4 text-slate-700 dark:text-slate-200">
            {item.definition}
          </p>
        </div>
      </div>

      <p className="mt-2 line-clamp-2 border-t border-slate-100 pt-2 text-[11px] font-medium italic leading-4 text-slate-500 dark:border-white/10 dark:text-slate-400">
        “{item.example}”
      </p>

      <Button
        variant="ghost"
        size="icon"
        disabled={isAdded || isAdding}
        onClick={onAdd}
        className={cn(
          'absolute right-2.5 top-2.5 h-7 w-7 rounded-lg transition',
          isAdded
            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300'
            : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20'
        )}
        title={isAdded ? 'Already in your saved words' : 'Add this item to saved words'}
      >
        {isAdded ? (
          <Check className="h-4 w-4" />
        ) : isAdding ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
      </Button>
    </motion.article>
  );
}

function StudyHeader({ resource }) {
  return (
    <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-sky-50 px-5 py-4 dark:border-white/10 dark:from-indigo-500/10 dark:via-slate-950 dark:to-sky-500/10 sm:px-6">
      <Badge className="border border-indigo-100 bg-white px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.13em] text-indigo-600 dark:border-indigo-400/20 dark:bg-white/5 dark:text-indigo-300">
        Vocabulary kit
      </Badge>
      <h2 className="mt-2 text-xl font-black tracking-tight text-slate-800 dark:text-white">
        {resource.title}
      </h2>
      <p className="mt-1 text-xs font-medium leading-5 text-slate-600 dark:text-slate-300">
        {resource.description}
      </p>
    </div>
  );
}

function WordList({ words, allVocabulary = [], onAddWord, onAddAll, isAddingAll, bulkStatus }) {
  const [addingWords, setAddingWords] = useState(new Set());
  const unsavedWords = words.filter(
    (item) =>
      !allVocabulary.some((saved) => saved?.word?.toLowerCase() === item?.word?.toLowerCase())
  );

  return (
    <div className="p-3 sm:p-4">
      <div className="mb-3 flex flex-col gap-2 rounded-2xl border border-indigo-100 bg-[#f8f8ff] px-3 py-2.5 dark:border-indigo-400/15 dark:bg-indigo-500/10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black text-slate-800 dark:text-white">
            {words.length} items · {unsavedWords.length} ready to save
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Save a phrase now, then review it from your personal word bank.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => onAddAll?.(unsavedWords)}
          disabled={!unsavedWords.length || isAddingAll || !onAddAll}
          className="h-9 shrink-0 rounded-xl bg-indigo-600 px-3.5 text-xs font-extrabold text-white hover:bg-indigo-700 disabled:bg-indigo-300"
        >
          {isAddingAll ? (
            <LoaderCircle className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <ListPlus className="mr-1.5 h-3.5 w-3.5" />
          )}
          {unsavedWords.length ? `Add all (${unsavedWords.length})` : 'All saved'}
        </Button>
      </div>

      {bulkStatus && (
        <p
          role="status"
          className={cn(
            'mb-3 rounded-xl px-3 py-2 text-xs font-semibold',
            bulkStatus.type === 'error'
              ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
          )}
        >
          {bulkStatus.message}
        </p>
      )}

      <div className="grid gap-2.5 md:grid-cols-2">
        {words.map((item, index) => {
          const isAdded = allVocabulary.some(
            (saved) => saved?.word?.toLowerCase() === item?.word?.toLowerCase()
          );
          const isAdding = addingWords.has(item.word);

          const handleAdd = async (event) => {
            event.stopPropagation();
            if (isAdded || isAdding || !onAddWord) return;
            setAddingWords((previous) => new Set(previous).add(item.word));
            await onAddWord({
              word: item.word,
              definition: item.definition,
              example: item.example,
              source: 'Vocabulary Kit',
            });
            setAddingWords((previous) => {
              const next = new Set(previous);
              next.delete(item.word);
              return next;
            });
          };

          return (
            <CompactWordCard
              key={`${item.word}-${index}`}
              item={item}
              index={index}
              isAdded={isAdded}
              isAdding={isAdding}
              onAdd={handleAdd}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function VocabularyStudyView({
  resource,
  user,
  onAddWord,
  onAddAll,
  isAddingAll = false,
  bulkStatus,
  allVocabulary,
  showHeader = true,
}) {
  let words = [];
  try {
    const parsed = JSON.parse(resource.content || '[]');
    words = Array.isArray(parsed) ? parsed : [];
  } catch {
    words = [];
  }

  const hasAccess = hasContentAccess(user, resource.access_tier);

  if (!hasAccess) return <LockedContent resource={resource} />;

  return (
    <div className="relative">
      {showHeader && <StudyHeader resource={resource} />}
      <WordList
        words={words}
        allVocabulary={allVocabulary}
        onAddWord={onAddWord}
        onAddAll={onAddAll}
        isAddingAll={isAddingAll}
        bulkStatus={bulkStatus}
      />
    </div>
  );
}
