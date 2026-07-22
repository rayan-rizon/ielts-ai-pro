import React, { Suspense, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  BookOpen,
  Clock3,
  ExternalLink,
  Headphones,
  Mic2,
  PenLine,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatBand } from '../utils';

const TestResultsModal = React.lazy(() => import('@/components/results/TestResultsModal'));

const MODULE_META = {
  reading: { label: 'Reading', icon: BookOpen, color: 'text-emerald-600', soft: 'bg-emerald-50' },
  writing: { label: 'Writing', icon: PenLine, color: 'text-blue-600', soft: 'bg-blue-50' },
  listening: { label: 'Listening', icon: Headphones, color: 'text-amber-600', soft: 'bg-amber-50' },
  speaking: { label: 'Speaking', icon: Mic2, color: 'text-fuchsia-600', soft: 'bg-fuchsia-50' },
};

function getFullReportPath(session) {
  if (!session) return null;
  switch (session.type) {
    case 'reading':
      return `/reading-test/${session.id}?view-results=true`;
    case 'listening':
      return `/listening-test/${session.id}?view-results=true`;
    case 'writing':
      return `/writing-task?sessionId=${session.id}&view=true`;
    case 'speaking':
      return `/speaking-test/${session.id}?view-score=true`;
    default:
      return null;
  }
}

function labelize(value) {
  return String(value || '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function collectCriteria(resultData) {
  const sources = [
    resultData?.criteriaScores,
    resultData?.finalEvaluation?.criteriaScores,
    resultData?.finalEvaluation?.scores,
    resultData?.task1CriteriaScores,
    resultData?.task2CriteriaScores,
  ];
  const seen = new Set();
  const rows = [];

  sources.forEach((source) => {
    if (!source || typeof source !== 'object' || Array.isArray(source)) return;
    Object.entries(source).forEach(([key, rawValue]) => {
      const value = Number(rawValue);
      const normalizedKey = key.toLowerCase().replace(/[^a-z]/g, '');
      if (!Number.isFinite(value) || value < 0 || value > 9 || seen.has(normalizedKey)) return;
      seen.add(normalizedKey);
      rows.push({ key, label: labelize(key), value });
    });
  });

  return rows.slice(0, 6);
}

function collectFeedback(resultData) {
  const writingFeedback = resultData?.ai_feedbacks || {};
  const firstWritingFeedback = writingFeedback['Task 1'] || writingFeedback['Task 2'] || {};
  const finalEvaluation = resultData?.finalEvaluation || {};
  const strengths = firstWritingFeedback.strengths || finalEvaluation.strengths || [];
  const improvements =
    firstWritingFeedback.weaknesses ||
    firstWritingFeedback.suggestions ||
    finalEvaluation.areasForImprovement ||
    finalEvaluation.suggestions ||
    [];

  return {
    strengths: Array.isArray(strengths) ? strengths.filter(Boolean).slice(0, 3) : [],
    improvements: Array.isArray(improvements) ? improvements.filter(Boolean).slice(0, 3) : [],
  };
}

function SummaryResultDialog({ session, onClose }) {
  const navigate = useNavigate();
  const meta = MODULE_META[session.type] || MODULE_META.reading;
  const Icon = meta.icon;
  const reportPath = getFullReportPath(session);
  const criteria = useMemo(() => collectCriteria(session.resultData), [session.resultData]);
  const feedback = useMemo(() => collectFeedback(session.resultData), [session.resultData]);

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-3xl grid-cols-[minmax(0,1fr)] gap-0 overflow-hidden rounded-[24px] border-slate-200 bg-white p-0 shadow-2xl dark:border-white/10 dark:bg-slate-950">
        <DialogHeader className="min-w-0 overflow-hidden border-b border-slate-100 px-5 py-5 pr-14 text-left dark:border-white/10 sm:px-7">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-2xl ${meta.soft} ${meta.color}`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="break-words text-xl font-extrabold leading-tight text-slate-950 dark:text-white sm:truncate">
                {session.title}
              </DialogTitle>
              <DialogDescription className="mt-1 font-medium">
                {meta.label} completed result
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="min-w-0 overflow-x-hidden overflow-y-auto px-5 py-5 sm:px-7">
          <div className="grid min-w-0 gap-4 sm:grid-cols-[1.15fr_1fr]">
            <div className="relative min-w-0 overflow-hidden rounded-[22px] bg-slate-950 p-6 text-white">
              <div className="absolute -right-8 -top-12 h-36 w-36 rounded-full bg-indigo-500/35 blur-3xl" />
              <Sparkles className="h-5 w-5 text-indigo-300" />
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-indigo-200">
                Overall band
              </p>
              <p className="mt-1 text-6xl font-black tracking-tight">
                {session.score == null ? '—' : formatBand(session.score)}
              </p>
              <p className="mt-3 text-sm font-medium text-slate-300">
                Saved score from this completed session
              </p>
            </div>

            <dl className="grid min-w-0 grid-cols-2 gap-3">
              {[
                ['Accuracy', session.accuracy == null ? '—' : `${session.accuracy}%`, BarChart3],
                [
                  'Time',
                  session.durationMinutes == null ? '—' : `${session.durationMinutes}m`,
                  Clock3,
                ],
              ].map(([label, value, MetricIcon]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-white/5 dark:bg-white/[0.03]"
                >
                  <MetricIcon className="h-4 w-4 text-indigo-500" />
                  <dt className="mt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    {label}
                  </dt>
                  <dd className="mt-1 text-2xl font-black text-slate-950 dark:text-white">
                    {value}
                  </dd>
                </div>
              ))}
              <div className="col-span-2 min-w-0 break-words rounded-2xl border border-slate-100 px-4 py-3 text-sm font-medium text-slate-500 dark:border-white/5 dark:text-slate-400">
                Detailed values appear only when they were saved with this test.
              </div>
            </dl>
          </div>

          {criteria.length ? (
            <section className="mt-5 rounded-[22px] border border-slate-100 p-5 dark:border-white/5">
              <h3 className="text-sm font-extrabold text-slate-950 dark:text-white">
                Scoring criteria
              </h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {criteria.map((criterion) => (
                  <div
                    key={criterion.key}
                    className="rounded-2xl bg-slate-50 p-3 dark:bg-white/[0.03]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        {criterion.label}
                      </span>
                      <span className="text-sm font-black text-indigo-600 dark:text-indigo-300">
                        {formatBand(criterion.value)}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{ width: `${Math.min(100, (criterion.value / 9) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {feedback.strengths.length || feedback.improvements.length ? (
            <section className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                ['Strengths', feedback.strengths, 'text-emerald-600'],
                ['Focus next', feedback.improvements, 'text-amber-600'],
              ].map(([title, items, color]) =>
                items.length ? (
                  <div
                    key={title}
                    className="rounded-[22px] border border-slate-100 p-5 dark:border-white/5"
                  >
                    <h3 className={`text-sm font-extrabold ${color}`}>{title}</h3>
                    <ul className="mt-3 space-y-2 text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                      {items.map((item, index) => (
                        <li key={`${title}-${index}`} className="flex gap-2">
                          <span aria-hidden="true">•</span>
                          <span>
                            {typeof item === 'string' ? item : item?.text || item?.feedback}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null
              )}
            </section>
          ) : null}
        </div>

        <DialogFooter className="min-w-0 border-t border-slate-100 px-5 py-4 dark:border-white/10 sm:px-7">
          <Button variant="outline" onClick={onClose} className="rounded-xl font-bold">
            Close
          </Button>
          {reportPath ? (
            <Button
              onClick={() => {
                onClose();
                navigate(reportPath);
              }}
              className="gap-2 rounded-xl bg-indigo-600 font-bold text-white hover:bg-indigo-700"
            >
              Open full report <ExternalLink className="h-4 w-4" />
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function PracticeResultDialog({ session, user, onClose }) {
  const navigate = useNavigate();
  if (!session) return null;

  const totalQuestions = Number(session.resultData?.totalQuestions);
  const correctAnswers = Number(session.resultData?.correctAnswers);
  const supportsDetailedModal =
    (session.type === 'reading' || session.type === 'listening') &&
    Number.isFinite(totalQuestions) &&
    totalQuestions > 0 &&
    Number.isFinite(correctAnswers);

  if (!supportsDetailedModal) {
    return <SummaryResultDialog session={session} onClose={onClose} />;
  }

  const fullReportPath = getFullReportPath(session);
  const testResults = {
    ...session.resultData,
    bandScore: session.score,
    durationMinutes: session.durationMinutes,
    unanswered:
      Number(session.resultData?.unanswered) ||
      Number(session.resultData?.errorPatterns?.unansweredCount) ||
      0,
  };

  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80">
          <div className="rounded-2xl bg-white px-5 py-4 text-sm font-bold text-slate-700 shadow-xl">
            Loading result…
          </div>
        </div>
      }
    >
      <TestResultsModal
        showResults
        testResults={testResults}
        sessionId={session.id}
        user={user}
        testType={session.type}
        celebrate={false}
        onClose={onClose}
        onReviewAnswers={() => {
          onClose();
          if (fullReportPath) navigate(fullReportPath);
        }}
      />
    </Suspense>
  );
}
