import React, { useEffect, useRef } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { AlertCircle, BookOpen, Check, LoaderCircle, Sparkles, Volume2, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MICRO, MUTED, PANEL, TILE, TITLE, WELL } from '@/features/dashboard/components/primitives';

function renderHighlightedExample(example, targetWord) {
  if (!example) return null;
  const trimmed = example
    .replace(/^["'“”]/, '')
    .replace(/["'“”]$/, '')
    .trim();
  if (!targetWord) return <span>&ldquo;{trimmed}&rdquo;</span>;

  const clean = targetWord
    .replace(/[^a-zA-Z]/g, '')
    .trim()
    .toLowerCase();
  if (!clean) return <span>&ldquo;{trimmed}&rdquo;</span>;

  // Derive base stem to match inflections (e.g., seem -> seemed, grow -> growing)
  const stem = clean.replace(/(?:ing|ed|es|s)$/i, '');
  const matchBase = stem.length >= 3 ? stem : clean;

  try {
    const regex = new RegExp(`(\\b${matchBase}[a-z]*\\b)`, 'gi');
    const parts = trimmed.split(regex);

    return (
      <span>
        &ldquo;
        {parts.map((part, i) => {
          const isMatch = regex.test(part);
          regex.lastIndex = 0;
          return isMatch ? (
            <span
              key={i}
              className="rounded bg-[#5a63df]/12 px-1 py-0.5 font-bold text-[#5a63df] dark:bg-[#8f97ff]/22 dark:text-[#afb5ff]"
            >
              {part}
            </span>
          ) : (
            <React.Fragment key={i}>{part}</React.Fragment>
          );
        })}
        &rdquo;
      </span>
    );
  } catch {
    return <span>&ldquo;{trimmed}&rdquo;</span>;
  }
}

function getLoadingPopoverStyle(position) {
  return {
    position: 'fixed',
    top: Math.max(12, Math.min(window.innerHeight - 56, position.y + 12)),
    left: Math.max(12, Math.min(window.innerWidth - 240, position.x - 100)),
    zIndex: 200,
  };
}

function getDefinitionPopoverStyle(position) {
  return {
    position: 'fixed',
    top: Math.max(12, Math.min(window.innerHeight - 440, position.y + 12)),
    left: Math.max(12, Math.min(window.innerWidth - 336, position.x - 160)),
    zIndex: 200,
  };
}

function WordDefinitionLoading({ position, word }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      style={getLoadingPopoverStyle(position)}
      className={cn(
        WELL,
        'flex items-center gap-2 rounded-lg border border-[#e4e2f0] px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-md shadow-slate-900/5 dark:border-white/[0.09] dark:text-slate-200 dark:shadow-black/40'
      )}
      role="status"
      aria-live="polite"
      aria-label={`Finding contextual meaning for ${word}`}
    >
      <LoaderCircle className="size-3.5 shrink-0 animate-spin text-[#5a63df]" />
      <span>Finding meaning here…</span>
    </m.div>
  );
}

function WordDefinitionHeader({ contextual, onClose }) {
  return (
    <div className="flex items-center justify-between -mr-0.5">
      <div className="flex items-center gap-1.5">
        {contextual ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#5a63df]/25 bg-[#5a63df]/[0.08] px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-wider text-[#5a63df] dark:border-[#8f97ff]/30 dark:bg-[#8f97ff]/15 dark:text-[#afb5ff]">
            <Sparkles className="size-2.5 shrink-0" />
            <span>Contextual AI</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-slate-100/80 px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-wider text-slate-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300">
            <BookOpen className="size-2.5 shrink-0 text-slate-500 dark:text-slate-400" />
            <span>Dictionary</span>
          </span>
        )}
      </div>

      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="grid size-5 place-items-center rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-white/[0.08] dark:hover:text-slate-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]"
          aria-label="Close definition"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}

function WordAudioButton({ audio, word }) {
  if (!audio) return null;
  return (
    <button
      type="button"
      onClick={() => new Audio(audio).play().catch(() => {})}
      className="grid size-5 place-items-center rounded text-slate-500 transition-colors hover:bg-[#5a63df]/10 hover:text-[#5a63df] dark:text-slate-400 dark:hover:text-[#afb5ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] cursor-pointer"
      aria-label={`Play pronunciation of ${word}`}
    >
      <Volume2 className="size-3.5" />
    </button>
  );
}

function WordTitleRow({ word, partOfSpeech, pronunciation, audio }) {
  const hasAudioOrPronunciation = Boolean(pronunciation || audio);

  return (
    <div className="mt-1 flex items-baseline justify-between gap-2 border-b border-[#e4e2f0] pb-2 dark:border-white/[0.07]">
      <div className="flex items-baseline gap-1.5 min-w-0 flex-wrap">
        <h4 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-50 truncate leading-snug">
          {word}
        </h4>
        {partOfSpeech ? (
          <span className="inline-flex items-center rounded-full border border-slate-200/90 bg-slate-100/80 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-slate-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300">
            {partOfSpeech}
          </span>
        ) : null}
      </div>

      {hasAudioOrPronunciation ? (
        <div className="flex items-center gap-1.5 shrink-0">
          {pronunciation ? (
            <span className="font-mono text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {pronunciation}
            </span>
          ) : null}
          <WordAudioButton audio={audio} word={word} />
        </div>
      ) : null}
    </div>
  );
}

function WordErrorStatus({ error, errorMessage, definition }) {
  const message = error ? 'Definition not found.' : errorMessage || 'Could not add to vocabulary.';
  const hasDefinitionFallback = definition && definition !== 'Definition not found.';

  return (
    <div className={cn(TILE, 'mt-2 px-3 py-3 text-center')} role="status" aria-live="polite">
      <div className="mx-auto mb-1.5 flex size-7 items-center justify-center rounded-lg bg-[rgb(var(--signal-fault)/0.1)]">
        <AlertCircle className="size-3.5 text-[rgb(var(--signal-fault))]" strokeWidth={2.2} />
      </div>
      <p className="mb-1 text-xs font-semibold text-[rgb(var(--signal-fault))]">{message}</p>
      {hasDefinitionFallback ? (
        <div
          className={cn(WELL, 'mt-1.5 rounded-lg p-2 text-xs text-slate-600 dark:text-slate-300')}
        >
          {definition}
        </div>
      ) : null}
    </div>
  );
}

function WordNoticeCard({ icon: Icon, iconClassName, iconStrokeWidth = 2.2, title, subtitle }) {
  return (
    <div className={cn(TILE, 'mt-2 space-y-1 py-3 text-center')} role="status" aria-live="polite">
      <div
        className={cn(
          'mx-auto mb-1 flex size-7 items-center justify-center rounded-lg',
          iconClassName
        )}
      >
        <Icon className="size-3.5" strokeWidth={iconStrokeWidth} />
      </div>
      <p className={TITLE}>{title}</p>
      {subtitle ? <p className={cn(MICRO, MUTED)}>{subtitle}</p> : null}
    </div>
  );
}

function WordExampleBox({ example, word }) {
  if (!example) return null;
  return (
    <div className="rounded-lg border border-[#e4e2f0] bg-[#f8f7fd] px-2.5 py-2 dark:border-white/[0.08] dark:bg-white/[0.035]">
      <div className="mb-1 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-[#5a63df] dark:bg-[#afb5ff]" />
        <span className={cn(MICRO, MUTED, 'text-[8px] tracking-wider')}>Example in context</span>
      </div>
      <p className="text-[12.5px] leading-relaxed text-slate-700 dark:text-slate-300">
        {renderHighlightedExample(example, word)}
      </p>
    </div>
  );
}

function WordSynonymsList({ synonyms }) {
  if (!synonyms || synonyms.length === 0) return null;
  return (
    <div className="space-y-1.5 pt-0.5">
      <div className="flex items-center gap-1.5">
        <span className="h-px w-2.5 bg-slate-300 dark:bg-white/20" aria-hidden="true" />
        <span className={cn(MICRO, MUTED, 'text-[8.5px]')}>Synonyms</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {synonyms.slice(0, 5).map((syn, i) => (
          <span
            key={i}
            className="inline-flex items-center rounded-full border border-[#e4e2f0] bg-white/90 px-2.5 py-0.5 text-[10.5px] font-medium text-slate-700 transition-colors hover:border-[#5a63df]/35 hover:text-[#5a63df] dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-[#8f97ff]/40 dark:hover:text-[#afb5ff]"
          >
            {syn}
          </span>
        ))}
      </div>
    </div>
  );
}

function WordDefinitionBody({ wordDefinition }) {
  if (wordDefinition.vocabError || wordDefinition.error) {
    return (
      <WordErrorStatus
        error={wordDefinition.error}
        errorMessage={wordDefinition.errorMessage}
        definition={wordDefinition.definition}
      />
    );
  }
  if (wordDefinition.addedToVocab) {
    return (
      <WordNoticeCard
        icon={Check}
        iconStrokeWidth={2.5}
        iconClassName="bg-[rgb(var(--signal-ok)/0.1)] text-[rgb(var(--signal-ok))]"
        title="Added to Word Bank"
        subtitle="+5 points earned"
      />
    );
  }
  if (wordDefinition.alreadyExists) {
    return (
      <WordNoticeCard
        icon={BookOpen}
        iconStrokeWidth={2.2}
        iconClassName="bg-[rgb(var(--signal-warn)/0.1)] text-[rgb(var(--signal-warn))]"
        title="Already in Word Bank"
      />
    );
  }

  return (
    <div className="mt-2.5 space-y-2.5">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className={cn(MICRO, MUTED, 'text-[8.5px]')}>Meaning</span>
          {wordDefinition.contextual && <span className="sr-only">Meaning here</span>}
        </div>
        <p className="text-[13px] font-semibold leading-snug tracking-[-0.01em] text-slate-900 dark:text-slate-50">
          {wordDefinition.definition}
        </p>
      </div>

      <WordExampleBox example={wordDefinition.example} word={wordDefinition.word} />
      <WordSynonymsList synonyms={wordDefinition.synonyms} />
    </div>
  );
}

function WordAddAction({ wordDefinition, onAdd }) {
  const hasFeedback =
    wordDefinition.addedToVocab ||
    wordDefinition.alreadyExists ||
    wordDefinition.error ||
    wordDefinition.vocabError;

  if (hasFeedback) return null;

  return (
    <button
      type="button"
      onClick={() => onAdd(wordDefinition)}
      disabled={wordDefinition.definition === 'Loading...'}
      aria-label="Add to Word Bank"
      className="mt-2 flex h-8 w-full items-center justify-between rounded-lg bg-[#5a63df] px-3 text-[11.5px] font-semibold text-white shadow-xs transition-all duration-150 hover:bg-[#4d56c9] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#141319] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
    >
      <div className="flex items-center gap-1.5">
        <BookOpen className="size-3.5" strokeWidth={2.2} />
        <span>Add to Word Bank</span>
      </div>
      <span className="rounded bg-white/20 px-1.5 py-0.5 text-[9.5px] font-bold tracking-tight text-white">
        +5 pts
      </span>
    </button>
  );
}

export default function WordDefinitionPopover({ wordDefinition, addToVocabulary, onClose }) {
  const popoverRef = useRef(null);

  useEffect(() => {
    if (!onClose || !wordDefinition) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, wordDefinition]);

  if (!wordDefinition?.position) return null;

  if (wordDefinition.definition === 'Loading...') {
    return <WordDefinitionLoading position={wordDefinition.position} word={wordDefinition.word} />;
  }

  return (
    <AnimatePresence>
      <m.div
        ref={popoverRef}
        initial={{ opacity: 0, scale: 0.98, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 6 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        style={getDefinitionPopoverStyle(wordDefinition.position)}
      >
        <div
          className={cn(
            PANEL,
            'relative max-h-[min(26rem,calc(100vh-2rem))] w-[310px] overflow-y-auto px-3.5 pt-2.5 pb-3 shadow-xl shadow-slate-900/10 dark:shadow-black/50'
          )}
          aria-label={`Definition for ${wordDefinition.word}`}
        >
          <WordDefinitionHeader contextual={wordDefinition.contextual} onClose={onClose} />
          <WordTitleRow
            word={wordDefinition.word}
            partOfSpeech={wordDefinition.part_of_speech}
            pronunciation={wordDefinition.pronunciation}
            audio={wordDefinition.audio}
          />
          <WordDefinitionBody wordDefinition={wordDefinition} />
          <WordAddAction wordDefinition={wordDefinition} onAdd={addToVocabulary} />
        </div>
      </m.div>
    </AnimatePresence>
  );
}
