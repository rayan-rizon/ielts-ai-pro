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
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';

// Annotation type configuration
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

// Tooltip component for annotations with smart positioning correction
const AnnotationTooltip = ({ annotation, onApply, onIgnore, onClose, config, containerRef }) => {
  const Icon = config.icon;
  const tooltipRef = useRef(null);
  const arrowRef = useRef(null);
  const [offsets, setOffsets] = useState({ x: 0, arrowX: 0 });

  useLayoutEffect(() => {
    if (!tooltipRef.current || !containerRef.current) return;

    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    // Padding to keep from touching the very edge
    const padding = 15;

    // Calculate overflow
    // standard left is centered, so we start from there.
    // The current render position "should" be centered on the span.

    // We simulate where it would be if centered:
    // Actually, asking bounding client rect gives us the CURRENT position.
    // Since we start with x:0, the first render is centered.
    // We measure that, and calculate deviation.

    let deltaX = 0;

    // Check Right Edge
    if (tooltipRect.right > containerRect.right - padding) {
      deltaX = containerRect.right - padding - tooltipRect.right;
    }
    // Check Left Edge
    else if (tooltipRect.left < containerRect.left + padding) {
      deltaX = containerRect.left + padding - tooltipRect.left;
    }

    // Limit deltaX so arrow doesn't detach (keep arrow within card)
    // Card half width is roughly 192px. Safe zone is ~170px.
    const maxShift = tooltipRect.width / 2 - 24; // 24px buffer for corner radius
    deltaX = Math.max(Math.min(deltaX, maxShift), -maxShift);

    if (Math.abs(deltaX) > 1) {
      setOffsets({
        x: deltaX,
        arrowX: -deltaX, // Counter-shift arrow to keep it pointing at the word
      });
    }
  }, [containerRef]);

  return (
    <motion.div
      ref={tooltipRef}
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0, x: offsets.x }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      style={{ left: '50%', translateX: '-50%' }} // Initial center alignment
      className={cn(
        'absolute z-[9999] w-96 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] overflow-hidden',
        'bg-white dark:bg-slate-900',
        'border border-slate-200/60 dark:border-white/10',
        'mt-3'
      )}
      data-oid="gcva2e:"
    >
      {/* Pointer Arrow */}
      <div
        ref={arrowRef}
        className={cn(
          'absolute -top-1.5 left-1/2 w-3 h-3 rotate-45 border-l border-t border-slate-200/60 dark:border-white/10 bg-inherit origin-center'
        )}
        style={{
          marginLeft: '-6px', // Center the 12px arrow (w-3)
          transform: `translateX(${offsets.arrowX}px) rotate(45deg)`,
        }}
        data-oid=":47_5-b"
      />

      <div className="p-5 relative bg-white dark:bg-slate-900" data-oid="n8h3tes">
        <div className="flex items-center gap-3 mb-4" data-oid="0488tr7">
          <div className={cn('p-2 rounded-xl flex-shrink-0', config.bgClass)} data-oid="yy1xtwl">
            <Icon className={cn('w-4 h-4', config.textClass)} data-oid="8s7ctjh" />
          </div>
          <div className="flex flex-col" data-oid="6gz18.y">
            <span
              className={cn('text-[10px] font-bold uppercase tracking-[0.2em]', config.textClass)}
              data-oid="__u2mlc"
            >
              {config.label}
            </span>
            <span
              className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase"
              data-oid="ydj_:0s"
            >
              Suggestion
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2" data-oid="i-oyqh:">
            {annotation.severity !== 'positive' && (
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px] font-bold uppercase py-0.5',
                  config.textClass,
                  config.borderClass
                )}
                data-oid="3j1ilgj"
              >
                {annotation.severity}
              </Badge>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
              data-oid="69v::6u"
            >
              <X className="w-4 h-4" data-oid="7r_ki:9" />
            </button>
          </div>
        </div>

        {annotation.severity !== 'positive' && (
          <div
            className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 mb-4 space-y-3"
            data-oid="_kqxoxl"
          >
            <div className="flex flex-col gap-1.5" data-oid="64shoqw">
              <span
                className="text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                data-oid="vebk6xb"
              >
                Original
              </span>
              <span
                className="text-sm line-through text-slate-500 font-medium decoration-slate-300 dark:decoration-slate-700"
                data-oid=".ed:lkn"
              >
                {annotation.originalText}
              </span>
            </div>
            <div className="h-px bg-slate-200/60 dark:bg-slate-800" data-oid="0u.pc_8" />
            <div className="flex flex-col gap-1.5" data-oid="v86_ryj">
              <span
                className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest"
                data-oid="0btrx2y"
              >
                Correction
              </span>
              <span
                className="text-[15px] font-bold text-emerald-600 dark:text-emerald-400 leading-snug"
                data-oid="awy2e76"
              >
                {annotation.suggestion}
              </span>
            </div>
          </div>
        )}

        <p
          className="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed mb-5 px-1 font-medium italic opacity-90"
          data-oid="r85n0el"
        >
          "{annotation.explanation}"
        </p>

        {annotation.severity !== 'positive' && onApply && (
          <div className="grid grid-cols-2 gap-3" data-oid="g3d0vfz">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onApply();
              }}
              className={cn(
                'h-10 text-xs font-bold shadow-md hover:shadow-lg transition-all',
                config.color === 'rose' && 'bg-rose-500 hover:bg-rose-600 text-white',
                config.color === 'orange' && 'bg-orange-500 hover:bg-orange-600 text-white',
                config.color === 'indigo' && 'bg-indigo-600 hover:bg-indigo-700 text-white',
                config.color === 'sky' && 'bg-sky-500 hover:bg-sky-600 text-white'
              )}
              data-oid="ms6u:er"
            >
              Apply Correction
            </Button>
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onIgnore();
              }}
              className="h-10 text-xs font-bold text-slate-500 hover:text-slate-700 border-slate-200 dark:border-slate-800"
              data-oid="pxo:-kb"
            >
              Dismiss
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Summary bar component
const AnnotationSummary = ({ annotations, filters, onFilterToggle }) => {
  const counts = useMemo(() => {
    const c = { error: 0, warning: 0, suggestion: 0, positive: 0 };
    annotations.forEach((a) => {
      if (a.severity && c[a.severity] !== undefined) {
        c[a.severity]++;
      }
    });
    return c;
  }, [annotations]);

  return (
    <div
      className="flex flex-wrap items-center gap-2.5 px-3 py-2 bg-white dark:bg-[#0D0E1A] rounded-xl border border-slate-100 dark:border-white/5 shadow-sm mb-3"
      data-oid="lv6bt79"
    >
      <span
        className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1"
        data-oid="22od5e0"
      >
        Filters:
      </span>

      {counts.error > 0 && (
        <button
          onClick={() => onFilterToggle('error')}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border',
            filters.includes('error')
              ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-400'
              : 'bg-transparent border-transparent text-slate-500 hover:bg-rose-50 hover:text-rose-500'
          )}
          data-oid="b_4vpa1"
        >
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              filters.includes('error') ? 'bg-rose-500' : 'bg-slate-300'
            )}
            data-oid="wp7skdr"
          />
          {counts.error} Errors
        </button>
      )}

      {counts.warning > 0 && (
        <button
          onClick={() => onFilterToggle('warning')}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border',
            filters.includes('warning')
              ? 'bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-500/10 dark:border-orange-500/30 dark:text-orange-400'
              : 'bg-transparent border-transparent text-slate-500 hover:bg-orange-50 hover:text-orange-500'
          )}
          data-oid="-xq3v38"
        >
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              filters.includes('warning') ? 'bg-orange-500' : 'bg-slate-300'
            )}
            data-oid="oxp_u0:"
          />
          {counts.warning} Warnings
        </button>
      )}

      {counts.suggestion > 0 && (
        <button
          onClick={() => onFilterToggle('suggestion')}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border',
            filters.includes('suggestion')
              ? 'bg-sky-50 border-sky-200 text-sky-600 dark:bg-sky-500/10 dark:border-sky-500/30 dark:text-sky-400'
              : 'bg-transparent border-transparent text-slate-500 hover:bg-sky-50 hover:text-sky-500'
          )}
          data-oid="zlqdlb-"
        >
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              filters.includes('suggestion') ? 'bg-sky-500' : 'bg-slate-300'
            )}
            data-oid="ei1tneb"
          />
          {counts.suggestion} Suggestions
        </button>
      )}

      {counts.positive > 0 && (
        <button
          onClick={() => onFilterToggle('positive')}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border',
            filters.includes('positive')
              ? 'bg-teal-50 border-teal-200 text-teal-600 dark:bg-teal-500/10 dark:border-teal-500/30 dark:text-teal-400'
              : 'bg-transparent border-transparent text-slate-500 hover:bg-teal-50 hover:text-teal-500'
          )}
          data-oid="1tt9av2"
        >
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              filters.includes('positive') ? 'bg-teal-500' : 'bg-slate-300'
            )}
            data-oid="eh9cb69"
          />
          {counts.positive} Good
        </button>
      )}
    </div>
  );
};

// Compact Vocabulary Card
const VocabularyCard = ({ enhancement }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative overflow-hidden rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-500/20 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300"
      data-oid="f6.wzpo"
    >
      <div
        className="absolute top-0 left-0 w-1 h-full bg-indigo-500/50 group-hover:bg-indigo-500 transition-colors"
        data-oid=":etkgoc"
      ></div>

      <div className="p-3 pl-4" data-oid="p:pbe9v">
        <div className="flex items-center justify-between gap-3" data-oid="-gcjx.d">
          <div className="flex items-center gap-2 min-w-0" data-oid="mf-a_f7">
            <div
              className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
              data-oid="2x.savs"
            >
              <BookOpen className="w-3.5 h-3.5" data-oid="kj15n4c" />
            </div>
            <div className="flex flex-col min-w-0" data-oid="w1as1v.">
              <span
                className="text-[10px] font-bold text-slate-400 uppercase tracking-wider"
                data-oid="elvoimf"
              >
                Enhance
              </span>
              <span
                className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate"
                data-oid="t.7z7xv"
              >
                "{enhancement.original}"
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 transition-colors"
            data-oid="puk1yl-"
          >
            <ChevronDown
              className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-180')}
              data-oid="z3l6hh9"
            />
          </button>
        </div>

        <AnimatePresence data-oid="gq25oo6">
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: 'auto', opacity: 1, marginTop: 8 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              className="overflow-hidden"
              data-oid="ae0x--l"
            >
              <p
                className="text-xs text-slate-500 dark:text-slate-400 mb-3 italic border-l-2 border-indigo-100 pl-2"
                data-oid="ic0s5yn"
              >
                "{enhancement.context}"
              </p>
              <div className="flex flex-wrap gap-1.5" data-oid="ke.bms2">
                {enhancement.alternatives?.map((alt, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/15 text-xs font-semibold text-indigo-700 dark:text-indigo-200 border border-indigo-100 dark:border-indigo-500/20"
                    data-oid="wlrcgql"
                  >
                    {alt}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isExpanded && enhancement.alternatives && (
          <div className="flex items-center gap-2 mt-2 pl-10 overflow-hidden" data-oid="npcwfzl">
            <span className="text-xs text-slate-400" data-oid="p997ig3">
              Try:
            </span>
            <div className="flex gap-1.5" data-oid="enh1l0k">
              {enhancement.alternatives.slice(0, 2).map((alt, i) => (
                <span
                  key={i}
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-200 bg-indigo-50/60 dark:bg-indigo-500/15 px-1.5 py-0.5 rounded-md border border-indigo-100/50 dark:border-indigo-500/10"
                  data-oid="f_f.5ea"
                >
                  {alt}
                </span>
              ))}
              {enhancement.alternatives.length > 2 && (
                <span className="text-[10px] font-medium text-slate-400 py-0.5" data-oid="1tn.5dp">
                  + {enhancement.alternatives.length - 2}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Main AnnotatedText Component
export default function AnnotatedText({
  text,
  annotations = [],
  vocabularyEnhancements = [],
  onApplyCorrection,
  onIgnoreAnnotation,
  className,
}) {
  const [activeAnnotation, setActiveAnnotation] = useState(null);
  const [ignoredAnnotations, setIgnoredAnnotations] = useState(new Set());
  const containerRef = useRef(null);

  // Click outside dismissal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setActiveAnnotation(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [filters, setFilters] = useState(['error', 'warning', 'suggestion', 'positive']);

  // Strip HTML tags for display
  const plainText = useMemo(() => {
    return (
      text
        ?.replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim() || ''
    );
  }, [text]);

  // Filter annotations
  const filteredAnnotations = useMemo(() => {
    return annotations
      .filter((a) => !ignoredAnnotations.has(a.originalText))
      .filter((a) => filters.includes(a.severity));
  }, [annotations, ignoredAnnotations, filters]);
  const handleFilterToggle = (filter) => {
    setFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
    );
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

  // Build annotated text segments
  const segments = useMemo(() => {
    if (!plainText || filteredAnnotations.length === 0) {
      return [{ text: plainText, annotation: null }];
    }

    // Find all annotation positions
    const positions = [];
    filteredAnnotations.forEach((annotation) => {
      const index = plainText.indexOf(annotation.originalText);
      if (index !== -1) {
        positions.push({
          start: index,
          end: index + annotation.originalText.length,
          annotation,
        });
      }
    });

    // Sort by position
    positions.sort((a, b) => a.start - b.start);

    // Remove overlapping annotations
    const nonOverlapping = [];
    let lastEnd = 0;
    positions.forEach((pos) => {
      if (pos.start >= lastEnd) {
        nonOverlapping.push(pos);
        lastEnd = pos.end;
      }
    });

    // Build segments
    const result = [];
    let currentIndex = 0;

    nonOverlapping.forEach((pos) => {
      // Text before annotation
      if (pos.start > currentIndex) {
        result.push({
          text: plainText.slice(currentIndex, pos.start),
          annotation: null,
        });
      }
      // Annotated text
      result.push({
        text: plainText.slice(pos.start, pos.end),
        annotation: pos.annotation,
      });
      currentIndex = pos.end;
    });

    // Remaining text
    if (currentIndex < plainText.length) {
      result.push({
        text: plainText.slice(currentIndex),
        annotation: null,
      });
    }

    return result;
  }, [plainText, filteredAnnotations]);

  if (!text) return null;

  return (
    <div className={cn('space-y-3', className)} data-oid="2i5_klq">
      {/* Summary Bar */}
      {annotations.length > 0 && (
        <AnnotationSummary
          annotations={annotations}
          filters={filters}
          onFilterToggle={handleFilterToggle}
          data-oid="0uicvua"
        />
      )}

      {/* Annotated Text */}
      <div
        ref={containerRef}
        className="relative p-4 md:px-6 md:pb-6 md:pt-5 bg-white dark:bg-[#0D0E1A] rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-sm overflow-visible"
        data-oid="6l:qtga"
      >
        <div
          className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-100/80 dark:border-white/5"
          data-oid="azcluld"
        >
          <div
            className="p-2.5 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/15 dark:to-orange-500/15 rounded-xl border border-amber-100 dark:border-amber-500/20 shadow-sm"
            data-oid="xi0dgv6"
          >
            <Sparkles className="w-5 h-5 text-amber-500" data-oid="1tqcz5i" />
          </div>
          <div data-oid="7pl1f.f">
            <h3
              className="font-bold text-slate-800 dark:text-slate-100 tracking-tight"
              data-oid="agneej4"
            >
              Your Text with Annotations
            </h3>
            <p
              className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider"
              data-oid="1hak-y4"
            >
              Interactive Feedback Mode
            </p>
          </div>
          <div
            className="ml-auto px-3 py-1.5 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/10 flex items-center gap-2"
            data-oid="x1upy0m"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" data-oid="mq0uizv" />
            <span
              className="text-xs font-bold text-slate-600 dark:text-slate-300"
              data-oid="bpot-fg"
            >
              {filteredAnnotations.length} Highlights
            </span>
          </div>
        </div>

        <div
          className="text-[15px] leading-8 text-slate-600 dark:text-slate-200 whitespace-pre-wrap font-serif"
          data-oid="ogtkokh"
        >
          {segments.map((segment, i) => {
            if (!segment.annotation) {
              return (
                <span key={i} data-oid="54l_n0f">
                  {segment.text}
                </span>
              );
            }

            const config = ANNOTATION_CONFIG[segment.annotation.type] || ANNOTATION_CONFIG.grammar;
            const isActive = activeAnnotation?.originalText === segment.annotation.originalText;

            // Priority logic for error coloring
            const isError = segment.annotation.severity === 'error';
            const effectiveConfig = isError ? ANNOTATION_CONFIG.grammar : config;

            return (
              <span key={i} className="relative inline" data-oid="ianepdw">
                <motion.span
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveAnnotation(isActive ? null : segment.annotation);
                  }}
                  whileHover={{ scale: 1.02 }}
                  className={cn(
                    'cursor-pointer px-2 py-0.5 rounded-lg mx-0.5 transition-all duration-200 border shadow-[0_1px_2px_rgba(0,0,0,0.02)]',
                    'inline [box-decoration-break:clone] [-webkit-box-decoration-break:clone]', // Added box-decoration-break for multiline highlights
                    effectiveConfig.borderClass,
                    effectiveConfig.bgClass,
                    isActive &&
                      cn(
                        'ring-2 ring-indigo-500/40 bg-indigo-100/30 dark:bg-indigo-500/20',
                        'z-10 relative shadow-md scale-[1.01]'
                      )
                  )}
                  data-oid="x:jeyc1"
                >
                  <span
                    className={cn(
                      effectiveConfig.textClass,
                      'font-medium transition-colors duration-200'
                    )}
                    data-oid="o18cs4y"
                  >
                    {segment.text}
                  </span>
                </motion.span>

                <AnimatePresence data-oid="bxm.oom">
                  {isActive && (
                    <AnnotationTooltip
                      annotation={segment.annotation}
                      config={config}
                      onApply={() => handleApply(segment.annotation)}
                      onIgnore={() => handleIgnore(segment.annotation)}
                      onClose={() => setActiveAnnotation(null)}
                      containerRef={containerRef}
                      data-oid="31y:q2r"
                    />
                  )}
                </AnimatePresence>
              </span>
            );
          })}
        </div>
      </div>

      {/* Vocabulary Enhancements */}
      {vocabularyEnhancements && vocabularyEnhancements.length > 0 && (
        <div className="space-y-4 pt-4" data-oid=":7k_4r8">
          <div className="flex items-center gap-2 px-1" data-oid="n00_5_3">
            <BookOpen className="w-4 h-4 text-indigo-500" data-oid="5x1_vre" />
            <h3
              className="text-sm font-bold text-slate-500 uppercase tracking-wider"
              data-oid="9.43i7j"
            >
              Vocabulary Upgrade
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-oid="nrr.8q7">
            {vocabularyEnhancements.map((enhancement, i) => (
              <VocabularyCard key={i} enhancement={enhancement} data-oid="njn16hl" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
