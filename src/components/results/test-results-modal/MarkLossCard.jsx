import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import {
  Empty,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  PanelTitle,
  SIGNAL_TEXT,
  TILE,
  Tip,
  WELL,
} from '@/features/dashboard/components/primitives';
import { accuracyTone } from './resultStats';
import { deriveMarkLoss, sectionNoun } from './resultInsights';

const BAR_FILL = {
  ok: 'bg-[rgb(var(--signal-ok))]',
  warn: 'bg-[rgb(var(--signal-warn))]',
  fault: 'bg-[rgb(var(--signal-fault))]',
};

const TONE_LABEL = { ok: 'Strong', warn: 'Fair', fault: 'Needs work' };

/**
 * The paper as a strip: one block per section, width proportional to how many
 * questions it holds, fill proportional to how many were right.
 *
 * This replaces the old stand-alone "Passage performance" list. The same three
 * numbers are here, but as the *shape of the paper* rather than a second column
 * of bars — so it reads as context for the ledger underneath instead of
 * competing with it for the same attention.
 */
function PaperMap({ sections, testType }) {
  const totalQuestions = sections.reduce((sum, section) => sum + section.total, 0);
  if (!totalQuestions) return null;

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className={cn(MICRO, MUTED)}>
          The paper, {sectionNoun(testType).toLowerCase()} by {sectionNoun(testType).toLowerCase()}
        </span>
        <span className={cn(MICRO, MUTED)}>
          <span className={NUM}>{totalQuestions}</span> questions
        </span>
      </div>

      <div className="mt-1.5 flex gap-1">
        {sections.map((section, idx) => {
          const tone = accuracyTone(section.accuracy);
          const share = Math.max(8, Math.round((section.total / totalQuestions) * 100));

          return (
            <Tip
              key={section.index}
              content={
                <span className="space-y-0.5">
                  <span className="block font-bold">
                    {section.label} — <span className={NUM}>{section.correct}</span>/
                    <span className={NUM}>{section.total}</span> correct
                  </span>
                  <span className="block text-slate-300 dark:text-slate-400">
                    {section.lost} mark{section.lost === 1 ? '' : 's'} lost ·{' '}
                    <span className={SIGNAL_TEXT[tone]}>{TONE_LABEL[tone]}</span>
                  </span>
                </span>
              }
            >
              <div className="min-w-0 cursor-default" style={{ width: `${share}%` }}>
                <div
                  className={cn(
                    'flex h-6 w-full flex-col justify-end overflow-hidden rounded-md',
                    WELL
                  )}
                >
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${section.accuracy}%` }}
                    transition={{ duration: 0.6, delay: 0.15 + idx * 0.05, ease: 'easeOut' }}
                    className={cn('w-full rounded-md', BAR_FILL[tone])}
                  />
                </div>
                <div className="mt-1 flex items-baseline justify-between gap-1">
                  <span className={cn(MICRO, MUTED, 'truncate')}>{section.shortLabel}</span>
                  <span className={cn(NUM, 'text-[10px] font-bold', SIGNAL_TEXT[tone])}>
                    {section.accuracy}%
                  </span>
                </div>
              </div>
            </Tip>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Where in the paper this question type went wrong.
 *
 * One pip per section, filled in proportion to that section's share of this
 * type's losses. It is the cross-tabulation neither of the two old cards could
 * express: "Matching is weak" and "Passage 3 is weak" were separate facts, and
 * a learner could not tell whether they were the same fact.
 */
function SectionPips({ entry, sections }) {
  if (!entry.bySection || entry.lost === 0) return null;
  const peak = Math.max(...entry.bySection);

  return (
    <span className="flex shrink-0 items-center gap-0.5" aria-hidden="true">
      {entry.bySection.map((lost, index) => {
        const intensity = peak > 0 ? lost / peak : 0;
        return (
          <span
            key={index}
            title={`${sections[index]?.label || `Section ${index + 1}`}: ${lost} lost`}
            className={cn(
              'h-3 w-1.5 rounded-[2px]',
              lost === 0
                ? 'bg-slate-200 dark:bg-white/[0.12]'
                : intensity > 0.66
                  ? 'bg-[rgb(var(--signal-fault))]'
                  : intensity > 0.33
                    ? 'bg-[rgb(var(--signal-fault)/0.6)]'
                    : 'bg-[rgb(var(--signal-fault)/0.3)]'
            )}
          />
        );
      })}
    </span>
  );
}

/**
 * "Where your marks went" — the single home for mark attribution.
 *
 * Replaces `QuestionTypeBreakdown` and `PassageBreakdownCard`. Those ranked by
 * accuracy percentage, which over-weights a type worth two marks over one worth
 * nine: a 0%-on-2 type sorted above a 60%-on-15 type that cost three times as
 * much. This ranks by marks actually lost, which is the quantity a learner can
 * act on, and keeps accuracy as the supporting bar.
 */
export function MarkLossCard({ testResults, testType = 'reading', onReviewAnswers }) {
  const loss = React.useMemo(() => deriveMarkLoss(testResults, testType), [testResults, testType]);
  const lostTypes = loss.types.filter((entry) => entry.lost > 0);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className={cn(PANEL, 'p-3.5')}
      aria-labelledby="mark-loss-title"
    >
      <PanelTitle
        label="Where your marks went"
        tip="Ranked by marks lost, not by percentage — a type worth 9 marks matters more than one worth 2."
        action={
          loss.totalLost > 0 ? (
            <span className={cn(MICRO, SIGNAL_TEXT.fault)}>
              <span className={NUM}>{loss.totalLost}</span> mark
              {loss.totalLost === 1 ? '' : 's'} lost
            </span>
          ) : (
            <span className={cn(MICRO, SIGNAL_TEXT.ok)}>Full marks</span>
          )
        }
      />

      {loss.sections.length > 0 && <PaperMap sections={loss.sections} testType={testType} />}

      {loss.types.length === 0 ? (
        <Empty>No question-type breakdown was recorded for this attempt.</Empty>
      ) : (
        <div className={cn(loss.sections.length > 0 && 'mt-3')}>
          <div className="flex items-center justify-between gap-2">
            <span id="mark-loss-title" className={cn(MICRO, MUTED)}>
              By question type
            </span>
            {loss.hasSectionAttribution && (
              <span className={cn(MICRO, MUTED)}>
                Pips show which {sectionNoun(testType).toLowerCase()}
              </span>
            )}
          </div>

          <div className="mt-2 grid grid-cols-1 gap-1 lg:grid-cols-2">
            {lostTypes.length === 0 ? (
              <p className={cn(MICRO, SIGNAL_TEXT.ok, 'py-2')}>
                Every question type was answered correctly.
              </p>
            ) : (
              lostTypes.map((entry, idx) => {
                const tone = accuracyTone(entry.accuracy);
                const worst =
                  entry.worstSection !== null ? loss.sections[entry.worstSection] : null;

                return (
                  <Tip
                    key={entry.type}
                    content={
                      <span className="space-y-0.5">
                        <span className="block font-bold">
                          <span className={NUM}>{entry.correct}</span>/
                          <span className={NUM}>{entry.total}</span> correct ·{' '}
                          <span className={SIGNAL_TEXT[tone]}>{TONE_LABEL[tone]}</span>
                        </span>
                        <span className="block text-slate-300 dark:text-slate-400">
                          {worst
                            ? `Most of these were lost in ${worst.label}`
                            : `${entry.lost} mark${entry.lost === 1 ? '' : 's'} lost in this type`}
                        </span>
                      </span>
                    }
                  >
                    <button
                      type="button"
                      onClick={onReviewAnswers}
                      className={cn(
                        TILE,
                        'flex w-full items-center gap-2.5 px-2.5 py-1.5 text-left transition-all duration-150',
                        'hover:border-[#c9cdf3] active:scale-[0.995] dark:hover:border-white/[0.18]'
                      )}
                    >
                      <span
                        className={cn(
                          NUM,
                          'w-4 shrink-0 text-center text-[11px] font-extrabold',
                          idx === 0 ? SIGNAL_TEXT.fault : 'text-slate-400 dark:text-slate-500'
                        )}
                      >
                        {idx + 1}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-[11px] font-extrabold text-slate-800 dark:text-slate-100">
                            {entry.label}
                          </span>
                          <span
                            className={cn(
                              NUM,
                              'shrink-0 text-[11px] font-extrabold',
                              SIGNAL_TEXT.fault
                            )}
                          >
                            −{entry.lost}
                          </span>
                        </span>

                        <span
                          className={cn(
                            'mt-1 flex h-1.5 w-full overflow-hidden rounded-full',
                            WELL
                          )}
                        >
                          <motion.span
                            initial={{ width: 0 }}
                            animate={{ width: `${entry.accuracy}%` }}
                            transition={{ duration: 0.6, delay: 0.2 + idx * 0.03 }}
                            className={cn('block h-full rounded-full', BAR_FILL[tone])}
                          />
                        </span>

                        <span className="mt-0.5 flex items-center justify-between gap-2">
                          <span className={cn(MICRO, MUTED, 'truncate')}>
                            <span className={NUM}>{entry.correct}</span>/
                            <span className={NUM}>{entry.total}</span> correct
                            {worst && (
                              <>
                                {' · worst in '}
                                <span className="font-bold text-slate-600 dark:text-slate-300">
                                  {worst.shortLabel}
                                </span>
                              </>
                            )}
                          </span>
                          <span
                            className={cn(NUM, 'shrink-0 text-[10px] font-bold', SIGNAL_TEXT[tone])}
                          >
                            {entry.accuracy}%
                          </span>
                        </span>
                      </span>

                      <SectionPips entry={entry} sections={loss.sections} />
                    </button>
                  </Tip>
                );
              })
            )}
          </div>
        </div>
      )}
    </motion.section>
  );
}

export default MarkLossCard;
