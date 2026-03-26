import React, { useMemo } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Trophy,
  BookOpen,
  Brain,
  Clock,
  TrendingUp,
  Crown,
  Zap,
  Target,
  BarChart3,
  Sparkles,
  Lock,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Award,
  Lightbulb,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import ConfettiCelebration from '@/components/ConfettiCelebration';
// Enhanced metrics components (Pro/Premium)
import { TimeEfficiencyCard } from '@/components/results/TimeEfficiencyCard';
import { SkillGapRadar } from '@/components/results/SkillGapRadar';
import { CognitiveInsightsCard } from '@/components/results/CognitiveInsightsCard';
import { AnswerJourneyCard } from '@/components/results/AnswerJourneyCard';
import { ActionableInsightsCard } from '@/components/results/ActionableInsightsCard';
import { WhatsNextCard } from '@/components/results/WhatsNextCard';
import { TargetBandGapCard } from '@/components/results/TargetBandGapCard';

// Question type labels for display
const QUESTION_TYPE_LABELS = {
  matching_headings: 'Matching Headings',
  table_completion: 'Table Completion',
  matching: 'Matching Features',
  matching_features: 'Matching Features',
  multiple_choice: 'Multiple Choice',
  true_false_not_given: 'True/False/Not Given',
  yes_no_not_given: 'Yes/No/Not Given',
  sentence_completion: 'Sentence Completion',
  summary_completion: 'Summary Completion',
  note_completion: 'Note Completion',
  notes_completion: 'Notes Completion',
  flow_chart_completion: 'Flow Chart',
  diagram_completion: 'Diagram Completion',
  short_answer: 'Short Answer',
  gap_fill: 'Gap Fill',
  map_labeling: 'Map Labeling',
  flowchart: 'Flowchart',
};

// Animated circular progress component
const AnimatedScoreRing = ({ percentage, score, size = 160 }) => {
  const radius = (size - 24) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getScoreColor = (score) => {
    if (score >= 7)
      return {
        ring: 'text-emerald-500',
        glow: 'shadow-emerald-500/40',
        bg: 'from-emerald-500/20 via-teal-500/10 to-transparent',
        text: 'text-emerald-600 dark:text-emerald-400',
        gradient: 'from-emerald-500 to-teal-400',
      };
    if (score >= 5.5)
      return {
        ring: 'text-amber-500',
        glow: 'shadow-amber-500/40',
        bg: 'from-amber-500/20 via-orange-500/10 to-transparent',
        text: 'text-amber-600 dark:text-amber-400',
        gradient: 'from-amber-500 to-orange-400',
      };
    return {
      ring: 'text-rose-500',
      glow: 'shadow-rose-500/40',
      bg: 'from-rose-500/20 via-pink-500/10 to-transparent',
      text: 'text-rose-600 dark:text-rose-400',
      gradient: 'from-rose-500 to-pink-400',
    };
  };

  const colors = getScoreColor(score);

  return (
    <div
      className="relative mx-auto flex items-center justify-center group"
      style={{ width: size, height: size }}
      data-oid="kjd989s"
    >
      {/* Outer glow aura */}
      <div
        className={cn(
          'absolute inset-0 rounded-full blur-2xl opacity-15 group-hover:opacity-30 transition-opacity duration-1000',
          `bg-gradient-to-br ${colors.bg}`
        )}
        data-oid="za3zjg3"
      />

      {/* Glassy background */}
      <div
        className="absolute inset-6 rounded-full bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white dark:border-slate-800 shadow-inner overflow-hidden"
        data-oid="v2y.czb"
      >
        <div
          className={cn('absolute inset-0 opacity-5 bg-gradient-to-br', colors.gradient)}
          data-oid="hocau7x"
        />
      </div>

      <svg
        className="w-full h-full transform -rotate-90 relative z-10"
        viewBox={`0 0 ${size} ${size}`}
        data-oid="pt31-kv"
      >
        {/* Background track */}
        <circle
          className="text-slate-100 dark:text-slate-900"
          strokeWidth="10"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          data-oid="6eoax38"
        />

        {/* Progress tracks with multiple layers for depth */}
        <motion.circle
          className={cn('opacity-15', colors.ring)}
          strokeWidth="15"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.8, ease: 'circOut', delay: 0.2 }}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          data-oid="3tx424b"
        />

        <motion.circle
          className={colors.ring}
          strokeWidth="10"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'circOut', delay: 0.3 }}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          data-oid="owoyocj"
        />
      </svg>

      {/* Score display */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center z-20"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, type: 'spring' }}
        data-oid="5-9ck3e"
      >
        <span
          className={cn('text-4xl font-black tracking-tighter text-slate-900 dark:text-white')}
          data-oid="z0b3lmq"
        >
          {percentage}%
        </span>
        <span
          className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-0.5"
          data-oid="om9jzeb"
        >
          TOTAL
        </span>
      </motion.div>
    </div>
  );
};

// Performance indicator badge
const PerformanceBadge = ({ percentage }) => {
  if (percentage >= 80)
    return (
      <span
        className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
        data-oid="m7ybd8-"
      >
        Excellent
      </span>
    );

  if (percentage >= 60)
    return (
      <span
        className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
        data-oid="y.k21z8"
      >
        Good
      </span>
    );

  return (
    <span
      className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400"
      data-oid="fhkkxh8"
    >
      Needs Work
    </span>
  );
};

// Section/Passage analysis card
const SectionCard = ({ index, title, correct, total, percentage, isLocked = false }) => {
  const getColors = (pct) => {
    if (pct >= 80)
      return {
        bar: 'bg-emerald-500',
        text: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-500/10',
        icon: 'text-emerald-500',
      };
    if (pct >= 60)
      return {
        bar: 'bg-blue-500',
        text: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-500/10',
        icon: 'text-blue-500',
      };
    if (pct >= 40)
      return {
        bar: 'bg-amber-500',
        text: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-500/10',
        icon: 'text-amber-500',
      };
    return {
      bar: 'bg-rose-500',
      text: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-500/10',
      icon: 'text-rose-500',
    };
  };

  const colors = getColors(percentage);

  // Difficulty badge based on percentage
  const getDifficultyBadge = (pct) => {
    if (pct >= 80)
      return {
        label: 'Easy',
        color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
      };
    if (pct >= 50)
      return {
        label: 'Medium',
        color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
      };
    return {
      label: 'Hard',
      color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400',
    };
  };

  const difficulty = getDifficultyBadge(percentage);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.05 * index }}
      className={cn(
        'group relative overflow-hidden p-3.5 rounded-xl transition-all duration-300',
        'bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800',
        'hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 hover:border-slate-300 dark:hover:border-slate-700',
        isLocked && 'opacity-50 blur-[1px]'
      )}
      data-oid="mx98p.:"
    >
      <div className="flex items-center justify-between gap-3 relative z-10" data-oid="g:dv8mn">
        <div className="flex items-center gap-2.5 min-w-0" data-oid="6fssem6">
          <div
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 shadow-sm',
              colors.bg
            )}
            data-oid="84xa7w1"
          >
            <BookOpen className={cn('w-4 h-4', colors.icon)} data-oid="5dkph:c" />
          </div>
          <div className="min-w-0" data-oid="eqmllhc">
            <div className="flex items-center gap-2" data-oid="p5jxdv8-wrap">
              <h4
                className="text-[13px] font-black text-slate-800 dark:text-slate-200 truncate leading-tight"
                data-oid="p5jxdv8"
              >
                {title.includes('Part') || title.includes('Passage')
                  ? title
                  : `Passage ${index + 1}`}
              </h4>
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wide',
                  difficulty.color
                )}
                data-oid="diff-badge"
              >
                {difficulty.label}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5" data-oid="e1oc14a">
              <span
                className={cn('text-[10px] font-black uppercase tracking-wider', colors.text)}
                data-oid="lgm-2mk"
              >
                {percentage}% Accuracy
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end shrink-0" data-oid="m1ndtdc">
          <div
            className="text-[15px] font-black tracking-tight leading-none text-slate-900 dark:text-white"
            data-oid="tiib1we"
          >
            {correct}
            <span
              className="text-slate-400 dark:text-slate-600 font-bold mx-0.5 text-xs"
              data-oid="z5-r0v:"
            >
              /
            </span>
            {total}
          </div>
        </div>
      </div>

      <div
        className="mt-2.5 h-1 w-full bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden"
        data-oid="k86idui"
      >
        <motion.div
          className={cn('h-full rounded-full', colors.bar)}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, delay: 0.3 + index * 0.1, ease: 'circOut' }}
          data-oid="76vi9u1"
        />
      </div>
    </motion.div>
  );
};

// Question type analysis bar
const TypeAnalysisBar = ({ type, stats, index, isLocked = false }) => {
  const accuracy = Math.round((stats.correct / stats.total) * 100);
  const label =
    QUESTION_TYPE_LABELS[type] || type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  const getColors = (acc) => {
    if (acc >= 75)
      return {
        text: 'text-emerald-600 dark:text-emerald-400',
        bar: 'bg-gradient-to-r from-emerald-500 to-teal-400',
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/5',
      };
    if (acc >= 50)
      return {
        text: 'text-amber-600 dark:text-amber-400',
        bar: 'bg-gradient-to-r from-amber-500 to-orange-400',
        bg: 'bg-amber-500/10 dark:bg-amber-500/5',
      };
    return {
      text: 'text-rose-600 dark:text-rose-400',
      bar: 'bg-gradient-to-r from-rose-500 to-pink-400',
      bg: 'bg-rose-500/10 dark:bg-rose-500/5',
    };
  };

  const colors = getColors(accuracy);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: isLocked ? 0.3 : 1, x: 0 }}
      transition={{ delay: 0.05 * index }}
      className={cn(
        'group p-3.5 rounded-xl transition-all duration-300 relative overflow-hidden',
        'bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800',
        'hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md hover:-translate-x-0.5',
        isLocked && 'blur-[1px] grayscale-[0.5]'
      )}
      data-oid="_nwn7_z"
    >
      {/* Subtle hover accent */}
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 w-1 opacity-0 group-hover:opacity-100 transition-opacity',
          colors.bar
        )}
        data-oid="cnfpd-t"
      />

      <div className="flex justify-between items-center mb-2.5" data-oid=".044ifh">
        <div className="flex items-center gap-2.5 min-w-0" data-oid=":o1ucva">
          <div
            className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
              colors.bg
            )}
            data-oid="03wfzu_"
          >
            <Target className={cn('w-4 h-4', colors.text)} data-oid="qb2890m" />
          </div>
          <span
            className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate"
            data-oid="w-upvhm"
          >
            {label}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0" data-oid="p:2ookw">
          <div
            className="flex items-center text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-100 dark:border-slate-700"
            data-oid="v:o-k.-"
          >
            {stats.correct}/{stats.total}
          </div>
          <span
            className={cn('text-sm font-black min-w-[2.5rem] text-right', colors.text)}
            data-oid="2_vagqy"
          >
            {accuracy}%
          </span>
        </div>
      </div>
      <div
        className="h-1.5 w-full bg-slate-200 dark:bg-slate-700/50 rounded-full overflow-hidden"
        data-oid="7j23a1v"
      >
        <motion.div
          className={cn('h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)]', colors.bar)}
          initial={{ width: 0 }}
          animate={{ width: `${accuracy}%` }}
          transition={{ duration: 1, delay: 0.3 + index * 0.05, ease: 'circOut' }}
          data-oid="yd.b-z:"
        />
      </div>
    </motion.div>
  );
};

// Premium unlock overlay with glassmorphism
const PremiumUnlockOverlay = ({
  onUpgrade,
  title = 'Unlock Full Analysis',
  message = 'Get detailed insights and recommendations',
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="absolute inset-0 bg-gradient-to-t from-white via-white/95 to-white/80 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-900/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-4"
    data-oid="p3p:cgs"
  >
    <motion.div
      initial={{ scale: 0.9, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      transition={{ delay: 0.2, type: 'spring' }}
      className="relative bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-2xl border border-purple-100 dark:border-purple-900/40 text-center max-w-[280px]"
      data-oid="f9zsqf:"
    >
      {/* Gradient border effect */}
      <div
        className="absolute -inset-[1px] bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 rounded-3xl -z-10 blur-sm opacity-40"
        data-oid="ihjxmbk"
      />

      <motion.div
        animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg shadow-purple-500/30 mb-4"
        data-oid="97dsxov"
      >
        <Crown className="w-7 h-7 text-white" data-oid="fd85n6r" />
      </motion.div>

      <h4 className="font-bold text-slate-900 dark:text-white text-base mb-2" data-oid="q_o0p4_">
        {title}
      </h4>
      <p
        className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed"
        data-oid="mf8zc55"
      >
        {message}
      </p>

      <Button
        onClick={onUpgrade}
        className="w-full bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 text-white text-sm font-black h-11 rounded-xl shadow-lg shadow-purple-500/25 transition-all hover:shadow-xl hover:shadow-purple-500/30 hover:scale-[1.02] active:scale-95"
        data-oid="nq5k3wi"
      >
        <Sparkles className="w-4 h-4 mr-2" data-oid="bw07_n0" />
        Upgrade to Pro Plan
      </Button>
    </motion.div>
  </motion.div>
);

// Time analytics section (Pro+) - Premium redesigned with accurate IELTS timing

// AI Recommendations section (Premium) - Completely redesigned with modern cards

// Detailed skill breakdown for Premium users - comprehensive statistics with premium design
const DetailedSkillBreakdown = ({
  typeStats,
  sectionStats,
  testType = 'reading',
  totalQuestions: propTotalQuestions,
  correctAnswers: propCorrectAnswers,
  bandScore,
  isLocked = false,
  onUpgrade,
}) => {
  const stats = useMemo(() => {
    if (!typeStats) return null;

    const entries = Object.entries(typeStats);
    if (entries.length === 0) return null;

    // Calculate from typeStats as fallback
    const typeCorrect = entries.reduce((acc, [, s]) => acc + s.correct, 0);
    const typeTotal = entries.reduce((acc, [, s]) => acc + s.total, 0);

    // Use props if provided for accurate totals
    const totalCorrect = propCorrectAnswers ?? typeCorrect;
    const totalQuestions = propTotalQuestions ?? typeTotal;
    const overallAccuracy =
      totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    const sorted = entries
      .map(([type, s]) => ({
        type,
        label:
          QUESTION_TYPE_LABELS[type] ||
          type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
        ...s,
      }))
      .sort((a, b) => b.accuracy - a.accuracy);

    // Calculate improvement potential
    const improvementPotential = sorted.reduce((acc, type) => {
      const missed = type.total - type.correct;
      return acc + missed;
    }, 0);

    return {
      overallAccuracy,
      totalCorrect,
      totalQuestions,
      strongest: sorted[0],
      weakest: sorted[sorted.length - 1],
      questionTypes: sorted.length,
      allTypes: sorted,
      improvementPotential,
    };
  }, [typeStats, propTotalQuestions, propCorrectAnswers]);

  if (!stats) return null;

  return (
    <div className="space-y-5 relative" data-oid="esrvnvs">
      <div className="flex items-center gap-2" data-oid=".-202bj">
        <div
          className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-200/50 dark:border-indigo-800/50"
          data-oid="fejbbo5"
        >
          <BarChart3 className="w-4 h-4 text-indigo-500" data-oid="t9m2ov8" />
        </div>
        <h3
          className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest"
          data-oid="-gai707"
        >
          Performance Details
        </h3>
        {isLocked && <Lock className="w-3 h-3 text-slate-400 ml-auto" data-oid="ju-nvr1" />}
      </div>

      {/* Partial preview wrapper - show first stats card for free users */}
      <div className={cn('relative', isLocked && 'min-h-[300px]')} data-oid="buxjet:">
        {/* Content wrapper - Stats grid is always visible */}
        <div className="space-y-4" data-oid="6.uxfls">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3" data-oid="3xaqc1o">
            {/* Overall Accuracy */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 relative overflow-hidden group h-full"
              data-oid="cbmty00"
            >
              <div className="relative" data-oid="9--_nlu">
                <div className="flex items-center gap-2 mb-2" data-oid="cunng9n">
                  <div
                    className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20"
                    data-oid="m.2s_v_"
                  >
                    <Target className="w-4 h-4 text-indigo-500" data-oid="5fvs26w" />
                  </div>
                  <span
                    className="text-[10px] font-black text-slate-400 uppercase tracking-widest"
                    data-oid="f-3qs.y"
                  >
                    Accuracy
                  </span>
                </div>
                <div className="flex items-baseline gap-1" data-oid="42x8il2">
                  <span
                    className="text-3xl font-black text-slate-900 dark:text-white"
                    data-oid="u39dlz3"
                  >
                    {stats.overallAccuracy}
                  </span>
                  <span className="text-lg font-bold text-slate-400" data-oid="j1znue6">
                    %
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Question Types Tested */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-3.5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 relative overflow-hidden group h-full"
              data-oid="g:n_1xv"
            >
              <div className="relative" data-oid="irpv9g6">
                <div className="flex items-center gap-2 mb-2" data-oid="8aqa.zx">
                  <div
                    className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20"
                    data-oid="r9j6q8:"
                  >
                    <BarChart3 className="w-4 h-4 text-blue-500" data-oid="1v.29n3" />
                  </div>
                  <span
                    className="text-[10px] font-black text-slate-400 uppercase tracking-widest"
                    data-oid="e:-2ztw"
                  >
                    Question Types
                  </span>
                </div>
                <div className="flex items-baseline gap-1" data-oid="5blc:.m">
                  <span
                    className="text-3xl font-black text-slate-900 dark:text-white"
                    data-oid="kf95o96"
                  >
                    {stats.questionTypes}
                  </span>
                  <span className="text-xs font-bold text-slate-400 ml-1" data-oid="jpkxwir">
                    tested
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Improvement Potential Banner */}
            {stats.improvementPotential > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="col-span-2 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800/50 flex items-center justify-between gap-3"
                data-oid="improvement-potential"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                      Improvement Potential
                    </span>
                    <p className="text-[10px] text-amber-600/80 dark:text-amber-500/80">
                      Points you can gain by mastering weak areas
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-amber-600 dark:text-amber-400">
                    +{stats.improvementPotential}
                  </span>
                  <span className="text-xs font-bold text-amber-500/70 ml-1">pts</span>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Deeper analysis - Blurred for free users */}
        <div className="relative" data-oid="vgbd1hm">
          <div
            className={cn('space-y-4 pt-3.5', isLocked && 'blur-sm select-none opacity-60')}
            data-oid="6onrz3s"
          >
            {/* Strongest & Weakest Skills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5" data-oid="m35g5_1">
              {stats.strongest && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 relative overflow-hidden group"
                  data-oid="mb_oolf"
                >
                  <div className="relative" data-oid="e-pxnt_">
                    <div className="flex items-center gap-2 mb-2.5" data-oid="j-:a.4n">
                      <div
                        className="w-6 h-6 rounded bg-emerald-500/10 flex items-center justify-center"
                        data-oid="ajcl-m6"
                      >
                        <Award className="w-3.5 h-3.5 text-emerald-500" data-oid="ag6h0de" />
                      </div>
                      <span
                        className="text-[10px] font-black text-slate-400 uppercase tracking-wider"
                        data-oid="ka2jkdo"
                      >
                        Top Skill
                      </span>
                    </div>
                    <p
                      className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2 truncate"
                      data-oid="3jake0."
                    >
                      {stats.strongest.label}
                    </p>
                    <div className="flex items-center gap-2" data-oid="-7xh7i9">
                      <div
                        className="flex-1 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"
                        data-oid="qa6ger4"
                      >
                        <motion.div
                          className="h-full bg-emerald-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${stats.strongest.accuracy}%` }}
                          transition={{ duration: 0.8 }}
                          data-oid="da-n-y."
                        />
                      </div>
                      <span
                        className="text-[11px] font-black text-emerald-600 dark:text-emerald-400"
                        data-oid="5:roz93"
                      >
                        {stats.strongest.accuracy}%
                      </span>
                    </div>
                    <div
                      className="text-[10px] text-slate-400 font-medium mt-1.5 flex justify-between"
                      data-oid="kt_mxxu"
                    >
                      <span data-oid="1s-pc77">Performance</span>
                      <span data-oid="r9eh-de">
                        {stats.strongest.correct}/{stats.strongest.total} correct
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {stats.weakest && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 relative overflow-hidden group"
                  data-oid="ko-10df"
                >
                  <div className="relative" data-oid="j2nsgyi">
                    <div className="flex items-center gap-2 mb-2.5" data-oid="6f_c4xv">
                      <div
                        className="w-6 h-6 rounded bg-rose-500/10 flex items-center justify-center"
                        data-oid="9g19uz8"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500" data-oid="ms:-9jw" />
                      </div>
                      <span
                        className="text-[10px] font-black text-slate-400 uppercase tracking-wider"
                        data-oid="_-w6wyp"
                      >
                        Focus Area
                      </span>
                    </div>
                    <p
                      className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2 truncate"
                      data-oid="cvl33to"
                    >
                      {stats.weakest.label}
                    </p>
                    <div className="flex items-center gap-2" data-oid="wl_6tvn">
                      <div
                        className="flex-1 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"
                        data-oid="4i631ra"
                      >
                        <motion.div
                          className="h-full bg-rose-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${stats.weakest.accuracy}%` }}
                          transition={{ duration: 0.8 }}
                          data-oid="ttq7f.k"
                        />
                      </div>
                      <span
                        className="text-[11px] font-black text-rose-600 dark:text-rose-400"
                        data-oid="h-xf.:e"
                      >
                        {stats.weakest.accuracy}%
                      </span>
                    </div>
                    <div
                      className="text-[10px] text-slate-400 font-medium mt-1.5 flex justify-between"
                      data-oid=".q3jzrm"
                    >
                      <span data-oid="cfqy4m0">Performance</span>
                      <span data-oid="d4sojqr">
                        {stats.weakest.correct}/{stats.weakest.total} correct
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* All Question Types Mini Breakdown */}
            {stats.allTypes.length > 2 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-slate-950/50 border border-slate-100 dark:border-slate-800"
                data-oid="09c14bf"
              >
                <p
                  className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3"
                  data-oid="jecjq1z"
                >
                  All Question Types
                </p>
                <div className="space-y-2" data-oid="rz0ndhy">
                  {stats.allTypes.slice(0, 5).map((qType, idx) => (
                    <div key={qType.type} className="flex items-center gap-3" data-oid="62.msvg">
                      <span
                        className="text-xs text-slate-600 dark:text-slate-400 truncate flex-1"
                        data-oid="9bwaxd4"
                      >
                        {qType.label}
                      </span>
                      <div
                        className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"
                        data-oid="v78pubj"
                      >
                        <motion.div
                          className={cn(
                            'h-full rounded-full',
                            qType.accuracy >= 70
                              ? 'bg-emerald-500'
                              : qType.accuracy >= 50
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                          )}
                          initial={{ width: 0 }}
                          animate={{ width: `${qType.accuracy}%` }}
                          transition={{ duration: 0.5, delay: 0.5 + idx * 0.05 }}
                          data-oid="67iez_4"
                        />
                      </div>
                      <span
                        className={cn(
                          'text-xs font-bold w-8 text-right',
                          qType.accuracy >= 70
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : qType.accuracy >= 50
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-rose-600 dark:text-rose-400'
                        )}
                        data-oid="1aoc1gy"
                      >
                        {qType.accuracy}%
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Blur overlay for free users - positioned over the blurred content */}
          {isLocked && (
            <PremiumUnlockOverlay
              onUpgrade={onUpgrade}
              title="Unlock Full Analysis"
              message="Get detailed performance insights & improvement recommendations"
              data-oid="vnytsnv"
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Main TestResultsModal component
export default function TestResultsModal({
  showResults,
  testResults,
  testData,
  earnedXP,
  user,
  onClose,
  onReviewAnswers,
  onNavigateToQuestion, // NEW: Navigate to specific question number
  testType = 'reading', // 'reading' or 'listening'
  dashboardUrl = '/dashboard',
}) {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = React.useState('overview');

  // Determine subscription tier access (only Free and Premium - no Pro tier)
  const subscriptionTier = (user?.subscription_tier || 'free').toLowerCase();
  const isPremium = subscriptionTier === 'premium' || subscriptionTier === 'pro' || isAdmin;

  // Sort weakness analysis by accuracy (worst first)
  const sortedTypeStats = useMemo(() => {
    if (!testResults?.typeStats) return [];
    return Object.entries(testResults.typeStats)
      .map(([type, stats]) => ({
        type,
        ...stats,
        accuracy: Math.round((stats.correct / stats.total) * 100),
      }))
      .sort((a, b) => a.accuracy - b.accuracy);
  }, [testResults?.typeStats]);

  // Number of weakness items to show for free users
  const freeWeaknessLimit = 2;

  const handleUpgrade = () => {
    navigate('/pricing');
  };

  const handleBackToTests = () => {
    navigate(testType === 'reading' ? '/reading' : '/listening');
  };

  const getAssessmentMessage = (score) => {
    if (score >= 8.5) return 'Unstoppable! You are mastering this exam.';
    if (score >= 7.5) return 'Fantastic work! You are well on your way.';
    if (score >= 6.5) return 'Good job! Keep pushing to reach the top.';
    if (score >= 5.5) return 'Solid effort. Focus on your weak spots to improve.';
    return 'Keep practicing. Consistency is key to improvement.';
  };

  // Celebration Logic
  const [showCelebration, setShowCelebration] = React.useState(false);
  const [particleCount, setParticleCount] = React.useState(0);
  const [celebrationTheme, setCelebrationTheme] = React.useState('default');

  React.useEffect(() => {
    if (showResults && testResults?.bandScore) {
      const score = parseFloat(testResults.bandScore);
      if (score >= 8.0) {
        setParticleCount(150);
        setCelebrationTheme('gold');
        setShowCelebration(true);
      } else if (score >= 7.0) {
        setParticleCount(100);
        setCelebrationTheme('default');
        setShowCelebration(true);
      } else if (score >= 6.0) {
        setParticleCount(60);
        setCelebrationTheme('default');
        setShowCelebration(true);
      } else if (score >= 5.0) {
        setParticleCount(40);
        setCelebrationTheme('silver');
        setShowCelebration(true);
      } else if (score >= 4.0) {
        setParticleCount(25);
        setCelebrationTheme('bronze');
        setShowCelebration(true);
      }
    }
  }, [showResults, testResults]);

  if (!showResults || !testResults) return null;

  return (
    <AnimatePresence data-oid="ihkxgha">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[100] flex items-center justify-center p-3 md:p-6 overflow-y-auto"
        data-oid="rzrso9e"
      >
        <ConfettiCelebration
          show={showCelebration}
          particleCount={particleCount}
          theme={celebrationTheme}
          onComplete={() => setShowCelebration(false)}
          data-oid="sg.l.7k"
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 30 }}
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          className="relative bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden"
          data-oid="-r:9.7j"
        >
          {/* Subtle animated background gradient - darkened for better contrast */}
          <div
            className="absolute top-0 inset-x-0 h-[400px] bg-gradient-to-b from-blue-50/50 via-purple-50/30 to-transparent dark:from-blue-900/10 dark:via-purple-900/5 dark:to-transparent pointer-events-none"
            data-oid="xe:hy-z"
          />

          {/* Close Button - Top Right */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-6 right-6 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-white hover:bg-rose-500 hover:border-rose-500 rounded-full transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-xl h-12 w-12"
            data-oid="w:ql:1a"
          >
            <X className="w-6 h-6" data-oid="ivzr5rc" />
          </Button>

          <div
            className="relative flex-1 overflow-hidden bg-slate-50/50 dark:bg-[#0B1120] flex flex-col"
            data-oid="01:i.lo"
          >
            {/* HERO HEADER AREA - Sticky at top */}
            <div
              className="p-6 lg:p-7 pb-2 flex flex-col items-center text-center relative gap-3 shrink-0 z-10 bg-white/50 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50"
              data-oid="mq0lnh."
            >
              <motion.h2
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight"
                data-oid="bb8mpiq"
              >
                IELTS {testType.charAt(0).toUpperCase() + testType.slice(1)} Test Result
              </motion.h2>

              {/* Sub-header Stats (Band Only) to save space if needed, or keep full header? 
                         Let's keep the Band Score prominent here but maybe compact high-level stats into the Overview Tab 
                         OR keep the Header consistent. 
                         Decision: Move the big score and stats INTO the Tabs for better scrolling experience, 
                         OR keep a "Mini Header" and put big stats in Overview. 
                         Results Page usually benefits from a Scrollable body. 
                         Let's put the heavy visuals inside the Tabs to avoid a massive sticky header covering mobile screens.
                     */}
            </div>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col overflow-hidden"
              data-oid="qgezt8v"
            >
              <div
                className="px-6 lg:px-7 pb-4 bg-white/50 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 shrink-0 z-10 flex justify-center"
                data-oid="ure23om"
              >
                <TabsList
                  className="grid w-full max-w-sm grid-cols-2 h-12 p-1 bg-slate-100/50 dark:bg-slate-900/50"
                  data-oid="nf4obpz"
                >
                  <TabsTrigger
                    value="overview"
                    className="gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-blue-500/25"
                    data-oid="_ev7mm4"
                  >
                    <BarChart3 className="w-4 h-4" data-oid="_uyqkn_" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="analysis"
                    className="gap-2 data-[state=active]:bg-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-indigo-500/25"
                    data-oid="yrnaz.q"
                  >
                    <Brain className="w-4 h-4" data-oid="xqxzto9" />
                    Deep Analysis
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar" data-oid="29d7i4l">
                <AnimatePresence mode="wait" data-oid="ikod:4o">
                  {activeTab === 'overview' && (
                    <TabsContent
                      value="overview"
                      forceMount
                      className="m-0 focus-visible:outline-none"
                      data-oid="4qgo-5k"
                    >
                      <motion.div
                        key="overview"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="p-5 lg:p-7 space-y-8"
                        data-oid="qsbm9v."
                      >
                        {/* 1. Band Score Hero */}
                        <div className="flex flex-col items-center" data-oid="j1qb-nz">
                          <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="inline-flex flex-col items-center gap-2 mb-6"
                            data-oid=".:enlg1"
                          >
                            <div
                              className="inline-flex items-center gap-3 px-6 py-2 rounded-[1.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 shadow-xl shadow-blue-500/30"
                              data-oid="5q-d537"
                            >
                              <span className="text-4xl font-black text-white" data-oid="p1_zjyy">
                                {parseFloat(testResults.bandScore).toFixed(1)}
                              </span>
                              <span
                                className="text-base font-bold text-blue-100/80 uppercase tracking-widest"
                                data-oid="46zsjnp"
                              >
                                Band
                              </span>
                            </div>

                            {testResults.previousBandScore != null && (
                              <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className={cn(
                                  'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold',
                                  parseFloat(testResults.bandScore) > testResults.previousBandScore
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                                    : parseFloat(testResults.bandScore) <
                                        testResults.previousBandScore
                                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'
                                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                )}
                                data-oid="jhz2eze"
                              >
                                {parseFloat(testResults.bandScore) >
                                testResults.previousBandScore ? (
                                  <>
                                    <TrendingUp className="w-3.5 h-3.5" data-oid="av396do" />+
                                    {(
                                      parseFloat(testResults.bandScore) -
                                      testResults.previousBandScore
                                    ).toFixed(1)}{' '}
                                    from last
                                  </>
                                ) : parseFloat(testResults.bandScore) <
                                  testResults.previousBandScore ? (
                                  <>
                                    <TrendingUp
                                      className="w-3.5 h-3.5 rotate-180"
                                      data-oid="9nz4flb"
                                    />
                                    {(
                                      parseFloat(testResults.bandScore) -
                                      testResults.previousBandScore
                                    ).toFixed(1)}{' '}
                                    from last
                                  </>
                                ) : (
                                  <>
                                    <span data-oid="7gtol6_">→</span>Same as last
                                  </>
                                )}
                              </motion.div>
                            )}
                          </motion.div>

                          <div
                            className="text-center mb-6 px-4 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300"
                            data-oid="_kx3xye"
                          >
                            <p
                              className="text-base font-bold text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed"
                              data-oid="n0fik82"
                            >
                              {getAssessmentMessage(parseFloat(testResults.bandScore))}
                            </p>
                          </div>
                        </div>

                        {/* Quick Stats Grid */}
                        <div
                          className="grid grid-cols-1 md:grid-cols-3 gap-2 w-full max-w-4xl mx-auto mb-6"
                          data-oid="gct9ohv"
                        >
                          <div
                            className="flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm"
                            data-oid="99.9haa"
                          >
                            <div
                              className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500"
                              data-oid="f7w:6_9"
                            >
                              <CheckCircle2 className="w-4.5 h-4.5" data-oid="r_eqv3t" />
                            </div>
                            <div className="text-left" data-oid="4rbk19x">
                              <p
                                className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1"
                                data-oid="bcil3qm"
                              >
                                Correct
                              </p>
                              <p
                                className="text-2xl font-black text-slate-900 dark:text-white leading-none"
                                data-oid=".ld4es1"
                              >
                                {testResults.correctAnswers}{' '}
                                <span
                                  className="text-slate-400 font-bold text-base"
                                  data-oid="yr48l80"
                                >
                                  / {testResults.totalQuestions}
                                </span>
                              </p>
                            </div>
                          </div>

                          <div
                            className="flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:border-rose-500/20"
                            data-oid="iutrm8f"
                          >
                            <div
                              className="w-9 h-9 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500"
                              data-oid="dsn0b-4"
                            >
                              <XCircle className="w-4.5 h-4.5" data-oid="p126ktm" />
                            </div>
                            <div className="text-left" data-oid="edrst37">
                              <p
                                className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1"
                                data-oid="nnb:na0"
                              >
                                Mistakes & Skipped
                              </p>
                              <div className="flex items-center gap-2" data-oid="y4oer2s">
                                <div className="flex flex-col" data-oid="c:l22iz">
                                  <span
                                    className="text-xl font-black text-rose-600 dark:text-rose-400 leading-none"
                                    data-oid="rs4q_qa"
                                  >
                                    {testResults.totalQuestions -
                                      testResults.correctAnswers -
                                      (testResults.errorPatterns?.unansweredCount || 0)}
                                  </span>
                                  <span
                                    className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter"
                                    data-oid="c5fbom."
                                  >
                                    Wrong
                                  </span>
                                </div>
                                <div
                                  className="h-6 w-px bg-slate-100 dark:bg-slate-800"
                                  data-oid="ww7az30"
                                />

                                <div className="flex flex-col" data-oid="v2swrfw">
                                  <span
                                    className="text-xl font-black text-amber-600 dark:text-amber-400 leading-none"
                                    data-oid="l1nuz21"
                                  >
                                    {testResults.errorPatterns?.unansweredCount || 0}
                                  </span>
                                  <span
                                    className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter"
                                    data-oid="9ko7l7o"
                                  >
                                    Skipped
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div
                            className="flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm"
                            data-oid="9e0ykm5"
                          >
                            <div
                              className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500"
                              data-oid="zb1lniu"
                            >
                              <Clock className="w-4.5 h-4.5" data-oid="vm4r8:k" />
                            </div>
                            <div className="text-left" data-oid="y:fxvz-">
                              <p
                                className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1"
                                data-oid="zvet_v:"
                              >
                                Time Spent
                              </p>
                              <p
                                className="text-2xl font-black text-slate-900 dark:text-white leading-none"
                                data-oid="4nvub33"
                              >
                                {Number.isFinite(testResults.timeMetrics?.totalTimeSpent)
                                  ? `${Math.floor(testResults.timeMetrics.totalTimeSpent / 60)}m`
                                  : Number.isFinite(testResults.durationMinutes)
                                    ? `${Math.floor(testResults.durationMinutes)}m`
                                    : '--'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Guidance & Milestones Grid */}
                        <div
                          className="grid grid-cols-1 md:grid-cols-2 gap-4"
                          data-oid="guidance-grid"
                        >
                          {/* What's Next Guidance */}
                          <WhatsNextCard
                            typeStats={testResults.typeStats}
                            bandScore={parseFloat(testResults.bandScore)}
                            testType={testType}
                            className="h-full"
                            data-oid="ens4h:e"
                          />

                          {/* Target Band Gap Card - Shows progress to next band */}
                          <TargetBandGapCard
                            currentBand={parseFloat(testResults.bandScore)}
                            correctAnswers={testResults.correctAnswers}
                            totalQuestions={testResults.totalQuestions}
                            testType={testType}
                            weakestType={
                              testResults.typeStats
                                ? (() => {
                                    let weakest = null;
                                    Object.entries(testResults.typeStats).forEach(
                                      ([type, stats]) => {
                                        if (stats.total > 0) {
                                          const accuracy = (stats.correct / stats.total) * 100;
                                          if (!weakest || accuracy < weakest.accuracy) {
                                            weakest = { type, accuracy };
                                          }
                                        }
                                      }
                                    );
                                    return weakest;
                                  })()
                                : null
                            }
                            className="h-full"
                            data-oid="target-band-gap"
                          />
                        </div>

                        {/* Passage Analysis Visuals */}
                        <section data-oid="lb4:2zx">
                          <div
                            className="flex items-center justify-between mb-4 px-1"
                            data-oid="sfruxdo"
                          >
                            <h3
                              className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]"
                              data-oid="_u840yb"
                            >
                              {testType === 'listening'
                                ? 'Part Performance'
                                : 'Passage Performance'}
                            </h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3" data-oid="vxlb5m2">
                            {testResults.sectionStats?.map((stat, idx) => (
                              <SectionCard
                                key={idx}
                                index={idx}
                                title={
                                  testType === 'listening'
                                    ? `Part ${idx + 1}`
                                    : `Passage ${idx + 1}`
                                }
                                {...stat}
                                data-oid="43690.f"
                              />
                            ))}
                          </div>
                        </section>

                        {/* Quick Answer Key - moved from Answers tab */}
                        <div
                          className="p-5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm"
                          data-oid="db9w373"
                        >
                          <h3
                            className="text-sm font-black text-slate-900 dark:text-white mb-4 uppercase tracking-wide"
                            data-oid="1v-y731"
                          >
                            Quick Answer Key
                          </h3>
                          <p className="text-xs text-slate-500 mb-6 font-medium" data-oid="ttj3-q5">
                            Click any question number to review details.
                          </p>

                          <div
                            className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3"
                            data-oid="3qwz.ci"
                          >
                            {Array.from({ length: testResults.totalQuestions }).map((_, i) => {
                              const qNum = i + 1;
                              let status = 'unknown';

                              // FIXED: Look up by questionNumber instead of array index
                              // This correctly handles table_completion questions where the
                              // question numbers (6, 7, 8) don't match their array positions
                              const r = Array.isArray(testResults.userResponses)
                                ? testResults.userResponses.find(
                                    (resp) => resp && String(resp.questionNumber) === String(qNum)
                                  )
                                : null;

                              if (r) {
                                // Handle null/undefined isCorrect as skipped (unanswered)
                                if (r.isCorrect === true) {
                                  status = 'correct';
                                } else if (r.isCorrect === false) {
                                  // Explicitly false - check if user answered
                                  status = !r.userAnswer ? 'skipped' : 'wrong';
                                } else {
                                  // isCorrect is null/undefined - treat as skipped
                                  status = 'skipped';
                                }
                              } else if (testResults.correctAnswersMap) {
                                const map = testResults.correctAnswersMap;
                                // Find entry by questionNumber instead of array index
                                const entry = Object.values(map).find(
                                  (v) => v && String(v.questionNumber) === String(qNum)
                                );
                                if (entry) {
                                  // Handle null/undefined isCorrect
                                  if (entry.isCorrect === true) {
                                    status = 'correct';
                                  } else if (entry.isCorrect === false) {
                                    status = !entry.userAnswer ? 'skipped' : 'wrong';
                                  } else {
                                    // isCorrect is null/undefined
                                    status = 'skipped';
                                  }
                                  if (
                                    entry.userAnswer === undefined ||
                                    entry.userAnswer === '' ||
                                    entry.isSkipped
                                  )
                                    status = 'skipped';
                                }
                              }

                              return (
                                <button
                                  key={qNum}
                                  onClick={() => {
                                    if (onNavigateToQuestion) {
                                      onNavigateToQuestion(qNum);
                                    } else {
                                      onReviewAnswers?.();
                                    }
                                  }}
                                  className={cn(
                                    'w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black transition-all hover:scale-110 shadow-sm border-2',
                                    status === 'correct'
                                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                                      : status === 'wrong'
                                        ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                                        : status === 'skipped'
                                          ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500 border-amber-100 dark:border-amber-900/50'
                                          : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700'
                                  )}
                                  data-oid="jhyw645"
                                >
                                  {qNum}
                                </button>
                              );
                            })}
                          </div>

                          <div
                            className="flex justify-center gap-6 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800"
                            data-oid="udnsg_i"
                          >
                            <div className="flex items-center gap-2" data-oid="fn5rigp">
                              <div
                                className="w-3 h-3 rounded-full bg-emerald-500"
                                data-oid="00zy5g2"
                              />

                              <span className="text-xs font-bold text-slate-500" data-oid="blxm8aw">
                                Correct
                              </span>
                            </div>
                            <div className="flex items-center gap-2" data-oid="p1nzcrn">
                              <div
                                className="w-3 h-3 rounded-full bg-rose-500"
                                data-oid="259mfwv"
                              />

                              <span className="text-xs font-bold text-slate-500" data-oid="cp2:dlk">
                                Incorrect
                              </span>
                            </div>
                            <div className="flex items-center gap-2" data-oid="w6qr.n_">
                              <div
                                className="w-3 h-3 rounded-full bg-amber-500"
                                data-oid="gcnyaoi"
                              />

                              <span className="text-xs font-bold text-slate-500" data-oid="gm6s3fd">
                                Skipped/Unknown
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </TabsContent>
                  )}

                  {activeTab === 'analysis' && (
                    <TabsContent
                      value="analysis"
                      forceMount
                      className="m-0 focus-visible:outline-none"
                      data-oid="qve-0s3"
                    >
                      <motion.div
                        key="analysis"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="p-5 lg:p-7 space-y-6"
                        data-oid="22y_iv."
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" data-oid="458146t">
                          <div className="lg:col-span-7 space-y-6" data-oid="4zfd52b">
                            <section
                              className="p-6 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm"
                              data-oid=".d:.-74"
                            >
                              <DetailedSkillBreakdown
                                typeStats={testResults.typeStats}
                                sectionStats={testResults.sectionStats}
                                testType={testType}
                                totalQuestions={testResults.totalQuestions}
                                correctAnswers={testResults.correctAnswers}
                                bandScore={testResults.bandScore}
                                isLocked={!isPremium}
                                onUpgrade={handleUpgrade}
                                data-oid="s-rhgwt"
                              />
                            </section>

                            {isPremium && (
                              <AnswerJourneyCard
                                answerTimestamps={testResults.answerTimestamps || null}
                                totalQuestions={testResults.totalQuestions}
                                totalTimeSeconds={
                                  testResults.timeMetrics?.totalTimeSpent ||
                                  testResults.durationMinutes * 60 ||
                                  3600
                                }
                                testType={testType}
                                data-oid="e2e7xvj"
                              />
                            )}

                            <section data-oid="212x9pg">
                              <div
                                className="flex items-center justify-between mb-4"
                                data-oid="6.k7dgn"
                              >
                                <h3
                                  className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"
                                  data-oid="188gbpz"
                                >
                                  {testType === 'listening' ? 'Part Analysis' : 'Passage Analysis'}
                                </h3>
                              </div>
                              <div className="grid grid-cols-1 gap-3" data-oid="zz75uo9">
                                {testResults.sectionStats?.map((stat, idx) => (
                                  <SectionCard
                                    key={idx}
                                    index={idx}
                                    title={
                                      testType === 'listening'
                                        ? `Part ${idx + 1}`
                                        : `Passage ${idx + 1}`
                                    }
                                    {...stat}
                                    data-oid="fx-d5k7"
                                  />
                                ))}
                              </div>
                            </section>

                            {isPremium && (
                              <CognitiveInsightsCard
                                errorPatterns={testResults.errorPatterns || null}
                                totalQuestions={testResults.totalQuestions}
                                data-oid="t1zzzp2"
                              />
                            )}
                          </div>

                          <div
                            className="lg:col-span-5 space-y-6 flex flex-col items-start"
                            data-oid="m88c8bd"
                          >
                            <section
                              className="w-full p-6 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden flex flex-col items-center group"
                              data-oid="6xblymw"
                            >
                              {/* Decorative Background Elements */}
                              <div
                                className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/5 blur-[50px] rounded-full -ml-16 -mt-16 pointer-events-none group-hover:bg-indigo-500/10 transition-all duration-700"
                                data-oid="2zjdyht"
                              />

                              <div
                                className="absolute bottom-0 right-0 w-48 h-48 bg-purple-500/5 blur-[60px] rounded-full -mr-20 -mb-20 pointer-events-none group-hover:bg-purple-500/10 transition-all duration-700"
                                data-oid=":47r7z0"
                              />

                              <div
                                className="flex items-center justify-between mb-5 relative z-10 w-full"
                                data-oid="1q-rmk9"
                              >
                                <div className="flex items-center gap-3" data-oid="r2a36y5">
                                  <div
                                    className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 transform group-hover:scale-110 transition-transform duration-500"
                                    data-oid="uwqho4b"
                                  >
                                    <Target className="w-5 h-5 text-white" data-oid="yghb32l" />
                                  </div>
                                  <div data-oid="w3g48.g">
                                    <h3
                                      className="text-base font-black text-slate-900 dark:text-white tracking-tight"
                                      data-oid="kl6k-5e"
                                    >
                                      Accuracy Analysis
                                    </h3>
                                    <div
                                      className="flex items-center gap-1.5 mt-0.5"
                                      data-oid="3re07i4"
                                    >
                                      <span
                                        className="w-1 h-1 rounded-full bg-blue-500 animate-pulse"
                                        data-oid="s:cebde"
                                      />

                                      <p
                                        className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]"
                                        data-oid="imnajz5"
                                      >
                                        Performance Metric
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div
                                className="relative py-4 transform group-hover:scale-105 transition-transform duration-500 z-10"
                                data-oid="m.qv1m2"
                              >
                                <AnimatedScoreRing
                                  percentage={testResults.percentage}
                                  score={testResults.bandScore}
                                  size={200}
                                  data-oid="zhf325e"
                                />
                              </div>

                              <div
                                className="w-full mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80 relative z-10"
                                data-oid="m7476qk"
                              >
                                <div className="grid grid-cols-2 gap-3" data-oid="uqi9v.x">
                                  <div
                                    className="flex flex-col items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 transition-all hover:bg-white dark:hover:bg-slate-900 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-1"
                                    data-oid="y7bovti"
                                  >
                                    <p
                                      className="text-2xl font-black text-slate-900 dark:text-white leading-none mb-1"
                                      data-oid="e:5vdvt"
                                    >
                                      {testResults.percentage}%
                                    </p>
                                    <p
                                      className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider"
                                      data-oid="9de9wkh"
                                    >
                                      Accuracy
                                    </p>
                                  </div>
                                  <div
                                    className="flex flex-col items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 transition-all hover:bg-white dark:hover:bg-slate-900 hover:shadow-lg hover:shadow-purple-500/5 hover:-translate-y-1"
                                    data-oid="mqkv-3u"
                                  >
                                    <p
                                      className="text-2xl font-black text-slate-900 dark:text-white leading-none mb-1"
                                      data-oid="al93d61"
                                    >
                                      {testResults.bandScore}
                                    </p>
                                    <p
                                      className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider"
                                      data-oid="zppvvx1"
                                    >
                                      Band Score
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </section>

                            {isPremium ? (
                              <>
                                <SkillGapRadar
                                  skillGaps={testResults.skillGaps || null}
                                  typeStats={testResults.typeStats}
                                  testType={testType}
                                  data-oid="_g58.9_"
                                />

                                <TimeEfficiencyCard
                                  timeMetrics={testResults.timeMetrics || null}
                                  passageProficiency={testResults.passageProficiency || null}
                                  totalQuestions={testResults.totalQuestions}
                                  testType={testType}
                                  data-oid="1x.ninl"
                                />

                                <ActionableInsightsCard
                                  sectionStats={testResults.sectionStats || null}
                                  timePerQuestionSeconds={
                                    testResults.timePerQuestionSeconds || null
                                  }
                                  correctAnswersMap={testResults.correctAnswersMap || null}
                                  totalTimeSeconds={
                                    testResults.timeMetrics?.totalTimeSpent ||
                                    testResults.durationMinutes * 60 ||
                                    3600
                                  }
                                  testType={testType}
                                  data-oid="-xlq3d7"
                                />
                              </>
                            ) : (
                              <div
                                className="relative h-[280px] w-full overflow-hidden rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center bg-slate-50 dark:bg-slate-900/50"
                                data-oid="ejm9-ow"
                              >
                                <PremiumUnlockOverlay
                                  onUpgrade={handleUpgrade}
                                  title="Unlock Pro Analysis"
                                  message="Get detailed breakdown, time tracking, and cognitive insights."
                                  data-oid="o7w.0-0"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    </TabsContent>
                  )}
                </AnimatePresence>
              </div>
            </Tabs>
          </div>

          {/* STICKY FOOTER ACTIONS */}
          <div
            className="p-3 lg:p-4 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 z-50"
            data-oid="ddvagn3"
          >
            <div className="flex items-center gap-3" data-oid="z.i_nlp">
              {!isPremium ? (
                <div
                  className="flex items-center gap-2 group cursor-pointer"
                  onClick={handleUpgrade}
                  data-oid="d5p.d.."
                >
                  <div
                    className="w-7 h-7 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform"
                    data-oid=".y8.lt9"
                  >
                    <Crown className="w-3.5 h-3.5" data-oid="jfw8t9p" />
                  </div>
                  <div className="text-left" data-oid="grp6156">
                    <p
                      className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 leading-tight"
                      data-oid="091s5k-"
                    >
                      Pro Analysis
                    </p>
                    <p
                      className="text-xs font-bold text-slate-500 leading-tight"
                      data-oid="1vcxsj9"
                    >
                      Unlock all insights
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2" data-oid="f3xq0-0">
                  <div
                    className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500"
                    data-oid="d1i.9o_"
                  >
                    <Sparkles className="w-3.5 h-3.5" data-oid="vca_oes" />
                  </div>
                  <div className="text-left" data-oid="e:yr:si">
                    <p
                      className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 leading-tight"
                      data-oid="8zcmlj2"
                    >
                      Premium Active
                    </p>
                    <p
                      className="text-xs font-bold text-slate-500 leading-tight"
                      data-oid="tvwj4f_"
                    >
                      Full analysis visible
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto" data-oid="y6ndnqw">
              <Button
                onClick={onReviewAnswers}
                className="flex-1 sm:min-w-[200px] h-11 rounded-xl font-black text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20"
                data-oid="fhdvm6s"
              >
                Review Mistakes
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 sm:min-w-[160px] h-11 rounded-xl font-black text-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
                data-oid="u97idvk"
              >
                Close
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
