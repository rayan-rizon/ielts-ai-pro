import React, { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  BookOpen,
  Check,
  LoaderCircle,
  Plus,
  X,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { PANEL, WELL, MICRO, NUM } from '@/features/dashboard/components/primitives';
import {
  LINKING_RELATIONS,
  plainWritingText,
} from '@/features/testing/writing/utils/writingCoaching';

// ─── Constants ────────────────────────────────────────────────────────────────

// Type only carries icon + label. Colour is driven by severity (below) so the
// palette stays the app's 3-signal system (fault/warn/ok) plus one brand accent
// for actionable suggestions — never a colour-per-category rainbow.
const TYPE_META = {
  grammar: { icon: AlertCircle, label: 'Grammar' },
  spelling: { icon: AlertCircle, label: 'Spelling' },
  style: { icon: AlertTriangle, label: 'Style' },
  vocabulary: { icon: BookOpen, label: 'Vocabulary' },
  clarity: { icon: Lightbulb, label: 'Clarity' },
  positive: { icon: CheckCircle2, label: 'Good' },
};

// rgb(var(--signal-*)) already resolves to the correct shade per theme, so no
// separate dark: class is needed for those three.
//
// `textClass`/`borderClass`/`bgClass` are reserved for small, one-at-a-time
// chrome (the tooltip's icon chip, severity badge, filter pills) — never for
// the running paragraph text.
//
// Inline segments carry severity through the UNDERLINE ALONE, with no resting
// background. This is the Grammarly / Google Docs model, and it is what keeps
// a densely-annotated essay readable: dark mode's signal colors are
// deliberately bright (--signal-fault is a bold coral, --signal-warn a bold
// gold, --signal-ok a bright mint) so they read as clear accents at small
// sizes, but a typical essay lights up all four severities at once, and any
// persistent fill — even a 12% wash — multiplies that into full-height color
// bands stacked down the whole page. A 2px underline carries the same
// information across a fraction of the area.
//
// Background is therefore a *state*, not an identity: `hoverWash` on hover,
// `activeWash` for the open annotation. Each severity stays on its own hue
// for those so the highlight never contradicts the underline beneath it.
const SEVERITY_STYLES = {
  error: {
    bgClass: 'bg-[rgb(var(--signal-fault)/0.08)]',
    borderClass: 'border-[rgb(var(--signal-fault)/0.3)]',
    textClass: 'text-[rgb(var(--signal-fault))]',
    underlineClass: 'underline-wave-error',
    hoverWash: 'hover:bg-[rgb(var(--signal-fault)/0.08)]',
    activeWash: 'bg-[rgb(var(--signal-fault)/0.14)]',
    applyClass: 'bg-[rgb(var(--signal-fault))] hover:opacity-90 text-white',
  },
  warning: {
    bgClass: 'bg-[rgb(var(--signal-warn)/0.08)]',
    borderClass: 'border-[rgb(var(--signal-warn)/0.3)]',
    textClass: 'text-[rgb(var(--signal-warn))]',
    underlineClass: 'underline-wave-warning',
    hoverWash: 'hover:bg-[rgb(var(--signal-warn)/0.08)]',
    activeWash: 'bg-[rgb(var(--signal-warn)/0.14)]',
    applyClass: 'bg-[rgb(var(--signal-warn))] hover:opacity-90 text-white',
  },
  suggestion: {
    bgClass: 'bg-[#efedff] dark:bg-indigo-500/10',
    borderClass: 'border-[#d2d7f8] dark:border-indigo-500/30',
    textClass: 'text-[#5661e9] dark:text-indigo-300',
    underlineClass:
      'underline decoration-[#5661e9]/80 dark:decoration-indigo-400/80 decoration-dashed decoration-1 underline-offset-[3px] py-0.5',
    hoverWash: 'hover:bg-[#5661e9]/8 dark:hover:bg-indigo-400/10',
    activeWash: 'bg-[#5661e9]/[0.12] dark:bg-indigo-400/16',
    applyClass: 'bg-[#5661e9] hover:bg-[#4853d6] text-white',
  },
  // "Good" is praise, not a task — it never needs to compete with the
  // actionable severities, so it gets the quietest mark: a plain solid rule.
  positive: {
    bgClass: 'bg-[rgb(var(--signal-ok)/0.08)]',
    borderClass: 'border-[rgb(var(--signal-ok)/0.3)]',
    textClass: 'text-[rgb(var(--signal-ok))]',
    underlineClass:
      'underline decoration-[rgb(var(--signal-ok)/0.65)] decoration-solid decoration-1 underline-offset-[3px] py-0.5',
    hoverWash: 'hover:bg-[rgb(var(--signal-ok)/0.08)]',
    activeWash: 'bg-[rgb(var(--signal-ok)/0.14)]',
    applyClass: 'bg-[rgb(var(--signal-ok))] hover:opacity-90 text-white',
  },
};

const SEVERITY_FALLBACK_BY_TYPE = {
  grammar: 'error',
  spelling: 'error',
  style: 'warning',
  vocabulary: 'suggestion',
  clarity: 'suggestion',
  positive: 'positive',
};

function resolveSeverity(annotation) {
  return (
    (SEVERITY_STYLES[annotation.severity] ? annotation.severity : null) ||
    SEVERITY_FALLBACK_BY_TYPE[annotation.type] ||
    'suggestion'
  );
}

// ─── Custom Hooks ─────────────────────────────────────────────────────────────

/**
 * Computes the horizontal offset needed to keep a tooltip inside its container.
 */
function useAnnotationPositioning(containerRef) {
  const tooltipRef = useRef(null);
  const [offsets, setOffsets] = useState({ x: 0, arrowX: 0 });

  useLayoutEffect(() => {
    if (!tooltipRef.current || !containerRef.current) return;

    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    const padding = 15;
    let deltaX = 0;

    if (tooltipRect.right > containerRect.right - padding) {
      deltaX = containerRect.right - padding - tooltipRect.right;
    } else if (tooltipRect.left < containerRect.left + padding) {
      deltaX = containerRect.left + padding - tooltipRect.left;
    }

    const maxShift = tooltipRect.width / 2 - 24;
    deltaX = Math.max(Math.min(deltaX, maxShift), -maxShift);

    if (Math.abs(deltaX) > 1) {
      setOffsets({ x: deltaX, arrowX: -deltaX });
    }
  }, [containerRef]);

  return { tooltipRef, offsets };
}

/**
 * Builds the list of text segments (annotated + plain) from plain text and annotations.
 */
/** Removes positions that overlap with previously accepted ones. */
function filterNonOverlapping(positions) {
  const result = [];
  let lastEnd = 0;
  for (const pos of positions) {
    if (pos.start >= lastEnd) {
      result.push(pos);
      lastEnd = pos.end;
    }
  }
  return result;
}

/** Converts a sorted non-overlapping position list + plainText into segments. */
function buildSegments(plainText, positions) {
  const result = [];
  let currentIndex = 0;
  for (const pos of positions) {
    if (pos.start > currentIndex) {
      result.push({ text: plainText.slice(currentIndex, pos.start), annotation: null });
    }
    result.push({ text: plainText.slice(pos.start, pos.end), annotation: pos.annotation });
    currentIndex = pos.end;
  }
  if (currentIndex < plainText.length) {
    result.push({ text: plainText.slice(currentIndex), annotation: null });
  }
  return result;
}

/**
 * Builds the list of text segments (annotated + plain) from plain text and annotations.
 */
function useAnnotatedSegments(plainText, filteredAnnotations) {
  return useMemo(() => {
    if (!plainText || filteredAnnotations.length === 0) {
      return [{ text: plainText, annotation: null }];
    }

    const positions = filteredAnnotations
      .map((annotation) => {
        const index = plainText.indexOf(annotation.originalText);
        if (index === -1) return null;
        return { start: index, end: index + annotation.originalText.length, annotation };
      })
      .filter(Boolean)
      .sort((a, b) => a.start - b.start);

    return buildSegments(plainText, filterNonOverlapping(positions));
  }, [plainText, filteredAnnotations]);
}

// ─── Tooltip Sub-components ───────────────────────────────────────────────────

// ─── Tooltip Sub-components ───────────────────────────────────────────────────

const TooltipHeader = ({ typeMeta, severityStyle, severity, onClose }) => {
  const Icon = typeMeta.icon;

  return (
    <div className="mb-2 flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5 dark:border-white/8">
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={cn(
            'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs shadow-2xs',
            severityStyle.bgClass,
            severityStyle.borderClass,
            severityStyle.textClass
          )}
        >
          <Icon className="h-3.5 w-3.5 stroke-[2.2]" />
        </span>
        <span className="truncate text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
          {typeMeta.label}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {severity !== 'positive' && (
          <span
            className={cn(
              'inline-flex h-5 items-center rounded-md border px-1.5 text-[10px] font-bold uppercase tracking-wider leading-none shadow-2xs',
              severityStyle.bgClass,
              severityStyle.borderClass,
              severityStyle.textClass
            )}
          >
            {severity}
          </span>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 active:scale-[0.96] dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
          title="Close"
        >
          <X className="h-3.5 w-3.5 stroke-[2.2]" />
        </button>
      </div>
    </div>
  );
};

const TooltipCorrectionBlock = ({ annotation }) => (
  <div className="mb-2 rounded-lg border border-slate-200/80 bg-slate-50/80 px-2.5 py-2 shadow-2xs dark:border-white/8 dark:bg-white/[0.035]">
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        Original
      </span>
      <span
        className={cn(
          'text-xs font-medium text-slate-700 dark:text-slate-200',
          annotation.replacementText &&
            'line-through decoration-[rgb(var(--signal-fault)/0.8)] decoration-2 text-slate-400 dark:text-slate-400'
        )}
      >
        {annotation.originalText}
      </span>
    </div>
    <div className="my-1.5 h-px bg-slate-200/70 dark:bg-white/8" />
    <div className="flex flex-col gap-0.5">
      <span
        className={cn(
          'text-[9px] font-bold uppercase tracking-wider',
          annotation.replacementText
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-[#5661e9] dark:text-indigo-300'
        )}
      >
        {annotation.replacementText ? 'Correction' : 'Writing advice'}
      </span>
      <span
        className={cn(
          'text-xs font-semibold leading-snug',
          annotation.replacementText
            ? 'text-emerald-700 dark:text-emerald-300 font-bold'
            : 'text-slate-800 dark:text-slate-100'
        )}
      >
        {annotation.replacementText || annotation.suggestion}
      </span>
    </div>
  </div>
);

const TooltipActions = ({ severityStyle, onApply, onIgnore, canApply }) => (
  <div className={cn('grid gap-1.5 pt-0.5', canApply ? 'grid-cols-2' : 'grid-cols-1')}>
    {canApply && (
      <Button
        onClick={(e) => {
          e.stopPropagation();
          onApply();
        }}
        className={cn(
          'h-7 rounded-lg border-0 text-xs font-bold shadow-2xs transition-all hover:shadow-xs active:scale-[0.96]',
          severityStyle.applyClass
        )}
      >
        Apply Correction
      </Button>
    )}
    <Button
      variant="outline"
      onClick={(e) => {
        e.stopPropagation();
        onIgnore();
      }}
      className="h-7 rounded-lg border-slate-200 bg-white text-xs font-bold text-slate-600 shadow-2xs transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-[0.96] dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
    >
      Dismiss
    </Button>
  </div>
);

// ─── Tooltip ──────────────────────────────────────────────────────────────────

const AnnotationTooltip = ({
  annotation,
  onApply,
  onIgnore,
  onClose,
  typeMeta,
  severityStyle,
  severity,
  containerRef,
}) => {
  const { tooltipRef, offsets } = useAnnotationPositioning(containerRef);
  const isPositive = severity === 'positive';

  return (
    <motion.div
      ref={tooltipRef}
      initial={{ opacity: 0, scale: 0.96, y: 5 }}
      animate={{ opacity: 1, scale: 1, y: 0, x: offsets.x }}
      exit={{ opacity: 0, scale: 0.96, y: 5 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      style={{ left: '50%', translateX: '-50%' }}
      className={cn(
        'absolute z-9999 w-[calc(100vw-36px)] max-w-[340px] font-sans antialiased text-left select-text',
        'overflow-hidden rounded-xl border border-[#e2e5f6] bg-white shadow-[0_16px_36px_-12px_rgba(15,23,42,0.18)] dark:border-white/12 dark:bg-[#141518] dark:shadow-[0_18px_40px_-12px_rgba(0,0,0,0.7)]',
        'mt-1.5'
      )}
    >
      {/* Pointer Arrow */}
      <div
        className="absolute -top-1.5 left-1/2 h-3 w-3 origin-center rotate-45 border-l border-t border-[#e2e5f6] bg-white dark:border-white/12 dark:bg-[#141518]"
        style={{ marginLeft: '-6px', transform: `translateX(${offsets.arrowX}px) rotate(45deg)` }}
      />

      <div className="relative px-3 py-2.5">
        <TooltipHeader
          annotation={annotation}
          typeMeta={typeMeta}
          severityStyle={severityStyle}
          severity={severity}
          onClose={onClose}
        />

        {!isPositive && <TooltipCorrectionBlock annotation={annotation} />}

        {annotation.explanation && (
          <p className="mb-2 px-0.5 text-xs font-normal leading-snug text-slate-600 dark:text-slate-300">
            {annotation.explanation}
          </p>
        )}

        {!isPositive && (
          <TooltipActions
            severityStyle={severityStyle}
            onApply={onApply}
            onIgnore={onIgnore}
            canApply={Boolean(onApply && annotation.replacementText)}
          />
        )}
      </div>
    </motion.div>
  );
};

// ─── Filter Pill ──────────────────────────────────────────────────────────────

const FILTER_PILL_CONFIG = {
  error: {
    active:
      'bg-[rgb(var(--signal-fault)/0.1)] border-[rgb(var(--signal-fault)/0.35)] text-[rgb(var(--signal-fault))]',
    dot: 'bg-[rgb(var(--signal-fault))]',
  },
  warning: {
    active:
      'bg-[rgb(var(--signal-warn)/0.1)] border-[rgb(var(--signal-warn)/0.35)] text-[rgb(var(--signal-warn))]',
    dot: 'bg-[rgb(var(--signal-warn))]',
  },
  suggestion: {
    active:
      'bg-[#efedff] border-[#d2d7f8] text-[#5661e9] dark:bg-indigo-500/20 dark:border-indigo-500/40 dark:text-indigo-200',
    dot: 'bg-[#5661e9] dark:bg-indigo-400',
  },
  positive: {
    active:
      'bg-[rgb(var(--signal-ok)/0.1)] border-[rgb(var(--signal-ok)/0.35)] text-[rgb(var(--signal-ok))]',
    dot: 'bg-[rgb(var(--signal-ok))]',
  },
};

const INACTIVE_PILL =
  'bg-slate-100/70 border-slate-200/60 text-slate-700 dark:bg-white/5 dark:border-white/10 dark:text-slate-300';
const INACTIVE_DOT = 'bg-slate-400 dark:bg-slate-500';

const FilterPill = ({ type, count, isActive, onToggle, label }) => {
  const cfg = FILTER_PILL_CONFIG[type];
  return (
    <button
      onClick={() => onToggle(type)}
      className={cn(
        'flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold transition-all border shadow-2xs',
        isActive ? cfg.active : INACTIVE_PILL
      )}
    >
      <div className={cn('w-1.5 h-1.5 rounded-full', isActive ? cfg.dot : INACTIVE_DOT)} />
      {count} {label}
    </button>
  );
};

// ─── Summary Bar ──────────────────────────────────────────────────────────────

const AnnotationSummary = ({ annotations, filters, onFilterToggle, onSelectAll }) => {
  const counts = useMemo(() => {
    const c = { error: 0, warning: 0, suggestion: 0, positive: 0 };
    annotations.forEach((a) => {
      if (a.severity && c[a.severity] !== undefined) c[a.severity]++;
    });
    return c;
  }, [annotations]);

  const pills = [
    { type: 'error', label: 'Errors' },
    { type: 'warning', label: 'Warnings' },
    { type: 'suggestion', label: 'Suggestions' },
    { type: 'positive', label: 'Good' },
  ];

  const allTypes = ['error', 'warning', 'suggestion', 'positive'];
  const isAllActive = allTypes.every((t) => filters.includes(t));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider mr-0.5">
        Filters:
      </span>
      {pills.map(({ type, label }) =>
        counts[type] > 0 ? (
          <FilterPill
            key={type}
            type={type}
            count={counts[type]}
            label={label}
            isActive={filters.includes(type)}
            onToggle={onFilterToggle}
          />
        ) : null
      )}

      <button
        type="button"
        onClick={onSelectAll}
        title={isAllActive ? 'Click to hide all highlights' : 'Click to show all highlights'}
        className={cn(
          'flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold transition-all border shadow-2xs cursor-pointer hover:scale-105 active:scale-95',
          isAllActive
            ? 'bg-[#efedff] border-[#d2d7f8] text-[#5661e9] dark:bg-indigo-500/15 dark:border-indigo-500/30 dark:text-indigo-200'
            : 'bg-slate-100/80 border-slate-200/60 text-slate-700 dark:bg-white/5 dark:border-white/10 dark:text-slate-300'
        )}
      >
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            isAllActive ? 'bg-[#5661e9] dark:bg-indigo-400 animate-pulse' : 'bg-slate-400'
          )}
        />
        <span>{annotations.length} Highlights</span>
      </button>
    </div>
  );
};

// ─── Annotated Segment ────────────────────────────────────────────────────────

const AnnotatedSegment = ({ segment, isActive, onActivate, onApply, onIgnore, containerRef }) => {
  const typeMeta = TYPE_META[segment.annotation.type] || TYPE_META.grammar;
  const severity = resolveSeverity(segment.annotation);
  const severityStyle = SEVERITY_STYLES[severity];
  const annotationRef = useRef(null);

  useEffect(() => {
    if (isActive) {
      annotationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isActive]);

  return (
    <span className="relative inline">
      <motion.span
        ref={annotationRef}
        onClick={(e) => {
          e.stopPropagation();
          onActivate();
        }}
        className={cn(
          'cursor-pointer rounded-[3px] px-0.5 -mx-0.5 transition-colors duration-150',
          'inline [box-decoration-break:clone] [-webkit-box-decoration-break:clone]',
          severityStyle.underlineClass,
          // Background is a state, not an identity — nothing at rest, so a
          // page full of annotations stays readable text rather than bands.
          isActive ? cn('relative z-10', severityStyle.activeWash) : severityStyle.hoverWash
        )}
      >
        <span className="font-medium text-slate-800 transition-colors duration-200 dark:text-slate-100">
          {segment.text}
        </span>
      </motion.span>

      <AnimatePresence>
        {isActive && (
          <AnnotationTooltip
            annotation={segment.annotation}
            typeMeta={typeMeta}
            severityStyle={severityStyle}
            severity={severity}
            onApply={onApply}
            onIgnore={onIgnore}
            onClose={() => onActivate(true)}
            containerRef={containerRef}
          />
        )}
      </AnimatePresence>
    </span>
  );
};

// ─── Vocabulary Card ──────────────────────────────────────────────────────────

const vocabularyTermKey = (word) =>
  String(word || '')
    .trim()
    .toLocaleLowerCase();

function vocabularySentencePreview(sentence, phrase) {
  const text = String(sentence || '').trim();
  const maxLength = 112;
  if (text.length <= maxLength) return text;

  const phraseIndex = text.toLocaleLowerCase().indexOf(String(phrase || '').toLocaleLowerCase());
  if (phraseIndex < 0) return `${text.slice(0, maxLength - 1).trimEnd()}…`;

  let start = Math.max(0, phraseIndex - 42);
  let end = Math.min(text.length, phraseIndex + String(phrase).length + 48);
  if (start > 0) {
    const nextSpace = text.indexOf(' ', start);
    if (nextSpace >= 0) start = nextSpace + 1;
  }
  if (end < text.length) {
    const previousSpace = text.lastIndexOf(' ', end);
    if (previousSpace > start) end = previousSpace;
  }

  return `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`;
}

const VocabularyCard = ({
  enhancement,
  sourceSentence,
  onSaveVocabularyWord,
  savedVocabularyTerms,
  savingVocabularyTerms,
}) => {
  const suggestion = enhancement;
  const alternatives = Array.isArray(enhancement.alternatives)
    ? enhancement.alternatives.filter(Boolean).slice(0, 2)
    : [];

  const [showFullSentence, setShowFullSentence] = useState(false);

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-w-0 space-y-2.5 rounded-xl border border-[#e4e2f0] bg-white p-3 shadow-2xs dark:border-white/10 dark:bg-[#151518]"
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <p className={MICRO}>Your wording</p>
          <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
            in essay
          </span>
        </div>
        <p className="mt-0.5 break-words text-sm font-bold text-slate-900 dark:text-white">
          {enhancement.original}
        </p>
      </div>

      {sourceSentence && (
        <div className="rounded-lg border border-slate-200/80 bg-slate-50/70 p-2 text-xs leading-5 dark:border-white/10 dark:bg-white/[0.03]">
          <p className="font-normal text-slate-700 dark:text-slate-300 leading-relaxed">
            “
            {highlightPhrase(
              vocabularySentencePreview(sourceSentence, suggestion.original),
              suggestion.original
            )}
            ”
          </p>
          <button
            type="button"
            onClick={() => setShowFullSentence((prev) => !prev)}
            aria-expanded={showFullSentence}
            className="mt-1 inline-flex cursor-pointer items-center gap-1 text-[10.5px] font-semibold text-[#5a63df] hover:underline dark:text-indigo-300 outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] active:scale-[0.98] transition-transform"
          >
            <span>{showFullSentence ? 'Hide sentence' : 'Full sentence'}</span>
            <ChevronRight
              className={cn(
                'h-3 w-3 transition-transform duration-200 ease-out',
                showFullSentence && 'rotate-90'
              )}
            />
          </button>
          <AnimatePresence initial={false}>
            {showFullSentence && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
                className="overflow-hidden"
              >
                <p className="mt-1.5 whitespace-normal break-words border-t border-slate-200/60 pt-1.5 font-medium text-slate-800 dark:border-white/5 dark:text-slate-200">
                  “{sourceSentence}”
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {alternatives.length > 0 && (
        <div className="border-t border-[#e4e2f0] pt-2 dark:border-white/[0.07]">
          <p className={MICRO}>Try</p>
          <ul className="mt-1.5 space-y-1.5">
            {alternatives.map((alternative) => {
              const termKey = vocabularyTermKey(alternative);
              const isSaved = savedVocabularyTerms?.has(termKey);
              const isSaving = savingVocabularyTerms?.has(termKey);
              return (
                <li
                  key={alternative}
                  className="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-[#e4e2f0] bg-[#faf9ff] px-2.5 py-1.5 dark:border-white/10 dark:bg-white/[0.03]"
                >
                  <span className="min-w-0 flex-1 break-words text-xs font-bold text-slate-900 dark:text-white">
                    {alternative}
                  </span>
                  {onSaveVocabularyWord && (
                    <button
                      type="button"
                      onClick={() =>
                        onSaveVocabularyWord({
                          word: alternative,
                          original: suggestion.original,
                          context: suggestion.context,
                          example: '',
                        })
                      }
                      disabled={isSaved || isSaving}
                      aria-label={`${isSaved ? 'Saved' : 'Add'} “${alternative}” to your vocabulary list`}
                      className={cn(
                        'inline-flex h-6.5 shrink-0 items-center gap-1 rounded-md px-2 text-[10.5px] font-bold transition-all active:scale-[0.96] border shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]',
                        isSaved
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
                          : 'border-[#d2d7f8] bg-white text-[#5a63df] hover:bg-[#efedff] dark:border-white/10 dark:bg-white/10 dark:text-indigo-200 dark:hover:bg-white/15 cursor-pointer',
                        (isSaving || isSaved) && 'cursor-default'
                      )}
                    >
                      {isSaving ? (
                        <LoaderCircle className="h-3 w-3 animate-spin" aria-hidden="true" />
                      ) : isSaved ? (
                        <Check className="h-3 w-3 stroke-[2.5]" aria-hidden="true" />
                      ) : (
                        <Plus className="h-3 w-3 stroke-[2.5]" aria-hidden="true" />
                      )}
                      <span>{isSaved ? 'Saved' : isSaving ? 'Saving' : 'Add'}</span>
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {suggestion.context && (
        <div className="rounded-md border border-[#e4e2f0]/70 bg-slate-50/60 p-2 text-[11px] leading-relaxed text-slate-600 dark:border-white/5 dark:bg-white/[0.02] dark:text-slate-300">
          <span className="font-bold text-slate-800 dark:text-slate-200">Why it fits: </span>
          {suggestion.context}
        </div>
      )}
    </motion.div>
  );
};

function vocabularySourceSentence(text, phrase) {
  if (!text || !phrase) return '';
  const source = plainWritingText(text);
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.match(new RegExp(`\\b${escaped}\\b`, 'i'));
  if (!match) return '';
  const before = source.slice(0, match.index);
  const after = source.slice(match.index + match[0].length);
  const start = Math.max(
    before.lastIndexOf('. '),
    before.lastIndexOf('! '),
    before.lastIndexOf('? '),
    before.lastIndexOf('\n')
  );
  const endCandidates = [
    after.indexOf('. '),
    after.indexOf('! '),
    after.indexOf('? '),
    after.indexOf('\n'),
  ].filter((index) => index >= 0);
  const end = endCandidates.length
    ? Math.min(...endCandidates) + match.index + match[0].length + 1
    : source.length;
  return source.slice(start < 0 ? 0 : start + (source[start] === '\n' ? 1 : 2), end).trim();
}

// ─── Annotation State Hook ────────────────────────────────────────────────────

function useAnnotationState({
  annotations,
  onApplyCorrection,
  onIgnoreAnnotation,
  focusAnnotation,
}) {
  const [activeAnnotation, setActiveAnnotation] = useState(null);
  const [ignoredAnnotations, setIgnoredAnnotations] = useState(new Set());
  const [filters, setFilters] = useState(['error', 'warning', 'suggestion', 'positive']);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setActiveAnnotation(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!focusAnnotation?.originalText) return;

    const annotation = annotations.find(
      (candidate) => candidate.originalText === focusAnnotation.originalText
    );
    if (!annotation) return;

    setIgnoredAnnotations((previous) => {
      if (!previous.has(annotation.originalText)) return previous;
      const next = new Set(previous);
      next.delete(annotation.originalText);
      return next;
    });
    setFilters((previous) =>
      previous.includes(annotation.severity) ? previous : [...previous, annotation.severity]
    );
    setActiveAnnotation(annotation);
  }, [annotations, focusAnnotation?.originalText, focusAnnotation?.requestId]);

  const filteredAnnotations = useMemo(
    () =>
      annotations
        .filter((a) => !ignoredAnnotations.has(a.originalText))
        .filter((a) => filters.includes(a.severity)),
    [annotations, ignoredAnnotations, filters]
  );

  const handleFilterToggle = (filter) =>
    setFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
    );

  const handleSelectAll = () => {
    const allTypes = ['error', 'warning', 'suggestion', 'positive'];
    const isAllActive = allTypes.every((t) => filters.includes(t));
    if (isAllActive) {
      setFilters([]);
    } else {
      setFilters(allTypes);
    }
  };

  const handleIgnore = (annotation) => {
    setIgnoredAnnotations((prev) => new Set([...prev, annotation.originalText]));
    setActiveAnnotation(null);
    onIgnoreAnnotation?.(annotation);
  };

  const handleApply = (annotation) => {
    onApplyCorrection?.(annotation);
    setActiveAnnotation(null);
  };

  const handleActivate = (annotation, isActive) => {
    setActiveAnnotation(isActive ? null : annotation);
  };

  return {
    activeAnnotation,
    filteredAnnotations,
    filters,
    containerRef,
    handleFilterToggle,
    handleSelectAll,
    handleIgnore,
    handleApply,
    handleActivate,
  };
}

// ─── Header Sub-component ─────────────────────────────────────────────────────

const AnnotatedTextHeader = ({ annotations, filters, onFilterToggle, onSelectAll }) => (
  <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3 pb-2.5 border-b border-slate-100 dark:border-white/5">
    <div className="flex items-center gap-2.5">
      <div className="p-1.5 bg-indigo-50 dark:bg-indigo-500/15 rounded-lg border border-indigo-200/60 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 shadow-2xs">
        <Sparkles className="w-3.5 h-3.5" />
      </div>
      <div>
        <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight leading-snug">
          Your Text with Annotations
        </h3>
        <p className="mt-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Interactive Feedback Mode
        </p>
      </div>
    </div>

    <div className="flex flex-wrap items-center gap-2.5">
      {annotations.length > 0 && (
        <AnnotationSummary
          annotations={annotations}
          filters={filters}
          onFilterToggle={onFilterToggle}
          onSelectAll={onSelectAll}
        />
      )}
    </div>
  </div>
);

// ─── Body Sub-component ───────────────────────────────────────────────────────

const AnnotatedTextBody = ({
  segments,
  activeAnnotation,
  containerRef,
  onApply,
  onIgnore,
  onActivate,
}) => (
  <div className="text-[15px] leading-8 text-slate-700 dark:text-slate-200 whitespace-pre-wrap font-serif">
    {segments.map((segment, i) => {
      if (!segment.annotation) return <span key={i}>{segment.text}</span>;
      const isActive = activeAnnotation?.originalText === segment.annotation.originalText;
      return (
        <AnnotatedSegment
          key={i}
          segment={segment}
          isActive={isActive}
          containerRef={containerRef}
          onApply={() => onApply(segment.annotation)}
          onIgnore={() => onIgnore(segment.annotation)}
          onActivate={(forceClose) => onActivate(segment.annotation, isActive || forceClose)}
        />
      );
    })}
  </div>
);

// ─── Coaching & Analysis Sub-components ───────────────────────────────────────

function highlightPhrase(sentence, phrase) {
  if (!sentence || !phrase) return sentence;
  try {
    const escaped = String(phrase)
      .trim()
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!escaped) return sentence;
    const splitRegex = new RegExp(`(\\b${escaped}\\b)`, 'gi');
    const parts = sentence.split(splitRegex);
    if (parts.length <= 1) return sentence;

    const testRegex = new RegExp(`^${escaped}$`, 'i');
    return parts.map((part, i) => {
      if (testRegex.test(part)) {
        return (
          <strong
            key={i}
            className="font-bold text-[#5661e9] dark:text-indigo-400 underline decoration-[#5661e9]/35 underline-offset-2"
          >
            {part}
          </strong>
        );
      }
      return part;
    });
  } catch {
    return sentence;
  }
}

function RepeatedWordCard({ word, count, inPrompt, examples }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <li className={cn(WELL, 'min-w-0 rounded-lg px-3 py-2.5 text-xs')}>
      <div className="flex min-w-0 items-center justify-between gap-2">
        <span className="min-w-0 break-words font-semibold">
          <strong className="text-sm font-black text-slate-900 dark:text-white">{word}</strong>
          {inPrompt && (
            <span className="ml-1 text-[11px] font-normal text-slate-500 dark:text-slate-400">
              in the prompt
            </span>
          )}
        </span>
        <span
          className={cn(
            NUM,
            'shrink-0 rounded-md bg-white px-2 py-1 text-[11px] font-bold text-slate-800 shadow-2xs dark:bg-white/10 dark:text-slate-200'
          )}
        >
          {count} {count === 1 ? 'occurrence' : 'occurrences'}
        </span>
      </div>
      <p className="mt-1 text-[11px] leading-4 text-slate-500 dark:text-slate-400">
        {inPrompt
          ? 'Question term — repetition may be necessary.'
          : 'Check the contexts before choosing an alternative. Keep terms that carry meaning.'}
      </p>

      {examples?.length > 0 && (
        <div className="mt-1.5">
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
            className="inline-flex cursor-pointer items-center gap-1 rounded-sm text-[11px] font-semibold text-[#5a63df] hover:underline outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] dark:text-indigo-300 transition-colors active:scale-[0.98]"
          >
            <ChevronRight
              className={cn(
                'h-3 w-3 transition-transform duration-200 ease-out',
                isOpen && 'rotate-90'
              )}
            />
            <span>
              {isOpen ? 'Hide' : 'Show'} {examples.length}{' '}
              {examples.length === 1 ? 'sentence' : 'sentences'}
            </span>
          </button>

          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
                className="overflow-hidden"
              >
                <ul className="mt-2 space-y-1.5 pt-0.5">
                  {examples.map((example, index) => (
                    <li
                      key={`${word}-${index}`}
                      className="rounded-md border border-[#e4e2f0] bg-white px-2.5 py-1.5 text-xs leading-relaxed text-slate-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-200"
                    >
                      “{highlightPhrase(example, word)}”
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </li>
  );
}

function LinkingCard({ category, count, phrases, matches }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <li className={cn(WELL, 'min-w-0 rounded-lg px-3 py-2.5 text-xs')}>
      <div className="flex items-center justify-between gap-2">
        <strong className="text-slate-900 dark:text-white">{category}</strong>
        <span className={cn(NUM, 'shrink-0 text-[11px]')}>
          {count} {count === 1 ? 'use' : 'uses'}
        </span>
      </div>

      <p className="mt-1 text-[11px] leading-5 text-slate-600 dark:text-slate-300">
        {LINKING_RELATIONS[category] || 'Shows a relationship between ideas.'}
      </p>

      <div className="mt-1.5 flex flex-wrap gap-1">
        {phrases.map((phrase) => (
          <span
            key={phrase}
            className="rounded-md border border-[#e4e2f0] bg-white px-1.5 py-0.5 text-[11px] font-semibold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
          >
            {phrase}
          </span>
        ))}
      </div>

      {matches?.length > 0 && (
        <div className="mt-1.5">
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
            className="inline-flex cursor-pointer items-center gap-1 rounded-sm text-[11px] font-semibold text-[#5a63df] hover:underline outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] dark:text-indigo-300 transition-colors active:scale-[0.98]"
          >
            <ChevronRight
              className={cn(
                'h-3 w-3 transition-transform duration-200 ease-out',
                isOpen && 'rotate-90'
              )}
            />
            <span>
              {isOpen ? 'Hide' : 'View'} {matches.length === 1 ? 'sentence' : 'sentences'}
            </span>
          </button>

          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-2 space-y-2 pt-0.5">
                  {matches.map((match, index) => (
                    <div
                      key={`${match.phrase}-${index}`}
                      className="rounded-lg border border-[#e4e2f0] bg-white p-2.5 dark:border-white/10 dark:bg-[#151518]"
                    >
                      {match.previousSentence ? (
                        <div className="space-y-1.5">
                          {/* Previous idea */}
                          <div className="border-l-2 border-slate-300 pl-2 py-0.5 dark:border-slate-600">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Previous idea:
                            </span>
                            <p className="mt-0.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                              {match.previousSentence}
                            </p>
                          </div>

                          {/* Your sentence */}
                          <div className="border-l-2 border-[#5661e9] pl-2 py-0.5 dark:border-indigo-400">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                                Your sentence:
                              </span>
                              <span className="text-[10.5px] text-slate-400 dark:text-slate-500">
                                with{' '}
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                  “{match.phrase}”
                                </span>
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs font-medium leading-relaxed text-slate-900 dark:text-white">
                              {highlightPhrase(match.sentence, match.phrase)}
                            </p>
                          </div>
                        </div>
                      ) : (
                        /* Single sentence when there is no preceding sentence in paragraph */
                        <div className="border-l-2 border-[#5661e9] pl-2 py-0.5 dark:border-indigo-400">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                              Your sentence:
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                              Paragraph opener
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs font-medium leading-relaxed text-slate-900 dark:text-white">
                            {highlightPhrase(match.sentence, match.phrase)}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </li>
  );
}

function ParagraphFlowSection({ writingAnalysis }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!writingAnalysis?.paragraphOpenings?.length) return null;

  return (
    <div className="border-t border-[#e4e2f0] pt-2 text-xs dark:border-white/[0.07]">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="flex w-full cursor-pointer items-center gap-2 font-bold text-slate-900 dark:text-white outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] rounded-sm transition-opacity hover:opacity-85 active:scale-[0.99]"
      >
        <span>Paragraph flow</span>
        <span
          className={cn(
            NUM,
            'rounded-md bg-[#f1f0fa] px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-white/10 dark:text-slate-300'
          )}
        >
          {writingAnalysis.paragraphCount}{' '}
          {writingAnalysis.paragraphCount === 1 ? 'paragraph' : 'paragraphs'}
        </span>
        <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          <span>{isOpen ? 'Hide openings' : 'View openings'}</span>
          <ChevronRight
            className={cn(
              'h-3 w-3 transition-transform duration-200 ease-out',
              isOpen && 'rotate-90'
            )}
          />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
            className="overflow-hidden"
          >
            <ol className="mt-2 grid gap-1.5 sm:grid-cols-2 pt-0.5">
              {writingAnalysis.paragraphOpenings.map((opening, index) => (
                <li
                  key={index}
                  className={cn(WELL, 'flex min-w-0 items-start gap-2 rounded-lg p-2 text-xs')}
                >
                  <span
                    className={cn(
                      NUM,
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-bold text-slate-800 shadow-2xs dark:bg-white/10 dark:text-slate-200'
                    )}
                    aria-label={`Paragraph ${index + 1}`}
                  >
                    {index + 1}
                  </span>
                  <span className="line-clamp-2 min-w-0 break-words leading-5 text-slate-800 dark:text-slate-200">
                    {opening}
                  </span>
                </li>
              ))}
            </ol>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AnnotatedText({
  text,
  annotations = [],
  vocabularyEnhancements = [],
  writingAnalysis,
  onSaveVocabularyWord,
  savedVocabularyTerms = new Set(),
  savingVocabularyTerms = new Set(),
  onApplyCorrection,
  onIgnoreAnnotation,
  focusAnnotation,
  className,
  cardClassName,
}) {
  const {
    activeAnnotation,
    filteredAnnotations,
    filters,
    containerRef,
    handleFilterToggle,
    handleSelectAll,
    handleIgnore,
    handleApply,
    handleActivate,
  } = useAnnotationState({ annotations, onApplyCorrection, onIgnoreAnnotation, focusAnnotation });

  const plainText = useMemo(() => plainWritingText(text).replace(/\s+/g, ' ').trim(), [text]);

  const segments = useAnnotatedSegments(plainText, filteredAnnotations);

  if (!text) return null;

  return (
    <div className={cn('space-y-3', className)}>
      <div
        ref={containerRef}
        className={cn(
          'relative p-3.5 sm:p-5 bg-white dark:bg-[#131315] rounded-2xl border border-[#e4e2f0] dark:border-white/[0.07] shadow-sm overflow-visible',
          cardClassName
        )}
      >
        <AnnotatedTextHeader
          annotations={annotations}
          filters={filters}
          onFilterToggle={handleFilterToggle}
          onSelectAll={handleSelectAll}
        />
        <AnnotatedTextBody
          segments={segments}
          activeAnnotation={activeAnnotation}
          containerRef={containerRef}
          onApply={handleApply}
          onIgnore={handleIgnore}
          onActivate={handleActivate}
        />
      </div>

      {(vocabularyEnhancements?.length > 0 || writingAnalysis) && (
        <section className={cn(PANEL, 'space-y-3 p-3.5 sm:p-4')}>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#5661e9] dark:text-indigo-400" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              {writingAnalysis ? 'Vocabulary & cohesion ideas' : 'Vocabulary ideas'}
            </h3>
          </div>
          {writingAnalysis && (
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Save useful phrases. Counts are hints, not grades.
            </p>
          )}
          {vocabularyEnhancements?.length > 0 && (
            <div>
              <h4 className={MICRO}>Vocabulary ideas</h4>
              <div className="mt-2 grid grid-cols-1 gap-2.5 xl:grid-cols-2">
                {vocabularyEnhancements.map((enhancement, i) => (
                  <VocabularyCard
                    key={i}
                    enhancement={enhancement}
                    sourceSentence={vocabularySourceSentence(text, enhancement.original)}
                    onSaveVocabularyWord={onSaveVocabularyWord}
                    savedVocabularyTerms={savedVocabularyTerms}
                    savingVocabularyTerms={savingVocabularyTerms}
                  />
                ))}
              </div>
            </div>
          )}
          {writingAnalysis && (
            <div className="space-y-4 border-t border-[#e4e2f0] pt-3 dark:border-white/[0.07]">
              <div className="min-w-0">
                <h4 className="text-sm font-bold">Repeated words</h4>
                <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                  Counts are descriptive, not mistakes. Open a word to see its sentences before
                  deciding whether to vary it.
                </p>
                {writingAnalysis.repeated.length > 0 ? (
                  <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                    {writingAnalysis.repeated.map((item) => (
                      <RepeatedWordCard
                        key={item.word}
                        word={item.word}
                        count={item.count}
                        inPrompt={item.inPrompt}
                        examples={item.examples}
                      />
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">No prominent repetition found.</p>
                )}
              </div>
              <div className="min-w-0 border-t border-[#e4e2f0] pt-3 dark:border-white/[0.07]">
                <h4 className="text-sm font-bold">How your ideas connect</h4>
                <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                  These words appear in your answer. Open a card to check the surrounding ideas; the
                  count alone does not grade cohesion.
                </p>
                {writingAnalysis.linking.length > 0 ? (
                  <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                    {writingAnalysis.linking.map((item) => (
                      <LinkingCard
                        key={item.category}
                        category={item.category}
                        count={item.count}
                        phrases={item.phrases}
                        matches={item.matches}
                      />
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">No listed linkers found.</p>
                )}
              </div>
            </div>
          )}
          <ParagraphFlowSection writingAnalysis={writingAnalysis} />
        </section>
      )}
    </div>
  );
}
