import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  Lightbulb,
  BookOpen,
  AlertTriangle,
  Target,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

/**
 * Renders a single explanation entry (passage_highlight, synonym_map, why_correct, why_wrong).
 * Reused for both standard questions and individual blanks.
 */
const PassageSection = ({ text }) => (
  <div className="space-y-3 group">
    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-emerald-600 dark:text-emerald-400">
      <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shadow-sm transition-transform duration-300">
        <BookOpen className="w-3.5 h-3.5" />
      </div>
      Passage Evidence
    </div>
    <div className="relative overflow-hidden rounded-xl border border-emerald-200/60 dark:border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-500/[0.03] p-3.5 shadow-sm transition-all duration-300 hover:shadow-[0_8px_20px_-6px_rgba(16,185,129,0.15)] hover:bg-emerald-50/60 dark:hover:bg-emerald-500/5 group-hover:border-emerald-300/50 dark:group-hover:border-emerald-500/40">
      <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-gradient-to-b from-emerald-400 to-teal-400 dark:from-emerald-500/60 dark:to-teal-500/60 opacity-80 group-hover:opacity-100 transition-opacity" />
      <p className="text-[12.5px] text-slate-700 dark:text-emerald-50/90 leading-relaxed italic pl-3 pr-1 font-medium">
        "{text}"
      </p>
    </div>
  </div>
);

const SynonymSection = ({ synonymMap }) => {
  if (!synonymMap || synonymMap.length === 0) return null;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
        <div className="w-6 h-6 rounded-lg bg-indigo-100/80 dark:bg-indigo-500/15 flex items-center justify-center shadow-sm border border-indigo-200/50 dark:border-indigo-500/20">
          <Target className="w-3.5 h-3.5" />
        </div>
        Keyword Mapping
      </div>
      <div className="grid gap-2">
        {synonymMap.map((sm, idx) => (
          <div
            key={idx}
            className="relative flex flex-col p-3 rounded-xl bg-white/60 dark:bg-slate-900/40 border border-slate-200/60 dark:border-white/5 backdrop-blur-md hover:border-indigo-300/50 dark:hover:border-indigo-500/30 transition-all duration-500 group"
          >
            <div className="relative space-y-2.5">
              {/* Question Keyword Row */}
              <div className="flex items-start gap-2.5">
                <div className="flex flex-col items-center pt-1 shrink-0">
                  <div className="w-3.5 h-3.5 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 z-10 transition-transform">
                    <Target className="w-2.5 h-2.5" />
                  </div>
                  <div className="w-[1px] h-full bg-gradient-to-b from-indigo-500/30 to-emerald-500/30 mt-1 min-h-[12px]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[8px] font-black uppercase tracking-wider text-indigo-500/70 dark:text-indigo-400/70 mb-0.5">
                    Question Keyword
                  </div>
                  <p className="text-[12px] font-bold text-slate-800 dark:text-slate-100 leading-tight tracking-tight break-words">
                    {sm.question_keyword}
                  </p>
                  {sm.connection && (
                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-snug italic font-medium mt-1 pl-1.5 border-l border-slate-200 dark:border-slate-800">
                      {sm.connection}
                    </p>
                  )}
                </div>
              </div>

              {/* Passage Keyword Row */}
              <div className="flex items-start gap-2.5">
                <div className="flex flex-col items-center pt-1 shrink-0">
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 z-10">
                    <ArrowRight className="w-2.5 h-2.5" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[8px] font-black uppercase tracking-wider text-emerald-600/70 dark:text-emerald-400/70 mb-0.5">
                    Passage Evidence
                  </div>
                  <p className="text-[12px] font-bold text-emerald-800 dark:text-emerald-400 leading-tight tracking-tight break-words">
                    {sm.passage_keyword}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const WhyCorrectSection = ({ text }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-blue-600 dark:text-blue-400">
      <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center shadow-sm">
        <Lightbulb className="w-3.5 h-3.5" />
      </div>
      Explanation
    </div>
    <div className="relative group overflow-hidden rounded-xl border border-blue-200/60 dark:border-blue-500/20 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/10 p-3.5 shadow-sm transition-all duration-300 hover:shadow-[0_8px_20px_-6px_rgba(59,130,246,0.15)] group-hover:border-blue-300/60 dark:group-hover:border-blue-500/40 backdrop-blur-md">
      <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-gradient-to-b from-blue-400 to-indigo-400 dark:from-blue-500/60 dark:to-indigo-500/60 opacity-80 group-hover:opacity-100 transition-opacity" />
      <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-blue-400/10 dark:bg-blue-400/15 rounded-full blur-2xl pointer-events-none transition-transform duration-700 group-hover:scale-125" />
      <p className="text-[12px] text-slate-800 dark:text-blue-50/90 leading-relaxed relative z-10 font-semibold pl-2">
        {text}
      </p>
    </div>
  </div>
);

const WhyWrongSection = ({ whyWrong }) => {
  const keys = Object.keys(whyWrong || {});
  if (keys.length === 0) return null;

  return (
    <div className="space-y-3 pt-5 mt-2 border-t border-slate-100 dark:border-slate-800/80">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 dark:text-rose-400">
        <div className="w-6 h-6 rounded-lg bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center shadow-sm">
          <AlertTriangle className="w-3.5 h-3.5" />
        </div>
        Why other options are wrong
      </div>
      <div className="grid gap-2.5">
        {keys.map((key) => {
          // Check if key is a short identifier (like A, B, C, or IX), but explicitly exclude boolean answers
          const uppercaseKey = key?.toUpperCase() || '';
          const isBooleanOption = ['TRUE', 'FALSE', 'YES', 'NO', 'NOT GIVEN'].includes(
            uppercaseKey
          );
          const isShortKey = !isBooleanOption && (key?.length || 0) <= 4;

          return (
            <div
              key={key}
              className="flex gap-3 p-3 rounded-xl bg-white/60 dark:bg-slate-900/40 border border-slate-200/60 dark:border-white/5 hover:border-rose-200 dark:hover:border-rose-500/30 hover:bg-rose-50/30 dark:hover:bg-rose-500/5 transition-all duration-300 shadow-sm hover:shadow-[0_4px_12px_-4px_rgba(244,63,94,0.1)] relative overflow-hidden group"
            >
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-rose-400 to-rose-300 dark:from-rose-500 dark:to-rose-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-4 w-full pl-1">
                <div className="shrink-0 flex items-start">
                  <div
                    className={cn(
                      'flex items-center font-bold tracking-tight border shadow-sm transition-all duration-300 bg-white dark:bg-slate-950 border-rose-200/80 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 rounded-lg group-hover:border-rose-300 dark:group-hover:border-rose-500/50 group-hover:bg-rose-50/50 dark:group-hover:bg-rose-500/10',
                      isShortKey
                        ? 'justify-center min-w-[32px] px-2 h-7 text-xs uppercase'
                        : 'px-2.5 py-1 text-[10.5px] max-w-[200px] sm:max-w-[160px] whitespace-normal text-left break-words leading-tight'
                    )}
                  >
                    {key}
                  </div>
                </div>
                <div className={cn('flex flex-1', !isShortKey && 'pt-0.5 sm:pt-0')}>
                  <p className="text-[12px] text-slate-700 dark:text-slate-300/90 font-medium leading-relaxed my-auto">
                    {whyWrong[key]}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const DeepDivePopover = ({
  explanationData,
  userAnswer,
  isOpen,
  onToggle,
  questionType,
  blankKey,
  questionNumber,
  inline = false,
}) => {
  // Resolve what to show: either a single entry, or multiple blank entries
  const { entries, isMultiBlank } = useMemo(() => {
    if (!explanationData) return { entries: [], isMultiBlank: false };

    if (explanationData.blanks && typeof explanationData.blanks === 'object') {
      const blankKeys = Object.keys(explanationData.blanks).sort((a, b) => Number(a) - Number(b));

      if (blankKey) {
        const stripped = String(blankKey).replace(/^(gap_|blank_)/, '');
        const data = explanationData.blanks[blankKey] || explanationData.blanks[stripped];
        return {
          entries: data ? [{ key: stripped, data }] : [],
          isMultiBlank: false,
        };
      }

      return {
        entries: blankKeys.map((k) => ({ key: k, data: explanationData.blanks[k] })),
        isMultiBlank: blankKeys.length > 1,
      };
    }

    return {
      entries: [
        { key: questionNumber != null ? String(questionNumber) : null, data: explanationData },
      ],
      isMultiBlank: false,
    };
  }, [explanationData, blankKey, questionNumber]);

  // Dispatch highlight event when popover opens
  React.useEffect(() => {
    if (isOpen && entries.length > 0) {
      // Find all valid question keys
      const keys = entries.map((e) => e.key).filter(Boolean);
      if (keys.length > 0) {
        window.dispatchEvent(
          new CustomEvent('set-passage-highlight', {
            detail: { type: 'specific', keys },
          })
        );
      }
    }
    // Notice: We deliberatly omit the 'clear' dispatch on unmount or on !isOpen,
    // because sibling conditionally-rendered Popovers running their cleanup
    // would wipe out the new highlight in a race condition.
    // Clearing is managed cleanly by ReadingTestQuestionsSidebar when openDeepDive turns null.
  }, [isOpen, entries]);

  // Consolidate redundant information
  const { sharedPassage, sharedWhyWrong, consolidatedSynonyms, individualEntries } = useMemo(() => {
    if (entries.length <= 1) {
      return {
        sharedPassage: null,
        sharedWhyWrong: null,
        consolidatedSynonyms: null,
        individualEntries: entries.map((e) => ({
          ...e,
          showPassage: true,
          showWhyWrong: true,
          synonymMap: e.data.synonym_map,
        })),
      };
    }

    const firstEntry = entries[0].data;

    // 1. Check for shared passage highlight
    const isAllPassageSame = entries.every(
      (e) => e.data.passage_highlight === firstEntry.passage_highlight
    );
    const sharedPassage = isAllPassageSame ? firstEntry.passage_highlight : null;

    // 2. Check for shared why_wrong
    const firstWhyWrongStr = JSON.stringify(firstEntry.why_wrong || {});
    const isAllWhyWrongSame = entries.every(
      (e) => JSON.stringify(e.data.why_wrong || {}) === firstWhyWrongStr
    );
    const sharedWhyWrong = isAllWhyWrongSame ? firstEntry.why_wrong : null;

    // 3. Collect unique synonyms globally if they are mostly redundant
    // For IELTS multi-mcq, we'll deduplicate all synonyms and show them once at top
    // unless they are very different. But for now, let's just deduplicate.
    const allSyns = entries.flatMap((e) => e.data.synonym_map || []);
    const consolidatedSynonyms = allSyns.filter(
      (s, index, self) =>
        index ===
        self.findIndex(
          (t) =>
            t.question_keyword === s.question_keyword && t.passage_keyword === s.passage_keyword
        )
    );

    return {
      sharedPassage,
      sharedWhyWrong,
      consolidatedSynonyms,
      individualEntries: entries.map((e) => ({
        ...e,
        showPassage: !isAllPassageSame,
        showWhyWrong: !isAllWhyWrongSame,
        synonymMap: isAllPassageSame ? null : e.data.synonym_map, // Only hide if we pulled them to global
      })),
    };
  }, [entries]);

  if (entries.length === 0) return null;

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => {
        if (open !== isOpen) onToggle();
      }}
    >
      <PopoverTrigger asChild>
        <motion.button
          initial={false}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            inline
              ? 'inline-flex w-[26px] h-[26px] ml-3 align-middle items-center justify-center rounded-full outline-none focus:outline-none transition-all shrink-0 relative group p-[1px] overflow-hidden'
              : 'w-full mt-2 flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-medium transition-all group',
            isOpen && !inline
              ? 'bg-violet-100 border-violet-200 text-violet-800 dark:bg-violet-900/40 dark:border-violet-800/60 dark:text-violet-200 shadow-sm'
              : !inline
                ? 'bg-white/50 border-slate-200/60 text-slate-600 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700 dark:bg-slate-900/50 dark:border-slate-800/60 dark:text-slate-400 dark:hover:bg-violet-900/20 dark:hover:border-violet-800/40 dark:hover:text-violet-300'
                : '',
            inline && !isOpen ? 'shadow-lg shadow-violet-500/20' : '',
            inline && isOpen ? 'ring-2 ring-violet-500/40' : ''
          )}
          data-oid="deep-dive-trigger"
        >
          {inline && !isOpen && (
            <>
              {/* Primary Rotating 'Comet' Sweep */}
              <motion.div
                className="absolute inset-[-150%] rounded-full opacity-100 z-0"
                style={{
                  background:
                    'conic-gradient(from 0deg, transparent 0%, #8b5cf6 50%, #c084fc 70%, transparent 100%)',
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
              {/* Secondary Glow Sweep (slightly offset) */}
              <motion.div
                className="absolute inset-[-150%] rounded-full opacity-60 blur-sm z-0"
                style={{
                  background:
                    'conic-gradient(from 90deg, transparent 0%, #3b82f6 50%, transparent 100%)',
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
              />
              {/* Center Mask with soft tint */}
              <div className="absolute inset-0 rounded-full bg-violet-50/80 dark:bg-slate-950 m-[1px] z-10" />
              {/* Inner Glow Core */}
              <div className="absolute inset-0 rounded-full bg-violet-100/30 dark:bg-violet-500/10 z-10" />
            </>
          )}

          {inline ? (
            <motion.div
              className="relative z-10 flex items-center justify-center w-full h-full rounded-full bg-violet-50/50 dark:bg-slate-900/90 backdrop-blur-sm"
              animate={isOpen ? { rotate: 90 } : { rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <Sparkles
                className={cn(
                  'w-3.5 h-3.5 transition-colors duration-300',
                  isOpen
                    ? 'text-violet-700 dark:text-violet-400'
                    : 'text-violet-600 dark:text-violet-400 group-hover:text-violet-800 dark:group-hover:text-violet-300'
                )}
              />
            </motion.div>
          ) : (
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-6 h-6 rounded-md flex items-center justify-center transition-colors',
                  isOpen ? 'bg-violet-200 dark:bg-violet-800' : 'bg-slate-100 dark:bg-slate-800'
                )}
              >
                <Sparkles
                  className={cn(
                    'w-3.5 h-3.5',
                    isOpen
                      ? 'text-violet-700 dark:text-violet-300'
                      : 'text-slate-500 dark:text-slate-400'
                  )}
                />
              </div>
              <span>Paraphrase Detective</span>
              {isMultiBlank && (
                <Badge
                  variant="secondary"
                  className="text-[9px] px-1.5 py-0 h-4 bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 border-0"
                >
                  {entries.length} explanations
                </Badge>
              )}
            </div>
          )}

          {!inline && (
            <span className="text-[10px] bg-white/60 dark:bg-black/20 px-2 py-0.5 rounded-full border border-black/5 dark:border-white/5">
              {isOpen ? 'Close' : 'View Details'}
            </span>
          )}
        </motion.button>
      </PopoverTrigger>

      <PopoverContent
        side="bottom"
        align={inline ? 'end' : 'start'}
        sideOffset={inline ? 12 : 8}
        collisionPadding={24}
        className="w-[calc(100vw-2rem)] sm:w-[420px] p-0 border border-violet-200/60 dark:border-white/10 shadow-2xl rounded-2xl overflow-hidden z-[100] backdrop-blur-xl bg-white/95 dark:bg-slate-950/95 flex flex-col"
        data-oid="deep-dive-content"
      >
        {/* Scrollable Content */}
        <div className="max-h-[min(65vh,550px)] overflow-y-auto overflow-x-hidden p-3 sm:p-4 relative scrollbar-thin scrollbar-thumb-violet-200 dark:scrollbar-thumb-white/10">
          {/* Background glowing orbs */}
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-violet-500/10 dark:bg-violet-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-blue-500/5 dark:bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-4 relative z-10">
            {/* 2. Consolidated Synonyms */}
            {consolidatedSynonyms && consolidatedSynonyms.length > 0 && (
              <SynonymSection synonymMap={consolidatedSynonyms} />
            )}

            {/* 3. Answer Justifications */}
            <div className="space-y-4">
              {individualEntries.map((entry, idx) => (
                <div key={entry.key ?? idx} className="space-y-2.5">
                  {/* Synonyms/Mapping tied to this specific entry if not shared */}
                  {entry.synonymMap && <SynonymSection synonymMap={entry.synonymMap} />}

                  {/* Justification Card with context-aware label */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.15em] text-blue-600/80 dark:text-blue-400/80 px-1">
                      <Lightbulb className="w-2.5 h-2.5" />
                      {isMultiBlank ? `Reasoning for Q${entry.key}` : 'Why is this correct?'}
                    </div>

                    <div className="relative group overflow-hidden rounded-xl border border-blue-200/50 dark:border-blue-500/20 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-900/10 dark:to-indigo-900/5 p-3 shadow-sm transition-all duration-300 hover:shadow-[0_8px_20px_-10px_rgba(59,130,246,0.12)] group-hover:border-blue-300/40 dark:group-hover:border-blue-500/30 backdrop-blur-md">
                      <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-gradient-to-b from-blue-400/80 to-indigo-400/80 dark:from-blue-500/40 dark:to-indigo-500/40 opacity-70 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-blue-400/10 dark:bg-blue-400/20 rounded-full blur-xl pointer-events-none group-hover:scale-110 transition-transform duration-500" />

                      <p className="text-[11.5px] text-slate-700 dark:text-blue-50/90 leading-relaxed relative z-10 font-medium pl-2.5">
                        {entry.data.why_correct}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 4. Shared or Individual Why Wrong Footer */}
            {sharedWhyWrong && <WhyWrongSection whyWrong={sharedWhyWrong} />}
            {individualEntries.some((e) => e.showWhyWrong && e.data.why_wrong) && (
              <div className="space-y-2">
                {individualEntries
                  .filter((e) => e.showWhyWrong && e.data.why_wrong)
                  .map((e) => (
                    <div key={e.key}>
                      {isMultiBlank && (
                        <div className="text-[9px] font-bold text-rose-400/70 mb-1 uppercase">
                          Q{e.key} Distractors
                        </div>
                      )}
                      <WhyWrongSection whyWrong={e.data.why_wrong} />
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DeepDivePopover;
