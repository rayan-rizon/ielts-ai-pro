import React from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock3,
  Flag,
  Rocket,
  Sparkles,
  Target,
  TrendingUp,
  XCircle,
  Zap,
} from 'lucide-react';
import { AnimatedScoreRing } from './AnimatedScoreRing';
import { PremiumUnlockOverlay } from './PremiumUnlockOverlay';
import { QUESTION_TYPE_LABELS } from './utils';
import { SkillGapRadar } from '../SkillGapRadar';
import { LISTENING_RAW_SCORE_THRESHOLDS, READING_RAW_SCORE_THRESHOLDS } from '@/lib/ieltsBandScore';

const SURFACE =
  'h-full min-w-0 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-[0_8px_24px_rgba(15,23,42,0.045)]';

const TIPS = {
  note_completion: 'Master note completion',
  notes_completion: 'Master note completion',
  matching: 'Strengthen feature matching',
  matching_features: 'Strengthen feature matching',
  matching_headings: 'Read for paragraph purpose',
  true_false_not_given: 'Separate false from not given',
  yes_no_not_given: 'Track the writer’s opinion',
  multiple_choice: 'Eliminate distractors',
  short_answer: 'Answer within the word limit',
  gap_fill: 'Predict the missing word form',
};

function getTypeEntries(typeStats) {
  if (!typeStats) return [];
  return Object.entries(typeStats)
    .filter(([, stat]) => Number(stat?.total) > 0)
    .map(([type, stat]) => ({
      type,
      label:
        QUESTION_TYPE_LABELS[type] ||
        type.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()),
      correct: Number(stat.correct) || 0,
      total: Number(stat.total) || 0,
      accuracy:
        Number(stat.total) > 0
          ? Math.round(((Number(stat.correct) || 0) / Number(stat.total)) * 100)
          : 0,
    }));
}

function getWeakestTypes(entries) {
  return [...entries].sort(
    (a, b) => a.accuracy - b.accuracy || b.total - b.correct - (a.total - a.correct)
  );
}

function getMilestone(testResults, testType) {
  const currentBand = Number(testResults.bandScore) || 0;
  const correct = Number(testResults.correctAnswers) || 0;
  const total = Number(testResults.totalQuestions) || 40;
  const thresholds =
    testType === 'listening' ? LISTENING_RAW_SCORE_THRESHOLDS : READING_RAW_SCORE_THRESHOLDS;
  const levels = Object.keys(thresholds)
    .map(Number)
    .sort((a, b) => a - b);
  const nextBand = levels.find((band) => band > currentBand) || 9;
  const previousBand = [...levels].reverse().find((band) => band <= currentBand);
  const nextRaw = Math.ceil(((thresholds[nextBand] || 40) / 40) * total);
  const previousRaw = previousBand ? Math.ceil(((thresholds[previousBand] || 0) / 40) * total) : 0;
  const progress =
    currentBand >= 9
      ? 100
      : Math.min(
          100,
          Math.max(
            0,
            Math.round(((correct - previousRaw) / Math.max(1, nextRaw - previousRaw)) * 100)
          )
        );
  return { nextBand, nextRaw, needed: Math.max(0, nextRaw - correct), progress };
}

const CardHeader = ({ icon: Icon, title, eyebrow, tone = 'blue' }) => {
  const tones = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
    violet: 'bg-violet-600 text-white shadow-md shadow-violet-500/20',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
  };
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 ${tones[tone]}`}
      >
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="min-w-0">
        <h3 className="text-xs font-black leading-tight tracking-tight text-slate-950 dark:text-white">
          {title}
        </h3>
        {eyebrow && (
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
            {eyebrow}
          </p>
        )}
      </div>
    </div>
  );
};

const MetricCard = ({ icon: Icon, label, value, detail, tone = 'blue', badge }) => {
  const tones = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
    rose: 'bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400',
    amber: 'bg-amber-50 text-amber-500 dark:bg-amber-950/40 dark:text-amber-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
  };
  return (
    <section className={`${SURFACE} p-3 flex flex-col justify-between min-h-[92px]`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${tones[tone]}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">{label}</span>
        </div>
        {badge && (
          <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-600">
            {badge}
          </span>
        )}
      </div>
      <div>
        <p className="text-xl font-black leading-tight tracking-tight text-slate-950 dark:text-white truncate">
          {value}
        </p>
        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">
          {detail}
        </p>
      </div>
    </section>
  );
};

const SummaryBanner = ({ testResults, testType, weakest }) => {
  const testLabel = testType === 'listening' ? 'listening' : 'reading';
  const focusLabels = weakest.slice(0, 2).map((entry) => entry.label);
  return (
    <section
      className={`${SURFACE} relative overflow-hidden min-h-[96px] px-4 py-2.5 grid grid-cols-[82px_1fr] lg:grid-cols-[96px_minmax(0,1fr)_320px] gap-3 items-center border-blue-200/80 bg-gradient-to-r from-white via-white to-blue-50/50 dark:from-slate-950 dark:via-slate-950 dark:to-blue-950/20`}
    >
      <div className="pointer-events-none absolute -right-12 -top-20 h-40 w-40 rounded-full bg-blue-100/40 blur-3xl dark:bg-blue-900/10" />
      <img
        src="/images/results/test-progress-illustration.svg"
        alt=""
        aria-hidden="true"
        className="relative z-10 w-[82px] h-[58px] lg:w-[94px] lg:h-[68px] object-contain"
      />
      <div className="min-w-0">
        <h2 className="text-[15px] font-black leading-tight tracking-tight text-slate-950 dark:text-white">
          You scored Band {Number(testResults.bandScore || 0).toFixed(1)}. Let’s build your{' '}
          {testLabel} foundation.
        </h2>
        <p className="mt-1 max-w-2xl text-[11px] leading-[1.55] text-slate-500 dark:text-slate-400">
          Your accuracy is {testResults.percentage}%. Focus on the lowest-scoring question types,
          then review every missed answer while the reasoning is still fresh.
        </p>
      </div>
      <div className="relative z-10 col-span-2 lg:col-span-1 lg:border-l lg:border-slate-200 dark:lg:border-slate-800 lg:pl-4 flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-[10px] bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center shrink-0">
          <Target className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Next focus</p>
          <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
            Focus on{' '}
            <span className="font-bold text-blue-600 dark:text-blue-400">
              {focusLabels.length ? focusLabels.join(' and ') : 'your weakest question types'}
            </span>{' '}
            to improve accuracy.
          </p>
        </div>
      </div>
    </section>
  );
};

const AccuracyCard = ({ testResults }) => (
  <section className={`${SURFACE} p-3.5 flex flex-col`}>
    <CardHeader icon={Target} title="Accuracy analysis" eyebrow="Performance metric" />
    <div className="flex-1 flex items-center justify-center py-1">
      <AnimatedScoreRing
        percentage={testResults.percentage}
        score={testResults.bandScore}
        size={138}
      />
    </div>
    <div className="grid grid-cols-3 gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
      {[
        ['Correct', testResults.correctAnswers, 'text-emerald-600'],
        ['Incorrect', testResults.incorrectAnswers, 'text-rose-500'],
        ['Skipped', testResults.unanswered, 'text-amber-500'],
      ].map(([label, value, color]) => (
        <div key={label} className="rounded-lg bg-slate-50 dark:bg-slate-900 px-2 py-2 text-center">
          <p className={`text-base font-black ${color}`}>{value}</p>
          <p className="text-[8px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
        </div>
      ))}
    </div>
  </section>
);

const TypeAnalysisCard = ({ entries }) => (
  <section className={`${SURFACE} p-3.5 flex flex-col`}>
    <CardHeader icon={BarChart3} title="Question type analysis" eyebrow="Correct / total" />
    <div className="mt-2.5 flex-1 divide-y divide-slate-100 dark:divide-slate-800">
      {entries.slice(0, 6).map((entry) => (
        <div
          key={entry.type}
          className="grid grid-cols-[minmax(0,1fr)_42px_92px_48px] items-center gap-2 py-[7px]"
        >
          <span className="truncate text-[10px] font-bold text-slate-700 dark:text-slate-300">
            {entry.label}
          </span>
          <span className="text-[10px] font-black text-slate-500">{entry.accuracy}%</span>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${entry.accuracy}%` }}
              className={`h-full rounded-full ${entry.accuracy >= 70 ? 'bg-emerald-500' : entry.accuracy >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
            />
          </div>
          <span className="text-right text-[10px] font-black text-slate-700 dark:text-slate-300">
            {entry.correct}/{entry.total}
          </span>
        </div>
      ))}
    </div>
  </section>
);

const SectionPerformanceCard = ({ sectionStats, testType }) => {
  const sectionLabel = testType === 'listening' ? 'Part' : 'Passage';
  return (
    <section className={`${SURFACE} p-3.5 flex flex-col`}>
      <CardHeader
        icon={BookOpen}
        title={`${sectionLabel} performance`}
        eyebrow="Section by section"
      />
      <div className="mt-3 grid grid-cols-3 gap-2">
        {(sectionStats || []).slice(0, testType === 'listening' ? 4 : 3).map((section, index) => {
          const percentage = Number(section.percentage) || 0;
          return (
            <div
              key={section.id || index}
              className="rounded-xl border border-slate-200/90 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/40 p-2.5 min-w-0"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[9px] font-bold text-slate-500">
                  {sectionLabel} {index + 1}
                </span>
                <span
                  className={`text-[10px] font-black ${percentage >= 60 ? 'text-emerald-600' : 'text-rose-500'}`}
                >
                  {percentage}%
                </span>
              </div>
              <div className="mt-2.5">
                <p className="text-lg font-black text-slate-950 dark:text-white">
                  {section.correct || 0}
                  <span className="text-[10px] text-slate-400">/{section.total || 0}</span>
                </p>
                <div className="mt-1.5 h-1.5 rounded-full bg-slate-200/70 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

const PerformanceSignalsCard = ({ percentage, totalTimeSeconds, entries }) => {
  const spread = entries.length
    ? Math.max(...entries.map((entry) => entry.accuracy)) -
      Math.min(...entries.map((entry) => entry.accuracy))
    : 0;
  const confidence = percentage >= 70 ? 'Strong' : percentage >= 40 ? 'Developing' : 'Low';
  const timing = totalTimeSeconds > 0 ? `${Math.round(totalTimeSeconds / 60)} min` : 'Not recorded';
  const rows = [
    [Zap, 'Stamina', totalTimeSeconds > 0 ? 'Timing captured' : 'No timing data'],
    [Activity, 'Confidence', confidence],
    [Clock3, 'Timing', timing],
    [TrendingUp, 'Accuracy pattern', spread <= 10 && percentage > 0 ? 'Balanced' : 'Needs work'],
  ];
  return (
    <section className={`${SURFACE} p-3.5`}>
      <CardHeader icon={Activity} title="Performance signals" eyebrow="What the result shows" />
      <div className="mt-2.5 divide-y divide-slate-100 dark:divide-slate-800">
        {rows.map(([Icon, label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <Icon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                {label}
              </span>
            </div>
            <span className="text-[9px] font-bold text-slate-500 truncate">{value}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

const RecommendationsCard = ({ weakest }) => (
  <section className={`${SURFACE} p-3.5`}>
    <CardHeader
      icon={Sparkles}
      title="Personalized recommendations"
      eyebrow="Start here"
      tone="violet"
    />
    <div className="mt-2.5 divide-y divide-slate-100 dark:divide-slate-800">
      {weakest.slice(0, 3).map((entry, index) => (
        <div key={entry.type} className="flex items-start gap-2.5 py-2">
          <span className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[9px] font-black shrink-0">
            {index + 1}
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 truncate">
              {TIPS[entry.type] || `Improve ${entry.label}`}
            </p>
            <p className="text-[9px] leading-relaxed text-slate-500 dark:text-slate-400">
              Review {entry.total - entry.correct} missed {entry.label.toLowerCase()} answer
              {entry.total - entry.correct === 1 ? '' : 's'}.
            </p>
          </div>
        </div>
      ))}
    </div>
  </section>
);

const MilestoneCard = ({ milestone, weakest }) => (
  <section className={`${SURFACE} p-3.5 flex flex-col`}>
    <CardHeader icon={Flag} title="Unlock higher band" eyebrow="Your next milestone" tone="amber" />
    <div className="mt-2.5 text-center">
      <p className="text-[10px] font-semibold text-slate-500">Target band</p>
      <p className="text-xl font-black text-slate-950 dark:text-white">
        {milestone.nextBand.toFixed(1)}
      </p>
      <p className="text-[9px] text-slate-500">
        {milestone.needed} more correct answer{milestone.needed === 1 ? '' : 's'} needed
      </p>
    </div>
    <div className="mt-2.5 space-y-1.5 flex-1">
      {[
        'Improve overall accuracy',
        weakest[0] ? `Practice ${weakest[0].label}` : 'Practice weak question types',
        'Review every missed answer',
      ].map((item) => (
        <div
          key={item}
          className="flex items-center gap-2 text-[9px] font-medium text-slate-600 dark:text-slate-400"
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
          <span>{item}</span>
        </div>
      ))}
    </div>
    <div className="mt-2.5">
      <div className="mb-1 flex items-center justify-between text-[9px] font-bold text-slate-500">
        <span>Progress</span>
        <span>{milestone.progress}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-blue-600"
          style={{ width: `${milestone.progress}%` }}
        />
      </div>
    </div>
  </section>
);

const LockedRow = ({ onUpgrade }) => (
  <section className={`${SURFACE} min-h-[210px] lg:col-span-12 relative overflow-hidden`}>
    <PremiumUnlockOverlay
      onUpgrade={onUpgrade}
      title="Unlock Pro Analysis"
      message="Get detailed skill signals, recommendations, and next-band guidance."
    />
  </section>
);

export const DetailedAnalysisTab = ({
  testResults,
  onUpgrade,
  isPremium,
  testType,
  totalTimeSeconds,
}) => {
  const entries = React.useMemo(
    () => getTypeEntries(testResults.typeStats),
    [testResults.typeStats]
  );
  const weakest = React.useMemo(() => getWeakestTypes(entries), [entries]);
  const milestone = React.useMemo(
    () => getMilestone(testResults, testType),
    [testResults, testType]
  );
  const focusLabel = weakest[0]?.label || 'Question analysis';
  const incorrect = Math.max(
    0,
    Number(testResults.totalQuestions || 0) -
      Number(testResults.correctAnswers || 0) -
      Number(testResults.unanswered || 0)
  );
  const normalizedResults = { ...testResults, incorrectAnswers: incorrect };

  return (
    <motion.div
      key="analysis"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2 }}
      className="p-3 sm:p-4 max-w-[1400px] mx-auto space-y-3"
    >
      <SummaryBanner testResults={normalizedResults} testType={testType} weakest={weakest} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 items-stretch">
        <MetricCard
          icon={BarChart3}
          label="Band score"
          value={Number(testResults.bandScore || 0).toFixed(1)}
          detail={`Target: Band ${milestone.nextBand.toFixed(1)}`}
        />
        <MetricCard
          icon={CheckCircle2}
          label="Accuracy"
          value={`${testResults.percentage}%`}
          detail={`${testResults.correctAnswers} / ${testResults.totalQuestions} correct`}
          tone="emerald"
        />
        <MetricCard
          icon={XCircle}
          label="Mistakes"
          value={incorrect}
          detail={`out of ${testResults.totalQuestions} questions`}
          tone="rose"
        />
        <MetricCard
          icon={Target}
          label="Focus area"
          value={focusLabel}
          detail={`${weakest[0]?.accuracy || 0}% accuracy`}
          tone="amber"
          badge="Priority"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
        <div className="lg:col-span-3 min-w-0">
          <AccuracyCard testResults={normalizedResults} />
        </div>
        <div className="lg:col-span-4 min-w-0 [&>div]:h-full">
          <SkillGapRadar
            skillGaps={testResults.skillGaps || null}
            typeStats={testResults.typeStats}
            testType={testType}
            compact
          />
        </div>
        <div className="lg:col-span-5 min-w-0">
          <TypeAnalysisCard entries={entries} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 items-stretch">
        {isPremium ? (
          <>
            <div className="lg:col-span-3 min-w-0">
              <SectionPerformanceCard sectionStats={testResults.sectionStats} testType={testType} />
            </div>
            <div className="lg:col-span-3 min-w-0">
              <PerformanceSignalsCard
                percentage={testResults.percentage}
                totalTimeSeconds={totalTimeSeconds}
                entries={entries}
              />
            </div>
            <div className="lg:col-span-3 min-w-0">
              <RecommendationsCard weakest={weakest} />
            </div>
            <div className="lg:col-span-3 min-w-0">
              <MilestoneCard milestone={milestone} weakest={weakest} />
            </div>
          </>
        ) : (
          <LockedRow onUpgrade={onUpgrade} />
        )}
      </div>

      <div className="flex items-center justify-center gap-2 py-1 text-[10px] font-semibold text-slate-400">
        <Rocket className="w-3.5 h-3.5 text-blue-500" />
        Small, focused improvements compound into a higher band.
      </div>
    </motion.div>
  );
};
