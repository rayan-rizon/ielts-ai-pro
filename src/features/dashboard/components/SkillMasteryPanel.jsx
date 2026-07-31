import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Crosshair } from 'lucide-react';
import { cn } from '@/lib/cn';
import { createPageUrl } from '@/utils';
import {
  Empty,
  FootNum,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  PanelFootnote,
  PanelTitle,
  Tip,
  WELL,
} from './primitives';
import { formatSkill, modulePage, stripModulePrefix } from './skillLabels';

/** Below 40% is a hole, 40–70% is shaky, above 70% is holding. */
function toneFor(pct) {
  if (pct < 40) return 'fault';
  if (pct < 70) return 'warn';
  return 'ok';
}

const FILL = {
  fault: 'bg-[rgb(var(--signal-fault)/0.18)]',
  warn: 'bg-[rgb(var(--signal-warn)/0.18)]',
  ok: 'bg-[rgb(var(--signal-ok)/0.18)]',
};

const TEXT = {
  fault: 'text-[rgb(var(--signal-fault))]',
  warn: 'text-[rgb(var(--signal-warn))]',
  ok: 'text-[rgb(var(--signal-ok))]',
};

const VISIBLE = 5;

/**
 * Band averages tell a student *which paper* is weak. This tells them which
 * question type inside it is costing the marks — the level at which IELTS
 * practice actually gets fixed.
 *
 * Skills with no logged practice are excluded rather than shown at their 0.5
 * seed value, which would render an untouched skill as a confident 50%.
 */
const SkillMasteryPanel = React.memo(({ skillProficiency }) => {
  const { rows, tracked, solid } = useMemo(() => {
    const practised = (Array.isArray(skillProficiency) ? skillProficiency : []).filter(
      (skill) => Number(skill?.practice_count) > 0
    );

    const mapped = practised.map((skill) => {
      const pct = Math.round((Number(skill.mastery_probability) || 0) * 100);
      return {
        key: `${skill.module}-${skill.skill_code}`,
        label: stripModulePrefix(formatSkill(skill.skill_code), skill.module),
        module: skill.module,
        pct,
        // A 1%-mastered skill draws no bar at all and reads as "unmeasured", so
        // the fill gets a floor. The number beside it stays exact.
        barPct: Math.max(pct, 3),
        tone: toneFor(pct),
        attempts: Number(skill.practice_count) || 0,
        correct: Number(skill.correct_count) || 0,
      };
    });

    return {
      rows: mapped.slice(0, VISIBLE),
      tracked: mapped.length,
      solid: mapped.filter((row) => row.pct >= 70).length,
    };
  }, [skillProficiency]);

  return (
    <div className={cn(PANEL, 'flex h-full flex-col p-4')}>
      <PanelTitle
        label="Question types to fix"
        accent
        tip="Mastery per IELTS question type, weakest first. Estimated from your answer history."
        action={
          <Link
            to={createPageUrl('Analytics')}
            className={cn(
              MICRO,
              'inline-flex items-center gap-0.5 text-slate-500 transition-colors hover:text-[#5a63df] dark:text-slate-400'
            )}
          >
            All skills <ChevronRight className="h-3 w-3" />
          </Link>
        }
      />

      {rows.length === 0 ? (
        <Empty icon={Crosshair} className="flex-1 content-center">
          No question types tracked yet — practise a test and this ranks your weak spots.
        </Empty>
      ) : (
        <div className="flex-1 space-y-2">
          {rows.map((row) => (
            <Tip key={row.key} content={`${row.label} — ${row.correct} of ${row.attempts} correct`}>
              <Link
                to={createPageUrl(modulePage(row.module))}
                className="group flex items-center gap-2.5"
              >
                <div className={cn('relative h-8 flex-1 overflow-hidden rounded-md', WELL)}>
                  <div
                    className={cn(
                      'absolute inset-y-0 left-0 rounded-md transition-[width] duration-700',
                      FILL[row.tone]
                    )}
                    style={{ width: `${row.barPct}%` }}
                  />
                  <div className="relative flex h-full items-center justify-between gap-2 px-3">
                    <span className="truncate text-[11px] font-extrabold text-slate-800 dark:text-slate-100">
                      {row.label}
                    </span>
                    <span className={cn(MICRO, MUTED, 'shrink-0 capitalize')}>{row.module}</span>
                  </div>
                </div>
                <span
                  className={cn(NUM, 'w-9 shrink-0 text-right text-sm font-bold', TEXT[row.tone])}
                >
                  {row.pct}
                </span>
              </Link>
            </Tip>
          ))}
        </div>
      )}

      <PanelFootnote>
        {tracked > 0 ? (
          <>
            <FootNum>{solid}</FootNum> of <FootNum>{tracked}</FootNum> tracked types above 70%
          </>
        ) : (
          <>mastery is estimated from answered questions, not self-report</>
        )}
      </PanelFootnote>
    </div>
  );
});

SkillMasteryPanel.displayName = 'SkillMasteryPanel';

export default SkillMasteryPanel;
