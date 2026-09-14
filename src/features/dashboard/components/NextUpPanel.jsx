import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { createPageUrl } from '@/utils';
import {
  MUTED,
  NUM,
  PANEL,
  PANEL_LINK,
  PanelFootnote,
  PanelTitle,
  ROW_CHEVRON,
} from './primitives';
import { formatSkill, modulePage, stripModulePrefix } from './skillLabels';
import { hasPaidAccess } from '@/features/subscription/config/contentAccess';

/** Priority rail colour. Reserved for genuine ranking, not decoration. */
const RANK = ['bg-[#5a63df]', 'bg-[#9a9fe8]', 'bg-slate-300 dark:bg-white/20'];

/**
 * One queue for everything the dashboard wants you to do, ranked. Previously
 * this was spread across the hero card's CTA, a "Focus Area" card and the
 * learning-path card, each pointing somewhere different with equal weight.
 */
const NextUpPanel = React.memo(({ recommended, stats, weakestSkill, aiFocus, user }) => {
  const isPro = hasPaidAccess(user);

  const actions = useMemo(() => {
    const list = [];
    const moduleAvg = Number(stats?.moduleAverages?.[recommended.key]);
    const hasAvg = Number.isFinite(moduleAvg) && moduleAvg > 0;

    list.push({
      key: 'module',
      value: hasAvg ? moduleAvg.toFixed(1) : '—',
      label: `${recommended.title} practice`,
      detail: hasAvg
        ? `Your lowest module. Gains here move your overall band fastest.`
        : `Not scored yet — one test gives your band estimate something to work with.`,
      to: recommended.href,
    });

    if (weakestSkill?.skill_code) {
      const mastery = Math.round((Number(weakestSkill.mastery_probability) || 0) * 100);
      // practice_count is questions answered of this type, not test sessions —
      // one test can contribute dozens at once, so "sessions" overstated it.
      const attempts = Number(weakestSkill.practice_count) || 0;
      list.push({
        key: 'skill',
        value: `${mastery}%`,
        label: stripModulePrefix(formatSkill(weakestSkill.skill_code), weakestSkill.module),
        detail: `Weakest question type across ${attempts} question${
          attempts === 1 ? '' : 's'
        } answered.`,
        to: createPageUrl(modulePage(weakestSkill.module)),
      });
    }

    if (aiFocus?.ai_reason) {
      list.push({
        key: 'path',
        value: null,
        label: 'Learning path',
        detail: aiFocus.ai_reason,
        to: createPageUrl('LearningPath'),
      });
    } else if (!isPro) {
      list.push({
        key: 'upgrade',
        value: null,
        label: 'Personalised plan',
        detail: 'A learning path that adapts to your results and exam date is on Pro.',
        to: createPageUrl('Pricing'),
      });
    }

    return list.slice(0, 3);
  }, [recommended, stats, weakestSkill, aiFocus, isPro]);

  return (
    <div className={cn(PANEL, 'flex h-full flex-col p-4')}>
      <PanelTitle
        label="Next up"
        accent
        tip="Ranked by likely impact on your band."
        action={
          <span className={cn(NUM, 'text-[11px] font-bold text-slate-500 dark:text-slate-400')}>
            {actions.length}
          </span>
        }
      />

      {actions.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
          <CheckCircle2 className="h-6 w-6 text-[rgb(var(--signal-ok))] opacity-60" />
          <p className={cn('mt-2 text-xs font-medium', MUTED)}>All recommended tasks complete.</p>
          <Link
            to={createPageUrl('Reading')}
            className="mt-2 text-xs font-bold text-[#5a63df] transition-colors duration-150 ease-smooth-out hover:underline active:scale-95"
          >
            Practice Cambridge papers →
          </Link>
        </div>
      ) : (
        <div className="flex-1 space-y-1.5">
          {actions.map((action, index) => (
            <Link
              key={action.key}
              to={action.to}
              className="group -mx-1 flex items-start gap-2.5 rounded-lg p-2.5 transition-all duration-150 ease-smooth-out hover:-translate-y-0.5 hover:bg-[#f7f6fd] hover:shadow-xs active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-1 dark:hover:bg-white/6 dark:focus-visible:ring-offset-[#131315]"
            >
              <span
                className={cn('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', RANK[index] || RANK[2])}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5">
                  {action.value ? (
                    <span
                      className={cn(NUM, 'text-sm font-bold text-slate-900 dark:text-slate-50')}
                    >
                      {action.value}
                    </span>
                  ) : null}
                  <span className="text-[11px] font-extrabold leading-tight text-slate-800 dark:text-slate-100">
                    {action.label}
                  </span>
                </div>
                <p className={cn('mt-0.5 text-[10px] font-medium leading-snug', MUTED)}>
                  {action.detail}
                </p>
              </div>
              <ChevronRight className={cn('mt-1 h-3.5 w-3.5', ROW_CHEVRON)} />
            </Link>
          ))}
        </div>
      )}

      <PanelFootnote>
        <Link
          to={createPageUrl('Onboarding')}
          className={cn(PANEL_LINK, 'min-h-6 py-1 px-1.5 -my-1 -mx-1.5')}
        >
          Update goals
        </Link>
      </PanelFootnote>
    </div>
  );
});

NextUpPanel.displayName = 'NextUpPanel';

export default NextUpPanel;
