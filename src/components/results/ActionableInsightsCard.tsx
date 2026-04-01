import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Clock,
  Target,
  TrendingDown,
  Zap,
  ArrowRight,
  Flame,
  Brain,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * ActionableInsightsCard
 *
 * Premium feature: Provides highly actionable, specific insights including:
 * - Weakest passage + recommended action
 * - Time spent on wrong vs right answers
 * - Top time sinks (slowest questions analysis)
 */

interface SectionStat {
  id?: string | number;
  title?: string;
  correct: number;
  total: number;
  percentage: number;
}

interface CorrectAnswerEntry {
  questionId?: string;
  questionNumber?: string | number;
  userAnswer?: string;
  correctAnswer?: string;
  isCorrect?: boolean;
}

interface ActionableInsightsCardProps {
  sectionStats: SectionStat[] | null;
  timePerQuestionSeconds: Record<string, number> | null;
  correctAnswersMap: Record<string, CorrectAnswerEntry> | null;
  totalTimeSeconds: number;
  testType?: 'reading' | 'listening';
}

// Passage-specific tips for improvement
const PASSAGE_TIPS: Record<number, string[]> = {
  1: [
    'Focus on skimming for main ideas first before diving into questions.',
    'Passage 1 is usually the easiest – aim for 90%+ accuracy here.',
    'Practice speed reading to build confidence early in the test.',
  ],

  2: [
    'Passage 2 often has more complex vocabulary – build your word bank.',
    'Practice identifying paragraph themes quickly.',
    "Allocate ~20 minutes here; don't overspend time from Passage 1.",
  ],

  3: [
    'Section 3 is the hardest – save time from earlier sections for this.',
    'Focus on understanding the argument structure first.',
    'Practice academic texts from journals and research papers.',
  ],
};

// Listening specific tips
const LISTENING_TIPS: Record<number, string[]> = {
  1: [
    'Part 1 is social conversation. Focus on numbers, names, and spelling.',
    'Predict the type of information needed (noun, number, etc.) before listening.',
    "Don't get stuck if you miss one; the audio keeps moving.",
  ],

  2: [
    'Part 2 is a monologue. Pay attention to signpost words (firstly, then, however).',
    'Visualize the map or diagram if present.',
    'Listen for synonyms/paraphrasing of the question keywords.',
  ],

  3: [
    'Part 3 is an academic discussion. Identify who is speaking (opinions often differ).',
    'Watch out for "distractors" - answers that sound correct but are contradicted.',
    "Focus on the speakers' attitude and agreement/disagreement.",
  ],

  4: [
    'Part 4 is an academic lecture. Follow the structure of the talk.',
    'Use the pause before Part 4 wisely to read ahead.',
    'Keywords in the question (notes) will help you track the speaker.',
  ],
};

export function ActionableInsightsCard({
  sectionStats,
  timePerQuestionSeconds,
  correctAnswersMap,
  totalTimeSeconds,
  testType = 'reading',
}: ActionableInsightsCardProps) {
  // Calculate all insights
  const insights = useMemo(() => {
    // 1. Find weakest passage
    let weakestPassage: { index: number; percentage: number; title?: string } | null = null;
    if (sectionStats && sectionStats.length > 0) {
      const sorted = [...sectionStats]
        .map((s, idx) => ({ ...s, index: idx + 1 }))
        .sort((a, b) => a.percentage - b.percentage);
      const weakest = sorted[0];
      if (weakest.percentage < 80) {
        weakestPassage = {
          index: weakest.index,
          percentage: weakest.percentage,
          title: weakest.title,
        };
      }
    }

    // 2. Calculate time on wrong vs right
    let timeOnWrong = 0;
    let timeOnRight = 0;
    let wrongCount = 0;
    let rightCount = 0;

    if (timePerQuestionSeconds && correctAnswersMap) {
      Object.entries(timePerQuestionSeconds).forEach(([questionId, seconds]) => {
        const entry = correctAnswersMap[questionId];
        if (entry) {
          if (entry.isCorrect) {
            timeOnRight += seconds;
            rightCount++;
          } else {
            timeOnWrong += seconds;
            wrongCount++;
          }
        }
      });
    }

    const totalTrackedTime = timeOnWrong + timeOnRight;
    const wrongTimePercent =
      totalTrackedTime > 0 ? Math.round((timeOnWrong / totalTrackedTime) * 100) : 0;
    const rightTimePercent = 100 - wrongTimePercent;

    // 3. Find top time sinks (slowest 20% of questions)
    let timeSinkInsight: {
      slowestCount: number;
      slowestTimePercent: number;
      avgSlowTime: number;
      topSlowQuestions: { questionId: string; seconds: number }[];
    } | null = null;

    if (timePerQuestionSeconds) {
      const entries = Object.entries(timePerQuestionSeconds)
        .map(([qId, secs]) => ({ questionId: qId, seconds: secs }))
        .filter((e) => e.seconds > 0)
        .sort((a, b) => b.seconds - a.seconds);

      if (entries.length >= 5) {
        const slowestCount = Math.max(1, Math.ceil(entries.length * 0.2));
        const slowest = entries.slice(0, slowestCount);
        const slowestTotalTime = slowest.reduce((sum, e) => sum + e.seconds, 0);
        const totalTime = entries.reduce((sum, e) => sum + e.seconds, 0);
        const avgSlowTime = slowestTotalTime / slowestCount;

        timeSinkInsight = {
          slowestCount,
          slowestTimePercent: totalTime > 0 ? Math.round((slowestTotalTime / totalTime) * 100) : 0,
          avgSlowTime: Math.round(avgSlowTime),
          topSlowQuestions: slowest.slice(0, 3),
        };
      }
    }

    return {
      weakestPassage,
      timeOnWrong,
      timeOnRight,
      wrongTimePercent,
      rightTimePercent,
      wrongCount,
      rightCount,
      timeSinkInsight,
    };
  }, [sectionStats, timePerQuestionSeconds, correctAnswersMap]);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  const getPassageTip = (passageIndex: number) => {
    const tips =
      testType === 'listening'
        ? LISTENING_TIPS[passageIndex] || LISTENING_TIPS[4]
        : PASSAGE_TIPS[passageIndex] || PASSAGE_TIPS[3];
    return tips[Math.floor(Math.random() * tips.length)];
  };

  const hasInsights =
    insights.weakestPassage ||
    (insights.wrongTimePercent > 0 && insights.wrongCount > 0) ||
    insights.timeSinkInsight;

  if (!hasInsights) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden"
      data-oid="btmsf2g"
    >
      {/* Background accent */}
      <div
        className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-amber-500/10 to-rose-500/10 blur-[60px] pointer-events-none"
        data-oid="y:t0sqv"
      />

      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4" data-oid="nneyuxi">
        <div
          className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center"
          data-oid="r1_blyd"
        >
          <Brain className="w-5 h-5 text-white" data-oid="3ynr3ti" />
        </div>
        <div data-oid="7p7l8r9">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white" data-oid=".9fy295">
            Actionable Insights
          </h3>
          <p
            className="text-[10px] font-medium text-slate-400 tracking-wider"
            data-oid="fw5jxo2"
          >
            Premium Analysis
          </p>
        </div>
      </div>

      <div className="space-y-3.5" data-oid="-dgg4yx">
        {/* Weakest Passage Insight */}
        {insights.weakestPassage && (
          <div
            className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/50"
            data-oid="mtcr_c_"
          >
            <div className="flex items-start gap-3" data-oid="8sgsqr:">
              <div
                className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center shrink-0"
                data-oid="z.eidq3"
              >
                <Target className="w-4 h-4 text-rose-600 dark:text-rose-400" data-oid="hpcrru6" />
              </div>
              <div className="flex-1 min-w-0" data-oid="w-8gtnn">
                <p
                  className="text-xs font-bold text-rose-700 dark:text-rose-300 mb-1"
                  data-oid="uf3e78t"
                >
                  {testType === 'listening' ? 'Part' : 'Passage'} {insights.weakestPassage.index} is
                  Your Bottleneck
                </p>
                <p
                  className="text-[11px] text-slate-600 dark:text-slate-400 mb-2"
                  data-oid="c_jvv1i"
                >
                  Only {insights.weakestPassage.percentage}% accuracy. This is where you lost the
                  most points.
                </p>
                <div
                  className="flex items-center gap-1.5 text-[11px] font-bold text-rose-600 dark:text-rose-400"
                  data-oid="7ingm-z"
                >
                  <ArrowRight className="w-3.5 h-3.5" data-oid="5aff7e2" />
                  <span data-oid=":kzv-20">{getPassageTip(insights.weakestPassage.index)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Time on Wrong vs Right - Visual Gauge Style */}
        {insights.wrongCount > 0 && insights.wrongTimePercent > 0 && (
          <div
            className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 relative overflow-hidden"
            data-oid="r2g2a55"
          >
            <div
              className="flex flex-col sm:flex-row items-center gap-6 relative z-10"
              data-oid="nn7oh30"
            >
              {/* Circular Gauge */}
              <div className="relative w-20 h-20 shrink-0" data-oid="p5994kz">
                <svg className="w-full h-full transform -rotate-90" data-oid="ognsrpb">
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    stroke="currentColor"
                    strokeWidth="7"
                    fill="transparent"
                    className="text-amber-200 dark:text-amber-900/40"
                    data-oid="zdqp9up"
                  />

                  <motion.circle
                    initial={{ strokeDashoffset: 214 }}
                    animate={{ strokeDashoffset: 214 - (214 * insights.wrongTimePercent) / 100 }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    cx="40"
                    cy="40"
                    r="34"
                    stroke="currentColor"
                    strokeWidth="7"
                    fill="transparent"
                    strokeDasharray="214"
                    strokeLinecap="round"
                    className="text-amber-500"
                    data-oid="jugef-w"
                  />
                </svg>
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center"
                  data-oid="ftjahbv"
                >
                  <span
                    className="text-xl font-black text-amber-600 dark:text-amber-400"
                    data-oid="icddwy2"
                  >
                    {insights.wrongTimePercent}%
                  </span>
                  <span
                    className="text-[9px] font-bold text-amber-400 uppercase"
                    data-oid="z4z-3cu"
                  >
                    Wasted
                  </span>
                </div>
              </div>

              <div className="flex-1 text-center sm:text-left" data-oid="6c:.:hq">
                <p
                  className="text-xs font-bold text-amber-700 dark:text-amber-300 mb-1 flex items-center justify-center sm:justify-start gap-2"
                  data-oid="sb1lyj5"
                >
                  <Clock className="w-4 h-4" data-oid="wdm0xxf" />
                  Time Investment Analysis
                </p>
                <p
                  className="text-xs text-slate-600 dark:text-slate-400 mb-3 leading-relaxed"
                  data-oid="qijk.-t"
                >
                  You spent a significant portion of your time on questions you ultimately got
                  wrong.
                </p>

                <div className="grid grid-cols-2 gap-2" data-oid="51og28w">
                  <div
                    className="bg-emerald-500/10 rounded-lg p-1.5 border border-emerald-500/20 flex flex-col justify-center"
                    data-oid="eqkrfym"
                  >
                    <div
                      className="text-[9px] text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-tight"
                      data-oid="1dvte62"
                    >
                      Productive
                    </div>
                    <div
                      className="text-sm font-black text-slate-900 dark:text-white"
                      data-oid="pzbim29"
                    >
                      {formatTime(insights.timeOnRight)}
                    </div>
                  </div>
                  <div
                    className="bg-amber-500/10 rounded-lg p-1.5 border border-amber-500/20 flex flex-col justify-center"
                    data-oid="13wtqmr"
                  >
                    <div
                      className="text-[9px] text-amber-600 dark:text-amber-400 font-black uppercase tracking-tight leading-tight"
                      data-oid="g_k0sgn"
                    >
                      Unproductive
                    </div>
                    <div
                      className="text-sm font-black text-slate-900 dark:text-white"
                      data-oid="3rxhyd2"
                    >
                      {formatTime(insights.timeOnWrong)}
                    </div>
                  </div>
                </div>

                {insights.wrongTimePercent > 40 && (
                  <div
                    className="mt-2.5 flex items-start gap-2 bg-white/50 dark:bg-black/20 p-2 rounded-lg"
                    data-oid="v_v6ir:"
                  >
                    <AlertTriangle
                      className="w-3 h-3 text-amber-600 mt-0.5 shrink-0"
                      data-oid=":adq-of"
                    />

                    <p
                      className="text-[10px] text-amber-800 dark:text-amber-200 font-medium text-left leading-tight"
                      data-oid="y046:oo"
                    >
                      Tip: If stuck for &gt;90s, mark &amp; move on. You can't buy back time!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Top Time Sinks */}
        {insights.timeSinkInsight && (
          <div
            className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50"
            data-oid="ey8g_f5"
          >
            <div className="flex items-start gap-3" data-oid="mkze.j:">
              <div
                className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0"
                data-oid="m6sg.wb"
              >
                <Flame
                  className="w-4 h-4 text-indigo-600 dark:text-indigo-400"
                  data-oid="kxbvxuk"
                />
              </div>
              <div className="flex-1 min-w-0" data-oid="ax0.cu0">
                <p
                  className="text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-1"
                  data-oid=".35ast4"
                >
                  Time Sink Alert
                </p>
                <p
                  className="text-[11px] text-slate-600 dark:text-slate-400 mb-2"
                  data-oid="v8-4edu"
                >
                  Your slowest{' '}
                  <span
                    className="font-black text-indigo-600 dark:text-indigo-400"
                    data-oid="4z_2oyf"
                  >
                    {insights.timeSinkInsight.slowestCount}
                  </span>{' '}
                  questions consumed{' '}
                  <span
                    className="font-black text-indigo-600 dark:text-indigo-400"
                    data-oid="::wz311"
                  >
                    {insights.timeSinkInsight.slowestTimePercent}%
                  </span>{' '}
                  of your total time.
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400" data-oid="rcdf_k-">
                  Average time on slowest questions:{' '}
                  <span className="font-bold" data-oid="jcq0844">
                    {formatTime(insights.timeSinkInsight.avgSlowTime)}
                  </span>
                </p>

                {insights.timeSinkInsight.slowestTimePercent > 50 && (
                  <div
                    className="mt-2 p-2 rounded-lg bg-indigo-100 dark:bg-indigo-800/30"
                    data-oid="caomeat"
                  >
                    <p
                      className="text-[10px] text-indigo-700 dark:text-indigo-300 font-medium"
                      data-oid="z5u3hdt"
                    >
                      ⚡ A few questions are eating most of your time. Practice recognizing when to
                      skip and return.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default ActionableInsightsCard;
