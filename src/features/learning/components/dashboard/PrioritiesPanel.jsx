import React from 'react';
import { Gauge } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  Bar,
  Empty,
  IconChip,
  MUTED,
  NUM,
  PANEL,
  PanelTitle,
  Pill,
} from '@/features/dashboard/components/primitives';
import { formatSkill, getModuleStyle, getModuleTone, getPrioritiesList } from './dashboardUtils';

const CONFIDENCE_TONE = { high: 'ok', moderate: 'warn', developing: 'warn' };
const CONFIDENCE_LABEL = {
  high: 'Reliable scores',
  moderate: 'Some scores',
  developing: 'Some scores',
};
const KIND_TONE = { rose: 'rose', amber: 'amber' };
const KIND_LABEL = {
  'Confirmed focus': 'Confirmed focus',
  'Needs more results': 'Watch this skill',
  'Review due': 'Review now',
};

function ConfidenceBadge({ label }) {
  return (
    <Pill tone={CONFIDENCE_TONE[label] || 'neutral'}>
      {CONFIDENCE_LABEL[label] || 'More scores needed'}
    </Pill>
  );
}

function PriorityRow({ skill, index }) {
  const style = getModuleStyle(skill.module);
  const Icon = style.icon;
  const mastery = Math.round((skill.mastery || 0) * 100);
  const confidence = Number(skill.confidence || 0);
  const confidenceText =
    confidence >= 0.7
      ? 'Enough recent answers'
      : confidence >= 0.4
        ? 'Some recent answers'
        : 'Needs more answers';

  return (
    <div className="min-w-0 border-b border-[#eeedf7] px-3 py-3 last:border-b-0 dark:border-white/10 sm:px-3.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="w-4 shrink-0 text-center text-xs font-bold text-slate-400 dark:text-slate-500">
          {index + 1}
        </span>
        <IconChip icon={Icon} tone={getModuleTone(skill.module)} />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-1.5">
            <p className="truncate text-xs font-bold leading-snug text-slate-900 dark:text-white">
              {formatSkill(skill.skill_code)}
            </p>
            <Pill tone={KIND_TONE[skill.tone] || 'neutral'}>
              {KIND_LABEL[skill.kind] || skill.kind}
            </Pill>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <Bar value={Math.max(5, mastery)} className="flex-1" />
            <span
              className={cn(
                NUM,
                'w-7 text-right text-xs font-bold text-slate-700 dark:text-slate-300'
              )}
            >
              {mastery}%
            </span>
          </div>
          <p className={cn('mt-0.5 truncate text-[10px] font-semibold', MUTED)}>
            {(skill.observations || 0).toLocaleString()} answers · {confidenceText}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PrioritiesPanel({ evidence }) {
  const priorities = getPrioritiesList(evidence);

  return (
    <section
      className={cn(PANEL, 'flex h-full min-w-0 flex-col p-5 sm:p-6')}
      aria-labelledby="priorities-title"
    >
      <PanelTitle
        label="Your focus areas"
        accent
        action={<ConfidenceBadge label={evidence?.confidence_label || 'diagnostic'} />}
      />
      <h2
        id="priorities-title"
        className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white"
      >
        What to improve next
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        Skills to practise now, skills to watch, and reviews due.
      </p>

      <div className="mt-4 flex-1 overflow-hidden rounded-lg border border-[#eeedf7] bg-white dark:border-white/10 dark:bg-white/[0.02]">
        {priorities.length > 0 ? (
          priorities.map((skill, index) => (
            <PriorityRow key={`${skill.kind}-${skill.skill_code}`} skill={skill} index={index} />
          ))
        ) : (
          <Empty icon={Gauge}>Complete a scored level check to find your first focus area.</Empty>
        )}
      </div>
    </section>
  );
}
