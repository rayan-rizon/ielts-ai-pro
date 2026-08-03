import React, { useMemo, useState } from 'react';
import { m } from 'framer-motion';
import { ClipboardList } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ITEM_VARIANTS } from '../constants';
import {
  Empty,
  MICRO,
  NUM,
  PANEL,
  PanelFootnote,
  PanelTitle,
  Tip,
  WELL,
} from '@/features/dashboard/components/primitives';

/**
 * The four criteria, in examiner order.
 *
 * The plain-English gloss moved from a permanent sub-line under every row into
 * the hover tooltip: four descriptions stacked in a card is four lines of prose
 * a learner reads once and then scrolls past forever.
 */
const MODULE_CRITERIA = {
  writing: [
    {
      key: 'taskAchievement',
      label: 'Task Response / Achievement',
      hint: 'How fully you answer Task 1 or develop your Task 2 response',
    },
    {
      key: 'coherence',
      label: 'Coherence & Cohesion',
      hint: 'How clearly your ideas connect and flow',
    },
    {
      key: 'lexicalResource',
      label: 'Lexical Resource',
      hint: 'Your range and accuracy of vocabulary',
    },
    {
      key: 'grammar',
      label: 'Grammatical Range',
      hint: 'Your range and accuracy of sentence structures',
    },
  ],
  speaking: [
    {
      key: 'fluency',
      label: 'Fluency & Coherence',
      hint: 'How smoothly and clearly you speak',
    },
    {
      key: 'lexicalResource',
      label: 'Lexical Resource',
      hint: 'Your range and accuracy of vocabulary',
    },
    {
      key: 'grammar',
      label: 'Grammatical Range',
      hint: 'Your range and accuracy of sentence structures',
    },
    {
      key: 'pronunciation',
      label: 'Pronunciation',
      hint: 'How easy your speech is to understand',
    },
  ],
};

const MODULES = ['writing', 'speaking'];
const BANDS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const SCALE_TICKS = [0, 3, 5, 7, 9];

/**
 * One criterion as nine band blocks rather than one continuous bar.
 *
 * IELTS criteria are marked in discrete half-bands, so a smooth fill quietly
 * misrepresents the scale — and a smooth fill is exactly what the two cards
 * either side of this one already use. Blocks say "band 7 of 9" at a glance
 * without a number being read, and the partial block carries the half-band
 * precisely instead of rounding it away.
 */
function CriterionMeter({ criterion }) {
  const { label, score, sampleCount, isWeakest, hint } = criterion;

  return (
    <Tip
      content={
        score == null
          ? `${hint}. No marked ${criterion.moduleName} test has scored this yet.`
          : `${hint}. Averaged from ${sampleCount} marked evaluation${sampleCount === 1 ? '' : 's'}.`
      }
    >
      <div>
        <div className="flex items-baseline justify-between gap-2">
          <p
            className={cn(
              'truncate text-[11px] font-extrabold',
              isWeakest ? 'text-[rgb(var(--signal-warn))]' : 'text-slate-800 dark:text-slate-100'
            )}
          >
            {label}
          </p>
          <span
            className={cn(
              NUM,
              'shrink-0 text-sm font-bold',
              score == null
                ? 'text-slate-400 dark:text-slate-500'
                : isWeakest
                  ? 'text-[rgb(var(--signal-warn))]'
                  : 'text-slate-900 dark:text-slate-50'
            )}
          >
            {score == null ? '—' : score.toFixed(1)}
          </span>
        </div>

        <div className="mt-1.5 flex gap-[3px]">
          {BANDS.map((band) => {
            const fill = score == null ? 0 : Math.max(0, Math.min(1, score - (band - 1)));
            return (
              <div
                key={band}
                className={cn('h-3.5 flex-1 overflow-hidden rounded-[3px]', WELL)}
                aria-hidden="true"
              >
                <div
                  className={cn(
                    'h-full transition-[width] duration-700 ease-out',
                    isWeakest ? 'bg-[rgb(var(--signal-warn))]' : 'bg-[#5a63df]'
                  )}
                  style={{ width: `${fill * 100}%` }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </Tip>
  );
}

/** The 0–9 band ruler every criterion above is measured against. */
function BandScaleAxis() {
  return (
    <div className="relative mt-2 h-3" aria-hidden="true">
      {SCALE_TICKS.map((tick) => (
        <span
          key={tick}
          className={cn(NUM, MICRO, 'absolute top-0 text-slate-400 dark:text-slate-600')}
          style={{
            left: `${(tick / 9) * 100}%`,
            transform: tick === 0 ? 'none' : tick === 9 ? 'translateX(-100%)' : 'translateX(-50%)',
          }}
        >
          {tick}
        </span>
      ))}
    </div>
  );
}

/**
 * The four areas an examiner actually scores, for Writing and Speaking.
 *
 * One panel with a two-way switch instead of the two near-identical cards this
 * replaced — same information, half the page height, and the pair now reads as
 * one question ("which criterion is costing me marks?") rather than two.
 */
export default function CriteriaBreakdownCard({ writingCriteria, speakingCriteria }) {
  const criteriaByModule = useMemo(
    () => ({ writing: writingCriteria, speaking: speakingCriteria }),
    [speakingCriteria, writingCriteria]
  );
  const [module, setModule] = useState(() =>
    writingCriteria?.hasData || !speakingCriteria?.hasData ? 'writing' : 'speaking'
  );

  const criteria = criteriaByModule[module];
  const hasData = Boolean(criteria?.hasData);

  const rows = useMemo(() => {
    const definitions = MODULE_CRITERIA[module];
    const scored = definitions
      .map((definition) => ({ key: definition.key, score: criteria?.[definition.key] ?? null }))
      .filter((item) => item.score != null);
    const weakestKey =
      scored.length >= 2 ? [...scored].sort((a, b) => a.score - b.score)[0].key : null;

    return definitions.map((definition) => ({
      ...definition,
      moduleName: module,
      score: criteria?.[definition.key] ?? null,
      sampleCount: criteria?.sampleCounts?.[definition.key] || 0,
      isWeakest: definition.key === weakestKey,
    }));
  }, [criteria, module]);

  const weakest = rows.find((row) => row.isWeakest) || null;

  return (
    <m.div variants={ITEM_VARIANTS} className="h-full">
      <section className={cn(PANEL, 'flex h-full flex-col p-4')}>
        <PanelTitle
          label="Examiner criteria"
          accent
          tip="Averaged from AI-marked tests. Each block is one band — hover a criterion for what it measures."
          action={
            <div
              role="tablist"
              aria-label="Criteria module"
              className="inline-flex gap-0.5 rounded-lg border border-[#ebeaf7] bg-[#f4f3fb] p-0.5 dark:border-white/10 dark:bg-white/[0.04]"
            >
              {MODULES.map((name) => {
                const isSelected = module === name;
                return (
                  <button
                    key={name}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setModule(name)}
                    className={cn(
                      MICRO,
                      'relative rounded-md px-2 py-1 capitalize transition-colors duration-150',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]/50',
                      isSelected
                        ? 'text-white'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'
                    )}
                  >
                    {isSelected && (
                      <m.span
                        layoutId="criteria-tab-pill"
                        className="absolute inset-0 rounded-md bg-[#5a63df]"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                    <span className="relative">{name}</span>
                  </button>
                );
              })}
            </div>
          }
        />

        {!hasData ? (
          <Empty icon={ClipboardList} className="flex-1 content-center">
            Complete a {module} test with AI feedback to see these score areas.
          </Empty>
        ) : (
          <div className="flex flex-1 flex-col">
            <div className="space-y-3">
              {rows.map((row) => (
                <CriterionMeter key={row.key} criterion={row} />
              ))}
            </div>
            <BandScaleAxis />
            <div className="flex-1" />
          </div>
        )}

        <PanelFootnote>
          {hasData && weakest ? (
            <>
              Lowest area is <span className="font-bold">{weakest.label}</span> at{' '}
              <span className={cn(NUM, 'font-bold')}>{weakest.score.toFixed(1)}</span> — the fastest
              band to lift.
            </>
          ) : (
            'Scored out of 9 by the same four criteria an examiner uses.'
          )}
        </PanelFootnote>
      </section>
    </m.div>
  );
}
