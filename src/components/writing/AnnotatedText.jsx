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

const ANNOTATION_CONFIG = {
  grammar: {
    icon: AlertCircle,
    color: 'rose',
    bgClass: 'bg-rose-50/80 dark:bg-rose-500/10',
    borderClass: 'border-rose-200/80 dark:border-rose-500/30',
    textClass: 'text-rose-700 dark:text-rose-300',
    underlineClass: 'decoration-rose-400 decoration-wavy',
    label: 'Grammar',
  },
  spelling: {
    icon: AlertCircle,
    color: 'rose',
    bgClass: 'bg-rose-50/80 dark:bg-rose-500/10',
    borderClass: 'border-rose-200/80 dark:border-rose-500/30',
    textClass: 'text-rose-700 dark:text-rose-300',
    underlineClass: 'decoration-rose-400 decoration-wavy',
    label: 'Spelling',
  },
  style: {
    icon: AlertTriangle,
    color: 'orange',
    bgClass: 'bg-orange-50/80 dark:bg-orange-500/10',
    borderClass: 'border-orange-200/80 dark:border-orange-500/30',
    textClass: 'text-orange-700 dark:text-orange-300',
    underlineClass: 'decoration-orange-400 decoration-wavy',
    label: 'Style',
  },
  vocabulary: {
    icon: BookOpen,
    color: 'indigo',
    bgClass: 'bg-indigo-50/80 dark:bg-indigo-500/10',
    borderClass: 'border-indigo-200/80 dark:border-indigo-500/30',
    textClass: 'text-indigo-700 dark:text-indigo-300',
    underlineClass: 'decoration-indigo-400 decoration-dashed',
    label: 'Vocabulary',
  },
  clarity: {
    icon: Lightbulb,
    color: 'sky',
    bgClass: 'bg-sky-50/80 dark:bg-sky-500/10',
    borderClass: 'border-sky-200/80 dark:border-sky-500/30',
    textClass: 'text-sky-700 dark:text-sky-300',
    underlineClass: 'decoration-sky-400 decoration-dotted',
    label: 'Clarity',
  },
  positive: {
    icon: CheckCircle2,
    color: 'teal',
    bgClass: 'bg-teal-50/80 dark:bg-teal-500/10',
    borderClass: 'border-teal-200/80 dark:border-teal-500/30',
    textClass: 'text-teal-700 dark:text-teal-300',
    underlineClass: 'decoration-teal-400 decoration-double',
    label: 'Good',
  },
};

const APPLY_BUTTON_COLORS = {
  rose: 'bg-rose-500 hover:bg-rose-600 text-white',
  orange: 'bg-orange-500 hover:bg-orange-600 text-white',
  indigo: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  sky: 'bg-sky-500 hover:bg-sky-600 text-white',
};

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

const SEVERITY_BADGE_STYLES = {
  error:
    'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800/60',
  warning:
    'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/60',
  suggestion:
    'bg-[#efedff] text-[#5661e9] border-[#d2d7f8] dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30',
  positive:
    'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/60',
};

const TooltipHeader = ({ annotation, config, onClose }) => {
  const Icon = config.icon;
  const severityStyle =
    SEVERITY_BADGE_STYLES[annotation.severity] || SEVERITY_BADGE_STYLES.suggestion;

  return (
    <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-[#e2e5f6] dark:border-white/10">
      <div className="flex items-center gap-2 min-w-0">
        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#efedff] text-[#5661e9] border border-[#d2d7f8] dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30 shadow-2xs shrink-0">
          <Icon className="w-3.5 h-3.5 stroke-[2.5]" />
        </span>
        <span className="text-xs font-black uppercase tracking-wider text-slate-950 dark:text-white truncate">
          {config.label}
        </span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {annotation.severity !== 'positive' && (
          <span
            className={cn(
              'inline-flex h-6 items-center px-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider border leading-none shadow-2xs',
              severityStyle
            )}
          >
            {annotation.severity}
          </span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100/80 text-slate-500 hover:bg-slate-200 hover:text-slate-900 border border-slate-200/60 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/20 dark:hover:text-white dark:border-white/10 transition-all active:scale-95 shadow-2xs"
          title="Close"
        >
          <X className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};

const TooltipCorrectionBlock = ({ annotation }) => (
  <div className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-[#fafbff] via-[#f5f6fe] to-[#eff1fe] dark:from-slate-900/60 dark:via-slate-900/30 dark:to-slate-950/60 border border-[#e2e5f6] dark:border-white/10 mb-2 space-y-2 shadow-2xs">
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
        Original
      </span>
      <span className="text-xs font-bold text-slate-600 dark:text-slate-300 line-through decoration-rose-400/80 decoration-2">
        {annotation.originalText}
      </span>
    </div>
    <div className="h-px bg-[#e2e5f6]/80 dark:bg-white/10" />
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
        Correction
      </span>
      <span className="text-sm font-black text-emerald-700 dark:text-emerald-300 leading-snug">
        {annotation.suggestion}
      </span>
    </div>
  </div>
);

const TooltipActions = ({ config, onApply, onIgnore }) => (
  <div className="grid grid-cols-2 gap-2 pt-0.5">
    <Button
      onClick={(e) => {
        e.stopPropagation();
        onApply();
      }}
      className="h-8.5 text-xs font-black rounded-xl bg-gradient-to-r from-[#5661e9] to-[#4853d6] hover:from-[#4853d6] hover:to-[#3b42c4] text-white shadow-2xs hover:shadow-xs transition-all active:scale-95 border-0"
    >
      Apply Correction
    </Button>
    <Button
      variant="outline"
      onClick={(e) => {
        e.stopPropagation();
        onIgnore();
      }}
      className="h-8.5 text-xs font-black text-[#5661e9] hover:text-[#4853d6] dark:text-slate-200 bg-gradient-to-r from-[#f8f9ff] to-[#f4f5fe] hover:bg-slate-100/80 dark:bg-white/10 dark:hover:bg-white/15 border-[#d2d7f8] dark:border-white/10 rounded-xl active:scale-95 shadow-2xs"
    >
      Dismiss
    </Button>
  </div>
);

// ─── Tooltip ──────────────────────────────────────────────────────────────────

const AnnotationTooltip = ({ annotation, onApply, onIgnore, onClose, config, containerRef }) => {
  const { tooltipRef, offsets } = useAnnotationPositioning(containerRef);
  const isPositive = annotation.severity === 'positive';

  return (
    <motion.div
      ref={tooltipRef}
      initial={{ opacity: 0, scale: 0.95, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0, x: offsets.x }}
      exit={{ opacity: 0, scale: 0.95, y: 6 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      style={{ left: '50%', translateX: '-50%' }}
      className={cn(
        'absolute z-[9999] w-[calc(100vw-36px)] max-w-[328px] rounded-2xl shadow-[0_12px_32px_-16px_rgba(86,97,233,0.18)] overflow-hidden',
        'bg-gradient-to-br from-white via-[#fafbff] to-[#f5f6fe] dark:from-[#101322] dark:via-[#0e111d] dark:to-[#141829]',
        'border border-[#e2e5f6] dark:border-white/10',
        'mt-1.5'
      )}
    >
      {/* Pointer Arrow */}
      <div
        className="absolute -top-1.5 left-1/2 w-3 h-3 rotate-45 border-l border-t border-[#dce0f5] dark:border-white/10 bg-inherit origin-center"
        style={{ marginLeft: '-6px', transform: `translateX(${offsets.arrowX}px) rotate(45deg)` }}
      />

      <div className="pt-2 pb-2.5 px-3 relative">
        <TooltipHeader annotation={annotation} config={config} onClose={onClose} />

        {!isPositive && <TooltipCorrectionBlock annotation={annotation} />}

        <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed mb-2 px-0.5 font-medium opacity-95">
          "{annotation.explanation}"
        </p>

        {!isPositive && onApply && (
          <TooltipActions config={config} onApply={onApply} onIgnore={onIgnore} />
        )}
      </div>
    </motion.div>
  );
};

// ─── Filter Pill ──────────────────────────────────────────────────────────────

const FILTER_PILL_CONFIG = {
  error: {
    active:
      'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-500/20 dark:border-rose-500/40 dark:text-rose-200',
    dot: 'bg-rose-600',
  },
  warning: {
    active:
      'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-500/20 dark:border-amber-500/40 dark:text-amber-200',
    dot: 'bg-amber-600',
  },
  suggestion: {
    active:
      'bg-sky-50 border-sky-200 text-sky-800 dark:bg-sky-500/20 dark:border-sky-500/40 dark:text-sky-200',
    dot: 'bg-sky-600',
  },
  positive: {
    active:
      'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-500/20 dark:border-emerald-500/40 dark:text-emerald-200',
    dot: 'bg-emerald-600',
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
        'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold transition-all border shadow-2xs',
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
          'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold transition-all border shadow-2xs cursor-pointer hover:scale-105 active:scale-95',
          isAllActive
            ? 'bg-amber-500/15 border-amber-500/30 text-amber-800 dark:text-amber-200'
            : 'bg-slate-100/80 border-slate-200/60 text-slate-700 dark:bg-white/5 dark:border-white/10 dark:text-slate-300'
        )}
      >
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            isAllActive ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'
          )}
        />
        <span>{annotations.length} Highlights</span>
      </button>
    </div>
  );
};

// ─── Annotated Segment ────────────────────────────────────────────────────────

const AnnotatedSegment = ({ segment, isActive, onActivate, onApply, onIgnore, containerRef }) => {
  const config = ANNOTATION_CONFIG[segment.annotation.type] || ANNOTATION_CONFIG.grammar;
  const effectiveConfig =
    segment.annotation.severity === 'error' ? ANNOTATION_CONFIG.grammar : config;
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
          effectiveConfig.borderClass,
          effectiveConfig.bgClass,
          isActive &&
            cn(
              'ring-2 ring-indigo-500/40 bg-indigo-100/30 dark:bg-indigo-500/20 z-10 relative shadow-md scale-[1.01]'
            )
        )}
      >
        <span
          className={cn(effectiveConfig.textClass, 'font-medium transition-colors duration-200')}
        >
          {segment.text}
        </span>
      </motion.span>

      <AnimatePresence>
        {isActive && (
          <AnnotationTooltip
            annotation={segment.annotation}
            config={config}
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
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-[#fafbff] to-[#f4f3ff] dark:from-[#101322] dark:via-[#0e111d] dark:to-[#141829] border border-[#dce0f5] dark:border-white/10 hover:border-[#5661e9]/60 dark:hover:border-indigo-500/40 shadow-2xs hover:shadow-xs transition-all duration-300 p-2.5 sm:p-3 space-y-2"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="p-1.5 rounded-xl bg-[#efedff] text-[#5661e9] dark:bg-indigo-500/20 dark:text-indigo-300 border border-[#d2d7f8] dark:border-indigo-500/30 shrink-0 shadow-2xs">
            <BookOpen className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[9px] font-black text-[#5661e9] dark:text-indigo-400 uppercase tracking-wider leading-none mb-0.5">
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
            className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100/80 text-slate-500 hover:bg-slate-200 hover:text-slate-900 border border-slate-200/60 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/20 dark:hover:text-white dark:border-white/10 transition-all active:scale-95 shadow-2xs"
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

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden space-y-2 pt-1 border-t border-[#e2e5f6] dark:border-white/10"
          >
            <p className="text-xs text-slate-600 dark:text-slate-300 italic border-l-2 border-[#5661e9] pl-2.5 py-0.5 font-medium">
              "{enhancement.context}"
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {alternatives.map((alt, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#efedff] text-xs font-bold text-[#5661e9] dark:bg-indigo-500/20 dark:text-indigo-200 border border-[#d2d7f8] dark:border-indigo-500/30 shadow-2xs"
                >
                  {alt}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isExpanded && alternatives.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-[#e2e5f6] dark:border-white/10">
          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-0.5">
            Try:
          </span>
          {preview.map((alt, i) => (
            <span
              key={i}
              className="text-[11px] font-bold text-[#5661e9] dark:text-indigo-300 bg-[#efedff]/80 dark:bg-indigo-500/15 px-2.5 py-0.5 rounded-full border border-[#d2d7f8] dark:border-indigo-500/30 shadow-2xs leading-normal truncate max-w-[240px]"
            >
              {alt}
            </span>
          ))}
          {overflow > 0 && (
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 py-0.5">
              +{overflow} more
            </span>
          )}
        </div>
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
        className="relative p-3.5 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm overflow-visible"
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
            <BookOpen className="w-4 h-4 text-indigo-500" />
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
