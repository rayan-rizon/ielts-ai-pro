import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { m } from 'framer-motion';
import { AlertCircle, Check, BookOpen, LoaderCircle, Volume2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  MICRO,
  MUTED,
  PANEL,
  Pill,
  TILE,
  TITLE,
  WELL,
} from '@/features/dashboard/components/primitives';

export default function WordDefinitionPopover({ wordDefinition, addToVocabulary }) {
  if (!wordDefinition || !wordDefinition.position) return null;

  if (wordDefinition.definition === 'Loading...') {
    return (
      <m.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          position: 'fixed',
          top: Math.max(12, Math.min(window.innerHeight - 56, wordDefinition.position.y + 12)),
          left: Math.max(12, Math.min(window.innerWidth - 220, wordDefinition.position.x - 90)),
          zIndex: 200,
        }}
        className={cn(
          WELL,
          'flex items-center gap-2 rounded-lg border border-[#dedcf0] px-3 py-2 text-xs font-semibold text-slate-700 dark:border-white/[0.09] dark:text-slate-200'
        )}
        role="status"
        aria-live="polite"
        aria-label={`Finding contextual meaning for ${wordDefinition.word}`}
      >
        <LoaderCircle className="size-3.5 shrink-0 animate-spin text-[#5a63df]" />
        Finding meaning here…
      </m.div>
    );
  }

  return (
    <AnimatePresence>
      <m.div
        initial={{ opacity: 0, scale: 0.98, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 6 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        style={{
          position: 'fixed',
          top: Math.max(12, Math.min(window.innerHeight - 390, wordDefinition.position.y + 12)),
          left: Math.max(12, Math.min(window.innerWidth - 300, wordDefinition.position.x - 140)),
          zIndex: 200,
        }}
      >
        <div
          className={cn(
            PANEL,
            'relative max-h-[min(24rem,calc(100vh-2rem))] w-72 overflow-y-auto p-3.5'
          )}
          aria-label={`Definition for ${wordDefinition.word}`}
        >
          <div className="mb-3 flex items-start justify-between gap-2 border-b border-[#eceafa] pb-2.5 dark:border-white/[0.07]">
            <div className="min-w-0">
              <p className={cn(MICRO, MUTED)}>
                {wordDefinition.contextual ? 'Contextual AI' : 'Dictionary'}
              </p>
              <h5 className={cn(TITLE, 'mt-0.5 truncate text-[15px]')}>{wordDefinition.word}</h5>
            </div>
            {wordDefinition.part_of_speech && (
              <Pill tone="accent">{wordDefinition.part_of_speech}</Pill>
            )}
          </div>

          {wordDefinition.vocabError || wordDefinition.error ? (
            <div className={cn(TILE, 'py-4 text-center')} role="status" aria-live="polite">
              <div className="mx-auto mb-2 flex size-8 items-center justify-center rounded-lg bg-[rgb(var(--signal-fault)/0.1)]">
                <AlertCircle className="size-4 text-[rgb(var(--signal-fault))]" />
              </div>
              <p className="mb-2 text-sm font-medium text-[rgb(var(--signal-fault))]">
                {wordDefinition.error
                  ? 'Definition not found.'
                  : wordDefinition.errorMessage || 'Could not add to vocabulary.'}
              </p>
              {wordDefinition.definition &&
                wordDefinition.definition !== 'Definition not found.' && (
                  <div
                    className={cn(
                      WELL,
                      'rounded-lg p-2 text-sm text-slate-600 dark:text-slate-300'
                    )}
                  >
                    {wordDefinition.definition}
                  </div>
                )}
            </div>
          ) : wordDefinition.addedToVocab ? (
            <div
              className={cn(TILE, 'space-y-2 py-4 text-center')}
              role="status"
              aria-live="polite"
            >
              <div className="mx-auto flex size-8 items-center justify-center rounded-lg bg-[rgb(var(--signal-ok)/0.1)] text-[rgb(var(--signal-ok))]">
                <Check className="size-4" />
              </div>
              <p className={TITLE}>Added to Word Bank</p>
              <p className={cn(MICRO, MUTED)}>+5 points earned</p>
            </div>
          ) : wordDefinition.alreadyExists ? (
            <div
              className={cn(TILE, 'space-y-2 py-4 text-center')}
              role="status"
              aria-live="polite"
            >
              <div className="mx-auto flex size-8 items-center justify-center rounded-lg bg-[rgb(var(--signal-warn)/0.1)] text-[rgb(var(--signal-warn))]">
                <BookOpen className="size-4" />
              </div>
              <p className={TITLE}>Already in Word Bank</p>
            </div>
          ) : (
            <>
              <p className={cn(MICRO, MUTED, 'mb-1.5')}>Meaning</p>
              {wordDefinition.contextual ? (
                <Pill tone="accent" className="mb-2">
                  Meaning here
                </Pill>
              ) : null}
              <div className="mb-3 text-[13px] font-medium leading-relaxed text-slate-700 dark:text-slate-200">
                {wordDefinition.definition}
              </div>
              {wordDefinition.pronunciation || wordDefinition.audio ? (
                <div className={cn(TILE, 'mb-3 flex items-center justify-between gap-2 p-2')}>
                  <span className="text-xs text-slate-600 dark:text-slate-300">
                    {wordDefinition.pronunciation || 'Hear pronunciation'}
                  </span>
                  {wordDefinition.audio ? (
                    <button
                      type="button"
                      onClick={() => new Audio(wordDefinition.audio).play().catch(() => {})}
                      className="grid size-8 place-items-center rounded-md text-[#5a63df] hover:bg-[#5a63df]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]"
                      aria-label={`Play pronunciation of ${wordDefinition.word}`}
                    >
                      <Volume2 className="size-4" />
                    </button>
                  ) : null}
                </div>
              ) : null}
              {wordDefinition.example && (
                <div className={cn(TILE, 'mt-3 border-l-2 border-l-[#5a63df] px-3 py-2')}>
                  <p className="text-sm italic leading-relaxed text-slate-600 dark:text-slate-400">
                    "{wordDefinition.example}"
                  </p>
                </div>
              )}
              {wordDefinition.synonyms && wordDefinition.synonyms.length > 0 && (
                <div className="mt-4 border-t border-[#eceafa] pt-3 dark:border-white/[0.07]">
                  <p className={cn(MICRO, MUTED, 'mb-2 flex items-center gap-2')}>
                    <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                    Synonyms
                    <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {wordDefinition.synonyms.slice(0, 5).map((syn, i) => (
                      <span
                        key={i}
                        className={cn(
                          TILE,
                          'cursor-default px-2 py-1 text-xs text-slate-600 dark:text-slate-400'
                        )}
                      >
                        {syn}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {!wordDefinition.addedToVocab &&
            !wordDefinition.alreadyExists &&
            !wordDefinition.error &&
            !wordDefinition.vocabError && (
              <button
                onClick={() => addToVocabulary(wordDefinition)}
                disabled={wordDefinition.definition === 'Loading...'}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md border border-[#5a63df] bg-[#5a63df] px-3 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-[#4d56c9] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <BookOpen className="size-3.5" />
                Add to Word Bank
              </button>
            )}
        </div>
      </m.div>
    </AnimatePresence>
  );
}
