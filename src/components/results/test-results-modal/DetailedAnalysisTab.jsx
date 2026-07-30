import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CalendarCheck2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Headphones,
  History,
  Lightbulb,
  LockKeyhole,
  Save,
  TriangleAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackAppEvent } from '@/lib/tracking';
import { fetchRecentResultSessions, saveResultFocusPlan } from '@/services/premiumAnalysisService';
import { buildPremiumAnalysis } from './premiumAnalysis';

const CARD =
  'min-w-0 rounded-2xl border border-[#dce0f5] bg-gradient-to-br from-white via-[#fafbff] to-[#f4f3ff] shadow-[0_10px_30px_-15px_rgba(86,97,233,0.12)] dark:border-white/10 dark:from-[#101322] dark:via-[#0e111d] dark:to-[#141829]';

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
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#efedff] text-[#5661e9] dark:bg-indigo-500/20 dark:text-indigo-300 border border-[#d2d7f8]/80 dark:border-indigo-500/30">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-black tracking-tight text-slate-950 dark:text-white">
            {title}
          </h3>
          {eyebrow && (
            <p className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {eyebrow}
            </p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

function FreeTeaser({ analysis, testType, onUpgrade }) {
  const largestLoss = analysis.typeLosses[0];
  const lossPercent = largestLoss?.total
    ? Math.round((largestLoss.lost / largestLoss.total) * 100)
    : 0;
  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-5 lg:p-6">
      <section className={`${CARD} overflow-hidden`}>
        <div className="border-b border-[#dce0f5] bg-gradient-to-r from-[#fafbff] via-white to-[#f4f3ff] px-4 py-4 dark:border-white/10">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="mt-0.5 text-lg font-extrabold tracking-tight text-slate-950 dark:text-white">
                Understand your {testType} result
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Start with the two signals that matter most.
              </p>
            </div>
            <Button
              onClick={onUpgrade}
              className="h-9 rounded-xl bg-[#5661e9] px-4 text-xs font-bold text-white hover:bg-[#4853d6] transition-all shadow-xs"
            >
              Unlock premium coaching <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <div className="rounded-xl border border-rose-200/80 bg-rose-50/50 p-3.5 dark:border-rose-900/50 dark:bg-rose-950/20">
            <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
              Your biggest score loss
            </p>
            <p className="mt-1 text-base font-extrabold text-slate-900 dark:text-white">
              {largestLoss?.label || 'Not enough detail'}
            </p>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
              {largestLoss
                ? `${largestLoss.lost} of ${largestLoss.total} points lost`
                : 'Complete a scored question type to reveal this signal.'}
            </p>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-rose-100 dark:bg-rose-950">
              <div
                className="h-full rounded-full bg-rose-500"
                style={{ width: `${lossPercent}%` }}
                aria-label={`${lossPercent}% of points lost in ${largestLoss?.label || 'this area'}`}
              />
            </div>
          </div>
          <div className="rounded-xl border border-[#d2d7f8] bg-[#efedff]/50 p-3.5 dark:border-indigo-900/50 dark:bg-indigo-950/20">
            <p className="text-xs font-bold text-[#5661e9] dark:text-indigo-400">
              Answers needed for your next band
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
            Premium includes answer priorities, passage or part insights, score trends, and a saved
            seven-day plan.
          </p>
        </div>
      </section>
    </div>
  );
}

function RecoveryMap({ analysis, currentBand, selectedTarget, _onTargetChange }) {
  const totalLost = analysis.typeLosses.reduce((sum, entry) => sum + entry.lost, 0);
  const totalCorrect = analysis.typeLosses.reduce((sum, entry) => sum + entry.correct, 0);
  const totalQuestions = analysis.typeLosses.reduce((sum, entry) => sum + entry.total, 0);
  const totalSkipped = analysis.typeLosses.reduce((sum, entry) => sum + entry.skipped, 0);
  const totalIncorrect = analysis.typeLosses.reduce((sum, entry) => sum + entry.incorrect, 0);
  const correctPct = totalQuestions ? (totalCorrect / totalQuestions) * 100 : 0;
  const incorrectPct = totalQuestions ? (totalIncorrect / totalQuestions) * 100 : 0;
  const skippedPct = Math.max(0, 100 - correctPct - incorrectPct);
  const largestLoss = analysis.typeLosses[0];

  return (
    <section className={`${CARD} p-4 sm:p-5 space-y-4`}>
      <SectionHeading
        icon={BarChart3}
        eyebrow="Compare the size of each loss before choosing what to practise."
        title="Where you lost marks"
        action={
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2.5 rounded-lg border border-slate-200/80 bg-slate-50/80 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <i className="h-2 w-2 rounded-full bg-emerald-500" /> Correct
              </span>
              <span className="flex items-center gap-1.5">
                <i className="h-2 w-2 rounded-full bg-[#5661e9]" /> Incorrect
              </span>
              <span className="flex items-center gap-1.5">
                <i className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" /> Skipped
              </span>
            </div>
            <span className="text-sm font-black text-rose-600 dark:text-rose-400">
              {totalLost} lost
            </span>
          </div>
        }
      />

      <div className="grid items-start gap-3 lg:grid-cols-[210px_minmax(0,1fr)_220px]">
        <div className="rounded-2xl border border-[#d2d7f8] bg-[#efedff]/55 p-3 dark:border-indigo-900/50 dark:bg-indigo-950/25">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                Current band
              </p>
              <p className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                {formatBand(currentBand)}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-[#5661e9]" />
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                Target band
              </p>
              <p className="text-2xl font-black tracking-tight text-[#5661e9] dark:text-indigo-300">
                {formatBand(selectedTarget)}
              </p>
            </div>
          </div>
          <div className="mt-2 border-t border-[#d2d7f8] pt-2 dark:border-white/10">
            <p className="text-xl font-black text-[#5661e9] dark:text-indigo-300 leading-none">
              +{analysis.target.additionalCorrect}
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 leading-tight">
              more correct answer{analysis.target.additionalCorrect === 1 ? '' : 's'} needed
            </p>
          </div>
        </div>

        <div className="grid auto-rows-fr gap-2.5 sm:grid-cols-2">
          {analysis.typeLosses.length ? (
            analysis.typeLosses.map((entry) => (
              <div
                key={entry.type}
                className="rounded-xl border border-[#e2e5f6] bg-white/80 p-3 dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-200">
                      {entry.label}
                    </p>
                    <p className="text-[10px] font-medium text-slate-400">
                      {entry.correct}/{entry.total} correct
                    </p>
                  </div>
                  <p className="shrink-0 text-xs font-black text-rose-600 dark:text-rose-400">
                    {entry.lost} lost
                  </p>
                </div>
                <div
                  className="mt-2.5 flex h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
                  aria-label={`${entry.label}: ${entry.correct} correct, ${entry.incorrect} incorrect and ${entry.skipped} skipped`}
                >
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${entry.total ? (entry.correct / entry.total) * 100 : 0}%` }}
                  />
                  <div
                    className="h-full bg-[#5661e9]"
                    style={{ width: `${entry.total ? (entry.incorrect / entry.total) * 100 : 0}%` }}
                  />
                  <div
                    className="h-full bg-slate-300 dark:bg-slate-600"
                    style={{ width: `${entry.total ? (entry.skipped / entry.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="flex min-h-28 items-center justify-center rounded-xl border border-dashed border-emerald-200 bg-emerald-50/60 p-4 text-sm font-bold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-300 sm:col-span-2">
              No lost marks in this result.
            </div>
          )}
        </div>

        <div className="flex h-full flex-col justify-between rounded-2xl border border-[#e2e5f6] bg-white/80 p-3.5 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center gap-3">
            <div
              className="relative h-14 w-14 shrink-0 rounded-full"
              style={{
                background: `conic-gradient(#10b981 0 ${correctPct}%, #5661e9 ${correctPct}% ${correctPct + incorrectPct}%, #cbd5e1 ${correctPct + incorrectPct}% ${correctPct + incorrectPct + skippedPct}%)`,
              }}
              aria-label={`${totalCorrect} correct, ${totalIncorrect} incorrect and ${totalSkipped} skipped overall`}
            >
              <div className="absolute inset-[6px] flex items-center justify-center rounded-full bg-white dark:bg-slate-950">
                <span className="text-xs font-black text-slate-950 dark:text-white">
                  {totalCorrect}/{totalQuestions || 0}
                </span>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-slate-400">Answer mix</p>
              <p className="text-sm font-black text-slate-900 dark:text-white">
                {totalQuestions ? Math.round(correctPct) : 0}% correct
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {totalSkipped} skipped · {totalIncorrect} incorrect
              </p>
            </div>
          </div>
          {largestLoss && (
            <div className="mt-3 border-t border-[#e2e5f6] pt-2.5 dark:border-white/10">
              <p className="text-[10px] font-bold text-[#5661e9] dark:text-indigo-300">
                Best recovery opportunity
              </p>
              <div className="mt-0.5 flex items-end justify-between gap-2">
                <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-200">
                  {largestLoss.label}
                </p>
                <p className="shrink-0 text-xs font-black text-rose-600 dark:text-rose-400">
                  {largestLoss.lost} marks
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function MistakeQueue({ analysis, onReviewQuestion }) {
  return (
    <section className={`${CARD} p-3.5 sm:p-4 space-y-3`}>
      <SectionHeading
        icon={BookOpenCheck}
        eyebrow="Start with the answers most likely to improve your score."
        title="Review these answers first"
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
          <div className="rounded-xl border border-[#e2e5f6] bg-white/80 p-3 dark:border-white/10 dark:bg-white/5">
            <div
              className="flex h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
              aria-label={`${analysis.errorBuckets.nearMiss} near misses, ${analysis.errorBuckets.changedWrong} changed wrong, ${analysis.errorBuckets.skipped} skipped, and ${analysis.errorBuckets.otherWrong} other wrong answers`}
            >
              {[
                [analysis.errorBuckets.nearMiss, 'bg-[#5661e9]'],
                [analysis.errorBuckets.changedWrong, 'bg-violet-500'],
                [analysis.errorBuckets.skipped, 'bg-slate-400'],
                [analysis.errorBuckets.otherWrong, 'bg-rose-500'],
              ].map(([value, color], index) => (
                <span
                  key={index}
                  className={color}
                  style={{
                    width: `${analysis.errorBuckets.total ? (value / analysis.errorBuckets.total) * 100 : 0}%`,
                  }}
                />
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-4">
              {[
                [
                  'Near miss',
                  analysis.errorBuckets.nearMiss,
                  'text-[#5661e9] dark:text-indigo-400',
                  'bg-[#5661e9]',
                ],
                [
                  'Changed wrong',
                  analysis.errorBuckets.changedWrong,
                  'text-purple-600 dark:text-purple-400',
                  'bg-violet-500',
                ],
                [
                  'Skipped',
                  analysis.errorBuckets.skipped,
                  'text-slate-600 dark:text-slate-300',
                  'bg-slate-400',
                ],
                [
                  'Other wrong',
                  analysis.errorBuckets.otherWrong,
                  'text-rose-600 dark:text-rose-400',
                  'bg-rose-500',
                ],
              ].map(([label, value, color, dot]) => (
                <div key={label} className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${dot}`} />
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {label} <strong className={color}>{value}</strong>
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {analysis.mistakeQueue.map((item) => {
              const formattedType = item.type
                ?.replace(/_/g, ' ')
                .replace(/\b\w/g, (char) => char.toUpperCase());
              return (
                <div
                  key={`${item.questionId}-${item.questionNumber}`}
                  className="p-3 rounded-xl border border-[#e2e5f6] bg-white/90 dark:border-white/10 dark:bg-white/5 transition-all hover:border-[#5661e9]/60 shadow-2xs group flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#efedff] text-xs font-black text-[#5661e9] border border-[#d2d7f8] dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30 shadow-2xs shrink-0">
                      Q{item.questionNumber}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs sm:text-sm font-black text-slate-950 dark:text-white">
                        {item.reason}
                      </p>
                      <div className="flex items-center gap-2 mt-1 min-w-0">
                        <span className="inline-block rounded-md bg-[#efedff] text-[#5661e9] dark:bg-indigo-500/20 dark:text-indigo-300 border border-[#d2d7f8] dark:border-indigo-500/30 px-2 py-0.5 text-[10px] font-extrabold shrink-0">
                          {item.label}
                        </span>
                        <span className="truncate text-xs font-bold text-slate-500 dark:text-slate-400">
                          {formattedType}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => onReviewQuestion(item)}
                    className="h-8.5 px-3.5 rounded-xl bg-[#5661e9] hover:bg-[#4853d6] text-white font-extrabold text-xs shadow-2xs hover:shadow-xs hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1 shrink-0"
                  >
                    Review <ChevronRight className="h-3.5 w-3.5 stroke-[2.5]" />
                  </Button>
                </div>
              );
            })}
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
    <section className={`${CARD} h-full p-3.5 sm:p-4 space-y-3`}>
      <SectionHeading
        icon={isReading ? Clock3 : Headphones}
        eyebrow={
          isReading
            ? 'Compare accuracy and time across each passage.'
            : 'See which listening parts cost the most marks.'
        }
        title={isReading ? 'Passage performance' : 'Part performance'}
      />
      <div className="space-y-2.5">
        {analysis.sectionStrategy.length === 0 && (
          <p className="rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-500 dark:bg-slate-900">
            Section-level scoring was not stored for this result.
          </p>
        )}
        {analysis.sectionStrategy.map((section) => (
          <div
            key={section.index}
            className="p-3 rounded-xl border border-[#e2e5f6] bg-white/90 dark:border-white/10 dark:bg-white/5 shadow-2xs space-y-2 transition-all hover:border-[#5661e9]/60"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs sm:text-sm font-black text-slate-950 dark:text-white">
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
            <div className="h-1.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800">
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
              <div className="flex items-center justify-between border-t border-[#dce0f5]/80 dark:border-white/10 pt-2 text-xs">
                <span className="font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Clock3 className="w-3.5 h-3.5 text-slate-400" />
                  {formatTime(section.seconds)}
                </span>
                <span className="bg-[#efedff] text-[#5661e9] border border-[#d2d7f8] dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30 text-xs font-extrabold px-2.5 py-0.5 rounded-md">
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
    <section className={`${CARD} h-full p-4 sm:p-5 space-y-3.5`}>
      <SectionHeading
        icon={History}
        eyebrow="Your latest results in this test type."
        title="Your score trend"
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
        </>
      )}
    </section>
  );
}

function RecoveryPlan({ analysis, canSave, saving, savedPathId, onSave, onViewPlan }) {
  const [showAllDays, setShowAllDays] = React.useState(false);
  const visiblePlan = showAllDays ? analysis.plan : analysis.plan.slice(0, 3);

  return (
    <section className={`${CARD} p-4 space-y-3`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeading
          icon={CalendarCheck2}
          eyebrow="One focused practice action per day."
          title="Your 7-day practice plan"
        />
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {analysis.plan.length > 3 && (
            <button
              type="button"
              onClick={() => setShowAllDays((visible) => !visible)}
              className="flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-bold text-[#5661e9] hover:bg-[#efedff] dark:text-indigo-300 dark:hover:bg-white/5"
              aria-expanded={showAllDays}
            >
              {showAllDays ? 'Show first 3 days' : 'Show all 7 days'}
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${showAllDays ? 'rotate-180' : ''}`}
              />
            </button>
          )}
          {savedPathId ? (
            <Button
              variant="outline"
              onClick={onViewPlan}
              className="h-9 rounded-xl px-4 text-xs font-bold border-slate-200 dark:border-slate-800 shadow-2xs hover:bg-blue-50 dark:hover:bg-blue-950/50"
            >
              View saved plan <ArrowRight className="ml-1.5 h-3.5 w-3.5 text-blue-600" />
            </Button>
          ) : (
            <Button
              onClick={onSave}
              disabled={!canSave || saving}
              className="h-9 rounded-xl bg-[#5661e9] px-4 text-xs font-black text-white shadow-xs hover:bg-[#4853d6] active:scale-[0.98] disabled:opacity-55"
            >
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {saving ? 'Saving…' : 'Save plan'}
            </Button>
          )}
        </div>
      </div>
      <div
        className={`grid grid-cols-1 gap-2 sm:grid-cols-3 ${
          showAllDays ? 'lg:grid-cols-4 xl:grid-cols-7' : ''
        }`}
      >
        {visiblePlan.map((item) => (
          <div
            key={item.day}
            className="flex min-w-0 items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white/80 p-2.5 dark:border-slate-800 dark:bg-white/5"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#5661e9] text-[10px] font-black text-white">
              D{item.day}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-extrabold text-slate-900 dark:text-white">
                {item.title}
              </p>
              <p className="mt-0.5 truncate text-[10px] font-medium text-slate-400 dark:text-slate-500">
                {item.skill}
              </p>
            </div>
            <span className="shrink-0 text-[10px] font-black text-[#5661e9] dark:text-indigo-300">
              {item.minutes}m
            </span>
          </div>
        ))}
      </div>
      {!canSave && (
        <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 sm:text-right">
          This older result can show the plan, but it cannot be saved.
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
        <RecoveryMap
          analysis={analysis}
          currentBand={testResults.bandScore}
          selectedTarget={selectedTarget || analysis.target.targetBand}
          onTargetChange={setSelectedTarget}
        />
        <div className="grid items-start gap-3 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-7">
            <MistakeQueue analysis={analysis} onReviewQuestion={handleReview} />
          </div>
          <div className="min-w-0 space-y-3 lg:col-span-5">
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
        Near-miss labels are review hints. They never change your official score.
      </div>
    </div>
  );
}
