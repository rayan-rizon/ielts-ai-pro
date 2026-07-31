import React from 'react';
import { m } from 'framer-motion';
import { Mic2, PenLine } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ITEM_VARIANTS } from '../constants';
import {
  Empty,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  PanelTitle,
  WELL,
} from '@/features/dashboard/components/primitives';

// Both modules share the accent bar: the bar length is the information here, so
// giving Speaking its own red hue only added glare without adding meaning.
const MODULE_CONFIG = {
  writing: { icon: PenLine, label: 'Writing score areas' },
  speaking: { icon: Mic2, label: 'Speaking score areas' },
};

const CRITERION_EXPLANATIONS = {
  'Task Achievement': 'How fully and accurately you answer Task 1',
  'Task Response': 'How fully and clearly you develop your Task 2 answer',
  'Coherence & Cohesion': 'How clearly your ideas connect and flow',
  'Lexical Resource': 'Your range and accuracy of vocabulary',
  'Grammatical Range & Accuracy': 'Your range and accuracy of sentence structures',
  'Grammatical Range': 'Your range and accuracy of sentence structures',
  'Fluency & Coherence': 'How smoothly and clearly you speak',
  Pronunciation: 'How easy your speech is to understand',
};

/**
 * One criterion row. The plain-English explanation sits directly under the
 * official IELTS name — a learner who has never read the band descriptors
 * should still know what "Lexical Resource" is measuring.
 */
function CriteriaRow({ label, score, sampleCount, index }) {
  const pct = score != null ? Math.max(0, Math.min(100, (score / 9) * 100)) : 0;

  return (
    <m.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="space-y-1"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">{label}</p>
          {CRITERION_EXPLANATIONS[label] ? (
            <p className={cn('text-[10px] font-medium leading-tight', MUTED)}>
              {CRITERION_EXPLANATIONS[label]}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-baseline gap-1.5">
          <span className={cn(MICRO, MUTED)}>
            {sampleCount > 0
              ? `${sampleCount} evaluation${sampleCount === 1 ? '' : 's'}`
              : 'Unavailable'}
          </span>
          <span
            className={cn(
              NUM,
              'text-sm font-bold',
              score == null
                ? 'text-slate-300 dark:text-slate-700'
                : 'text-slate-900 dark:text-slate-50'
            )}
          >
            {score != null ? score.toFixed(1) : '—'}
          </span>
        </div>
      </div>
      <div className={cn('h-1.5 w-full overflow-hidden rounded-full', WELL)}>
        <div
          className="h-full rounded-full bg-[#5a63df] transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </m.div>
  );
}

/**
 * CriteriaBreakdownCard
 *
 * Per-criteria average scores for Writing or Speaking — the "where am I losing
 * marks" view. Shows an honest empty state when no AI evaluation exists yet.
 */
export default function CriteriaBreakdownCard({ module, criteria, labels }) {
  const config = MODULE_CONFIG[module];
  if (!config) return null;

  const hasData = criteria?.hasData;

  return (
    <m.div variants={ITEM_VARIANTS} className="h-full">
      <section className={cn(PANEL, 'flex h-full flex-col p-4')}>
        <PanelTitle
          label={config.label}
          accent={module === 'writing'}
          tip="Averaged from AI-marked tests. Each area is scored out of 9."
          action={<span className={cn(MICRO, MUTED)}>Avg / 9.0</span>}
        />

        {!hasData ? (
          <Empty icon={config.icon}>
            Complete a {module} test with AI feedback to see these score areas.
          </Empty>
        ) : (
          <div className="space-y-3">
            {Object.entries(labels).map(([key, label], idx) => (
              <CriteriaRow
                key={key}
                label={label}
                score={criteria[key]}
                sampleCount={criteria.sampleCounts?.[key] || 0}
                index={idx}
              />
            ))}
          </div>
        )}
      </section>
    </m.div>
  );
}
