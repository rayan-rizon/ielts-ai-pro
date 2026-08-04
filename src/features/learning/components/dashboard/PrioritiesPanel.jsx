import React from 'react';
import { Gauge } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  Empty,
  IconChip,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  PanelTitle,
  Pill,
  WELL,
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

/**
 * Plain-language reading of a mastery percentage, so the bar is never the only
 * cue. Kept to one word — the panel subtitle already says "weakest skills
 * first, practising the top row moves your band the most," so repeating that
 * full sentence on every row (four times, identically, when four rows share a
 * band) was pure noise rather than information.
 */
const masteryBand = (mastery) => {
  if (mastery < 40) return { tone: 'fault', text: 'Weak' };
  if (mastery < 70) return { tone: 'warn', text: 'Getting there' };
  return { tone: 'ok', text: 'Strong' };
};

const BAND_FILL = {
  fault: 'bg-[rgb(var(--signal-fault))]',
  warn: 'bg-[rgb(var(--signal-warn))]',
  ok: 'bg-[rgb(var(--signal-ok))]',
};

const BAND_TEXT = {
  fault: 'text-[rgb(var(--signal-fault))]',
  warn: 'text-[rgb(var(--signal-warn))]',
  ok: 'text-[rgb(var(--signal-ok))]',
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
  const band = masteryBand(mastery);
  const isTopPriority = index === 0;

  return (
    <div
      className={cn(
        'min-w-0 border-b border-[#eeedf7] px-3 py-2.5 transition-colors last:border-b-0 hover:bg-[#faf9ff] dark:border-white/10 dark:hover:bg-white/[0.03]',
        isTopPriority && 'bg-[#5a63df]/[0.03] dark:bg-[#8f97ff]/[0.05]'
      )}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <span
          className={cn(
            NUM,
            'mt-0.5 w-4 shrink-0 text-center text-xs font-extrabold',
            isTopPriority
              ? 'text-[#5a63df] dark:text-[#afb5ff]'
              : 'text-slate-400 dark:text-slate-500'
          )}
        >
          {index + 1}
        </span>
        <IconChip icon={Icon} tone={getModuleTone(skill.module)} className="mt-0.5" />
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
            <div className={cn('h-1.5 flex-1 overflow-hidden rounded-full', WELL)}>
              <div
                className={cn(
                  'h-full rounded-full transition-[width] duration-500 ease-out',
                  BAND_FILL[band.tone]
                )}
                style={{ width: `${Math.max(5, mastery)}%` }}
              />
            </div>
            <span
              className={cn(
                NUM,
                'w-8 shrink-0 text-right text-xs font-extrabold',
                BAND_TEXT[band.tone]
              )}
            >
              {mastery}%
            </span>
          </div>

          <p className="mt-1 truncate text-[10px] font-medium">
            <span className={cn('font-bold', BAND_TEXT[band.tone])}>{band.text}</span>
            <span className={MUTED}> · {(skill.observations || 0).toLocaleString()} answers</span>
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
      className={cn(PANEL, 'flex h-full min-w-0 flex-col p-4 sm:p-5')}
      aria-labelledby="priorities-title"
    >
      <PanelTitle
        label="What to improve next"
        accent
        tip="Ranked from the skills your scored practice keeps getting wrong."
        action={<ConfidenceBadge label={evidence?.confidence_label || 'diagnostic'} />}
      />
      <p id="priorities-title" className={cn('text-xs font-medium leading-relaxed', MUTED)}>
        Your weakest skills first. Practising the top row moves your band the most.
      </p>

      <div className="mt-3 flex-1 overflow-hidden rounded-lg border border-[#eeedf7] bg-white dark:border-white/10 dark:bg-white/[0.02]">
        {priorities.length > 0 ? (
          priorities.map((skill, index) => (
            <PriorityRow key={`${skill.kind}-${skill.skill_code}`} skill={skill} index={index} />
          ))
        ) : (
          <Empty icon={Gauge}>Complete a scored level check to find your first focus area.</Empty>
        )}
      </div>

      {priorities.length > 0 && (
        <p
          className={cn(MICRO, MUTED, 'mt-3 border-t border-[#eceafa] pt-2.5 dark:border-white/10')}
        >
          Percentages are how often you get that skill right, not a band score.
        </p>
      )}
    </section>
  );
}
