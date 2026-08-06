import React, { useState } from 'react';
import { m } from 'framer-motion';
import { Check, ListPlus, LoaderCircle, Lock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { contentTierLabel, hasContentAccess } from '@/features/subscription/config/contentAccess';
import { MICRO, MUTED, Pill, TILE } from '@/features/dashboard/components/primitives';

const LOCKED_BENEFITS = ['Every entry in this kit unlocked', 'Save words straight to your bank'];

const LockedContent = ({ resource }) => {
  const tier = contentTierLabel(resource.access_tier);
  return (
    <div className={cn(TILE, 'mx-auto my-6 max-w-lg border-dashed p-8 text-center sm:p-10')}>
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-[#5a63df]/20 bg-[#5a63df]/10 text-[#5a63df] ring-4 ring-[#5a63df]/6 dark:border-[#8f97ff]/25 dark:bg-[#8f97ff]/[0.14] dark:text-[#afb5ff] dark:ring-[#8f97ff]/8">
        <Lock className="h-5 w-5" strokeWidth={2.25} />
      </span>

      <Pill tone="accent" className="mx-auto mt-4 w-fit">
        {tier}
      </Pill>

      <h2 className="mt-3 text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
        {tier} vocabulary kit
      </h2>
      <p className={cn('mx-auto mt-1.5 max-w-sm text-sm font-medium leading-6', MUTED)}>
        Upgrade to {tier} to study this kit and save its words.
      </p>

      <ul className="mx-auto mt-4 flex w-fit flex-col gap-1.5 text-left">
        {LOCKED_BENEFITS.map((benefit) => (
          <li
            key={benefit}
            className="flex items-center gap-2 text-[11.5px] font-semibold text-slate-600 dark:text-slate-300"
          >
            <Check
              className="h-3.5 w-3.5 shrink-0 text-[rgb(var(--signal-ok))]"
              strokeWidth={2.75}
            />
            {benefit}
          </li>
        ))}
      </ul>

      <Button
        onClick={() => (window.location.href = '/pricing')}
        className="mt-6 h-11 rounded-lg bg-[#5a63df] px-7 text-xs font-bold text-white hover:bg-[#4a52c9]"
      >
        View plans
      </Button>
      <p className={cn(MICRO, MUTED, 'mt-3')}>Included in Pro and Premium</p>
    </div>
  );
};

function CompactWordCard({ item, index, isAdded, isAdding, onAdd }) {
  return (
    <m.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.018, 0.16) }}
      className={cn(
        TILE,
        'group relative min-h-[132px] p-3.5 transition hover:-translate-y-0.5 hover:border-[#c9cdf3] hover:shadow-sm dark:hover:border-white/20'
      )}
    >
      <div className="flex items-start gap-2 pr-9">
        <div className="min-w-0">
          <h3 className="text-[15px] font-extrabold leading-5 tracking-tight text-[#5a63df] dark:text-indigo-300">
            {item.word}
          </h3>
          <p className="mt-1 text-xs font-semibold leading-4 text-slate-700 dark:text-slate-200">
            {item.definition}
          </p>
        </div>
      </div>

      <p className="mt-2 line-clamp-2 border-t border-[#eeedf7] pt-2 text-[11px] font-medium italic leading-4 text-slate-500 dark:border-white/10 dark:text-slate-400">
        &quot;{item.example}&quot;
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
            : 'bg-[#5a63df]/10 text-[#5a63df] hover:bg-[#5a63df]/15 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20'
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
    </m.article>
  );
}

function StudyHeader({ resource }) {
  return (
    <div className="border-b border-[#eeedf7] px-5 py-4 dark:border-white/[0.07] sm:px-6">
      <Pill tone="accent">Vocabulary kit</Pill>
      <h2 className="mt-2 text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
        {resource.title}
      </h2>
      <p className={cn('mt-1 text-xs font-medium leading-5', MUTED)}>{resource.description}</p>
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
      <div
        className={cn(
          TILE,
          'mb-3 flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between'
        )}
      >
        <div>
          <p className="text-xs font-extrabold text-slate-900 dark:text-white">
            {words.length} items · {unsavedWords.length} ready to save
          </p>
          <p className={cn('mt-0.5 text-[11px] font-medium', MUTED)}>
            Save a phrase now, then review it from your personal word bank.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => onAddAll?.(unsavedWords)}
          disabled={!unsavedWords.length || isAddingAll || !onAddAll}
          className="h-9 shrink-0 rounded-lg bg-[#5a63df] px-3.5 text-xs font-bold text-white hover:bg-[#4a52c9] disabled:bg-[#5a63df]/40"
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
            'mb-3 rounded-lg px-3 py-2 text-xs font-semibold',
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
