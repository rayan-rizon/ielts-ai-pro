import React from 'react';
import { m } from 'framer-motion';
import { Gauge } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  Empty,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  PanelFootnote,
  PanelTitle,
  Pill,
  Ring,
  WELL,
} from '@/features/dashboard/components/primitives';
import { READINESS_FACTORS } from '../hooks/analyticsCalculations';
import { ITEM_VARIANTS } from '../constants';

/**
 * "If I sat the test this week, am I ready?"
 *
 * Every other card on this page answers a piece of that question — band score,
 * pacing, module coverage — but none of them answer it directly, and it is the
 * question a learner two weeks from their exam date actually has. The score is
 * a readiness check built from things the app can verify (coverage, distance
 * to target, consistency, stability), not a predicted exam band — IELTS bands
 * are examiner judgment calls this app has no authority to forecast, which is
 * why the copy says "Nearly there", never "You will score a 7".
 */
export default function ExamReadinessCard({ readiness, targetScore, modulesWithData = 0 }) {
  if (!readiness) {
    const hasTarget = Number.isFinite(Number(targetScore)) && Number(targetScore) > 0;
    const emptyCopy = !hasTarget
      ? 'Set your target band to calculate readiness.'
      : modulesWithData < 4
        ? 'Score a test in each module to see a readiness check here.'
        : 'Complete another measured test to calculate readiness.';
    return (
      <m.div variants={ITEM_VARIANTS} className="h-full">
        <section className={cn(PANEL, 'flex h-full flex-col p-4')}>
          <PanelTitle label="Exam readiness" accent />
          <Empty icon={Gauge} className="flex-1 content-center">
            {emptyCopy}
          </Empty>
        </section>
      </m.div>
    );
  }

  const { score, factors, verdict, tone, missingModules } = readiness;

  return (
    <m.div variants={ITEM_VARIANTS} className="h-full">
      <section className={cn(PANEL, 'flex h-full flex-col p-4')}>
        <PanelTitle
          label="Exam readiness"
          accent
          tip="A readiness check from four measurable signals — not a predicted exam band. IELTS bands are an examiner's call."
          action={<Pill tone={tone}>{verdict}</Pill>}
        />

        <div className="flex items-center gap-3.5">
          <Ring value={score} size={72} stroke={7} label={`${score}`} sublabel="/ 100" />
          <div className="min-w-0 flex-1 space-y-2">
            {READINESS_FACTORS.map((factor) => {
              const value = factors[factor.key];
              return (
                <div key={factor.key} className="min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn(MICRO, MUTED, 'truncate')}>{factor.label}</span>
                    <span
                      className={cn(
                        NUM,
                        'text-[10px] font-bold text-slate-700 dark:text-slate-200'
                      )}
                    >
                      {value == null ? '—' : `${value}`}
                    </span>
                  </div>
                  <div className={cn('mt-1 h-1 w-full overflow-hidden rounded-full', WELL)}>
                    <div
                      className="h-full rounded-full bg-[#5a63df] transition-[width] duration-700 ease-out"
                      style={{ width: `${value ?? 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <PanelFootnote>
          {missingModules.length ? (
            <>
              Score <span className="font-bold capitalize">{missingModules.join(', ')}</span> to
              complete your coverage.
            </>
          ) : (
            'All four modules scored. Coverage is complete.'
          )}
        </PanelFootnote>
      </section>
    </m.div>
  );
}
