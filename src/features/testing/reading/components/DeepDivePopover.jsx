import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Lightbulb, AlertTriangle, Target } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

const SynonymSection = ({ synonymMap }) => {
  if (!synonymMap || synonymMap.length === 0) return null;
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.16em] text-[#5a63df] dark:text-[#9da5ff]">
        <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[#5a63df]/30 bg-[#5a63df]/[0.08] dark:border-[#8590ff]/45 dark:bg-[#8590ff]/[0.12]">
          <Target className="h-3 w-3" strokeWidth={2.2} />
        </div>
        Keyword Mapping
      </div>
      <div className="grid gap-2">
        {synonymMap.map((sm, idx) => (
          <div
            key={idx}
            className="relative flex flex-col rounded-xl border border-[#ebeaf7] bg-[#fbfbfe] p-3 transition-all duration-200 hover:border-[#5a63df]/40 dark:border-white/[0.11] dark:bg-white/[0.055] dark:hover:border-[#8f97ff]/40"
          >
            <div className="relative space-y-2.5">
              {/* Question Keyword Row */}
              <div className="flex items-start gap-2">
                <div className="flex flex-col items-center pt-1 shrink-0">
                  <div className="z-10 flex h-6 w-6 items-center justify-center rounded-full border border-[#7d88ff] bg-[#6570ed] text-white shadow-[0_0_10px_rgba(101,112,237,0.28)]">
                    <Target className="h-3 w-3" strokeWidth={2.4} />
                  </div>
                  <div className="mt-1 min-h-[12px] h-full w-px bg-gradient-to-b from-[#7580ff] to-[#17bd8a] opacity-45" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="mb-0.5 text-[8px] font-black uppercase tracking-[0.12em] text-[#5a63df] dark:text-[#9da5ff]">
                    Question Keyword
                  </div>
                  <p className="break-words text-[12px] font-extrabold leading-snug tracking-tight text-slate-800 dark:text-slate-100">
                    {sm.question_keyword}
                  </p>
                  {sm.connection && (
                    <p className="mt-1 border-l border-slate-300 pl-1.5 text-[10px] font-medium italic leading-snug text-slate-500 dark:border-white/15 dark:text-slate-400">
                      {sm.connection}
                    </p>
                  )}
                </div>
              </div>

              {/* Passage Keyword Row */}
              <div className="flex items-start gap-2">
                <div className="flex flex-col items-center pt-1 shrink-0">
                  <div className="z-10 flex h-6 w-6 items-center justify-center rounded-full border border-[#24d5a1] bg-[#19b989] text-white shadow-[0_0_10px_rgba(25,185,137,0.22)]">
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="mb-0.5 text-[8px] font-black uppercase tracking-[0.12em] text-emerald-600 dark:text-[#39d7a5]">
                    Passage Evidence
                  </div>
                  <p className="break-words text-[12px] font-extrabold leading-snug tracking-tight text-emerald-700 dark:text-[#2bd29d]">
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

function useExplanationEntries(explanationData, blankKey, questionNumber) {
  return useMemo(() => {
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
}

function useConsolidatedEntries(entries) {
  return useMemo(() => {
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
    const isAllPassageSame = entries.every(
      (e) => e.data.passage_highlight === firstEntry.passage_highlight
    );
    const sharedPassage = isAllPassageSame ? firstEntry.passage_highlight : null;

    const firstWhyWrongStr = JSON.stringify(firstEntry.why_wrong || {});
    const isAllWhyWrongSame = entries.every(
      (e) => JSON.stringify(e.data.why_wrong || {}) === firstWhyWrongStr
    );
    const sharedWhyWrong = isAllWhyWrongSame ? firstEntry.why_wrong : null;

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
        synonymMap: isAllPassageSame ? null : e.data.synonym_map,
      })),
    };
  }, [entries]);
}

/**
 * The inline variant used to run two rotating conic-gradient rings, in colours
 * (`#8b5cf6`, `#c084fc`, `#3b82f6`) that matched nothing else in the app. The
 * second ring's `animate` also passed `repeat`/`ease` as animate targets rather
 * than inside `transition` — framer-motion silently drops unknown animate
 * keys, so that layer eased to a 2.5° tilt once on mount and then sat frozen,
 * never actually spinning. It's one ring now, in the brand accent used for
 * every other "AI-assisted" affordance in the app, and the animation is
 * correct rather than accidentally inert.
 */
const DeepDiveTrigger = React.memo(({ inline, isOpen, isMultiBlank, entriesCount }) => (
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
          ? 'bg-[#5a63df]/10 border-[#5a63df]/25 text-[#4a52c9] dark:bg-[#8f97ff]/[0.16] dark:border-[#8f97ff]/35 dark:text-[#c3c8ff] shadow-sm'
          : !inline
            ? 'bg-white/50 border-slate-200/60 text-slate-600 hover:bg-[#5a63df]/[0.06] hover:border-[#5a63df]/25 hover:text-[#4a52c9] dark:bg-slate-900/50 dark:border-slate-800/60 dark:text-slate-400 dark:hover:bg-[#8f97ff]/10 dark:hover:border-[#8f97ff]/30 dark:hover:text-[#c3c8ff]'
            : '',
        inline && !isOpen ? 'shadow-lg shadow-[#5a63df]/20' : '',
        inline && isOpen ? 'ring-2 ring-[#5a63df]/35' : ''
      )}
      data-oid="deep-dive-trigger"
    >
      {inline && !isOpen && (
        <>
          <motion.div
            className="absolute inset-[-150%] rounded-full opacity-100 z-0"
            style={{
              background:
                'conic-gradient(from 0deg, transparent 0%, #5a63df 50%, #8f97ff 70%, transparent 100%)',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
          />
          <div className="absolute inset-0 rounded-full bg-[#f4f4ff]/85 dark:bg-slate-950 m-[1px] z-10" />
          <div className="absolute inset-0 rounded-full bg-[#5a63df]/[0.08] dark:bg-[#8f97ff]/10 z-10" />
        </>
      )}

      {inline ? (
        <motion.div
          className="relative z-10 flex items-center justify-center w-full h-full rounded-full bg-[#f4f4ff]/60 dark:bg-slate-900/90 backdrop-blur-sm"
          animate={isOpen ? { rotate: 90 } : { rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <Sparkles
            className={cn(
              'w-3.5 h-3.5 transition-colors duration-300',
              isOpen
                ? 'text-[#4a52c9] dark:text-[#afb5ff]'
                : 'text-[#5a63df] dark:text-[#afb5ff] group-hover:text-[#4a52c9] dark:group-hover:text-[#c3c8ff]'
            )}
          />
        </motion.div>
      ) : (
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'w-6 h-6 rounded-md flex items-center justify-center transition-colors',
              isOpen ? 'bg-[#5a63df]/15 dark:bg-[#8f97ff]/25' : 'bg-slate-100 dark:bg-slate-800'
            )}
          >
            <Sparkles
              className={cn(
                'w-3.5 h-3.5',
                isOpen ? 'text-[#4a52c9] dark:text-[#c3c8ff]' : 'text-slate-500 dark:text-slate-400'
              )}
            />
          </div>
          <span>Paraphrase Detective</span>
          {isMultiBlank && (
            <Badge
              variant="secondary"
              className="text-[9px] px-1.5 py-0 h-4 bg-[#5a63df]/10 dark:bg-[#8f97ff]/20 text-[#4a52c9] dark:text-[#c3c8ff] border-0"
            >
              {entriesCount} explanations
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
));
DeepDiveTrigger.displayName = 'DeepDiveTrigger';

const DeepDiveBody = React.memo(
  ({ consolidatedSynonyms, individualEntries, isMultiBlank, sharedWhyWrong }) => (
    <div className="relative max-h-[min(62vh,500px)] overflow-y-auto overflow-x-hidden bg-white p-3 scrollbar-thin scrollbar-thumb-[#b9b9d8] dark:bg-[#131315] dark:scrollbar-thumb-white/10 sm:p-4">
      <div className="relative z-10 space-y-3">
        {consolidatedSynonyms && consolidatedSynonyms.length > 0 && (
          <SynonymSection synonymMap={consolidatedSynonyms} />
        )}

        <div className="space-y-3">
          {individualEntries.map((entry, idx) => (
            <div key={entry.key ?? idx} className="space-y-2">
              {entry.synonymMap && <SynonymSection synonymMap={entry.synonymMap} />}

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 px-1 text-[9px] font-black uppercase tracking-[0.14em] text-[#4b80d6] dark:text-[#79a9ff]">
                  <Lightbulb className="h-3 w-3" strokeWidth={2.2} />
                  {isMultiBlank ? `Reasoning for Q${entry.key}` : 'Why is this correct?'}
                </div>

                <div className="group relative overflow-hidden rounded-xl border border-blue-200/70 bg-[#f5f8ff] p-3 shadow-sm transition-all duration-200 hover:border-blue-300 dark:border-white/[0.11] dark:bg-white/[0.055] dark:shadow-none">
                  <div className="absolute bottom-0 left-0 top-0 w-1 bg-[#3973d5] dark:bg-[#2e64d2]" />
                  <div className="pointer-events-none absolute -bottom-8 -right-6 h-20 w-20 rounded-full bg-blue-400/10 blur-2xl dark:bg-blue-400/10" />

                  <p className="relative z-10 pl-2 text-[12px] font-medium leading-relaxed text-slate-700 dark:text-slate-200">
                    {entry.data.why_correct}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

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
  )
);
DeepDiveBody.displayName = 'DeepDiveBody';

const DeepDivePopover = ({
  explanationData,
  userAnswer: _userAnswer,
  isOpen,
  onToggle,
  questionType: _questionType,
  blankKey,
  questionNumber,
  inline = false,
}) => {
  const { entries, isMultiBlank } = useExplanationEntries(
    explanationData,
    blankKey,
    questionNumber
  );

  React.useEffect(() => {
    if (isOpen && entries.length > 0) {
      const keys = entries.map((e) => e.key).filter(Boolean);
      if (keys.length > 0) {
        window.dispatchEvent(
          new CustomEvent('set-passage-highlight', {
            detail: { type: 'specific', keys },
          })
        );
      }
    }
  }, [isOpen, entries]);

  const { sharedWhyWrong, consolidatedSynonyms, individualEntries } =
    useConsolidatedEntries(entries);

  if (entries.length === 0) return null;

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => {
        if (open !== isOpen) onToggle();
      }}
    >
      <DeepDiveTrigger
        inline={inline}
        isOpen={isOpen}
        isMultiBlank={isMultiBlank}
        entriesCount={entries.length}
      />

      <PopoverContent
        side="bottom"
        align={inline ? 'end' : 'start'}
        sideOffset={inline ? 12 : 8}
        collisionPadding={24}
        className="relative z-[100] flex w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-[#e4e2f0] bg-white p-0 shadow-xl backdrop-blur-xl dark:border-white/[0.10] dark:bg-[#131315] dark:shadow-[0_20px_55px_-26px_rgba(0,0,0,0.75)] sm:w-[390px]"
        data-oid="deep-dive-content"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full bg-[#6674ee]/[0.06] blur-3xl dark:bg-[#6674ee]/[0.08]" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-32 w-32 rounded-full bg-blue-500/[0.04] blur-3xl dark:bg-blue-400/[0.05]" />

        <DeepDiveBody
          consolidatedSynonyms={consolidatedSynonyms}
          individualEntries={individualEntries}
          isMultiBlank={isMultiBlank}
          sharedWhyWrong={sharedWhyWrong}
        />
      </PopoverContent>
    </Popover>
  );
};

export default DeepDivePopover;
