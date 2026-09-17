import React from 'react';
import { ChevronRight, Gauge } from 'lucide-react';
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
  ROW_CHEVRON,
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

/**
 * Rows are startable.
 *
 * This panel ranks the skills that cost the most band, then used to leave the
 * learner to find the matching practice themselves somewhere else in the app.
 * Each row now routes straight into practice for that module and skill, which
 * is the only action the ranking was ever asking for.
 */
function PriorityRow({ skill, index, onStart }) {
  const style = getModuleStyle(skill.module);
  const Icon = style.icon;
  const mastery = Math.round((skill.mastery || 0) * 100);
  const band = masteryBand(mastery);
  const isTopPriority = index === 0;
  const skillName = formatSkill(skill.skill_code);

  return (
    <button
      type="button"
      onClick={() =>
        onStart?.({
          module: skill.module,
          activity_type: 'targeted_drill',
          title: `${style.label}: ${skillName.toLowerCase()} practice`,
          skill_targets: [skill.skill_code],
          routing: { route: skill.module, mode: 'practice', skill: skill.skill_code },
          requested_mode: 'practice',
        })
      }
      aria-label={`Practise ${skillName}, currently ${mastery}% correct`}
      className={cn(
        'block w-full min-w-0 border-b border-[#eeedf7] px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-[#faf9ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] dark:border-white/10 dark:hover:bg-white/3',
        isTopPriority && 'bg-[#5a63df]/3 dark:bg-[#8f97ff]/5'
      )}
    >
      <div className="group flex min-w-0 items-start gap-2.5">
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
              {skillName}
            </p>
            <span className="flex shrink-0 items-center gap-1">
              <Pill tone={KIND_TONE[skill.tone] || 'neutral'}>
                {KIND_LABEL[skill.kind] || skill.kind}
              </Pill>
              <ChevronRight className={cn('h-3.5 w-3.5', ROW_CHEVRON)} />
            </span>
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
    </button>
  );
}

export default function PrioritiesPanel({ evidence, onStart }) {
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
        Focus areas from your scored practice. Pick a skill to practise it and review your feedback.
      </p>

      <div className="mt-3 flex-1 overflow-hidden rounded-lg border border-[#eeedf7] bg-white dark:border-white/10 dark:bg-white/2">
        {priorities.length > 0 ? (
          priorities.map((skill, index) => (
            <PriorityRow
              key={`${skill.kind}-${skill.skill_code}`}
              skill={skill}
              index={index}
              onStart={onStart}
            />
          ))
        ) : (
          <Empty icon={Gauge}>Complete a scored practice test to find your first focus area.</Empty>
        )}
      </div>

      {priorities.length > 0 && (
        <p
          className={cn(MICRO, MUTED, 'mt-3 border-t border-[#eceafa] pt-2.5 dark:border-white/10')}
        >
          Percentages estimate skill progress from recorded answers. They are not IELTS band scores.
        </p>
      )}
    </section>
  );
}
