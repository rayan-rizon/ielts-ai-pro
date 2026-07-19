import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  ClipboardPaste,
  Info,
  LineChart,
  Link,
  Loader2,
  LockKeyhole,
  ImageUp,
  PenLine,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  Type,
  WandSparkles,
  Zap,
} from 'lucide-react';

import CookieConsent from '@/components/shared/CookieConsent';
import DocumentHead from '@/components/shared/DocumentHead';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useAuth } from '@/features/auth/context/AuthContext';
import Footer from '@/features/core/components/landing/Footer';
import PublicNavbar from '@/features/core/components/landing/PublicNavbar';
import { cn } from '@/lib/cn';
import { uploadFile } from '@/lib/supabase';
import { trackAppEvent } from '@/lib/tracking';
import { generateDetailedFeedback } from '@/utils/api';

const DRAFT_STORAGE_KEY = 'public-writing-checker-draft-v2';
const CHECKER_PATH = '/ielts-writing-checker';

const TASKS = {
  'Task 1': {
    label: 'Task 1',
    shortLabel: 'Task 1 report',
    minimum: 150,
    feedbackMinimum: 50,
    prompt:
      'Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
  },
  'Task 2': {
    label: 'Task 2',
    shortLabel: 'Task 2 essay',
    minimum: 250,
    feedbackMinimum: 100,
    prompt:
      'Some people think governments should spend more money on public transport, while others believe improving roads is more important. Discuss both views and give your own opinion.',
  },
};

const DEMO_ESSAYS = {
  'Task 2': `Investment in transport infrastructure is essential for modern cities, but people disagree about whether public transport or roads should receive priority. Although roads remain necessary for many journeys, I believe governments should direct more funding towards reliable public transport.

Those who support road investment argue that private vehicles offer flexibility. Roads connect homes, workplaces and rural communities that may not be served by trains or buses. They are also necessary for emergency services and the delivery of goods. If roads are badly maintained, congestion can increase and businesses may face higher transport costs. For these reasons, governments cannot ignore the quality and safety of road networks.

However, improving public transport can solve several problems at the same time. Frequent buses and trains allow more people to travel using less space, which can reduce traffic congestion in crowded cities. Public transport can also make employment and education more accessible to people who cannot afford a car. In addition, electric trains and buses can lower emissions when they replace large numbers of individual car journeys. A dependable network therefore benefits both the economy and the environment.

In my view, governments should maintain existing roads while giving new investment priority to public transport, especially in densely populated areas. This balanced approach preserves essential road access but encourages commuters to choose a more efficient alternative.

In conclusion, roads are indispensable for flexible and last-mile travel, yet high-quality public transport produces wider long-term benefits. Public money should therefore focus on expanding affordable and reliable transport networks while keeping essential roads safe.`,
  'Task 1': `The three pie charts compare the proportions of sodium, saturated fat and added sugar contained in four meals in the United States.

Overall, dinner accounts for the largest shares of sodium and saturated fat, whereas snacks contain by far the greatest proportion of added sugar. Breakfast makes the smallest or joint-smallest contribution to all three nutrients.

Regarding sodium, dinner represents 43% of the total, followed by lunch at 29%. Breakfast and snacks each account for 14%. A similar pattern can be seen for saturated fat. Dinner is again the largest source, at 37%, while lunch contributes 26%. Snacks make up 21%, leaving breakfast with the lowest figure of 16%.

The distribution of added sugar is noticeably different. Snacks are responsible for 42%, almost twice the proportion recorded for dinner, at 23%. Lunch and breakfast contribute comparatively modest shares of 19% and 16% respectively.

In summary, the evening meal is the main source of sodium and saturated fat in the typical diet shown, while snacking is the principal source of added sugar.`,
};

const FAQS = [
  {
    question: 'Is this an Academic IELTS writing checker?',
    answer:
      'Yes. This checker is designed only for Academic IELTS Writing Task 1 and Task 2. For Task 1, you add the original chart, graph, map or diagram when requesting analysis.',
  },
  {
    question: 'Is the IELTS writing checker free?',
    answer:
      'Yes. Your first three Academic IELTS writing feedback reports are free. A report is only used when you choose to analyse a response.',
  },
  {
    question: 'What feedback will I receive?',
    answer:
      'You receive an estimated overall band and criterion-level feedback for Task Achievement or Task Response, Coherence and Cohesion, Lexical Resource, and Grammatical Range and Accuracy, plus strengths and practical next steps.',
  },
  {
    question: 'How accurate is the estimated IELTS band score?',
    answer:
      'The report is an AI-assisted practice estimate based on the writing you submit and the task prompt. It is designed to support practice and is not an official IELTS result or a replacement for a qualified examiner.',
  },
  {
    question: 'Why is the original Task 2 question needed?',
    answer:
      'Task Response measures how completely and relevantly you answer the exact question. The checker asks for those instructions only when they are needed for an accurate personalised report.',
  },
  {
    question: 'Why is my Academic Task 1 image needed?',
    answer:
      'Task Achievement depends on accurately selecting, comparing and reporting the main features of the exact chart, graph, table, map or process. Your visual is requested only when you analyse Task 1.',
  },
];

const getSampleCriteria = (taskType) => [
  [
    taskType === 'Task 1' ? 'Task Achievement' : 'Task Response',
    '7.0',
    taskType === 'Task 1'
      ? 'Selects and reports main features with clear comparisons.'
      : 'Addresses the prompt with a clear position and key ideas.',
  ],
  ['Coherence & Cohesion', '6.5', 'Organises ideas logically with clear paragraphing.'],
  ['Lexical Resource', '7.0', 'Uses a range of vocabulary with flexibility.'],
  ['Grammatical Range & Accuracy', '6.5', 'Uses a mix of structures with clear communication.'],
];

const ANALYSIS_STAGES = [
  { id: 'preparing', label: 'Preparing your response' },
  { id: 'criteria', label: 'Checking IELTS criteria' },
  { id: 'feedback', label: 'Writing your feedback' },
];

const stripHtml = (value = '') =>
  value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const countWords = (value) => {
  const plain = stripHtml(value);
  return plain ? plain.split(/\s+/).filter(Boolean).length : 0;
};

const normalizeFeedback = (result) => {
  const raw = result?.data || result || {};
  const feedback = raw.feedback || raw;
  return {
    ...feedback,
    overallBand:
      Number.parseFloat(
        feedback.overallBand || feedback.overall_band || raw.overallBand || raw.overall_band || 0
      ) || null,
    criteriaScores:
      feedback.criteriaScores ||
      feedback.criteria_scores ||
      raw.criteriaScores ||
      raw.criteria_scores ||
      {},
    strengths: Array.isArray(feedback.strengths || raw.strengths)
      ? feedback.strengths || raw.strengths
      : [],
    weaknesses: Array.isArray(feedback.weaknesses || raw.weaknesses)
      ? feedback.weaknesses || raw.weaknesses
      : [],
    suggestions: Array.isArray(feedback.suggestions || raw.suggestions)
      ? feedback.suggestions || raw.suggestions
      : [],
    corrections: Array.isArray(feedback.corrections || raw.corrections)
      ? feedback.corrections || raw.corrections
      : [],
    vocabularyEnhancements: Array.isArray(
      feedback.vocabularyEnhancements || raw.vocabularyEnhancements
    )
      ? feedback.vocabularyEnhancements || raw.vocabularyEnhancements
      : [],
  };
};

const getCriteria = (feedback, taskType) => {
  const scores = feedback?.criteriaScores || {};
  return [
    {
      label: taskType === 'Task 1' ? 'Task Achievement' : 'Task Response',
      score:
        scores.TaskAchievement ??
        scores.TaskResponse ??
        scores.task_achievement ??
        scores.task_response,
    },
    {
      label: 'Coherence & Cohesion',
      score: scores.CoherenceAndCohesion ?? scores.coherence_and_cohesion,
    },
    { label: 'Lexical Resource', score: scores.LexicalResource ?? scores.lexical_resource },
    {
      label: 'Grammatical Range & Accuracy',
      score: scores.GrammaticalRangeAndAccuracy ?? scores.grammatical_range_and_accuracy,
    },
  ];
};

function DemoResultPanel({
  feedback,
  activeTask,
  isLoading,
  analysisStage,
  error,
  onSignUp,
  onRetry,
  isSignedIn,
  showSignupGate,
}) {
  const sampleCriteria = getSampleCriteria(activeTask);

  if (isLoading) {
    const currentStageIndex = Math.max(
      0,
      ANALYSIS_STAGES.findIndex((stage) => stage.id === analysisStage)
    );
    return (
      <div
        aria-live="polite"
        className="flex min-h-[620px] flex-col items-center justify-center rounded-[28px] border border-indigo-100 bg-white p-8 text-center shadow-[0_24px_80px_rgba(79,70,229,0.09)]"
      >
        <div className="relative grid h-24 w-24 place-items-center rounded-full bg-indigo-50 ring-8 ring-indigo-50/70">
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-600 border-r-violet-500 animate-spin" />
          <Sparkles className="h-8 w-8 text-indigo-600 animate-pulse" />
        </div>
        <span className="mt-8 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-black uppercase tracking-[.16em] text-indigo-600">
          Academic IELTS analysis
        </span>
        <h3 className="mt-4 text-2xl font-extrabold text-slate-950">Analysing your writing…</h3>
        <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600">
          We are checking your response against the four IELTS writing criteria and preparing a
          practical report.
        </p>
        <div className="mt-8 w-full max-w-sm">
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-500 transition-all duration-700"
              style={{ width: `${Math.min(94, 24 + currentStageIndex * 32)}%` }}
            />
          </div>
          <div className="mt-4 grid gap-2 text-left">
            {ANALYSIS_STAGES.map((stage, index) => (
              <div key={stage.id} className="flex items-center gap-3 text-xs font-bold">
                <span
                  className={cn(
                    'grid h-5 w-5 place-items-center rounded-full border transition-colors',
                    index <= currentStageIndex
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-slate-200 bg-white text-slate-300'
                  )}
                >
                  {index < currentStageIndex ? <Check className="h-3 w-3" /> : index + 1}
                </span>
                <span
                  className={
                    index === currentStageIndex
                      ? 'text-indigo-700'
                      : index < currentStageIndex
                        ? 'text-slate-500'
                        : 'text-slate-300'
                  }
                >
                  {stage.label}
                </span>
                {index === currentStageIndex && (
                  <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin text-indigo-500" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Helper to render the circular progress SVG
  const renderBandScoreDial = (score) => {
    const scoreVal = Number(score || 7.0);
    const radius = 38;
    const strokeWidth = 7;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (scoreVal / 9) * circumference;

    return (
      <div className="relative grid h-24 w-24 place-items-center shrink-0">
        <svg className="h-full w-full -rotate-90">
          <circle
            cx="48"
            cy="48"
            r={radius}
            className="stroke-indigo-50/50 fill-transparent"
            strokeWidth={strokeWidth}
          />
          <circle
            cx="48"
            cy="48"
            r={radius}
            className="stroke-indigo-600 fill-transparent transition-all duration-1000 ease-out"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-indigo-950 tracking-tighter">
            {scoreVal.toFixed(1)}
          </span>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Band
          </span>
        </div>
      </div>
    );
  };

  if (feedback) {
    const criteria = getCriteria(feedback, activeTask);
    const strengths = feedback.strengths.slice(0, 4);
    const weaknesses = feedback.weaknesses.slice(0, 4);
    const suggestions = feedback.suggestions.slice(0, 6);
    const corrections = feedback.corrections.slice(0, 5);
    const vocabulary = feedback.vocabularyEnhancements.slice(0, 4);

    // Map each criterion to its specific icon & colors
    const criterionDetails = {
      'Task Achievement': {
        icon: Target,
        bgColor: 'bg-rose-50',
        iconColor: 'text-rose-600',
        barColor: 'from-rose-500 to-pink-500',
      },
      'Task Response': {
        icon: Target,
        bgColor: 'bg-rose-50',
        iconColor: 'text-rose-600',
        barColor: 'from-rose-500 to-pink-500',
      },
      'Coherence & Cohesion': {
        icon: BarChart3,
        bgColor: 'bg-indigo-50',
        iconColor: 'text-indigo-600',
        barColor: 'from-indigo-500 to-violet-500',
      },
      'Lexical Resource': {
        icon: Sparkles,
        bgColor: 'bg-violet-50',
        iconColor: 'text-violet-600',
        barColor: 'from-violet-500 to-purple-500',
      },
      'Grammatical Range & Accuracy': {
        icon: ShieldCheck,
        bgColor: 'bg-emerald-50',
        iconColor: 'text-emerald-600',
        barColor: 'from-emerald-500 to-teal-500',
      },
    };

    return (
      <section
        aria-live="polite"
        className="h-full rounded-[28px] border border-indigo-100 bg-white p-5 shadow-[0_24px_80px_rgba(79,70,229,0.09)] sm:p-7"
      >
        <div className="flex flex-wrap items-center justify-between gap-5 border-b border-slate-100 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" /> Your report is ready
            </div>
            <p className="mt-3 text-sm font-bold text-slate-700">
              Your Academic IELTS result is ready to review.
            </p>
            <p className="mt-4 text-xs font-black uppercase tracking-[0.1em] text-slate-400">
              Estimated practice band
            </p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-5xl font-black tracking-tight text-indigo-600">
                {(feedback.overallBand || 7.0).toFixed(1)}
              </span>
              <span className="text-sm font-bold text-slate-400">out of 9</span>
            </div>
          </div>
          {renderBandScoreDial(feedback.overallBand)}
        </div>

        <div className="py-6">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-950">Detailed scoring</h3>
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-extrabold text-slate-500">
              Academic {activeTask}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {criteria.map((criterion) => {
              const details = criterionDetails[criterion.label] || {
                icon: Target,
                bgColor: 'bg-indigo-50',
                iconColor: 'text-indigo-600',
                barColor: 'from-indigo-500 to-violet-500',
              };
              const Icon = details.icon;
              const score = criterion.score == null ? 0 : Number(criterion.score);
              return (
                <div
                  key={criterion.label}
                  className="flex flex-col justify-between h-full rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.015)] transition-all duration-300 hover:shadow-md hover:border-slate-200/60"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'grid h-9 w-9 place-items-center rounded-xl',
                          details.bgColor,
                          details.iconColor
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-extrabold text-[#0d1740]">
                        {criterion.label}
                      </span>
                    </div>
                    <span className="text-lg font-black text-indigo-600">
                      {criterion.score == null ? '—' : score.toFixed(1)}
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full bg-gradient-to-r transition-all duration-1000',
                          details.barColor
                        )}
                        style={{ width: `${(score / 9) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-emerald-100 bg-gradient-to-b from-emerald-50/20 to-white p-5">
            <h3 className="text-sm font-extrabold text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> What is working
            </h3>
            <div className="mt-4 space-y-3.5">
              {strengths.map((item, index) => (
                <div key={`${index}-${item}`} className="flex gap-2.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                  <p className="text-xs leading-5 text-slate-700">{stripHtml(String(item))}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-gradient-to-b from-amber-50/20 to-white p-5">
            <h3 className="text-sm font-extrabold text-amber-950 flex items-center gap-2">
              <Target className="h-4 w-4 text-amber-600" /> What limits the band
            </h3>
            <div className="mt-4 space-y-3.5">
              {weaknesses.map((item, index) => (
                <div key={`${index}-${item}`} className="flex gap-2.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                  <p className="text-xs leading-5 text-slate-700">{stripHtml(String(item))}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-6">
          <h3 className="text-base font-extrabold text-slate-950">
            Priority actions for the next draft
          </h3>
          <div className="mt-4 space-y-3">
            {suggestions.length ? (
              suggestions.map((item, index) => (
                <div
                  key={`${index}-${item}`}
                  className="flex gap-4 rounded-2xl border border-indigo-50 bg-indigo-50/30 p-4 transition-all hover:bg-indigo-50/50"
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-indigo-600 text-[11px] font-black text-white shadow-sm shadow-indigo-200">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-slate-700">{stripHtml(String(item))}</p>
                </div>
              ))
            ) : (
              <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                Use the criterion scores above to prioritise your next revision.
              </p>
            )}
          </div>
        </div>

        {corrections.length > 0 && (
          <div className="mt-6 border-t border-slate-100 pt-6">
            <h3 className="text-base font-extrabold text-slate-950">Language corrections</h3>
            <div className="mt-4 space-y-3">
              {corrections.map((item, index) => (
                <div
                  key={`${index}-${item.original}`}
                  className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 line-through">
                      {stripHtml(item.original)}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                    <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-extrabold text-emerald-800">
                      {stripHtml(item.correction)}
                    </span>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-slate-600">
                    {stripHtml(item.explanation)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {vocabulary.length > 0 && (
          <div className="mt-6 border-t border-slate-100 pt-6">
            <h3 className="text-base font-extrabold text-slate-950">Vocabulary in context</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {vocabulary.map((item, index) => (
                <div
                  key={`${index}-${item.original}`}
                  className="rounded-2xl border border-violet-100/60 bg-gradient-to-br from-violet-50/10 to-white p-5 transition hover:-translate-y-0.5 hover:shadow-sm"
                >
                  <p className="text-xs font-extrabold text-slate-800 flex flex-wrap items-center gap-2">
                    <span className="text-slate-400 font-semibold">{stripHtml(item.original)}</span>
                    <ArrowRight className="h-3 w-3 text-slate-300" />
                    <span className="text-violet-700">
                      {(item.alternatives || []).map(stripHtml).join(' / ')}
                    </span>
                  </p>
                  <p className="mt-3 text-xs leading-5 text-slate-600 italic">
                    "{stripHtml(item.context)}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
          This is an AI-assisted practice estimate, not an official IELTS result.
        </p>
      </section>
    );
  }

  const showOverlay = showSignupGate || (isSignedIn && Boolean(error));

  return (
    <section
      aria-label="Academic IELTS demo feedback report"
      className="relative h-full min-h-[620px] overflow-hidden rounded-[28px] border border-indigo-100 bg-white p-5 shadow-[0_24px_80px_rgba(79,70,229,0.09)] sm:p-7"
    >
      <div className={cn('transition duration-300', showSignupGate && 'select-none blur-[5px]')}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-indigo-600">
              Demo report · {activeTask}
            </span>
            <p className="mt-5 text-sm font-bold text-slate-500">Estimated practice band</p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-5xl font-black text-indigo-600">7.0</span>
              <span className="text-sm font-bold text-slate-400">out of 9</span>
            </div>
          </div>
          {renderBandScoreDial(7.0)}
        </div>

        <div className="py-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-950">What your report reveals</h3>
            <span className="rounded-lg bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-600">
              IELTS criteria demo
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {sampleCriteria.map(([label, score, text]) => {
              // Custom map for sample criteria
              const criterionDetails = {
                'Task Achievement': {
                  icon: Target,
                  bgColor: 'bg-rose-50',
                  iconColor: 'text-rose-600',
                  barColor: 'from-rose-500 to-pink-500',
                },
                'Task Response': {
                  icon: Target,
                  bgColor: 'bg-rose-50',
                  iconColor: 'text-rose-600',
                  barColor: 'from-rose-500 to-pink-500',
                },
                'Coherence & Cohesion': {
                  icon: BarChart3,
                  bgColor: 'bg-indigo-50',
                  iconColor: 'text-indigo-600',
                  barColor: 'from-indigo-500 to-violet-500',
                },
                'Lexical Resource': {
                  icon: Sparkles,
                  bgColor: 'bg-violet-50',
                  iconColor: 'text-violet-600',
                  barColor: 'from-violet-500 to-purple-500',
                },
                'Grammatical Range & Accuracy': {
                  icon: ShieldCheck,
                  bgColor: 'bg-emerald-50',
                  iconColor: 'text-emerald-600',
                  barColor: 'from-emerald-500 to-teal-500',
                },
              };
              const details = criterionDetails[label] || {
                icon: Target,
                bgColor: 'bg-indigo-50',
                iconColor: 'text-indigo-600',
                barColor: 'from-indigo-500 to-violet-500',
              };
              const Icon = details.icon;
              const scoreVal = Number(score);
              return (
                <div
                  key={label}
                  className="flex flex-col justify-between h-full rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.015)] transition-all duration-300 hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'grid h-9 w-9 place-items-center rounded-xl',
                            details.bgColor,
                            details.iconColor
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-extrabold text-[#0d1740]">{label}</span>
                      </div>
                      <span className="text-lg font-black text-indigo-600">{score}</span>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-slate-500">{text}</p>
                  </div>
                  <div className="mt-4">
                    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full bg-gradient-to-r transition-all duration-1000',
                          details.barColor
                        )}
                        style={{ width: `${(scoreVal / 9) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <h3 className="text-base font-extrabold text-slate-950">
            Example improvement priorities
          </h3>
          <div className="mt-4 space-y-3">
            {[
              'Develop the less-supported view with one specific example.',
              'Use referencing words to reduce repetition across paragraphs.',
              'Check article use and punctuation in longer complex sentences.',
            ].map((item, index) => (
              <div
                key={item}
                className="flex gap-4 rounded-2xl border border-indigo-50 bg-indigo-50/30 p-4 transition-all"
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-indigo-600 text-[11px] font-black text-white shadow-sm shadow-indigo-200">
                  {index + 1}
                </span>
                <p className="text-sm leading-6 text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showOverlay && (
        <div className="absolute inset-5 flex flex-col items-center justify-center rounded-[24px] border border-indigo-100 bg-white/95 p-6 text-center shadow-2xl shadow-indigo-100/30 backdrop-blur-md">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-indigo-50 text-indigo-600 ring-8 ring-indigo-50/50 animate-pulse">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <h3 className="mt-6 text-xl font-extrabold text-slate-950">
            {error
              ? 'Your report was not generated'
              : isSignedIn
                ? 'Your report will appear here'
                : 'Sign up to reveal your real report'}
          </h3>
          <p
            className={cn(
              'mx-auto mt-2.5 max-w-sm text-xs leading-5',
              error ? 'text-rose-600' : 'text-slate-500'
            )}
          >
            {error ||
              (isSignedIn
                ? 'Add your response, then request feedback to replace this blurred example with your real report.'
                : 'Create your free account to continue. Your first 3 writing feedback reports are included.')}
          </p>
          <button
            type="button"
            onClick={isSignedIn ? onRetry : onSignUp}
            className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 text-sm font-extrabold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            {isSignedIn ? (error ? 'Try again' : 'Check my writing') : 'Create free account'}{' '}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  );
}

function CheckerWorkspace({ user, authLoading }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTask, setActiveTask] = useState('Task 1');
  const [drafts, setDrafts] = useState(() => ({
    'Task 1': { prompt: TASKS['Task 1'].prompt, essay: '' },
    'Task 2': { prompt: '', essay: '' },
  }));
  const [feedback, setFeedback] = useState(null);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState('preparing');
  const [error, setError] = useState('');
  const [showSignupGate, setShowSignupGate] = useState(false);
  const [showPromptField, setShowPromptField] = useState(false);
  const [showTaskImageField, setShowTaskImageField] = useState(false);
  const [taskImageFile, setTaskImageFile] = useState(null);
  const autoSubmitRef = useRef(false);
  const restoredSubmissionRef = useRef(null);

  const task = TASKS[activeTask];
  const currentDraft = drafts[activeTask];
  const wordCount = countWords(currentDraft.essay);

  const updateDraft = (field, value) => {
    setDrafts((current) => ({
      ...current,
      [activeTask]: { ...current[activeTask], [field]: value },
    }));
    setFeedback(null);
    setError('');
    setShowSignupGate(false);
  };

  const persistDraft = useCallback(
    (pendingAnalysis) => {
      const payload = {
        activeTask,
        drafts,
        pendingAnalysis,
        savedAt: Date.now(),
      };
      window.sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
      return payload;
    },
    [activeTask, drafts]
  );

  const requestSignup = useCallback(() => {
    persistDraft(true);
    window.sessionStorage.setItem('auth_destination', CHECKER_PATH);
    trackAppEvent('writing_checker_signup_gate_viewed', {
      task_type: activeTask,
      word_count: wordCount,
    });
    navigate('/signup', { state: { from: location } });
  }, [activeTask, location, navigate, persistDraft, wordCount]);

  const analyse = useCallback(
    async (submission = null) => {
      const selectedTask = submission?.activeTask || activeTask;
      const selectedDrafts = submission?.drafts || drafts;
      const selectedDraft = selectedDrafts[selectedTask];
      const selectedConfig = TASKS[selectedTask];
      const selectedWordCount = countWords(selectedDraft.essay);

      setActiveTask(selectedTask);
      setDrafts(selectedDrafts);
      setFeedback(null);
      setError('');

      if (!selectedDraft.prompt.trim()) {
        setShowPromptField(true);
        setError(
          'Paste the original Task 2 instructions so Task Response can be scored accurately.'
        );
        return;
      }
      if (selectedTask === 'Task 1' && !taskImageFile) {
        setShowTaskImageField(true);
        setError(
          'Add the original Task 1 chart, graph, table, map or diagram so Task Achievement can be scored accurately.'
        );
        return;
      }
      if (selectedWordCount < selectedConfig.feedbackMinimum) {
        setError(
          `Write at least ${selectedConfig.feedbackMinimum} words so the checker has enough evidence to assess your response.`
        );
        return;
      }
      if (!user) {
        return;
      }

      setIsAnalysing(true);
      setAnalysisStage('preparing');
      const stageTimer = window.setInterval(() => {
        setAnalysisStage((currentStage) => {
          const currentIndex = ANALYSIS_STAGES.findIndex((stage) => stage.id === currentStage);
          return ANALYSIS_STAGES[Math.min(ANALYSIS_STAGES.length - 1, currentIndex + 1)].id;
        });
      }, 900);
      try {
        const analysisRequest = (async () => {
          let imageUrl = null;
          if (selectedTask === 'Task 1') {
            const uploaded = await uploadFile(taskImageFile);
            imageUrl = uploaded.file_url;
          }
          window.sessionStorage.setItem(
            DRAFT_STORAGE_KEY,
            JSON.stringify({
              activeTask: selectedTask,
              drafts: selectedDrafts,
              pendingAnalysis: false,
              savedAt: Date.now(),
            })
          );
          return generateDetailedFeedback({
            writingText: stripHtml(selectedDraft.essay),
            taskPrompt: stripHtml(selectedDraft.prompt),
            taskType: selectedTask,
            imageUrl,
          });
        })();
        const minimumDisplayTime = new Promise((resolve) => window.setTimeout(resolve, 2400));
        const [result] = await Promise.all([analysisRequest, minimumDisplayTime]);
        setAnalysisStage('feedback');
        const normalized = normalizeFeedback(result);
        if (!normalized.overallBand)
          throw new Error('The report did not contain a valid band score.');
        setFeedback(normalized);
        trackAppEvent('writing_checker_feedback_revealed', {
          task_type: selectedTask,
          word_count: selectedWordCount,
        });
        window.setTimeout(() => {
          document
            .querySelector('#checker-results')
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 80);
      } catch (analysisError) {
        const quotaExceeded =
          analysisError?.name === 'RateLimitError' && analysisError?.rateLimitType === 'quota';
        setError(
          quotaExceeded
            ? 'You have used the writing feedback available on your current plan. Your draft is still saved.'
            : analysisError?.userMessage ||
                analysisError?.message ||
                'We could not generate your report. Please try again.'
        );
      } finally {
        window.clearInterval(stageTimer);
        setIsAnalysing(false);
      }
    },
    [activeTask, drafts, taskImageFile, user]
  );

  useEffect(() => {
    try {
      const saved = JSON.parse(window.sessionStorage.getItem(DRAFT_STORAGE_KEY) || 'null');
      if (!saved?.drafts || !TASKS[saved.activeTask]) return;
      restoredSubmissionRef.current = saved;
      setActiveTask(saved.activeTask);
      setDrafts(saved.drafts);
    } catch {
      window.sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    const saved = restoredSubmissionRef.current;
    if (!saved?.pendingAnalysis || !user || authLoading || autoSubmitRef.current) return;
    autoSubmitRef.current = true;
    analyse(saved);
  }, [analyse, authLoading, user]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (wordCount < task.feedbackMinimum) {
      setError(`Write at least ${task.feedbackMinimum} words to request useful feedback.`);
      return;
    }
    if (!user) {
      persistDraft(false);
      setShowSignupGate(true);
      trackAppEvent('writing_checker_feedback_preview_requested', {
        task_type: activeTask,
        word_count: wordCount,
      });
      window.setTimeout(() => {
        document
          .querySelector('#checker-results')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
      return;
    }
    if (!currentDraft.prompt.trim()) {
      setShowPromptField(true);
      setError('Paste the original Task 2 instructions so Task Response can be scored accurately.');
      return;
    }
    if (activeTask === 'Task 1' && !taskImageFile) {
      setShowTaskImageField(true);
      setError(
        'Add the original Task 1 chart, graph, table, map or diagram so Task Achievement can be scored accurately.'
      );
      return;
    }
    analyse();
  };

  const loadDemo = () => {
    setDrafts((current) => ({
      ...current,
      [activeTask]: {
        ...current[activeTask],
        essay: DEMO_ESSAYS[activeTask],
        prompt: TASKS[activeTask].prompt,
      },
    }));
    setFeedback(null);
    setError('');
    setShowSignupGate(false);
    trackAppEvent('writing_checker_demo_loaded', { task_type: activeTask });
  };

  const clearEssay = () => {
    updateDraft('essay', '');
    window.sessionStorage.removeItem(DRAFT_STORAGE_KEY);
  };

  return (
    <section id="checker" className="relative scroll-mt-24 pb-8 pt-3 sm:pb-12">
      <div className="grid gap-5 lg:grid-cols-[1.02fr_.98fr]">
        <form
          onSubmit={handleSubmit}
          className="h-full rounded-[28px] border border-indigo-100 bg-white p-5 shadow-[0_24px_80px_rgba(79,70,229,0.09)] sm:p-7"
        >
          <div
            className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5"
            role="tablist"
            aria-label="Academic IELTS writing task"
          >
            {Object.keys(TASKS).map((taskType) => (
              <button
                key={taskType}
                type="button"
                role="tab"
                aria-selected={activeTask === taskType}
                onClick={() => {
                  setActiveTask(taskType);
                  setFeedback(null);
                  setError('');
                  setShowSignupGate(false);
                  setShowPromptField(false);
                  setShowTaskImageField(false);
                }}
                className={cn(
                  'flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-extrabold transition focus:outline-none focus:ring-2 focus:ring-indigo-500',
                  activeTask === taskType
                    ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-indigo-200'
                    : 'text-slate-500 hover:text-slate-900'
                )}
              >
                {taskType === 'Task 2' ? (
                  <PenLine className="h-4 w-4" />
                ) : (
                  <LineChart className="h-4 w-4" />
                )}
                {TASKS[taskType].label}
              </button>
            ))}
          </div>

          {activeTask === 'Task 1' && showTaskImageField && (
            <div className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-indigo-600 shadow-sm">
                  <ImageUp className="h-5 w-5" />
                </div>
                <div>
                  <label htmlFor="task-image" className="text-sm font-extrabold text-slate-900">
                    Add your original Task 1 visual
                  </label>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Upload the chart, graph, table, map or process image needed for accurate Task
                    Achievement feedback.
                  </p>
                </div>
              </div>
              <input
                id="task-image"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
                    setError('Use a PNG, JPG or WebP image for the Task 1 visual.');
                    event.target.value = '';
                    return;
                  }
                  if (file.size > 8 * 1024 * 1024) {
                    setError('The Task 1 image must be smaller than 8 MB.');
                    event.target.value = '';
                    return;
                  }
                  setTaskImageFile(file);
                  setError('');
                }}
                className="mt-4 block w-full rounded-xl border border-indigo-200 bg-white p-2 text-xs font-semibold text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-xs file:font-extrabold file:text-white hover:file:bg-indigo-700"
              />
              {taskImageFile && (
                <p className="mt-2 flex items-center gap-2 text-xs font-bold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" /> {taskImageFile.name}
                </p>
              )}
            </div>
          )}

          {activeTask === 'Task 2' && showPromptField && (
            <div className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4">
              <label htmlFor="task-prompt" className="text-sm font-extrabold text-slate-900">
                Original Task 2 instructions
              </label>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Needed after analysis is requested so Task Response is measured against the exact
                question.
              </p>
              <textarea
                id="task-prompt"
                value={currentDraft.prompt}
                onChange={(event) => updateDraft('prompt', event.target.value)}
                rows={3}
                maxLength={1500}
                placeholder="Paste the original Academic IELTS Task 2 question here…"
                className="mt-3 w-full resize-y rounded-xl border border-indigo-200 bg-white px-4 py-3 text-sm font-medium leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              />
            </div>
          )}

          <div className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label htmlFor="writing-response" className="text-sm font-extrabold text-slate-900">
                Your response
              </label>
              <div className="flex items-center gap-3 text-xs font-bold">
                <span className={wordCount >= task.minimum ? 'text-emerald-600' : 'text-slate-500'}>
                  {wordCount} / {task.minimum}+ words
                </span>
                <button
                  type="button"
                  onClick={loadDemo}
                  className="text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  Load demo
                </button>
              </div>
            </div>
            <textarea
              id="writing-response"
              value={currentDraft.essay}
              onChange={(event) => updateDraft('essay', event.target.value)}
              rows={17}
              maxLength={activeTask === 'Task 1' ? 1500 : 2500}
              placeholder={`Paste or write your Academic IELTS ${activeTask} response here…`}
              className="mt-3 min-h-[330px] w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold leading-6 text-rose-700"
            >
              {error}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={clearEssay}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <RotateCcw className="h-4 w-4" /> Clear
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    if (text) updateDraft('essay', text);
                  } catch {
                    setError(
                      'Your browser blocked clipboard access. Paste the essay into the text box instead.'
                    );
                  }
                }}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <ClipboardPaste className="h-4 w-4" /> Paste
              </button>
            </div>
            <button
              type="submit"
              disabled={isAnalysing || authLoading}
              className="inline-flex h-12 min-w-52 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 text-sm font-extrabold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isAnalysing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Analysing…
                </>
              ) : (
                <>
                  Analyze my writing — Free <WandSparkles className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          <div className="mt-5 flex items-start gap-2.5 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
            <span>
              Your response is only sent when you request analysis. Your first 3 Academic IELTS
              writing feedback reports are free.
            </span>
          </div>
        </form>

        <div id="checker-results" className="scroll-mt-24 h-full">
          <DemoResultPanel
            feedback={feedback}
            activeTask={activeTask}
            isLoading={isAnalysing}
            analysisStage={analysisStage}
            error={error}
            onSignUp={requestSignup}
            onRetry={() => analyse()}
            isSignedIn={Boolean(user)}
            showSignupGate={showSignupGate}
          />
        </div>
      </div>
    </section>
  );
}

export default function IeltsWritingChecker() {
  const { user, loading: authLoading } = useAuth();
  const structuredData = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          name: 'Academic IELTS Writing Checker',
          url: 'https://www.ieltsai.pro/ielts-writing-checker',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Web',
          description:
            'Free Academic IELTS Writing Task 1 and Task 2 checker with estimated band scores and criterion-level AI-assisted practice feedback.',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
            description: 'Three free writing feedback reports for new accounts.',
          },
        },
        {
          '@type': 'HowTo',
          name: 'How to check your Academic IELTS writing',
          step: [
            {
              '@type': 'HowToStep',
              name: 'Choose Task 1 or Task 2',
              text: 'Select the Academic IELTS writing task you want to practise.',
            },
            {
              '@type': 'HowToStep',
              name: 'Add your response',
              text: 'Paste or write your response and check the word count.',
            },
            {
              '@type': 'HowToStep',
              name: 'Analyse the response',
              text: 'Request a personalised report when the response is ready.',
            },
            {
              '@type': 'HowToStep',
              name: 'Review and improve',
              text: 'Use the estimated band, four criterion scores, and suggestions to plan your next response.',
            },
          ],
        },
        {
          '@type': 'FAQPage',
          mainEntity: FAQS.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: { '@type': 'Answer', text: item.answer },
          })),
        },
      ],
    }),
    []
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fbfcff] text-slate-950">
      <DocumentHead
        title="Free IELTS Writing Checker: Academic Task 1 & 2"
        description="Check Academic IELTS Writing Task 1 reports and Task 2 essays. Get an estimated band score, four IELTS criterion scores and detailed AI feedback."
        canonicalUrl="https://www.ieltsai.pro/ielts-writing-checker"
        keywords="IELTS writing checker, free IELTS writing checker, Academic IELTS Writing Task 1 checker, IELTS Task 2 essay checker, AI IELTS writing feedback, IELTS band score checker"
        structuredData={structuredData}
      />
      <PublicNavbar />

      <main>
        <section className="relative overflow-hidden pb-4 pt-20 sm:pt-24">
          <div className="pointer-events-none absolute -left-40 top-28 h-96 w-96 rounded-full bg-indigo-200/35 blur-3xl" />
          <div className="pointer-events-none absolute -right-40 top-10 h-[34rem] w-[34rem] rounded-full bg-violet-200/40 blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="grid items-center gap-10 lg:grid-cols-[.92fr_1.08fr]">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-[.14em] text-indigo-700 shadow-sm">
                  <Sparkles className="h-3.5 w-3.5" /> Free Academic IELTS Writing Checker
                </div>
                <h1 className="mt-6 text-[2.25rem] font-black leading-[1.08] tracking-[-.04em] text-[#0d1740] sm:text-[3rem] lg:text-[3.50rem]">
                  <span className="block">IELTS Free</span>
                  <span className="block text-indigo-600">Writing Checker</span>
                </h1>
                <p className="font-handwritten mt-4 text-3xl leading-tight text-violet-600 sm:text-4xl">
                  Write Better. Score Higher.
                </p>
                <p className="mt-5 max-w-xl text-base font-medium leading-8 text-slate-600 sm:text-lg">
                  Paste your Academic IELTS Task 1 report or Task 2 essay, then get an estimated
                  band score and detailed feedback across all four writing criteria.
                </p>
                <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold text-slate-700">
                  {['3 free feedback reports', 'Task 1 & Task 2', '4-criterion feedback'].map(
                    (item) => (
                      <span key={item} className="flex items-center gap-2">
                        <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                          <Check className="h-3 w-3" />
                        </span>
                        {item}
                      </span>
                    )
                  )}
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href="#checker"
                    className="inline-flex h-12 items-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-extrabold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    Check my writing <ArrowRight className="h-4 w-4" />
                  </a>
                  <a
                    href="#what-you-receive"
                    className="inline-flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 text-sm font-extrabold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    See sample feedback
                  </a>
                </div>
              </div>

              <div className="relative mx-auto w-full max-w-2xl">
                <div className="absolute -left-3 top-16 z-10 w-36 rotate-[-3deg] rounded-2xl border border-indigo-100 bg-white p-4 shadow-xl sm:-left-8 sm:w-40">
                  <span className="text-3xl font-black text-indigo-600">7.0</span>
                  <p className="mt-1 text-xs font-extrabold text-emerald-600">Example band</p>
                  <p className="mt-2 text-[10px] leading-4 text-slate-500">
                    Your personalised report appears after analysis.
                  </p>
                </div>
                <div className="absolute -right-2 top-24 z-10 hidden rotate-[5deg] rounded-xl bg-violet-200 p-4 text-center text-xs font-bold leading-5 text-violet-950 shadow-lg sm:block">
                  Task response
                  <br />
                  Coherence
                  <br />
                  Vocabulary
                  <br />
                  Grammar
                </div>
                <div className="overflow-hidden rounded-[38px] bg-gradient-to-br from-indigo-50 via-violet-50 to-white p-3 shadow-[0_35px_90px_rgba(79,70,229,.16)] ring-1 ring-indigo-100">
                  <img
                    src="/ielts-hero-student.webp"
                    alt="Student practising Academic IELTS writing with a laptop and notebook"
                    className="aspect-[4/3] w-full rounded-[30px] object-cover"
                    width="1200"
                    height="900"
                  />
                </div>
                <div className="absolute -bottom-4 left-1/2 flex w-[88%] -translate-x-1/2 items-center justify-between rounded-2xl border border-white/80 bg-white/95 px-5 py-4 shadow-xl backdrop-blur">
                  <div>
                    <p className="text-xs font-bold text-slate-500">Your report includes</p>
                    <p className="mt-1 text-sm font-black text-slate-900">
                      4 criterion scores + next steps
                    </p>
                  </div>
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-indigo-50 text-indigo-600">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <CheckerWorkspace user={user} authLoading={authLoading} />
            </div>
          </div>
        </section>

        <section className="border-y border-slate-100/80 bg-slate-50/30 py-6 sm:py-8">
          <div className="mx-auto grid max-w-7xl gap-4 px-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
            {[
              [
                Zap,
                'Instant Results',
                'Get your estimated band score and feedback in seconds.',
                'text-violet-600',
                'bg-violet-50',
              ],
              [
                Target,
                'Band-Focused Feedback',
                'Aligned with official IELTS band descriptors to help you improve.',
                'text-emerald-600',
                'bg-emerald-50',
              ],
              [
                BarChart3,
                'Track Your Progress',
                'Check your writing regularly and see consistent improvement.',
                'text-blue-600',
                'bg-blue-50',
              ],
              [
                ShieldCheck,
                '100% Free to Use',
                'Powerful AI feedback at no cost. Upgrade anytime for more.',
                'text-amber-600',
                'bg-amber-50',
              ],
            ].map(([Icon, title, text, iconColor, iconBgColor]) => (
              <div
                key={title}
                className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.015)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(0,0,0,0.04)] hover:border-slate-200/60"
              >
                <div
                  className={cn(
                    'grid h-12 w-12 shrink-0 place-items-center rounded-full',
                    iconBgColor,
                    iconColor
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-extrabold text-[#0d1740] leading-snug">{title}</h3>
                  <p className="text-xs font-medium text-slate-500 leading-relaxed">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="what-you-receive" className="scroll-mt-24 py-10 sm:py-12 bg-slate-50">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="rounded-[32px] border border-indigo-100 bg-white p-5 sm:p-6 lg:p-8 shadow-[0_16px_48px_rgba(79,70,229,0.035)]">
              <div className="grid gap-8 lg:grid-cols-[0.32fr_0.68fr] lg:items-center">
                <div className="flex flex-col items-start max-w-md">
                  <span className="text-xs font-black uppercase tracking-[.2em] text-indigo-600">
                    What you receive
                  </span>
                  <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                    What you receive
                  </h2>
                  <div className="w-12 h-1 bg-indigo-600 rounded-full mt-3" />
                  <p className="mt-5 text-sm leading-relaxed text-slate-600 font-medium">
                    A clear, criterion-based report with an estimated band (practice only) and
                    actionable feedback to help you improve.
                  </p>
                  <div className="relative mt-8 flex items-start gap-3 rounded-2xl bg-indigo-50/50 border border-indigo-100/40 p-4">
                    <Info className="h-5 w-5 shrink-0 text-indigo-600 mt-0.5" />
                    <p className="text-xs leading-relaxed text-indigo-700 font-bold">
                      This is a practice estimate based on AI analysis and is not a result from an
                      IELTS examiner.
                    </p>
                  </div>
                </div>
                <div className="overflow-hidden rounded-[28px] border border-indigo-50 bg-slate-50/50 p-6 shadow-[inset_0_2px_4px_rgba(0,0,0,0.005),0_8px_30px_rgba(79,70,229,.05)]">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                    {/* Column 1: Estimated Band */}
                    <div className="flex flex-col items-center text-center pb-6 md:pb-0 md:pr-4">
                      <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                        Estimated band
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 mt-0.5">
                        (Practice estimate)
                      </span>
                      <div className="relative mt-6 flex items-center justify-center">
                        <svg className="h-28 w-28 transform -rotate-90">
                          <circle
                            cx="56"
                            cy="56"
                            r="46"
                            stroke="#f1f5f9"
                            strokeWidth="8"
                            fill="transparent"
                          />
                          <circle
                            cx="56"
                            cy="56"
                            r="46"
                            stroke="#10b981"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 46}
                            strokeDashoffset={2 * Math.PI * 46 * (1 - 6.5 / 9)}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                          <span className="text-3xl font-black text-slate-900">6.5</span>
                          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">
                            Good
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Task Response */}
                    <div className="flex flex-col justify-between items-center text-center pt-6 md:pt-0 md:px-4">
                      <div>
                        <div className="mx-auto grid h-8 w-8 place-items-center rounded-full bg-violet-50 text-violet-600 shadow-sm">
                          <Target className="h-4.5 w-4.5" />
                        </div>
                        <h3 className="mt-3 text-xs font-black text-slate-800">Task Response</h3>
                        <span className="block text-2xl font-black text-emerald-600 mt-2">6.5</span>
                        <p className="mt-2 text-[11px] leading-relaxed text-slate-500 font-medium px-1">
                          Addresses the task well with relevant ideas, though some details could be
                          more specific.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="mt-4 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 border border-indigo-100 hover:border-indigo-200 rounded-lg py-1 px-3 w-full transition shadow-sm bg-white"
                      >
                        View feedback
                      </button>
                    </div>

                    {/* Column 3: Coherence & Cohesion */}
                    <div className="flex flex-col justify-between items-center text-center pt-6 md:pt-0 md:px-4">
                      <div>
                        <div className="mx-auto grid h-8 w-8 place-items-center rounded-full bg-violet-50 text-violet-600 shadow-sm">
                          <Link className="h-4.5 w-4.5" />
                        </div>
                        <h3 className="mt-3 text-xs font-black text-slate-800 font-bold">
                          Coherence & Cohesion
                        </h3>
                        <span className="block text-2xl font-black text-amber-500 mt-2">6.0</span>
                        <p className="mt-2 text-[11px] leading-relaxed text-slate-500 font-medium px-1">
                          Organisation is clear in parts, but paragraphing and linking can be
                          improved.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="mt-4 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 border border-indigo-100 hover:border-indigo-200 rounded-lg py-1 px-3 w-full transition shadow-sm bg-white"
                      >
                        View feedback
                      </button>
                    </div>

                    {/* Column 4: Lexical Resource */}
                    <div className="flex flex-col justify-between items-center text-center pt-6 md:pt-0 md:px-4">
                      <div>
                        <div className="mx-auto grid h-8 w-8 place-items-center rounded-full bg-violet-50 text-violet-600 shadow-sm">
                          <BookOpen className="h-4.5 w-4.5" />
                        </div>
                        <h3 className="mt-3 text-xs font-black text-slate-800">Lexical Resource</h3>
                        <span className="block text-2xl font-black text-emerald-600 mt-2">6.5</span>
                        <p className="mt-2 text-[11px] leading-relaxed text-slate-500 font-medium px-1">
                          Good range of vocabulary with some precise word choice. Try more less
                          common items.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="mt-4 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 border border-indigo-100 hover:border-indigo-200 rounded-lg py-1 px-3 w-full transition shadow-sm bg-white"
                      >
                        View feedback
                      </button>
                    </div>

                    {/* Column 5: Grammatical Range */}
                    <div className="flex flex-col justify-between items-center text-center pt-6 md:pt-0 md:pl-4">
                      <div>
                        <div className="mx-auto grid h-8 w-8 place-items-center rounded-full bg-violet-50 text-violet-600 shadow-sm">
                          <Type className="h-4.5 w-4.5" />
                        </div>
                        <h3 className="mt-3 text-xs font-black text-slate-800">
                          Grammatical Range
                        </h3>
                        <span className="block text-2xl font-black text-emerald-600 mt-2">6.5</span>
                        <p className="mt-2 text-[11px] leading-relaxed text-slate-500 font-medium px-1">
                          Uses a variety of structures with good control. Minor errors present.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="mt-4 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 border border-indigo-100 hover:border-indigo-200 rounded-lg py-1 px-3 w-full transition shadow-sm bg-white"
                      >
                        View feedback
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#f3f5ff] py-10 sm:py-12">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-[32px] border border-indigo-100 bg-white shadow-[0_16px_60px_rgba(79,70,229,.06)]">
              <div className="grid lg:grid-cols-[1.12fr_.88fr]">
                <div className="bg-slate-50/30 p-5 sm:p-6 lg:border-r lg:border-indigo-100 lg:p-8">
                  <div className="flex flex-col items-start">
                    <span className="text-xs font-black uppercase tracking-[.2em] text-indigo-600">
                      Step by step
                    </span>
                    <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                      How It Works
                    </h2>
                  </div>
                  <div className="mt-8 w-full">
                    <div className="grid gap-4 md:grid-cols-3 w-full">
                      {[
                        {
                          Icon: ClipboardPaste,
                          title: 'Paste Your Essay',
                          text: 'Add your IELTS Writing Task 1 or Task 2 essay (150+ words).',
                          iconBg: 'bg-emerald-50/80',
                          iconColor: 'text-emerald-600',
                          cardBg: 'bg-gradient-to-br from-emerald-50/20 to-white',
                          borderClass: 'border-emerald-500/15',
                          shadowClass: 'shadow-none',
                          hoverClass: 'hover:from-emerald-50/35 hover:to-emerald-50/5',
                        },
                        {
                          Icon: PenLine,
                          title: 'Get AI Feedback',
                          text: 'Our AI analyzes your writing and checks key assessment criteria.',
                          iconBg: 'bg-indigo-50/80',
                          iconColor: 'text-indigo-600',
                          cardBg: 'bg-gradient-to-br from-indigo-50/20 to-white',
                          borderClass: 'border-indigo-500/15',
                          shadowClass: 'shadow-none',
                          hoverClass: 'hover:from-indigo-50/35 hover:to-indigo-50/5',
                        },
                        {
                          Icon: CheckCircle2,
                          title: 'Improve & Score Higher',
                          text: 'Review suggestions, learn from mistakes, and write even better.',
                          iconBg: 'bg-emerald-50/80',
                          iconColor: 'text-emerald-600',
                          cardBg: 'bg-gradient-to-br from-emerald-50/20 to-white',
                          borderClass: 'border-emerald-500/15',
                          shadowClass: 'shadow-none',
                          hoverClass: 'hover:from-emerald-50/35 hover:to-emerald-50/5',
                        },
                      ].map((step, index, steps) => (
                        <article
                          key={step.title}
                          className={cn(
                            'relative flex flex-col justify-between h-full rounded-2xl border p-5 sm:p-6 text-center transition-all duration-300 group hover:-translate-y-1',
                            step.cardBg,
                            step.borderClass,
                            step.shadowClass,
                            step.hoverClass
                          )}
                        >
                          <div>
                            <span className="absolute left-4 top-4 grid h-6 w-6 place-items-center rounded-full bg-indigo-600 text-xs font-black text-white shadow-sm">
                              {index + 1}
                            </span>
                            <div
                              className={cn(
                                'mx-auto grid h-12 w-12 place-items-center rounded-full',
                                step.iconBg,
                                step.iconColor
                              )}
                            >
                              <step.Icon className="h-5 w-5" />
                            </div>
                            <h3 className="mt-5 text-sm font-extrabold text-[#0d1740]">
                              {step.title}
                            </h3>
                            <p className="mt-2 text-xs leading-relaxed text-slate-500 font-medium">
                              {step.text}
                            </p>
                          </div>
                          {index < steps.length - 1 && (
                            <div className="absolute -right-6 top-1/2 z-10 hidden -translate-y-1/2 md:block">
                              <svg
                                className="h-5 w-5 text-indigo-400/80 transition-transform duration-300 group-hover:translate-x-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="2.5"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3"
                                />
                              </svg>
                            </div>
                          )}
                        </article>
                      ))}
                    </div>
                  </div>
                </div>

                <aside className="relative overflow-hidden p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
                  <div className="pointer-events-none absolute -bottom-24 -right-20 h-64 w-64 rounded-full bg-violet-100 blur-2xl" />
                  <div>
                    <span className="text-xs font-black uppercase tracking-[.2em] text-indigo-600">
                      Features
                    </span>
                    <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                      Why Use Our Writing Checker?
                    </h2>
                    <div className="grid sm:grid-cols-[1.3fr_.7fr] items-center gap-4 mt-6">
                      <ul className="relative space-y-4 text-sm font-bold text-slate-700">
                        {[
                          'Instant, detailed feedback in seconds',
                          'Covers all IELTS Writing assessment criteria',
                          'Find grammar, vocabulary & structure mistakes',
                          'Perfect for self-study and exam preparation',
                          '3 free feedback reports with simple sign-up',
                        ].map((item) => (
                          <li key={item} className="flex items-start gap-3">
                            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                              <Check className="h-3 w-3" />
                            </span>
                            <span className="text-slate-700 font-semibold text-xs leading-5">
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <div className="relative mx-auto max-w-[140px] sm:max-w-none">
                        <img
                          src="/writing-illustration.png"
                          alt="Student checking Academic IELTS writing essay on laptop with AI support"
                          className="w-full h-auto object-contain rounded-2xl"
                          width="240"
                          height="240"
                        />
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </section>

        <section className="py-10 sm:py-12">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 sm:px-6 lg:grid-cols-[.9fr_1.1fr] lg:px-8">
            <div>
              <span className="text-xs font-black uppercase tracking-[.2em] text-indigo-600">
                Frequently asked questions
              </span>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Before you check your IELTS writing
              </h2>
              <p className="mt-4 max-w-lg text-base leading-7 text-slate-600">
                Clear answers about the Academic-only format, free reports, task context, and
                estimated band scores.
              </p>
              <a
                href="#checker"
                className="mt-7 inline-flex items-center gap-2 text-sm font-extrabold text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                Analyze my writing free <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            <Accordion type="single" collapsible className="space-y-3">
              {FAQS.map((item, index) => (
                <AccordionItem
                  key={item.question}
                  value={`faq-${index}`}
                  className="rounded-2xl border border-slate-200 bg-white px-5 shadow-sm"
                >
                  <AccordionTrigger className="text-left text-sm font-extrabold text-slate-900 hover:no-underline sm:text-base">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-7 text-slate-600">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <section className="px-5 pb-10 sm:pb-12 sm:px-6 lg:px-8">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[32px] bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-500 px-6 py-9 text-white shadow-[0_24px_70px_rgba(79,70,229,.28)] sm:px-10 sm:py-11 lg:px-14">
            <div className="pointer-events-none absolute -left-28 -top-32 h-80 w-80 rounded-full bg-fuchsia-400/25 blur-3xl" />
            <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-cyan-300/25 blur-3xl" />
            <Sparkles className="pointer-events-none absolute right-[38%] top-8 h-6 w-6 text-white/60" />
            <Sparkles className="pointer-events-none absolute right-[30%] bottom-10 h-4 w-4 text-indigo-100/70" />
            <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[1fr_360px]">
              <div className="max-w-2xl">
                <span className="text-xs font-black uppercase tracking-[.18em] text-indigo-100">
                  Ready to improve your IELTS writing?
                </span>
                <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-4xl">
                  Get your next Academic IELTS writing report.
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-indigo-50 sm:text-base">
                  Analyze a Task 1 report or Task 2 essay, review all four IELTS writing criteria,
                  and use practical feedback to improve your next draft.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <a
                    href="#checker"
                    className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 text-sm font-extrabold text-indigo-700 shadow-lg shadow-indigo-950/15 transition hover:-translate-y-0.5 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
                  >
                    Analyze my writing <ArrowRight className="h-4 w-4" />
                  </a>
                  <a
                    href="#what-you-receive"
                    className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/35 bg-white/10 px-6 text-sm font-extrabold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
                  >
                    See what you receive <BarChart3 className="h-4 w-4" />
                  </a>
                </div>
                <p className="mt-4 text-xs font-semibold text-indigo-100">
                  Your first 3 Academic IELTS writing feedback reports are free.
                </p>
              </div>

              <div
                className="relative mx-auto hidden h-48 w-full max-w-[350px] lg:block"
                aria-hidden="true"
              >
                <div className="absolute right-36 top-0 h-44 w-24 rotate-[-5deg] rounded-[22px] border-[5px] border-white/70 bg-white p-2 shadow-2xl shadow-indigo-950/25">
                  <div className="h-full rounded-[15px] bg-gradient-to-b from-indigo-50 to-white p-2 text-indigo-700">
                    <div className="text-[8px] font-black tracking-wide text-rose-500">IELTS</div>
                    <div className="mt-4 text-center text-3xl font-black">7.5</div>
                    <div className="mt-2 h-1.5 rounded-full bg-indigo-100">
                      <div className="h-full w-4/5 rounded-full bg-indigo-500" />
                    </div>
                    <div className="mt-4 flex items-end gap-1">
                      <span className="h-5 w-2 rounded-t bg-indigo-200" />
                      <span className="h-8 w-2 rounded-t bg-indigo-400" />
                      <span className="h-11 w-2 rounded-t bg-indigo-600" />
                      <span className="h-7 w-2 rounded-t bg-violet-400" />
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-2 right-8 grid h-24 w-24 place-items-center rounded-full border-8 border-white/80 bg-[#17245c] shadow-2xl shadow-indigo-950/30">
                  <div className="text-center">
                    <div className="mx-auto mb-1 flex justify-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-cyan-300" />
                      <span className="h-2 w-2 rounded-full bg-cyan-300" />
                    </div>
                    <span className="text-[10px] font-black tracking-[.2em] text-white">AI</span>
                  </div>
                </div>
                <div className="absolute bottom-0 left-3 h-20 w-20 rotate-[-14deg] rounded-2xl border border-white/40 bg-white/15 p-3 backdrop-blur-sm">
                  <BarChart3 className="h-full w-full text-white/80" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <CookieConsent />
    </div>
  );
}
