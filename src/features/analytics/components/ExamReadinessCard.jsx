import React, { useMemo } from 'react';
import { m } from 'framer-motion';
import { Gauge, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  AnimatedNumber,
  Empty,
  IconChip,
  InfoTip,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  PanelFootnote,
  PanelTitle,
  Pill,
  Ring,
  TILE,
  Tip,
  WELL,
} from '@/features/dashboard/components/primitives';

const VERDICT_HINTS = {
  'Exam ready': 'Score of 80 or higher — every signal below is holding up well.',
  'Nearly there': 'Score of 60–79 — close, with at least one signal still lagging.',
  'Building up': 'Score of 35–59 — real progress, but more than one signal needs work.',
  'Early days': 'Score below 35 — most signals still need building.',
};
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
  const lowestFactor = useMemo(() => {
    if (!readiness) return null;
    // Coverage sits at 100 by construction whenever this card renders at all
    // (the gate below requires every module scored), so it can never be the
    // lever worth naming — the search only makes sense across the other three.
    const candidates = READINESS_FACTORS.filter((factor) => factor.key !== 'coverage')
      .map((factor) => ({ factor, value: readiness.factors[factor.key] }))
      .filter((item) => item.value != null);
    if (!candidates.length) return null;
    return candidates.sort((a, b) => a.value - b.value)[0];
  }, [readiness]);

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

  const { score, factors, verdict, tone } = readiness;

  return (
    <m.div variants={ITEM_VARIANTS} className="h-full">
      <section className={cn(PANEL, 'flex h-full flex-col p-4')}>
        <PanelTitle
          label="Exam readiness"
          accent
          tip="A readiness check from four measurable signals — not a predicted exam band. IELTS bands are an examiner's call."
          action={
            <Tip content={VERDICT_HINTS[verdict] || verdict}>
              <m.span
                key={verdict}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                className="inline-block"
              >
                <Pill tone={tone}>{verdict}</Pill>
              </m.span>
            </Tip>
          }
        />

        <div className="flex items-center gap-4">
          <Tip content="Equal average of the four signals to the right.">
            <span>
              <Ring
                value={score}
                size={80}
                stroke={7}
                label={<AnimatedNumber value={score} decimals={0} />}
                sublabel="/ 100"
              />
            </span>
          </Tip>
          <div className="min-w-0 flex-1 space-y-2.5">
            {READINESS_FACTORS.map((factor) => {
              const value = factors[factor.key];
              return (
                <div key={factor.key} className="min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn(MICRO, MUTED, 'flex min-w-0 items-center gap-1 truncate')}>
                      <span className="truncate">{factor.label}</span>
                      <InfoTip>{factor.hint}</InfoTip>
                    </span>
                    <span
                      className={cn(
                        NUM,
                        'shrink-0 text-[10px] font-bold text-slate-700 dark:text-slate-200'
                      )}
                    >
                      {value == null ? '—' : <AnimatedNumber value={value} decimals={0} />}
                    </span>
                  </div>
                  <div className={cn('mt-1 h-1.5 w-full overflow-hidden rounded-full', WELL)}>
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

        {/* The one lever most worth pulling, named directly rather than left for
            the learner to infer from four bars — the same "here's what to do
            with this" job every other card on the page does in its footnote. */}
        {lowestFactor ? (
          <div className={cn(TILE, 'mt-3 flex items-start gap-2.5 p-3')}>
            <IconChip icon={Lightbulb} tone="amber" size="sm" className="mt-0.5" />
            <p className={cn('min-w-0 text-[11px] font-medium leading-snug', MUTED)}>
              <span className="font-extrabold text-slate-800 dark:text-slate-100">
                {lowestFactor.factor.label}
              </span>{' '}
              is your lowest signal at{' '}
              <span className={cn(NUM, 'font-bold text-slate-800 dark:text-slate-100')}>
                <AnimatedNumber value={lowestFactor.value} decimals={0} />
              </span>
              . {lowestFactor.factor.hint}
            </p>
          </div>
        ) : null}

        <div className="flex-1" />

        <PanelFootnote>All four modules scored. Coverage is complete.</PanelFootnote>
      </section>
    </m.div>
  );
}
