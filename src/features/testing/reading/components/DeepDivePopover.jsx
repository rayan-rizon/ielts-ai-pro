import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Lightbulb, AlertTriangle, Target } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { IconChip, MICRO, TILE, Pill } from '@/features/dashboard/components/primitives';

const SynonymSection = ({ synonymMap }) => {
  if (!synonymMap || synonymMap.length === 0) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <IconChip icon={Target} tone="accent" size="sm" />
        <span className={cn(MICRO, 'text-[#5a63df] dark:text-[#8f97ff]')}>Keyword Mapping</span>
      </div>
      <div className="grid gap-2">
        {synonymMap.map((sm, idx) => (
          <div key={idx} className={cn(TILE, 'p-2.5 space-y-2')}>
            {/* Question Keyword Row */}
            <div className="flex items-start gap-2">
              <div className="flex flex-col items-center pt-0.5 shrink-0">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#5a63df]/10 text-[#5a63df] dark:bg-[#8f97ff]/20 dark:text-[#afb5ff]">
                  <Target className="h-3 w-3" strokeWidth={2.2} />
                </span>
                <div className="mt-1 h-3 w-px bg-[#5a63df]/20 dark:bg-[#8f97ff]/20" />
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn(MICRO, 'text-[#5a63df] dark:text-[#8f97ff] text-[8px]')}>
                  Question Keyword
                </div>
                <p className="break-words text-[12px] font-extrabold leading-snug tracking-tight text-slate-800 dark:text-slate-100">
                  {sm.question_keyword}
                </p>
                {sm.connection && (
                  <p className="mt-0.5 border-l border-slate-200 pl-1.5 text-[10px] font-medium italic leading-snug text-slate-500 dark:border-white/10 dark:text-slate-400">
                    {sm.connection}
                  </p>
                )}
              </div>
            </div>

            {/* Passage Keyword Row */}
            <div className="flex items-start gap-2">
              <div className="flex flex-col items-center pt-0.5 shrink-0">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300">
                  <ArrowRight className="h-3 w-3" strokeWidth={2.2} />
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn(MICRO, 'text-emerald-600 dark:text-emerald-400 text-[8px]')}>
                  Passage Evidence
                </div>
                <p className="break-words text-[12px] font-bold leading-snug text-emerald-700 dark:text-emerald-300">
                  {sm.passage_keyword}
                </p>
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
    <div className="space-y-2 pt-3 border-t border-[#e4e2f0] dark:border-white/[0.08]">
      <div className="flex items-center gap-1.5">
        <IconChip icon={AlertTriangle} tone="rose" size="sm" />
        <span className={cn(MICRO, 'text-rose-600 dark:text-rose-400')}>
          Why other options are wrong
        </span>
      </div>
      <div className="grid gap-2">
        {keys.map((key) => {
          return (
            <div
              key={key}
              className="flex items-start gap-2.5 p-2.5 rounded-lg border border-rose-500/20 bg-rose-500/[0.03] dark:border-rose-400/20 dark:bg-rose-400/[0.06] transition-colors"
            >
              <Pill tone="rose" className="shrink-0 text-[9px] mt-0.5">
                {key}
              </Pill>
              <p className="text-[12px] font-medium leading-relaxed text-slate-700 dark:text-slate-200 my-auto">
                {whyWrong[key]}
              </p>
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

const DeepDiveTrigger = React.memo(({ inline, isOpen, isMultiBlank, entriesCount }) => (
  <PopoverTrigger asChild>
    <motion.button
      initial={false}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        inline
          ? 'inline-flex h-6 w-6 ml-2 align-middle items-center justify-center rounded-md border border-[#5a63df]/30 bg-[#5a63df]/[0.08] text-[#5a63df] hover:border-[#5a63df] hover:bg-[#5a63df]/15 dark:border-[#8f97ff]/30 dark:bg-[#8f97ff]/[0.14] dark:text-[#afb5ff] dark:hover:border-[#8f97ff] dark:hover:bg-[#8f97ff]/25 transition-colors shrink-0'
          : 'w-full mt-2 flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-semibold transition-colors',
        !inline &&
          (isOpen
            ? 'bg-[#5a63df]/10 border-[#5a63df]/30 text-[#4a52c9] dark:bg-[#8f97ff]/20 dark:border-[#8f97ff]/40 dark:text-[#c3c8ff]'
            : 'bg-white border-[#e4e2f0] text-slate-700 hover:bg-[#f4f3fb] hover:border-[#5a63df]/30 dark:bg-[#131315] dark:border-white/[0.10] dark:text-slate-300 dark:hover:bg-white/[0.06]')
      )}
      data-oid="deep-dive-trigger"
    >
      {inline ? (
        <Sparkles className="w-3.5 h-3.5 stroke-[2.2]" />
      ) : (
        <div className="flex items-center gap-2">
          <IconChip icon={Sparkles} tone="accent" size="sm" />
          <span className="font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            Paraphrase Detective
          </span>
          {isMultiBlank && <Pill tone="accent">{entriesCount} explanations</Pill>}
        </div>
      )}

      {!inline && (
        <span className={cn(MICRO, 'text-slate-500 dark:text-slate-400')}>
          {isOpen ? 'Close' : 'View Details'}
        </span>
      )}
    </motion.button>
  </PopoverTrigger>
));
DeepDiveTrigger.displayName = 'DeepDiveTrigger';

const DeepDiveBody = React.memo(
  ({ consolidatedSynonyms, individualEntries, isMultiBlank, sharedWhyWrong }) => (
    <div className="relative max-h-[min(65vh,520px)] overflow-y-auto overflow-x-hidden p-3.5 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
      {consolidatedSynonyms && consolidatedSynonyms.length > 0 && (
        <SynonymSection synonymMap={consolidatedSynonyms} />
      )}

      <div className="space-y-3">
        {individualEntries.map((entry, idx) => (
          <div key={entry.key ?? idx} className="space-y-2">
            {entry.synonymMap && <SynonymSection synonymMap={entry.synonymMap} />}

            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <IconChip icon={Lightbulb} tone="accent" size="sm" />
                <span className={cn(MICRO, 'text-[#5a63df] dark:text-[#8f97ff]')}>
                  {isMultiBlank ? `Reasoning for Q${entry.key}` : 'Why is this correct?'}
                </span>
              </div>

              <div className={cn(TILE, 'relative overflow-hidden p-3')}>
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#5a63df] dark:bg-[#8f97ff]" />
                <p className="pl-1.5 text-[12px] font-medium leading-relaxed text-slate-800 dark:text-slate-100">
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
                  <div className={cn(MICRO, 'text-rose-500/80 mb-1')}>Q{e.key} Distractors</div>
                )}
                <WhyWrongSection whyWrong={e.data.why_wrong} />
              </div>
            ))}
        </div>
      )}
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
        sideOffset={inline ? 10 : 8}
        collisionPadding={20}
        className="relative z-[100] flex w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-[#e4e2f0] bg-white dark:border-white/[0.10] dark:bg-[#131315] p-0 shadow-lg dark:shadow-[0_12px_36px_rgba(0,0,0,0.6)] sm:w-[390px]"
        data-oid="deep-dive-content"
      >
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
