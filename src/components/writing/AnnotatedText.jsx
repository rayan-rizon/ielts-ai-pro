import React, { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Lightbulb,
  BookOpen,
  Check,
  LoaderCircle,
  Plus,
  X,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { PANEL, WELL, NUM } from '@/features/dashboard/components/primitives';
import {
  LINKING_RELATIONS,
  plainWritingText,
} from '@/features/testing/writing/utils/writingCoaching';
import { tidyServerCut } from '@/features/testing/writing/utils/feedbackFormatting';
import { adviceForRepeatedWord } from '@/features/testing/writing/utils/repeatedWordAdvice';

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

const SEVERITY_RANK = { focus: -1, error: 0, warning: 1, suggestion: 2, positive: 3 };

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Finds a quoted phrase in the essay. Exact first; then whitespace-tolerant,
 * because the marker may quote across a line break the learner typed.
 */
function locatePhrase(plainText, phrase) {
  const needle = String(phrase || '').trim();
  if (!needle) return null;
  const at = plainText.indexOf(needle);
  if (at !== -1) return { start: at, end: at + needle.length };
  const pattern = needle.split(/\s+/).map(escapeRegex).join('\\s+');
  const match = new RegExp(pattern).exec(plainText);
  return match ? { start: match.index, end: match.index + match[0].length } : null;
}

/**
 * Overlapping highlights can't both be drawn. Keep the most important one
 * (mistakes before advice, then the shorter, more specific phrase) and attach
 * the others to it as `related`, so its popover still shows every note.
 * Previously the later highlight was silently dropped.
 */
function resolveOverlaps(positions) {
  const rank = (pos) => SEVERITY_RANK[pos.severity] ?? 2;
  const ranked = [...positions].sort(
    (a, b) => rank(a) - rank(b) || a.end - a.start - (b.end - b.start)
  );
  const kept = [];
  for (const pos of ranked) {
    const clash = kept.find((item) => pos.start < item.end && pos.end > item.start);
    if (clash) {
      if (!pos.annotation.isFocus) clash.related.push(pos.annotation);
      continue;
    }
    kept.push({ ...pos, related: [] });
  }
  return kept.sort((a, b) => a.start - b.start);
}

/** Converts sorted, non-overlapping positions into text and highlight segments. */
function buildSegments(text, positions, offset = 0) {
  const result = [];
  let cursor = 0;
  for (const pos of positions) {
    const start = pos.start - offset;
    const end = pos.end - offset;
    if (start > cursor) result.push({ text: text.slice(cursor, start), annotation: null });
    result.push({ text: text.slice(start, end), annotation: pos.annotation, related: pos.related });
    cursor = end;
  }
  if (cursor < text.length) result.push({ text: text.slice(cursor), annotation: null });
  return result;
}

const paragraphKey = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Splits the essay into paragraphs, each with its own highlight segments, a
 * count of fixes inside it and (when the marker wrote one) a margin note.
 */
function useAnnotatedParagraphs(plainText, filteredAnnotations, focusText, paragraphNotes) {
  return useMemo(() => {
    const candidates = [
      ...filteredAnnotations.map((annotation) => ({
        annotation,
        severity: resolveSeverity(annotation),
      })),
      ...(focusText
        ? [{ annotation: { originalText: focusText, isFocus: true }, severity: 'focus' }]
        : []),
    ]
      .map((item) => {
        const range = locatePhrase(plainText, item.annotation.originalText);
        return range ? { ...item, ...range } : null;
      })
      .filter(Boolean);
    const positions = resolveOverlaps(candidates);

    const paragraphs = [];
    let cursor = 0;
    plainText.split('\n\n').forEach((text, index) => {
      const start = plainText.indexOf(text, cursor);
      const end = start + text.length;
      cursor = end;
      const inside = positions
        .filter((pos) => pos.start < end && pos.end > start)
        .map((pos) => ({ ...pos, start: Math.max(pos.start, start), end: Math.min(pos.end, end) }));
      const fixCount = inside.reduce(
        (sum, pos) =>
          sum +
          [pos.annotation, ...pos.related].filter(
            (annotation) => !annotation.isFocus && resolveSeverity(annotation) !== 'positive'
          ).length,
        0
      );
      const key = paragraphKey(text);
      const note = (paragraphNotes || []).find(
        (item) =>
          paragraphKey(item.opening).length >= 3 && key.startsWith(paragraphKey(item.opening))
      )?.note;
      paragraphs.push({
        index,
        text,
        segments: buildSegments(text, inside, start),
        fixCount,
        note,
      });
    });
    return paragraphs;
  }, [plainText, filteredAnnotations, focusText, paragraphNotes]);
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
        <span className="truncate text-[13px] font-bold text-slate-900 dark:text-white">
          {severity === 'positive' ? 'Good choice' : typeMeta.label}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
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
      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
        You wrote
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
          'text-[11px] font-semibold',
          annotation.replacementText
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-[#5661e9] dark:text-indigo-300'
        )}
      >
        {annotation.replacementText ? 'Change to' : 'Suggestion'}
      </span>
      <span
        className={cn(
          'text-xs font-semibold leading-snug',
          annotation.replacementText
            ? 'text-emerald-700 dark:text-emerald-300 font-bold'
            : 'text-slate-800 dark:text-slate-100'
        )}
      >
        {annotation.replacementText || tidyServerCut(annotation.suggestion)}
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
        Use in my draft
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
      Hide
    </Button>
  </div>
);

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function RelatedNotes({ related }) {
  if (!related?.length) return null;
  return (
    <div className="mb-2 space-y-1.5 border-t border-slate-100 pt-2 dark:border-white/8">
      <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
        Also in this part
      </p>
      {related.map((item) => (
        <div
          key={item.originalText}
          className="text-xs leading-snug text-slate-700 dark:text-slate-200"
        >
          <span className="font-semibold">“{item.originalText}”</span>
          {item.replacementText ? (
            <>
              {' '}
              <span aria-hidden="true">→</span>
              <span className="sr-only">change to</span>{' '}
              <span className="font-semibold text-[rgb(var(--signal-ok))]">
                {item.replacementText}
              </span>
            </>
          ) : item.suggestion ? (
            <span className="text-slate-600 dark:text-slate-300">: {item.suggestion}</span>
          ) : null}
          {item.explanation && (
            <span className="block text-slate-500 dark:text-slate-400">{item.explanation}</span>
          )}
        </div>
      ))}
    </div>
  );
}

const AnnotationTooltip = ({
  annotation,
  related,
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
            {tidyServerCut(annotation.explanation)}
          </p>
        )}

        <RelatedNotes related={related} />

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
      type="button"
      aria-pressed={isActive}
      onClick={() => onToggle(type)}
      className={cn(
        'flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]',
        isActive ? cfg.active : INACTIVE_PILL
      )}
    >
      <div className={cn('w-1.5 h-1.5 rounded-full', isActive ? cfg.dot : INACTIVE_DOT)} />
      {count} {label}
    </button>
  );
};

// ─── Summary Bar ──────────────────────────────────────────────────────────────

const LEGEND = [
  { type: 'error', label: 'Mistakes' },
  { type: 'warning', label: 'Worth fixing' },
  { type: 'suggestion', label: 'Ideas' },
  { type: 'positive', label: 'Good' },
];

const AnnotationSummary = ({ annotations, filters, onFilterToggle, onSelectAll }) => {
  const counts = useMemo(() => {
    const c = { error: 0, warning: 0, suggestion: 0, positive: 0 };
    annotations.forEach((a) => {
      const severity = resolveSeverity(a);
      if (c[severity] !== undefined) c[severity]++;
    });
    return c;
  }, [annotations]);

  const allTypes = LEGEND.map((item) => item.type);
  const isAllActive = allTypes.every((t) => filters.includes(t));

  return (
    <div
      className="flex flex-wrap items-center gap-1.5"
      role="group"
      aria-label="Show or hide highlights"
    >
      {LEGEND.map(({ type, label }) =>
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
        className="rounded-sm px-1 text-[11px] font-semibold text-[#5a63df] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] dark:text-[#afb5ff]"
      >
        {isAllActive ? 'Hide all' : 'Show all'}
      </button>
    </div>
  );
};

// ─── Focus Segment ────────────────────────────────────────────────────────────

/** A passage the report pointed to ("Show in my essay") that has no note of its own. */
const FocusSegment = ({ text, requestId }) => {
  const ref = useRef(null);
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    ref.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  }, [requestId]);
  return (
    <mark
      ref={ref}
      className="rounded-[3px] bg-[#5a63df]/15 px-0.5 -mx-0.5 text-inherit [box-decoration-break:clone] dark:bg-[#8f97ff]/25"
    >
      {text}
    </mark>
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
            related={segment.related}
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
  const alternatives = Array.isArray(enhancement.alternatives)
    ? enhancement.alternatives.filter(Boolean).slice(0, 2)
    : [];
  const [showFullSentence, setShowFullSentence] = useState(false);
  const preview = sourceSentence
    ? vocabularySentencePreview(sourceSentence, enhancement.original)
    : '';
  const canExpand = Boolean(sourceSentence) && preview !== sourceSentence;

  return (
    <div className="min-w-0 rounded-xl border border-[#e4e2f0] bg-white p-3 dark:border-white/10 dark:bg-[#151518]">
      <p className="text-[11.5px] font-semibold text-slate-500 dark:text-slate-400">You wrote</p>
      <p className="mt-0.5 break-words text-[14px] font-bold text-slate-900 dark:text-white">
        {enhancement.original}
      </p>

      {sourceSentence && (
        <div className={cn(WELL, 'mt-2 rounded-lg px-2.5 py-2')}>
          <p className="font-serif text-[12.5px] leading-relaxed text-slate-700 dark:text-slate-300">
            “{highlightPhrase(showFullSentence ? sourceSentence : preview, enhancement.original)}”
          </p>
          {canExpand && (
            <button
              type="button"
              onClick={() => setShowFullSentence((prev) => !prev)}
              aria-expanded={showFullSentence}
              className="mt-1 rounded-sm text-[11.5px] font-semibold text-[#5a63df] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[#5a63df] dark:text-indigo-300"
            >
              {showFullSentence ? 'Show less' : 'Show the whole sentence'}
            </button>
          )}
        </div>
      )}

      {alternatives.length > 0 && (
        <div className="mt-3">
          <p className="text-[11.5px] font-semibold text-slate-500 dark:text-slate-400">
            Instead, you could write
          </p>
          <ul className="mt-1.5 space-y-1.5">
            {alternatives.map((alternative) => {
              const termKey = vocabularyTermKey(alternative);
              const isSaved = savedVocabularyTerms?.has(termKey);
              const isSaving = savingVocabularyTerms?.has(termKey);
              return (
                <li
                  key={alternative}
                  className="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-[#5a63df]/20 bg-[#5a63df]/[0.05] px-2.5 py-1.5 dark:border-[#8f97ff]/25 dark:bg-[#8f97ff]/10"
                >
                  <span className="min-w-0 flex-1 break-words text-[13px] font-bold text-slate-900 dark:text-white">
                    {alternative}
                  </span>
                  {onSaveVocabularyWord && (
                    <button
                      type="button"
                      onClick={() =>
                        onSaveVocabularyWord({
                          word: alternative,
                          original: enhancement.original,
                          context: enhancement.context,
                          example: '',
                        })
                      }
                      disabled={isSaved || isSaving}
                      aria-label={`${isSaved ? 'Saved' : 'Add'} “${alternative}” to your vocabulary list`}
                      className={cn(
                        'inline-flex h-7 shrink-0 items-center gap-1 rounded-md border px-2 text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]',
                        isSaved
                          ? 'cursor-default border-[rgb(var(--signal-ok)/0.4)] bg-[rgb(var(--signal-ok)/0.1)] text-[rgb(var(--signal-ok))]'
                          : 'cursor-pointer border-[#d2d7f8] bg-white text-[#5a63df] hover:bg-[#efedff] dark:border-white/10 dark:bg-white/10 dark:text-indigo-200'
                      )}
                    >
                      {isSaving ? (
                        <LoaderCircle className="h-3 w-3 animate-spin" aria-hidden="true" />
                      ) : isSaved ? (
                        <Check className="h-3 w-3 stroke-[2.5]" aria-hidden="true" />
                      ) : (
                        <Plus className="h-3 w-3 stroke-[2.5]" aria-hidden="true" />
                      )}
                      <span>{isSaved ? 'Saved' : isSaving ? 'Saving' : 'Save word'}</span>
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {enhancement.context && (
        <p className="mt-2 text-[12px] leading-snug text-slate-600 dark:text-slate-300">
          <span className="font-semibold text-slate-800 dark:text-slate-100">
            Why it is better:{' '}
          </span>
          {tidyServerCut(enhancement.context)}
        </p>
      )}
    </div>
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
  const [focusText, setFocusText] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setActiveAnnotation(null);
        setFocusText(null);
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
    if (!annotation) {
      // The report can point at a passage that has no highlight of its own
      // (a priority's evidence). Mark the passage itself instead of doing nothing.
      setActiveAnnotation(null);
      setFocusText(focusAnnotation.originalText);
      return;
    }
    setFocusText(null);

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
    setFocusText(null);
    setActiveAnnotation(isActive ? null : annotation);
  };

  return {
    activeAnnotation,
    focusText,
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
  <div className="mb-3 flex flex-wrap items-start justify-between gap-2.5 border-b border-[#eceafa] pb-2.5 dark:border-white/[0.07]">
    <div>
      <h3 className="text-[15px] font-extrabold tracking-tight text-slate-900 dark:text-white">
        Your essay
      </h3>
      {annotations.length > 0 && (
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Tap an underlined phrase to see the fix.
        </p>
      )}
    </div>
    {annotations.length > 0 && (
      <AnnotationSummary
        annotations={annotations}
        filters={filters}
        onFilterToggle={onFilterToggle}
        onSelectAll={onSelectAll}
      />
    )}
  </div>
);

// ─── Body Sub-component ───────────────────────────────────────────────────────

/**
 * The marker's note for one paragraph, shown under it. Paragraphs keep their
 * full width; a note only appears where the marker wrote one.
 */
function ParagraphNote({ note }) {
  if (!note) return null;
  return (
    <p className="mt-1.5 border-l-2 border-[#5a63df]/40 pl-2.5 font-sans text-[12.5px] leading-snug text-slate-600 dark:border-[#8f97ff]/40 dark:text-slate-300">
      {note}
    </p>
  );
}

const AnnotatedTextBody = ({
  paragraphs,
  activeAnnotation,
  containerRef,
  onApply,
  onIgnore,
  onActivate,
  focusRequestId,
}) => {
  return (
    <div>
      <div className="space-y-4">
        {paragraphs.map((paragraph) => (
          <div key={paragraph.index}>
            <p className="whitespace-pre-wrap font-serif text-[15px] leading-8 text-slate-700 dark:text-slate-200">
              {paragraph.segments.map((segment, i) => {
                if (!segment.annotation) return <span key={i}>{segment.text}</span>;
                if (segment.annotation.isFocus) {
                  return <FocusSegment key={i} text={segment.text} requestId={focusRequestId} />;
                }
                const isActive = Boolean(
                  activeAnnotation &&
                  [segment.annotation, ...(segment.related || [])].some(
                    (item) => item.originalText === activeAnnotation.originalText
                  )
                );
                return (
                  <AnnotatedSegment
                    key={i}
                    segment={segment}
                    isActive={isActive}
                    containerRef={containerRef}
                    onApply={() => onApply(segment.annotation)}
                    onIgnore={() => onIgnore(segment.annotation)}
                    onActivate={(forceClose) =>
                      onActivate(segment.annotation, isActive || forceClose)
                    }
                  />
                );
              })}
            </p>
            <ParagraphNote note={paragraph.note} />
          </div>
        ))}
      </div>
    </div>
  );
};

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

function RepeatedWordCard({ word, count, examples, isVisualTask }) {
  const [isOpen, setIsOpen] = useState(false);
  const advice = adviceForRepeatedWord({ word, count });

  return (
    <li className="min-w-0 rounded-lg border border-[#e4e2f0] bg-white p-3 text-xs dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex items-baseline justify-between gap-2">
        <strong className="break-words text-[14px] font-bold text-slate-900 dark:text-white">
          {word}
        </strong>
        <span
          className={cn(
            NUM,
            'shrink-0 text-[11.5px] font-semibold',
            advice.severity === 'high'
              ? 'text-[rgb(var(--signal-warn))]'
              : 'text-slate-500 dark:text-slate-400'
          )}
        >
          {count} times
        </span>
      </div>
      <p className="mt-1 text-[12px] leading-snug text-slate-600 dark:text-slate-300">
        {advice.verdict}
      </p>

      {advice.alternatives.length > 0 && (
        <div className="mt-2">
          <p className="text-[11.5px] font-semibold text-slate-500 dark:text-slate-400">
            You could also say
          </p>
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {advice.alternatives.map((alternative) => (
              <li
                key={alternative}
                className="rounded-md bg-[#5a63df]/10 px-2 py-0.5 text-[12px] font-semibold text-[#4b53c9] dark:bg-[#8f97ff]/15 dark:text-[#c3c7ff]"
              >
                {alternative}
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="mt-2 text-[11.5px] leading-snug text-slate-500 dark:text-slate-400">
        {advice.tip}
        {isVisualTask && ` If “${word}” is a label in the chart, keep it exactly.`}
      </p>

      {examples?.length > 0 && (
        <div className="mt-1.5">
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
            className="inline-flex cursor-pointer items-center gap-1 rounded-sm text-[11.5px] font-semibold text-[#5a63df] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[#5a63df] dark:text-indigo-300"
          >
            <ChevronRight
              className={cn(
                'h-3 w-3 transition-transform duration-200 ease-out',
                isOpen && 'rotate-90'
              )}
            />
            {isOpen ? 'Hide' : 'See'} where you used it
          </button>
          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.ul
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
                className="mt-1.5 space-y-1 overflow-hidden"
              >
                {examples.map((example, index) => (
                  <li
                    key={`${word}-${index}`}
                    className={cn(
                      WELL,
                      'rounded-md px-2.5 py-1.5 font-serif text-[12.5px] leading-relaxed text-slate-700 dark:text-slate-200'
                    )}
                  >
                    {highlightPhrase(example, word)}
                  </li>
                ))}
              </motion.ul>
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
  paragraphNotes = [],
  chartText = '',
  isVisualTask = false,
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
    focusText,
    filteredAnnotations,
    filters,
    containerRef,
    handleFilterToggle,
    handleSelectAll,
    handleIgnore,
    handleApply,
    handleActivate,
  } = useAnnotationState({ annotations, onApplyCorrection, onIgnoreAnnotation, focusAnnotation });

  // Keep the learner's paragraphs. Only spacing inside a paragraph is
  // normalised; collapsing every newline used to show the essay as one block.
  const plainText = useMemo(
    () =>
      plainWritingText(text)
        .split(/\n+/)
        .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .join('\n\n'),
    [text]
  );

  const paragraphs = useAnnotatedParagraphs(
    plainText,
    filteredAnnotations,
    focusText,
    paragraphNotes
  );

  // Words from the question and labels from the chart must be repeated
  // exactly ("Very satisfied" can't become "happy"), and words the vocabulary
  // ideas already cover would say the same thing twice. Chart labels come from
  // the marker's own description of the visual, matched on the first five
  // letters so "satisfied" also catches "satisfaction".
  const repeatedWords = useMemo(() => {
    const covered = (vocabularyEnhancements || []).map((item) =>
      String(item.original || '').toLowerCase()
    );
    const chartStems = new Set(
      (
        String(chartText)
          .toLowerCase()
          .match(/[a-z]{3,}/g) || []
      ).map((word) => word.slice(0, 5))
    );
    return (writingAnalysis?.repeated || []).filter(
      (item) =>
        !item.inPrompt &&
        !chartStems.has(item.word.toLowerCase().slice(0, 5)) &&
        !covered.some((phrase) => phrase.includes(item.word.toLowerCase()))
    );
  }, [writingAnalysis, vocabularyEnhancements, chartText]);

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
          paragraphs={paragraphs}
          focusRequestId={focusAnnotation?.requestId}
          activeAnnotation={activeAnnotation}
          containerRef={containerRef}
          onApply={handleApply}
          onIgnore={handleIgnore}
          onActivate={handleActivate}
        />
      </div>

      {(vocabularyEnhancements?.length > 0 || writingAnalysis) && (
        <section className={cn(PANEL, 'space-y-3 p-3.5 sm:p-4')}>
          <div>
            <h3 className="text-[15px] font-extrabold tracking-tight text-slate-900 dark:text-white">
              Words and linking
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Ideas to vary your words. Save the ones you like to your vocabulary list.
            </p>
          </div>
          {vocabularyEnhancements?.length > 0 && (
            <div>
              <h4 className="text-[13px] font-bold text-slate-800 dark:text-slate-100">
                Better words for this essay
              </h4>
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
              {repeatedWords.length > 0 && (
                <div className="min-w-0">
                  <h4 className="text-[13px] font-bold text-slate-800 dark:text-slate-100">
                    Words you used a lot
                  </h4>
                  <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    Repeating a word is only a problem when it fills many sentences.{' '}
                    {isVisualTask
                      ? 'Words from the question and labels from the chart are left out: keep those exactly as they are.'
                      : 'Words from the question are left out, because repeating those is expected.'}
                  </p>
                  <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                    {repeatedWords.map((item) => (
                      <RepeatedWordCard
                        key={item.word}
                        isVisualTask={isVisualTask}
                        word={item.word}
                        count={item.count}
                        examples={item.examples}
                      />
                    ))}
                  </ul>
                </div>
              )}
              <div className="min-w-0">
                <h4 className="text-[13px] font-bold text-slate-800 dark:text-slate-100">
                  Linking words you used
                </h4>
                {writingAnalysis.linking.length > 0 ? (
                  <dl className="mt-2 grid gap-x-4 gap-y-1.5 text-xs sm:grid-cols-[auto_minmax(0,1fr)]">
                    {writingAnalysis.linking.map((item) => (
                      <React.Fragment key={item.category}>
                        <dt className="text-slate-500 dark:text-slate-400">
                          {LINKING_RELATIONS[item.category]?.replace(/\.$/, '') || item.category}
                        </dt>
                        <dd className="flex flex-wrap gap-1">
                          {item.phrases.map((phrase) => (
                            <span
                              key={phrase}
                              className="rounded-md border border-[#e4e2f0] bg-white px-1.5 py-0.5 font-semibold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                            >
                              {phrase}
                            </span>
                          ))}
                        </dd>
                      </React.Fragment>
                    ))}
                  </dl>
                ) : (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    No common linking words found. Words like “however”, “as a result” and “for
                    example” help the reader follow your ideas.
                  </p>
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
