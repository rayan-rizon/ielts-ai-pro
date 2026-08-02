import React, { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  BookOpen,
  X,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

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
const SEVERITY_STYLES = {
  error: {
    bgClass: 'bg-[rgb(var(--signal-fault)/0.08)]',
    borderClass: 'border-[rgb(var(--signal-fault)/0.3)]',
    textClass: 'text-[rgb(var(--signal-fault))]',
    underlineClass: 'decoration-[rgb(var(--signal-fault))] decoration-wavy',
    applyClass: 'bg-[rgb(var(--signal-fault))] hover:opacity-90 text-white',
  },
  warning: {
    bgClass: 'bg-[rgb(var(--signal-warn)/0.08)]',
    borderClass: 'border-[rgb(var(--signal-warn)/0.3)]',
    textClass: 'text-[rgb(var(--signal-warn))]',
    underlineClass: 'decoration-[rgb(var(--signal-warn))] decoration-wavy',
    applyClass: 'bg-[rgb(var(--signal-warn))] hover:opacity-90 text-white',
  },
  suggestion: {
    bgClass: 'bg-[#efedff] dark:bg-indigo-500/10',
    borderClass: 'border-[#d2d7f8] dark:border-indigo-500/30',
    textClass: 'text-[#5661e9] dark:text-indigo-300',
    underlineClass: 'decoration-[#5661e9] decoration-dashed',
    applyClass: 'bg-[#5661e9] hover:bg-[#4853d6] text-white',
  },
  positive: {
    bgClass: 'bg-[rgb(var(--signal-ok)/0.08)]',
    borderClass: 'border-[rgb(var(--signal-ok)/0.3)]',
    textClass: 'text-[rgb(var(--signal-ok))]',
    underlineClass: 'decoration-[rgb(var(--signal-ok))] decoration-double',
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

const TooltipHeader = ({ typeMeta, severityStyle, severity, onClose }) => {
  const Icon = typeMeta.icon;

  return (
    <div className="mb-2 flex items-center justify-between gap-1.5 border-b border-[#e2e5f6] pb-2 dark:border-white/[0.1]">
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border shadow-2xs',
            severityStyle.bgClass,
            severityStyle.borderClass,
            severityStyle.textClass
          )}
        >
          <Icon className="h-4 w-4 stroke-[2.5]" />
        </span>
        <span className="truncate text-sm font-extrabold uppercase tracking-[0.08em] text-slate-950 dark:text-white">
          {typeMeta.label}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {severity !== 'positive' && (
          <span
            className={cn(
              'inline-flex h-6 items-center rounded-lg border px-2 text-[10px] font-extrabold uppercase tracking-[0.08em] leading-none shadow-2xs',
              severityStyle.bgClass,
              severityStyle.borderClass,
              severityStyle.textClass
            )}
          >
            {severity}
          </span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200/70 bg-slate-100/80 text-slate-500 shadow-2xs transition-all hover:bg-slate-200 hover:text-slate-900 active:scale-95 dark:border-white/[0.1] dark:bg-white/[0.06] dark:text-slate-300 dark:hover:bg-white/[0.12] dark:hover:text-white"
          title="Close"
        >
          <X className="h-4 w-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};

const TooltipCorrectionBlock = ({ annotation }) => (
  <div className="mb-2 space-y-1.5 rounded-xl border border-[#e2e5f6] bg-[#f8f9ff] p-2 shadow-2xs sm:p-2.5 dark:border-white/[0.1] dark:bg-white/[0.035]">
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
        Original
      </span>
      <span className="text-xs font-bold text-slate-600 dark:text-slate-300 line-through decoration-[rgb(var(--signal-fault)/0.8)] decoration-2">
        {annotation.originalText}
      </span>
    </div>
    <div className="h-px bg-[#e2e5f6]/80 dark:bg-white/[0.1]" />
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] font-black text-[rgb(var(--signal-ok))] uppercase tracking-wider">
        Correction
      </span>
      <span className="text-sm font-black text-[rgb(var(--signal-ok))] leading-snug">
        {annotation.suggestion}
      </span>
    </div>
  </div>
);

const TooltipActions = ({ severityStyle, onApply, onIgnore }) => (
  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
    <Button
      onClick={(e) => {
        e.stopPropagation();
        onApply();
      }}
      className={cn(
        'h-8 rounded-lg border-0 text-xs font-extrabold shadow-2xs transition-all hover:shadow-xs active:scale-95',
        severityStyle.applyClass
      )}
    >
      Apply Correction
    </Button>
    <Button
      variant="outline"
      onClick={(e) => {
        e.stopPropagation();
        onIgnore();
      }}
      className="h-8 rounded-lg border-slate-200 bg-slate-50 text-xs font-extrabold text-slate-600 shadow-2xs active:scale-95 hover:bg-slate-100 hover:text-slate-900 dark:border-white/[0.1] dark:bg-white/[0.05] dark:text-slate-300 dark:hover:bg-white/[0.1] dark:hover:text-white"
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
      initial={{ opacity: 0, scale: 0.95, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0, x: offsets.x }}
      exit={{ opacity: 0, scale: 0.95, y: 6 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      style={{ left: '50%', translateX: '-50%' }}
      className={cn(
        'absolute z-[9999] w-[calc(100vw-36px)] max-w-[340px] overflow-hidden rounded-xl border border-[#e2e5f6] bg-white/95 shadow-[0_16px_40px_-20px_rgba(86,97,233,0.28)] dark:border-white/[0.12] dark:bg-[#131315]/95 dark:shadow-[0_18px_42px_-20px_rgba(0,0,0,0.7)]',
        'mt-1.5'
      )}
    >
      {/* Pointer Arrow */}
      <div
        className="absolute -top-1.5 left-1/2 h-3 w-3 origin-center rotate-45 border-l border-t border-[#dce0f5] bg-inherit dark:border-white/[0.12]"
        style={{ marginLeft: '-6px', transform: `translateX(${offsets.arrowX}px) rotate(45deg)` }}
      />

      <div className="relative px-2.5 py-2.5 sm:px-3">
        <TooltipHeader
          annotation={annotation}
          typeMeta={typeMeta}
          severityStyle={severityStyle}
          severity={severity}
          onClose={onClose}
        />

        {!isPositive && <TooltipCorrectionBlock annotation={annotation} />}

        <p className="mb-2 px-0.5 text-xs font-medium leading-relaxed text-slate-700 opacity-95 dark:text-slate-200">
          "{annotation.explanation}"
        </p>

        {!isPositive && onApply && (
          <TooltipActions severityStyle={severityStyle} onApply={onApply} onIgnore={onIgnore} />
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
        whileHover={{ scale: 1.02 }}
        className={cn(
          'cursor-pointer px-2 py-0.5 rounded-lg mx-0.5 transition-all duration-200 border shadow-[0_1px_2px_rgba(0,0,0,0.02)]',
          'inline [box-decoration-break:clone] [-webkit-box-decoration-break:clone]',
          severityStyle.borderClass,
          severityStyle.bgClass,
          isActive &&
            cn(
              'relative z-10 scale-[1.002] border-[0.5px] border-[#8f97ff]/55 bg-[#8f97ff]/[0.05] shadow-[0_1px_4px_rgba(86,97,233,0.1)] dark:border-[#aeb4ff]/45 dark:bg-[#8f97ff]/[0.1]'
            )
        )}
      >
        <span className={cn(severityStyle.textClass, 'font-medium transition-colors duration-200')}>
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

const VocabularyCard = ({ enhancement }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const alternatives = enhancement.alternatives ?? [];
  const preview = alternatives.slice(0, 2);
  const overflow = alternatives.length - 2;

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative space-y-2 rounded-xl border border-[#ebeaf7] bg-[#fbfbfe] p-2.5 transition-shadow duration-200 hover:shadow-sm dark:border-white/10 dark:bg-white/[0.03] sm:p-3"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="p-1.5 rounded-lg bg-[#efedff] text-[#5661e9] dark:bg-indigo-500/15 dark:text-indigo-300 shrink-0">
            <BookOpen className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none mb-0.5">
              Original Phrase
            </span>
            <span className="text-xs font-black text-slate-950 dark:text-white leading-snug break-words">
              "{enhancement.original}"
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100/80 text-slate-500 hover:bg-slate-200 hover:text-slate-900 border border-slate-200/60 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/20 dark:hover:text-white dark:border-white/10 transition-all active:scale-95"
            title="Toggle Details"
          >
            <ChevronDown
              className={cn(
                'w-3.5 h-3.5 transition-transform duration-200',
                isExpanded && 'rotate-180'
              )}
            />
          </button>
        </div>
      </div>

      {alternatives.length > 0 && (
        <motion.div
          layout
          transition={{ layout: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } }}
          className="space-y-2 overflow-hidden border-t border-[#e2e5f6] pt-1 dark:border-white/10"
        >
          {isExpanded ? (
            <>
              <p className="border-l-2 border-[#5661e9] py-0.5 pl-2.5 text-xs font-medium italic text-slate-600 dark:border-indigo-500 dark:text-slate-300">
                "{enhancement.context}"
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {alternatives.map((alt, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center rounded-full border border-[#d2d7f8] bg-[#efedff] px-2.5 py-1 text-xs font-bold text-[#5661e9] dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-200"
                  >
                    {alt}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="mr-0.5 text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Try:
              </span>
              {preview.map((alt, i) => (
                <span
                  key={i}
                  className="max-w-[240px] truncate rounded-full border border-[#d2d7f8] bg-[#efedff]/80 px-2.5 py-0.5 text-[11px] font-bold leading-normal text-[#5661e9] dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-300"
                >
                  {alt}
                </span>
              ))}
              {overflow > 0 && (
                <span className="py-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  +{overflow} more
                </span>
              )}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AnnotatedText({
  text,
  annotations = [],
  vocabularyEnhancements = [],
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

  const plainText = useMemo(
    () =>
      text
        ?.replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim() || '',
    [text]
  );

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

      {vocabularyEnhancements?.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-2 px-1">
            <BookOpen className="w-4 h-4 text-[#5661e9] dark:text-indigo-400" />
            <h3 className="text-xs sm:text-sm font-black text-slate-500 uppercase tracking-wider">
              Vocabulary Upgrade
            </h3>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5">
            {vocabularyEnhancements.map((enhancement, i) => (
              <VocabularyCard key={i} enhancement={enhancement} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
