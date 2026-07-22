import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CalendarCheck2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Headphones,
  History,
  Lightbulb,
  LockKeyhole,
  Save,
  Target,
  TriangleAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackAppEvent } from '@/lib/tracking';
import { fetchRecentResultSessions, saveResultFocusPlan } from '@/services/premiumAnalysisService';
import { buildPremiumAnalysis } from './premiumAnalysis';

const CARD =
  'min-w-0 rounded-2xl border border-slate-200/90 bg-white shadow-xs dark:border-slate-800/90 dark:bg-slate-950/90';

const TREND_STYLES = {
  recurring:
    'bg-rose-50/90 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60 shadow-2xs',
  improving:
    'bg-emerald-50/90 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs',
  declining:
    'bg-amber-50/90 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 shadow-2xs',
  stable:
    'bg-slate-100/90 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/60 shadow-2xs',
  limited:
    'bg-blue-50/90 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60 shadow-2xs',
};

function formatBand(value) {
  return Number(value || 0).toFixed(1);
}

function formatTime(seconds) {
  if (!seconds) return 'Not recorded';
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}m ${String(remaining).padStart(2, '0')}s`;
}

function SectionHeading({ icon: Icon, eyebrow, title, action }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {eyebrow}
          </p>
          <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
            {title}
          </h3>
        </div>
      </div>
      {action}
    </div>
  );
}

function FreeTeaser({ analysis, testType, onUpgrade }) {
  const largestLoss = analysis.typeLosses[0];
  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-5 lg:p-6">
      <section className={`${CARD} overflow-hidden`}>
        <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50/80 via-white to-amber-50/60 px-4 py-4 dark:border-slate-800 dark:bg-none">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Premium score recovery
              </p>
              <h2 className="mt-0.5 text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                Two signals from this {testType} result
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Unlock the question-level diagnosis and a saved seven-day recovery plan.
              </p>
            </div>
            <Button
              onClick={onUpgrade}
              className="h-9 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white hover:bg-blue-600 transition-all shadow-xs"
            >
              Unlock full analysis <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <div className="rounded-xl border border-rose-200/70 bg-rose-50/50 p-3.5 dark:border-rose-900/50 dark:bg-rose-950/20">
            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Largest lost-point area
            </p>
            <p className="mt-1 text-base font-extrabold text-slate-900 dark:text-white">
              {largestLoss?.label || 'Not enough detail'}
            </p>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
              {largestLoss
                ? `${largestLoss.lost} of ${largestLoss.total} points lost`
                : 'Complete a scored question type to reveal this signal.'}
            </p>
          </div>
          <div className="rounded-xl border border-blue-200/70 bg-blue-50/50 p-3.5 dark:border-blue-900/50 dark:bg-blue-950/20">
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Next-band gap
            </p>
            <p className="mt-1 text-base font-extrabold text-slate-900 dark:text-white">
              {analysis.target.additionalCorrect} more correct answer
              {analysis.target.additionalCorrect === 1 ? '' : 's'}
            </p>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
              Reach Band {formatBand(analysis.target.nextBand)} at about {analysis.target.rawNeeded}
              /{analysis.target.total || 40} correct.
            </p>
          </div>
        </div>
        <div className="mx-4 mb-4 flex items-center gap-2.5 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-900/50">
          <LockKeyhole className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Mistake causes, recent patterns, pacing, target scenarios, and plan actions are
            available to paid members.
          </p>
        </div>
      </section>
    </div>
  );
}

function ScoreBridge({ currentBand, targetBand, additionalCorrect }) {
  return (
    <div className="mt-2 flex items-center gap-2 flex-wrap sm:flex-nowrap">
      {/* Current Score Pill */}
      <div className="rounded-xl border border-slate-200/90 bg-white/90 px-3 py-1.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900/90 flex-1 sm:flex-none text-center">
        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Now</p>
        <p className="text-lg font-black text-slate-900 dark:text-white leading-tight">
          {formatBand(currentBand)}
        </p>
      </div>

      {/* Dynamic Gradient Connector Line */}
      <div className="flex min-w-10 flex-1 items-center gap-1 px-0.5">
        <span className="h-1 flex-1 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-600 shadow-2xs" />
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs shadow-blue-500/30 shrink-0">
          <ArrowRight className="h-3 w-3" />
        </span>
        <span className="h-1 flex-1 rounded-full bg-gradient-to-r from-violet-600 via-indigo-500 to-blue-500 shadow-2xs" />
      </div>

      {/* Target Score Pill */}
      <div className="rounded-xl border border-blue-500/80 bg-gradient-to-br from-blue-600 to-indigo-700 px-3 py-1.5 text-white shadow-xs shadow-blue-500/20 flex-1 sm:flex-none text-center">
        <p className="text-[9px] font-black uppercase tracking-wider text-blue-100">Target</p>
        <p className="text-lg font-black leading-tight">{formatBand(targetBand)}</p>
      </div>

      {/* Gap Pill */}
      <div className="rounded-xl border border-amber-300/80 bg-amber-500/10 px-3 py-1.5 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/50 dark:text-amber-300 shadow-2xs flex-1 sm:flex-none text-center">
        <p className="text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
          Gap
        </p>
        <p className="text-xs font-black leading-tight">+{additionalCorrect} answers</p>
      </div>
    </div>
  );
}

function Blockers({ analysis, currentBand }) {
  const fallback = {
    title: 'No lost points detected',
    detail: 'Keep the result as your new benchmark',
    status: 'Strong result',
  };
  const blockers = analysis.topBlockers.length ? analysis.topBlockers : [fallback];

  const BLOCKER_ACCENTS = [
    'bg-gradient-to-br from-rose-50/90 via-white to-red-50/40 border-rose-200/80 dark:from-rose-950/40 dark:via-slate-900 dark:to-slate-950 dark:border-rose-900/50',
    'bg-gradient-to-br from-amber-50/90 via-white to-yellow-50/40 border-amber-200/80 dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-950 dark:border-amber-900/50',
    'bg-gradient-to-br from-violet-50/90 via-white to-indigo-50/40 border-violet-200/80 dark:from-violet-950/40 dark:via-slate-900 dark:to-slate-950 dark:border-violet-900/50',
  ];

  return (
    <section
      className={`${CARD} overflow-hidden p-3.5 sm:p-4 bg-gradient-to-r from-blue-50/50 via-white to-indigo-50/40 dark:from-slate-900/90 dark:via-slate-900/50 dark:to-slate-950`}
    >
      <div className="grid gap-3.5 xl:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.15fr)] xl:items-center">
        {/* Left Brief Column */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-5.5 w-5.5 items-center justify-center rounded-md bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              <Target className="h-3.5 w-3.5" />
            </span>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Your score recovery brief
            </p>
          </div>
          <ScoreBridge
            currentBand={currentBand}
            targetBand={analysis.target.targetBand}
            additionalCorrect={analysis.target.additionalCorrect}
          />
        </div>

        {/* Right Top Blockers Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 min-w-0">
          {blockers.slice(0, 3).map((blocker, index) => (
            <div
              key={`${blocker.title}-${index}`}
              className={`rounded-xl border p-2.5 shadow-2xs flex flex-col justify-between space-y-1.5 transition-all hover:border-blue-300 dark:hover:border-blue-700/60 min-w-0 ${BLOCKER_ACCENTS[index % 3]}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-900 text-[10px] font-black text-white shadow-2xs dark:bg-white dark:text-slate-900 shrink-0">
                  {index + 1}
                </span>
                <p className="truncate text-xs font-extrabold text-slate-900 dark:text-white min-w-0">
                  {blocker.title}
                </p>
              </div>
              <div>
                <p className="text-xs font-black text-rose-600 dark:text-rose-400">
                  {blocker.detail}
                </p>
                <span className="inline-block mt-0.5 rounded-md bg-rose-100/80 px-1.5 py-0.5 text-[9px] font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60">
                  {blocker.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RecoveryMap({ analysis }) {
  const maxLost = Math.max(1, ...analysis.typeLosses.map((entry) => entry.lost));
  const totalLost = analysis.typeLosses.reduce((sum, entry) => sum + entry.lost, 0);

  return (
    <section className={`${CARD} p-4 sm:p-5 space-y-4`}>
      <SectionHeading
        icon={BarChart3}
        eyebrow="Where points went"
        title="Score recovery map"
        action={
          <span className="rounded-full bg-gradient-to-r from-rose-500 to-red-600 text-white font-extrabold px-3 py-1 text-xs shadow-xs">
            {totalLost} total lost
          </span>
        }
      />

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {analysis.typeLosses.map((entry) => {
          const accuracy = entry.total > 0 ? Math.round((entry.correct / entry.total) * 100) : 0;
          return (
            <div
              key={entry.type}
              className="p-3.5 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/50 to-blue-50/20 dark:border-slate-800 dark:from-slate-900/90 dark:to-slate-950 flex flex-col justify-between space-y-3 transition-all hover:border-blue-400/80 hover:shadow-xs group"
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                  {entry.label}
                </h4>
                <span
                  className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold ${TREND_STYLES[entry.trend.status]}`}
                >
                  {entry.trend.label}
                </span>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xl font-black text-rose-600 dark:text-rose-400 leading-none">
                    {entry.lost} <span className="text-xs font-bold text-slate-400">lost</span>
                  </p>
                  <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-1">
                    {entry.correct}/{entry.total} correct
                  </p>
                </div>

                {/* Circular Accuracy Ring */}
                <div className="relative w-11 h-11 flex items-center justify-center">
                  <svg className="w-11 h-11 transform -rotate-90">
                    <circle
                      cx="22"
                      cy="22"
                      r="18"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      className="text-slate-100 dark:text-slate-800"
                      fill="transparent"
                    />
                    <circle
                      cx="22"
                      cy="22"
                      r="18"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      strokeDasharray={113}
                      strokeDashoffset={113 - (113 * accuracy) / 100}
                      strokeLinecap="round"
                      className="text-blue-600 dark:text-blue-400 transition-all duration-700"
                      fill="transparent"
                    />
                  </svg>
                  <span className="absolute text-[10px] font-black text-slate-800 dark:text-slate-200">
                    {accuracy}%
                  </span>
                </div>
              </div>

              {/* Progress Bar Footer */}
              <div className="h-2 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex border border-slate-200/50 dark:border-slate-800">
                <div
                  className="bg-gradient-to-r from-rose-500 to-red-500"
                  style={{ width: `${(entry.incorrect / maxLost) * 100}%` }}
                />
                <div
                  className="bg-gradient-to-r from-amber-400 to-yellow-400"
                  style={{ width: `${(entry.skipped / maxLost) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-5 border-t border-slate-100 dark:border-slate-800 pt-3 text-xs font-bold text-slate-600 dark:text-slate-400">
        <span className="flex items-center gap-2">
          <i className="h-3 w-3 rounded-full bg-gradient-to-r from-rose-500 to-red-500 shadow-2xs" />
          Incorrect
        </span>
        <span className="flex items-center gap-2">
          <i className="h-3 w-3 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 shadow-2xs" />
          Skipped
        </span>
      </div>
    </section>
  );
}

function TargetPlanner({ analysis, selectedTarget, onTargetChange }) {
  const progress = Math.min(
    100,
    Math.round(
      (analysis.target.rawNeeded
        ? (analysis.target.rawNeeded - analysis.target.additionalCorrect) /
          analysis.target.rawNeeded
        : 1) * 100
    )
  );
  return (
    <section className={`${CARD} p-3.5 sm:p-4 space-y-3`}>
      <SectionHeading
        icon={Target}
        eyebrow="What the next band takes"
        title="Target band planner"
        action={
          <select
            value={selectedTarget}
            onChange={(event) => onTargetChange(Number(event.target.value))}
            className="h-7.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          >
            {analysis.target.options.map((band) => (
              <option key={band} value={band}>
                Band {formatBand(band)}
              </option>
            ))}
          </select>
        }
      />
      <div className="rounded-xl border border-blue-200/70 bg-gradient-to-br from-blue-50/80 via-indigo-50/20 to-white p-3.5 dark:border-blue-900/50 dark:from-blue-950/30 dark:via-slate-900 dark:to-slate-950">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Recovery gap
            </p>
            <p className="mt-0.5 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              +{analysis.target.additionalCorrect}
            </p>
            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
              additional correct answers
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              {analysis.target.rawNeeded}/{analysis.target.total || 40}
            </p>
            <p className="text-[10px] font-medium text-slate-400">target raw score</p>
          </div>
        </div>
        <div
          className="mt-3 grid grid-cols-12 gap-1"
          aria-label={`${progress}% of target raw score secured`}
        >
          {Array.from({ length: 12 }, (_, index) => (
            <span
              key={index}
              className={`h-2 rounded-full transition-all ${index < Math.round((progress / 100) * 12) ? 'bg-blue-600' : 'bg-blue-100 dark:bg-blue-950'}`}
            />
          ))}
        </div>
        <p className="mt-2 text-[10px] font-bold text-blue-700 dark:text-blue-300">
          {progress}% of the target raw score already secured
        </p>
      </div>
      <p className="text-[10px] leading-relaxed text-slate-400 dark:text-slate-500">
        Scaled for this test length using the module-specific band conversion table.
      </p>
    </section>
  );
}

function MistakeQueue({ analysis, onReviewQuestion }) {
  return (
    <section className={`${CARD} p-4 sm:p-5 space-y-4`}>
      <SectionHeading
        icon={BookOpenCheck}
        eyebrow="Highest return first"
        title="Priority mistake queue"
      />
      {!analysis.dataAvailability.hasReliableBuckets ? (
        <div className="flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 dark:border-amber-900/50 dark:bg-amber-950/20">
          <TriangleAlert className="h-4.5 w-4.5 shrink-0 text-amber-600" />
          <p className="text-xs leading-relaxed font-medium text-amber-800 dark:text-amber-200">
            This older result does not contain enough question-level detail for trustworthy cause
            labels. The score map remains available.
          </p>
        </div>
      ) : analysis.mistakeQueue.length ? (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              [
                'Near miss',
                analysis.errorBuckets.nearMiss,
                'text-blue-600 dark:text-blue-400',
                'bg-gradient-to-br from-blue-50/90 to-indigo-50/40 border-blue-200/80 dark:from-blue-950/40 dark:to-indigo-950/20 dark:border-blue-900/50',
              ],
              [
                'Changed wrong',
                analysis.errorBuckets.changedWrong,
                'text-violet-600 dark:text-violet-400',
                'bg-gradient-to-br from-violet-50/90 to-purple-50/40 border-violet-200/80 dark:from-violet-950/40 dark:to-purple-950/20 dark:border-violet-900/50',
              ],
              [
                'Skipped',
                analysis.errorBuckets.skipped,
                'text-amber-600 dark:text-amber-400',
                'bg-gradient-to-br from-amber-50/90 to-yellow-50/40 border-amber-200/80 dark:from-amber-950/40 dark:to-yellow-950/20 dark:border-amber-900/50',
              ],
              [
                'Other wrong',
                analysis.errorBuckets.otherWrong,
                'text-rose-600 dark:text-rose-400',
                'bg-gradient-to-br from-rose-50/90 to-red-50/40 border-rose-200/80 dark:from-rose-950/40 dark:to-red-950/20 dark:border-rose-900/50',
              ],
            ].map(([label, value, color, bg]) => (
              <div key={label} className={`rounded-xl border p-3 ${bg} shadow-2xs space-y-0.5`}>
                <p className={`text-xl font-black ${color}`}>{value}</p>
                <p className="text-xs font-extrabold text-slate-600 dark:text-slate-400">{label}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {analysis.mistakeQueue.map((item) => (
              <div
                key={`${item.questionId}-${item.questionNumber}`}
                className="p-3 rounded-xl border border-slate-200/70 bg-gradient-to-r from-slate-50/90 via-white to-slate-50/40 dark:border-slate-800 dark:from-slate-900/80 dark:via-slate-900/40 dark:to-slate-950 transition-all hover:border-blue-300 dark:hover:border-blue-700/60 shadow-2xs group flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-xs font-black text-white shadow-xs dark:bg-white dark:text-slate-900 shrink-0">
                    Q{item.questionNumber}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                      {item.reason}
                    </p>
                    <p className="truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                      <span className="inline-block rounded-md bg-slate-200/70 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300 mr-1.5">
                        {item.label}
                      </span>
                      {item.type?.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => onReviewQuestion(item)}
                  className="h-8.5 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-1 shrink-0"
                >
                  Review <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="rounded-xl bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/50">
          No recoverable mistakes remain in this result.
        </p>
      )}
    </section>
  );
}

function SectionStrategy({ analysis, testType }) {
  const isReading = testType === 'reading';
  return (
    <section className={`${CARD} p-4 sm:p-5 space-y-4`}>
      <SectionHeading
        icon={isReading ? Clock3 : Headphones}
        eyebrow={isReading ? '20-minute benchmark' : 'Part-level recovery'}
        title="Section strategy"
      />
      <div className="space-y-3">
        {analysis.sectionStrategy.length === 0 && (
          <p className="rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-500 dark:bg-slate-900">
            Section-level scoring was not stored for this result.
          </p>
        )}
        {analysis.sectionStrategy.map((section) => (
          <div
            key={section.index}
            className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 bg-gradient-to-r from-slate-50/90 via-white to-slate-50/40 dark:border-slate-800 dark:from-slate-900/80 dark:via-slate-900/40 dark:to-slate-950 shadow-2xs space-y-2.5 transition-all hover:border-blue-300/80"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                  {section.label}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {section.lost} point{section.lost === 1 ? '' : 's'} lost · {section.accuracy}%
                  accuracy
                </p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-black border ${
                  section.lost
                    ? 'bg-rose-50 text-rose-600 border-rose-200/80 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-900/50'
                    : 'bg-emerald-50 text-emerald-600 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900/50'
                }`}
              >
                {section.correct}/{section.total}
              </span>
            </div>

            {/* Visual Accuracy Bar */}
            <div className="h-2 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  section.accuracy >= 70
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                    : section.accuracy >= 40
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-500'
                      : 'bg-gradient-to-r from-rose-500 to-red-500'
                }`}
                style={{ width: `${Math.max(5, section.accuracy)}%` }}
              />
            </div>

            {isReading && (
              <div className="flex items-center justify-between border-t border-slate-200/70 dark:border-slate-800 pt-2 text-xs">
                <span className="font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Clock3 className="w-3.5 h-3.5 text-slate-400" />
                  {formatTime(section.seconds)}
                </span>
                <span className="bg-blue-50 text-blue-700 border border-blue-200/80 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900/60 text-xs font-extrabold px-2.5 py-0.5 rounded-md">
                  {section.paceDeltaSeconds == null
                    ? 'Timing unavailable'
                    : section.paceDeltaSeconds > 0
                      ? `${Math.ceil(section.paceDeltaSeconds / 60)}m over benchmark`
                      : `${Math.ceil(Math.abs(section.paceDeltaSeconds) / 60)}m available`}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
      {!isReading && (
        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          Listening analysis intentionally uses error concentration by part; answer timestamps are
          not presented as time spent.
        </p>
      )}
    </section>
  );
}
function TrendSparkline({ scores }) {
  const values = scores.map((entry) => Number(entry.score) || 0);
  const minVal = Math.max(0, Math.min(...values) - 0.5);
  const maxVal = Math.min(9, Math.max(...values) + 0.5);
  const range = Math.max(1, maxVal - minVal);

  const pointsArray = values.map((value, index) => {
    const x = values.length <= 1 ? 120 : 16 + (index / (values.length - 1)) * 208;
    const y = 64 - ((value - minVal) / range) * 44; // maps y between 20 and 64
    return { x, y, value };
  });

  const points = pointsArray.map((p) => `${p.x},${p.y}`).join(' ');
  const polygonPoints = `16,74 ${points} 224,74`;

  return (
    <div className="relative w-full">
      <svg
        viewBox="0 0 240 80"
        className="w-full h-24 overflow-visible"
        role="img"
        aria-label="Recent band score trend"
      >
        <defs>
          <linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Dashed Grid Lines */}
        {[20, 42, 64].map((y) => (
          <line
            key={y}
            x1="12"
            x2="228"
            y1={y}
            y2={y}
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-800/80"
            strokeDasharray="4 4"
          />
        ))}

        {/* Area Gradient Fill */}
        {values.length > 1 && <polygon points={polygonPoints} fill="url(#sparklineGradient)" />}

        {/* Trend Line */}
        {values.length > 1 && (
          <polyline
            points={points}
            fill="none"
            stroke="#2563eb"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Glowing Data Dots */}
        {pointsArray.map((p, index) => (
          <g key={index}>
            <circle cx={p.x} cy={p.y} r="4" fill="#ffffff" stroke="#2563eb" strokeWidth="2.5" />
            {/* Highlight current / last score value */}
            {index === pointsArray.length - 1 && (
              <text
                x={p.x}
                y={p.y - 7}
                textAnchor="middle"
                className="text-[10px] font-black fill-blue-600 dark:fill-blue-400"
              >
                {p.value.toFixed(1)}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

function RecentPatterns({ analysis, loading, failed, currentBand }) {
  const scores = [
    ...[...analysis.history.scores].reverse(),
    { score: currentBand, date: 'current' },
  ];
  return (
    <section className={`${CARD} p-4 sm:p-5 space-y-3.5`}>
      <SectionHeading
        icon={History}
        eyebrow="Last five same-module tests"
        title="Recent patterns"
      />
      {loading ? (
        <div className="h-28 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-900" />
      ) : failed ? (
        <p className="rounded-xl bg-amber-50 p-3 text-xs font-medium text-amber-700 border border-amber-200/60 dark:bg-amber-950/30 dark:text-amber-300">
          History could not be loaded. Current-result analysis is unaffected.
        </p>
      ) : !analysis.history.scores.length ? (
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-blue-200 bg-blue-50/50 p-3.5 dark:border-blue-900/50 dark:bg-blue-950/20">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xs font-extrabold text-blue-600 shadow-2xs dark:bg-slate-900">
            {formatBand(currentBand)}
          </span>
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">Baseline recorded</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Your next same-module result will start the trend line.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-b from-slate-50/90 to-white p-3 dark:border-slate-800 dark:from-slate-900/60 dark:to-slate-950 shadow-2xs">
            <TrendSparkline scores={scores} />
            <div className="flex justify-between items-center px-2 pt-2 text-[11px] font-bold text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800/80 mt-1">
              <span>Start: {formatBand(scores[0].score)}</span>
              <span className="text-blue-600 dark:text-blue-400 font-extrabold">
                Current: Band {formatBand(currentBand)}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {analysis.typeLosses.slice(0, 5).map((entry) => (
              <span
                key={entry.type}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-extrabold ${TREND_STYLES[entry.trend.status]}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                {entry.label}: {entry.trend.label}
              </span>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function RecoveryPlan({ analysis, canSave, saving, savedPathId, onSave, onViewPlan }) {
  return (
    <section className={`${CARD} p-4 sm:p-5 space-y-4`}>
      <SectionHeading
        icon={CalendarCheck2}
        eyebrow="One focused action per day"
        title="Seven-day recovery plan"
        action={
          savedPathId ? (
            <Button
              variant="outline"
              onClick={onViewPlan}
              className="h-8 rounded-xl px-3 text-xs font-bold border-slate-200 dark:border-slate-800 shadow-2xs hover:bg-blue-50 dark:hover:bg-blue-950/50"
            >
              View plan <ArrowRight className="ml-1.5 h-3.5 w-3.5 text-blue-600" />
            </Button>
          ) : null
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {analysis.plan.map((item) => (
          <div
            key={item.day}
            className="p-3 rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white via-slate-50/60 to-blue-50/20 dark:border-slate-800 dark:from-slate-900/90 dark:to-slate-950 flex flex-col justify-between space-y-2.5 transition-all hover:border-blue-400/80 hover:shadow-xs group min-w-0"
          >
            <div className="flex items-center justify-between gap-1.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-[10px] font-black text-white shadow-2xs shrink-0">
                D{item.day}
              </span>
              <span className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-extrabold px-1.5 py-0.5 rounded-md text-[9px]">
                {item.minutes}m
              </span>
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-xs font-extrabold leading-tight text-slate-900 dark:text-white line-clamp-2">
                {item.title}
              </p>
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 truncate">
                {item.skill}
              </p>
            </div>
          </div>
        ))}
      </div>
      <Button
        onClick={onSave}
        disabled={!canSave || saving || Boolean(savedPathId)}
        className="h-11 w-full rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-xs font-black text-white shadow-md shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99] transition-all disabled:opacity-55"
      >
        {savedPathId ? (
          <>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Plan saved
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving plan…' : 'Use as my 7-day plan'}
          </>
        )}
      </Button>
      {!canSave && (
        <p className="text-center text-[10px] font-medium text-slate-400 dark:text-slate-500">
          Legacy results can use this plan on-screen but cannot save it.
        </p>
      )}
    </section>
  );
}

export function DetailedAnalysisTab({
  testResults,
  testData,
  userId,
  sessionId,
  targetBand,
  isPremium,
  onUpgrade,
  onReviewQuestion,
  testType = 'reading',
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const initialTarget =
    Number(targetBand) > Number(testResults.bandScore) ? Number(targetBand) : undefined;
  const [selectedTarget, setSelectedTarget] = React.useState(initialTarget);
  const [savedPathId, setSavedPathId] = React.useState(null);
  const viewedRef = React.useRef(false);

  const historyQuery = useQuery({
    queryKey: ['premium-analysis-history', userId, testType, sessionId || 'legacy'],
    queryFn: () => fetchRecentResultSessions({ userId, testType, sessionId }),
    enabled: Boolean(isPremium && userId),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const analysis = React.useMemo(
    () =>
      buildPremiumAnalysis({
        testResults,
        testData,
        recentSessions: historyQuery.data || [],
        testType,
        targetBand: selectedTarget,
      }),
    [testResults, testData, historyQuery.data, testType, selectedTarget]
  );

  React.useEffect(() => {
    if (!selectedTarget && analysis.target.targetBand)
      setSelectedTarget(analysis.target.targetBand);
  }, [analysis.target.targetBand, selectedTarget]);

  React.useEffect(() => {
    if (!isPremium || viewedRef.current) return;
    viewedRef.current = true;
    trackAppEvent('premium_analysis_viewed', {
      module: testType,
      history_available: analysis.dataAvailability.hasHistory,
      insight_category: 'score_recovery_coach',
    });
  }, [analysis.dataAvailability.hasHistory, isPremium, testType]);

  const saveMutation = useMutation({
    mutationFn: () =>
      saveResultFocusPlan({
        sessionId,
        testType,
        plan: analysis.plan,
        targetBand: analysis.target.targetBand,
      }),
    onSuccess: (result) => {
      setSavedPathId(result?.path_id || result?.pathId || true);
      queryClient.invalidateQueries({ queryKey: ['learningPath'] });
      trackAppEvent('premium_plan_saved', {
        module: testType,
        history_available: analysis.dataAvailability.hasHistory,
        insight_category: 'seven_day_plan',
      });
      toast.success('Your seven-day recovery plan is ready.');
    },
    onError: (error) => toast.error(error?.message || 'The plan could not be saved.'),
  });

  const handleUpgrade = () => {
    trackAppEvent('premium_analysis_upgrade_clicked', {
      module: testType,
      history_available: false,
      insight_category: 'free_teaser',
    });
    onUpgrade?.();
  };

  const handleReview = (item) => {
    trackAppEvent('premium_analysis_review_clicked', {
      module: testType,
      history_available: analysis.dataAvailability.hasHistory,
      insight_category: item.bucket,
    });
    onReviewQuestion?.(item.questionNumber);
  };

  if (!isPremium) {
    return <FreeTeaser analysis={analysis} testType={testType} onUpgrade={handleUpgrade} />;
  }

  return (
    <div className="p-3 sm:p-4 lg:p-5">
      <div className="mx-auto max-w-[1400px] space-y-3">
        <Blockers analysis={analysis} currentBand={testResults.bandScore} />
        <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
          <div className="min-w-0 space-y-3">
            <RecoveryMap analysis={analysis} />
            <MistakeQueue analysis={analysis} onReviewQuestion={handleReview} />
          </div>
          <div className="min-w-0 space-y-3">
            <TargetPlanner
              analysis={analysis}
              selectedTarget={selectedTarget || analysis.target.targetBand}
              onTargetChange={setSelectedTarget}
            />
            <SectionStrategy analysis={analysis} testType={testType} />
            <RecentPatterns
              analysis={analysis}
              loading={historyQuery.isLoading}
              failed={historyQuery.isError}
              currentBand={testResults.bandScore}
            />
          </div>
        </div>
        <RecoveryPlan
          analysis={analysis}
          canSave={Boolean(sessionId)}
          saving={saveMutation.isPending}
          savedPathId={savedPathId}
          onSave={() => saveMutation.mutate()}
          onViewPlan={() => navigate('/learning-path')}
        />
      </div>
      <div className="mx-auto mt-3 flex max-w-[1400px] items-center gap-2.5 rounded-xl border border-blue-200/80 bg-blue-50/70 px-4 py-3 text-xs font-semibold text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300 shadow-xs">
        <Lightbulb className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
        Possible near misses are review hints only. Your official score is never changed by this
        analysis.
      </div>
    </div>
  );
}
