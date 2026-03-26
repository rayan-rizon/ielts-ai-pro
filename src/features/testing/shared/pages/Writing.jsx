import React, { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Search,
  PenTool,
  Clock,
  HelpCircle,
  ArrowRight,
  Play,
  RotateCcw,
  CheckCircle2,
  Brain,
  LayoutGrid,
  List,
  Sparkles,
  ChevronRight,
  GraduationCap,
  Users,
  Target,
  Lock,
  Crown,
  TrendingUp,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { Passage, User } from '@/entities';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/context/AuthContext';

import { useDataQuery } from '@/hooks/useDataQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { createPageUrl } from '@/utils';

const isValidFeedback = (fb) =>
  !!fb &&
  (fb.overallBand !== undefined ||
    fb.overall_band !== undefined ||
    fb.band_score !== undefined ||
    fb.score !== undefined);

const hasValidAiFeedback = (content) => {
  const feedbacks = content?.ai_feedbacks;
  if (!feedbacks) return false;
  return isValidFeedback(feedbacks['Task 1']) || isValidFeedback(feedbacks['Task 2']);
};

const getScoreFromFeedback = (content) => {
  const feedbacks = content?.ai_feedbacks;
  if (!feedbacks) return null;

  const fb =
    (isValidFeedback(feedbacks['Task 1']) && feedbacks['Task 1']) ||
    (isValidFeedback(feedbacks['Task 2']) && feedbacks['Task 2']) ||
    null;

  if (!fb) return null;

  const band = fb.overallBand ?? fb.overall_band ?? fb.band_score ?? fb.score;
  if (band === undefined || band === null) return null;

  const num = Number(band);
  return Number.isFinite(num) ? num : null;
};

const pickLatestSessionForTest = (allSessions, testId) => {
  if (!Array.isArray(allSessions) || allSessions.length === 0) return undefined;

  return allSessions.reduce((latest, s) => {
    const matches = String(s?.passage_id) === testId || String(s?.content_data?.id) === testId;
    if (!matches) return latest;
    if (!latest) return s;

    const latestTime = new Date(latest.created_at || 0).getTime();
    const currentTime = new Date(s.created_at || 0).getTime();
    return currentTime > latestTime ? s : latest;
  }, undefined);
};

const TestCard = ({
  test,
  session,
  completedSession,
  takenCount,
  duration,
  wordLimit,
  user,
  isAdmin,
  hasMounted,
}) => {
  const effectiveSession = session || completedSession;
  const isEffectivelyCompleted =
    (!!completedSession && completedSession.is_completed) ||
    (!!effectiveSession && hasValidAiFeedback(effectiveSession.content_data)) ||
    (!!effectiveSession && effectiveSession.score !== undefined && effectiveSession.score !== null);

  const displayScore =
    effectiveSession?.score ?? getScoreFromFeedback(effectiveSession?.content_data);

  const isResuming = !!session && !session.is_completed && !isEffectivelyCompleted;
  const isCompleted = isEffectivelyCompleted;
  const completedSessionId = effectiveSession?.id;

  // Access Control Logic
  const isLocked = (() => {
    const tier = (user?.subscription_tier || 'free').toLowerCase();
    const hasPremiumAccess = tier === 'pro' || tier === 'premium' || isAdmin;

    if (test.id.startsWith('cambridge-')) {
      return !hasPremiumAccess;
    }
    if (test.access_tier && test.access_tier !== 'free') {
      return !hasPremiumAccess;
    }
    return false;
  })();

  // Calculate progress based on task-specific word counts
  const calculateProgress = () => {
    if (!session) return 0;
    const savedContent = session.user_responses;
    if (!savedContent || !Array.isArray(savedContent) || savedContent.length === 0) return 0;
    const item = savedContent[0];
    if (typeof item !== 'object') return 0;

    let task1Text = item.task1_response || '';
    let task2Text = item.task2_response || '';

    if (!task1Text && !task2Text && item.response) {
      try {
        const parsed = JSON.parse(item.response);
        task1Text = parsed['Task 1'] || '';
        task2Text = parsed['Task 2'] || '';
      } catch (e) {
        task1Text = item.task1_response || '';
        task2Text = item.task2_response || '';
      }
    }

    const countWords = (text) => {
      if (!text) return 0;
      const cleaned = text
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      return cleaned.split(/\s+/).filter((w) => w.length > 0).length;
    };

    const task1Words = countWords(task1Text);
    const task2Words = countWords(task2Text);

    let hasTask2 = false;
    try {
      const testContent =
        typeof test.content === 'string' ? JSON.parse(test.content) : test.content;
      hasTask2 = testContent && testContent['Task 2'];
    } catch (e) {
      hasTask2 = false;
    }

    let progress = 0;
    if (hasTask2) {
      if (task1Words >= 50) progress += 50;
      else progress += Math.min(Math.floor((task1Words / 50) * 50), 49);
      if (task2Words >= 100) progress += 50;
      else progress += Math.min(Math.floor((task2Words / 100) * 50), 49);
    } else {
      if (task1Words >= 50) progress = 100;
      else progress = Math.min(Math.floor((task1Words / 50) * 100), 99);
    }
    return Math.min(progress, 100);
  };
  const progress = calculateProgress();

  // Dynamic color assignment
  const getColor = (str) => {
    const colors = ['orange', 'amber', 'rose', 'indigo', 'blue', 'cyan'];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const colorVariants = {
    orange: {
      gradient:
        'from-orange-50/80 via-white to-white dark:from-orange-900/10 dark:via-[#151515] dark:to-[#151515]',
      hover: 'from-orange-100/50 via-transparent to-transparent dark:from-orange-900/30',
      text: 'text-orange-500 dark:text-orange-400',
      border: 'border-orange-100 dark:border-white/10',
      badge:
        'bg-orange-50 dark:bg-orange-900/30 border-orange-100 dark:border-orange-800 text-orange-700 dark:text-orange-300',
      button:
        'border-orange-600 dark:border-orange-500 text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20',
      ping: 'bg-orange-400',
      dot: 'bg-orange-500',
    },
    amber: {
      gradient:
        'from-amber-50/80 via-white to-white dark:from-amber-900/10 dark:via-[#151515] dark:to-[#151515]',
      hover: 'from-amber-100/50 via-transparent to-transparent dark:from-amber-900/30',
      text: 'text-amber-500 dark:text-amber-400',
      border: 'border-amber-100 dark:border-white/10',
      badge:
        'bg-amber-50 dark:bg-amber-900/30 border-amber-100 dark:border-amber-800 text-amber-700 dark:text-amber-300',
      button:
        'border-amber-600 dark:border-amber-500 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20',
      ping: 'bg-amber-400',
      dot: 'bg-amber-500',
    },
    rose: {
      gradient:
        'from-rose-50/80 via-white to-white dark:from-rose-900/10 dark:via-[#151515] dark:to-[#151515]',
      hover: 'from-rose-100/50 via-transparent to-transparent dark:from-rose-900/30',
      text: 'text-rose-500 dark:text-rose-400',
      border: 'border-rose-100 dark:border-white/10',
      badge:
        'bg-rose-50 dark:bg-rose-900/30 border-rose-100 dark:border-rose-800 text-rose-700 dark:text-rose-300',
      button:
        'border-rose-600 dark:border-rose-500 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20',
      ping: 'bg-rose-400',
      dot: 'bg-rose-500',
    },
    indigo: {
      gradient:
        'from-indigo-50/80 via-white to-white dark:from-indigo-900/10 dark:via-[#151515] dark:to-[#151515]',
      hover: 'from-indigo-100/50 via-transparent to-transparent dark:from-indigo-900/30',
      text: 'text-indigo-500 dark:text-indigo-400',
      border: 'border-indigo-100 dark:border-white/10',
      badge:
        'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300',
      button:
        'border-indigo-600 dark:border-indigo-500 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20',
      ping: 'bg-indigo-400',
      dot: 'bg-indigo-500',
    },
    blue: {
      gradient:
        'from-blue-50/80 via-white to-white dark:from-blue-900/10 dark:via-[#151515] dark:to-[#151515]',
      hover: 'from-blue-100/50 via-transparent to-transparent dark:from-blue-900/30',
      text: 'text-blue-500 dark:text-blue-400',
      border: 'border-blue-100 dark:border-white/10',
      badge:
        'bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300',
      button:
        'border-blue-600 dark:border-blue-500 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20',
      ping: 'bg-blue-400',
      dot: 'bg-blue-500',
    },
    cyan: {
      gradient:
        'from-cyan-50/80 via-white to-white dark:from-cyan-900/10 dark:via-[#151515] dark:to-[#151515]',
      hover: 'from-cyan-100/50 via-transparent to-transparent dark:from-cyan-900/30',
      text: 'text-cyan-500 dark:text-cyan-400',
      border: 'border-cyan-100 dark:border-white/10',
      badge:
        'bg-cyan-50 dark:bg-cyan-900/30 border-cyan-100 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300',
      button:
        'border-cyan-600 dark:border-cyan-500 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20',
      ping: 'bg-cyan-400',
      dot: 'bg-cyan-500',
    },
  };

  let displayTitle = test.title;
  if (test.is_official_cambridge && test.cambridge_year) {
    const bookNumber = test.cambridge_year - 2005;
    displayTitle = `IELTS ${bookNumber} Writing ${test.cambridge_year} Test ${test.cambridge_test_number || test.title.match(/Test\s*(\d+)/i)?.[1] || '1'}`;
  }

  const color = getColor(displayTitle || 'default');
  const Icon = test.test_format?.toLowerCase() === 'academic' ? GraduationCap : PenTool;

  const ContainerLink = isLocked ? 'div' : Link;
  const linkProps = isLocked
    ? { onClick: () => (window.location.href = createPageUrl('Pricing')) }
    : { to: `/writing-task?taskId=${test.id}` };

  return (
    <motion.div
      initial={hasMounted ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn(
        'group relative flex flex-col h-full rounded-[1.5rem] sm:rounded-[2rem] p-4 xs:p-5 sm:p-6 transition-all duration-500 ease-sidebar',
        'bg-white dark:bg-[#121212] border border-slate-200/60 dark:border-white/5',
        `bg-gradient-to-b ${colorVariants[color].gradient}`,
        'shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] hover:shadow-[0_60px_120px_-30px_rgba(0,0,0,0.15)]',
        'dark:shadow-[0_10px_40px_-15px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)]',
        'hover:-translate-y-2 will-change-transform',
        isLocked && 'opacity-90 grayscale-[0.2]'
      )}
      data-oid="_k4u2_e"
    >
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-tr transition-opacity duration-500 opacity-0 group-hover:opacity-100 rounded-[2rem]',
          colorVariants[color].hover
        )}
        data-oid="o9pvpl6"
      />

      <div className="flex justify-between items-start mb-6 relative z-10" data-oid="vu9byh8">
        <div
          className={cn(
            'w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300',
            `bg-white dark:bg-white/5`,
            colorVariants[color].text,
            `shadow-[0_10px_20px_-5px_rgba(0,0,0,0.1)] dark:shadow-none border`,
            colorVariants[color].border,
            'group-hover:scale-110 group-hover:rotate-3'
          )}
          data-oid="a9-urrz"
        >
          <Icon className="w-7 h-7" data-oid="05:_8kx" />
        </div>

        <div className="flex flex-col items-end gap-2.5" data-oid="0cckrht">
          {isLocked ? (
            <div
              className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center shadow-lg transform rotate-12"
              data-oid="27:.nf7"
            >
              <Lock className="w-4 h-4 text-white" data-oid="zxs.:2p" />
            </div>
          ) : isResuming ? (
            <div
              className={cn(
                'flex items-center gap-2 rounded-full px-3 py-1 border',
                colorVariants[color].badge
              )}
              data-oid="_mbeaaq"
            >
              <span className="relative flex h-2 w-2" data-oid="kdfh9bd">
                <span
                  className={cn(
                    'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                    colorVariants[color].ping
                  )}
                  data-oid="r899y3g"
                ></span>
                <span
                  className={cn(
                    'relative inline-flex rounded-full h-2 w-2',
                    colorVariants[color].dot
                  )}
                  data-oid="upr7nn:"
                ></span>
              </span>
              <span className="text-[11px] font-bold tracking-wide uppercase" data-oid="c5yj115">
                In Progress
              </span>
            </div>
          ) : isCompleted ? (
            <div
              className={cn(
                'flex items-center gap-2 rounded-full px-3 py-1 border',
                colorVariants[color].badge
              )}
              data-oid="oc3nnug"
            >
              <CheckCircle2 className="w-3.5 h-3.5" data-oid="749s80g" />
              <span className="text-[11px] font-bold tracking-wide uppercase" data-oid="sz0n4-0">
                Completed
              </span>
            </div>
          ) : (
            <Badge
              variant="outline"
              className="bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 px-3 py-1 text-[11px] font-bold tracking-wider uppercase"
              data-oid="pfo_un_"
            >
              New Task
            </Badge>
          )}
        </div>
      </div>

      <div
        className={cn('mb-6 flex-grow relative z-10', isLocked && 'filter blur-sm select-none')}
        data-oid="r.khxq1"
      >
        <ContainerLink {...linkProps} className="block group/title" data-oid="nxh-d6w">
          <h3
            className={cn(
              'text-xl font-bold text-slate-900 dark:text-white leading-snug mb-2 transition-colors cursor-pointer line-clamp-2',
              `group-hover:${colorVariants[color].text.split(' ')[0]}`
            )}
            data-oid="q_r2i7r"
          >
            {displayTitle}
          </h3>
        </ContainerLink>
        <p
          className="text-sm text-slate-500 dark:text-slate-400 font-medium line-clamp-2"
          data-oid="13gbdvp"
        >
          {test.description || 'Authentic IELTS Writing task practice with AI feedback.'}
        </p>
      </div>

      <div
        className={cn('mb-6 relative z-10 space-y-4', isLocked && 'filter blur-sm select-none')}
        data-oid="wrm-y7."
      >
        <div className="flex flex-wrap items-center gap-2" data-oid="2r3d.ub">
          <div
            className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2"
            data-oid="yu.ubve"
          >
            <Clock className="w-3.5 h-3.5 text-slate-400" data-oid="-y2d13v" />
            <span
              className="text-xs font-semibold text-slate-600 dark:text-slate-300"
              data-oid="czvnx9g"
            >
              {duration || 60} min
            </span>
          </div>
          <div
            className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2"
            data-oid="sow4x7q"
          >
            <Target className="w-3.5 h-3.5 text-slate-400" data-oid="6f64xnc" />
            <span
              className="text-xs font-semibold text-slate-600 dark:text-slate-300"
              data-oid="1ic6vty"
            >
              {wordLimit || 400} Words
            </span>
          </div>
          {takenCount > 0 && (
            <div
              className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2"
              data-oid="pa5m0vj"
            >
              <Users className="w-3.5 h-3.5 text-slate-400" data-oid="re-cxjf" />
              <span
                className="text-xs font-semibold text-slate-600 dark:text-slate-300"
                data-oid="652m9ws"
              >
                {takenCount} Taken
              </span>
            </div>
          )}
        </div>

        {isResuming ? (
          <div
            className="space-y-4 pt-2 border-t border-slate-100 dark:border-white/5"
            data-oid="-691_:i"
          >
            <div
              className="flex justify-between text-xs font-bold tracking-wide"
              data-oid="c2iqc.6"
            >
              <span className="text-slate-700 dark:text-slate-300 uppercase" data-oid="nldkwz1">
                Completion
              </span>
              <span
                className={cn('font-black', colorVariants[color].text.split(' ')[0])}
                data-oid="g8o-c2t"
              >
                {progress}%
              </span>
            </div>
            <Progress
              value={progress}
              className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full"
              indicatorClassName={cn(
                'bg-gradient-to-r',
                color === 'orange' ? 'from-orange-400 to-orange-600' : 'from-amber-400 to-amber-600'
              )}
              data-oid="o:_ykvr"
            />
          </div>
        ) : isCompleted && displayScore !== null && displayScore !== undefined ? (
          <div className="pt-2 border-t border-slate-100 dark:border-white/5" data-oid="s_jm:ja">
            <div className="flex items-center justify-between" data-oid="ju247t:">
              <span
                className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wide uppercase"
                data-oid=":qlq:wt"
              >
                Your Score
              </span>
              <div className="flex items-center gap-2" data-oid="v:r3gzj">
                <span
                  className={cn('text-2xl font-black', colorVariants[color].text.split(' ')[0])}
                  data-oid="kkng572"
                >
                  {typeof displayScore === 'number' ? displayScore.toFixed(1) : displayScore}
                </span>
                <span className="text-xs text-slate-400" data-oid="xt3-_x5">
                  / 9.0
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div
        className="relative z-10 mt-auto pt-2 border-t border-slate-50 dark:border-white/5"
        data-oid="15yrq8t"
      >
        {isLocked ? (
          <Link to={createPageUrl('Pricing')} className="block mt-4" data-oid="ixf:2gs">
            <Button
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl h-11 text-sm shadow-lg transition-all"
              data-oid="gn6vgwj"
            >
              <Crown className="w-4 h-4 mr-2" data-oid="jo544-9" /> Upgrade to Access
            </Button>
          </Link>
        ) : isResuming ? (
          <Link
            to={`/writing-task?sessionId=${session.id}`}
            className="block mt-4"
            data-oid="y2t8cyu"
          >
            <Button
              className={cn(
                'w-full bg-white dark:bg-transparent border-2 font-bold rounded-xl h-11 text-sm shadow-none transition-all',
                colorVariants[color].button
              )}
              data-oid="s6xs6m2"
            >
              Resume Task <Play className="w-3.5 h-3.5 ml-2 fill-current" data-oid=".-4kr_9" />
            </Button>
          </Link>
        ) : isCompleted ? (
          <div className="flex gap-2 mt-4" data-oid="zab9mjp">
            <Link
              to={`/writing-task?sessionId=${completedSessionId}&view=true`}
              className="flex-1"
              data-oid="jfg20.-"
            >
              <Button
                className={cn(
                  'w-full bg-white dark:bg-transparent border-2 font-bold rounded-xl h-11 text-sm shadow-none transition-all',
                  colorVariants[color].button
                )}
                data-oid="k0u:nt6"
              >
                View Feedback <ArrowRight className="w-3.5 h-3.5 ml-2" data-oid=":-av:yx" />
              </Button>
            </Link>
            <Link to={`/writing-task?taskId=${test.id}&new_attempt=true`} data-oid="_dqax-o">
              <Button
                variant="outline"
                className="h-11 px-4 rounded-xl border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                data-oid="hp_onrw"
              >
                <RotateCcw className="w-4 h-4" data-oid="ty4dtj2" />
              </Button>
            </Link>
          </div>
        ) : (
          <Link
            to={`/writing-task?taskId=${test.id}&new_attempt=true`}
            className="block mt-4"
            data-oid="b.7v7n_"
          >
            <Button
              className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-orange-600 dark:hover:bg-orange-500 text-white font-bold rounded-xl h-11 text-sm shadow-lg shadow-slate-900/20 dark:shadow-orange-900/40 transition-all group-hover:scale-[1.02] border-0"
              data-oid="8s0-v3x"
            >
              Start Writing <ChevronRight className="w-4 h-4 ml-1.5" data-oid="7d1d6w:" />
            </Button>
          </Link>
        )}
      </div>
    </motion.div>
  );
};

const MemoizedTestCard = memo(TestCard, (prevProps, nextProps) => {
  return (
    prevProps.test.id === nextProps.test.id &&
    prevProps.session?.id === nextProps.session?.id &&
    prevProps.completedSession?.id === nextProps.completedSession?.id &&
    prevProps.takenCount === nextProps.takenCount &&
    prevProps.duration === nextProps.duration &&
    prevProps.wordLimit === nextProps.wordLimit &&
    prevProps.user?.subscription_tier === nextProps.user?.subscription_tier &&
    prevProps.isAdmin === nextProps.isAdmin &&
    prevProps.hasMounted === nextProps.hasMounted
  );
});

// PERFORMANCE: Accept user from context instead of fetching redundantly
const fetchWritingData = async (user, page = 1, pageSize = 12, existingData = null) => {
  // Use passed user - no more redundant User.me() call!

  // Fetch passages with pagination
  const offset = (page - 1) * pageSize;

  const {
    data: testsData,
    count: totalCount,
    error: passageError,
  } = await supabase
    .from('passages')
    .select(
      'id, title, is_official_cambridge, cambridge_year, cambridge_test_number, test_type, test_format, is_active, total_questions, created_at, duration_minutes',
      { count: 'exact' }
    )
    .eq('test_type', 'writing')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (passageError) {
    console.error('Error fetching passages:', passageError);
  }

  // REVERTED: Use standard select query instead of RPC
  let writingSessions = [];
  const takenCountsResult = await supabase.rpc('get_test_taken_counts', { type_filter: 'writing' });

  // Extract passage IDs for optimized fetching
  const passageIds = testsData?.map((t) => t.id) || [];

  if (user && passageIds.length > 0) {
    const { data, error } = await supabase
      .from('test_sessions')
      .select('id, passage_id, is_completed, score, content_data, created_at, completed_at')
      .eq('user_id', user.id)
      .eq('test_type', 'writing')
      .in('passage_id', passageIds)
      .order('created_at', { ascending: false });

    if (!error && data) {
      writingSessions = data;
    }
  }

  const taken = existingData?.testCounts || {};
  if (takenCountsResult?.data) {
    takenCountsResult.data.forEach((item) => {
      if (item.passage_id) taken[item.passage_id] = item.taken_count;
    });
  }

  const meta = existingData?.testMeta || {};
  if (testsData) {
    testsData.forEach((test) => {
      meta[test.id] = { duration: 60, wordLimit: 400 };
    });
  }

  // Merge with existing passages if loading more
  const allPassages = existingData
    ? [...existingData.passages, ...(testsData || [])]
    : testsData || [];

  // Merge sessions - preserve previous page sessions when loading more
  const newSessionPassageIds = new Set(writingSessions.map((s) => s.passage_id));
  const allSessions = existingData
    ? [
        ...existingData.sessions.filter((s) => !newSessionPassageIds.has(s.passage_id)),
        ...writingSessions,
      ]
    : writingSessions;

  const durs = existingData?.durations || {};
  const wLimits = existingData?.wordLimits || {};

  if (testsData) {
    testsData.forEach((test) => {
      durs[test.id] = test.duration_minutes || (test.test_type === 'task1' ? 20 : 40);
      wLimits[test.id] = test.word_limit || (test.test_type === 'task1' ? 150 : 250);
    });
  }

  return {
    passages: allPassages,
    sessions: allSessions,
    testCounts: taken,
    durations: durs,
    wordLimits: wLimits,
    currentUser: user,
    totalCount: totalCount || 0,
    currentPage: page,
    hasMore: allPassages.length < (totalCount || 0),
  };
};

export default function Writing() {
  // PERFORMANCE: Get user from context instead of refetching
  const { userProfile: userData, isAdmin, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [writingData, setWritingData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Set hasMounted on mount
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Initial load - depends on auth being ready
  // Initial load - depends on auth being ready
  useEffect(() => {
    // Wait for auth to complete before fetching
    if (authLoading) return;

    // Check if we already have data for this user
    if (writingData?.currentUser?.id === userData?.id) return;

    const loadInitialData = async () => {
      if (!writingData) setIsLoading(true);
      try {
        const data = await fetchWritingData(userData, 1, 12);
        setWritingData(data);
      } catch (error) {
        console.error('Error loading writing data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, [userData?.id, authLoading]);
  // userData is now from context, no need for writingData?.currentUser

  // Load more handler - memoized for performance
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !writingData?.hasMore) return;

    setIsLoadingMore(true);
    try {
      const nextPage = (writingData?.currentPage || 1) + 1;
      const moreData = await fetchWritingData(userData, nextPage, 12, writingData);
      setWritingData(moreData);
    } catch (error) {
      console.error('Error loading more tests:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, writingData, userData]);

  const passages = writingData?.passages || [];
  const sessions = writingData?.sessions || [];
  const testCounts = writingData?.testCounts || {};
  const durations = writingData?.durations || {};
  const wordLimits = writingData?.wordLimits || {};

  const tabs = [
    { id: 'all', label: 'All Tasks', icon: LayoutGrid },
    { id: 'cambridge', label: 'Cambridge', icon: Award },
    { id: 'in-progress', label: 'In Progress', icon: Clock },
  ];

  const filteredTests = passages
    .filter((test) => {
      const testId = String(test.id);
      const latestSession = pickLatestSessionForTest(sessions, testId);

      const hasFeedback = hasValidAiFeedback(latestSession?.content_data);
      const isEffectivelyCompleted =
        latestSession?.is_completed ||
        hasFeedback ||
        (latestSession?.score !== undefined && latestSession?.score !== null);
      const isInProgress = !!latestSession && !isEffectivelyCompleted;

      let matchesTab = false;
      if (activeTab === 'all') matchesTab = true;
      else if (activeTab === 'in-progress') matchesTab = isInProgress;
      else if (activeTab === 'cambridge') matchesTab = test.is_official_cambridge;
      else matchesTab = test.test_type?.toLowerCase() === activeTab.toLowerCase();

      const matchesSearch = (test.title || '')
        .toLowerCase()
        .includes(debouncedSearchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <div
      className="min-h-screen bg-[#FDFDFF] dark:bg-[#050505] font-sans text-slate-900 dark:text-slate-100"
      data-oid="t_qr8bg"
    >
      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-4" data-oid="r7c-88f">
        {/* Header Section */}
        <div
          className="relative group overflow-hidden rounded-[2.5rem] p-3 md:p-4 border border-orange-200/60 dark:border-orange-800/40 bg-gradient-to-br from-orange-50/80 via-white to-amber-50/80 dark:from-orange-500/5 dark:via-transparent dark:to-amber-500/5 backdrop-blur-3xl shadow-xl shadow-orange-500/10 dark:shadow-orange-500/20"
          data-oid="gkyc.o."
        >
          <div
            className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-orange-500/5 to-transparent -z-10"
            data-oid="6m1s7rb"
          />

          <div
            className="absolute -top-24 -right-24 w-80 h-80 bg-orange-400/10 dark:bg-orange-500/10 rounded-full blur-[80px] -z-10 group-hover:scale-110 transition-transform duration-1000"
            data-oid="ogrgxnp"
          />

          <div
            className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10"
            data-oid="jz4eiud"
          >
            <div className="space-y-4 max-w-2xl" data-oid="3cn5nhl">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-600/5 dark:bg-orange-400/10 border border-orange-500/10 text-orange-600 dark:text-orange-400 text-[9px] font-black uppercase tracking-[0.2em] backdrop-blur-md"
                data-oid="1lrleuj"
              >
                <Sparkles className="w-3 h-3" data-oid="kyxhk4b" />
                <span data-oid="abvnsmn">Premium Writing Hub</span>
              </motion.div>

              <div className="space-y-2" data-oid="4za07ag">
                <h1
                  className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight"
                  data-oid="ex2pcv4"
                >
                  Writing{' '}
                  <span
                    className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-600 to-red-600 dark:from-orange-400 dark:via-amber-400 dark:to-red-400"
                    data-oid="hu7lx0z"
                  >
                    Library
                  </span>
                </h1>
                <p
                  className="text-slate-500 dark:text-slate-400 text-base md:text-lg font-medium leading-relaxed max-w-lg"
                  data-oid="x09z8xk"
                >
                  Master IELTS writing with structured tasks, expert templates, and instant AI
                  feedback.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 items-center" data-oid="gkcxyyh">
                <div
                  className="flex items-center gap-3 bg-white/60 dark:bg-white/5 border border-white dark:border-white/10 px-3 py-2 rounded-2xl shadow-sm backdrop-blur-xl"
                  data-oid="_ckibxb"
                >
                  <div
                    className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20"
                    data-oid="e35ge7a"
                  >
                    <TrendingUp className="w-4 h-4" data-oid="lu6guoq" />
                  </div>
                  <div className="flex flex-col" data-oid="zgmhd-y">
                    <h4
                      className="text-base font-black text-slate-900 dark:text-white leading-none"
                      data-oid="jppg-gk"
                    >
                      84%
                    </h4>
                    <span
                      className="text-[9px] font-bold text-slate-500 uppercase tracking-wider"
                      data-oid="-6n1jox"
                    >
                      Success
                    </span>
                  </div>
                </div>
                <div
                  className="flex items-center gap-3 bg-white/60 dark:bg-white/5 border border-white dark:border-white/10 px-3 py-2 rounded-2xl shadow-sm backdrop-blur-xl"
                  data-oid="956p-9h"
                >
                  <div
                    className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20"
                    data-oid="1cyl3no"
                  >
                    <Award className="w-4 h-4" data-oid=":lw_fwx" />
                  </div>
                  <div className="flex flex-col" data-oid="ofw1mrg">
                    <h4
                      className="text-base font-black text-slate-900 dark:text-white leading-none"
                      data-oid="bgtmq6r"
                    >
                      Official
                    </h4>
                    <span
                      className="text-[9px] font-bold text-slate-500 uppercase tracking-wider"
                      data-oid="3hf0qci"
                    >
                      Content
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Library Insights Card */}
            <div className="lg:block hidden" data-oid="g0vddyu">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative p-1"
                data-oid="hhbcfg4"
              >
                <div
                  className="absolute -inset-2 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-[2.5rem] blur-xl opacity-50 group-hover:opacity-100 transition-opacity"
                  data-oid="o9pvfq6"
                />

                <div
                  className="relative w-72 bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl border border-white dark:border-white/10 rounded-[2rem] p-4 shadow-2xl overflow-hidden"
                  data-oid="z814.-x"
                >
                  <div className="absolute top-0 right-0 p-4" data-oid="915bgnt">
                    <div
                      className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center border border-orange-500/20"
                      data-oid=":he-p7b"
                    >
                      <Target
                        className="w-5 h-5 text-orange-600 dark:text-orange-400"
                        data-oid="djb4fgh"
                      />
                    </div>
                  </div>

                  <div className="space-y-3" data-oid="pci6i0b">
                    <div className="flex flex-col" data-oid="qnh0te3">
                      <span
                        className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-1"
                        data-oid="5bhcwh4"
                      >
                        Weekly Target
                      </span>
                      <h4
                        className="text-xl font-black text-slate-900 dark:text-white"
                        data-oid="1gevuh8"
                      >
                        Writing Mastery
                      </h4>
                    </div>

                    <div className="space-y-3" data-oid="jx_vzhm">
                      <div className="flex justify-between items-end" data-oid="mchgupj">
                        <span className="text-xs font-bold text-slate-500" data-oid="z0zrf-k">
                          5 of 8 Tasks Completed
                        </span>
                        <span className="text-sm font-black text-orange-600" data-oid="gp-fug5">
                          62%
                        </span>
                      </div>
                      <div
                        className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden p-[1px] border border-slate-200 dark:border-white/5"
                        data-oid="3uf--9:"
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: '62%' }}
                          className="h-full bg-gradient-to-r from-orange-600 to-amber-600 rounded-full shadow-[0_0_10px_rgba(234,88,12,0.4)]"
                          data-oid="ki_x.p2"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2" data-oid="daej..l">
                      <div
                        className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 border border-slate-100 dark:border-white/5"
                        data-oid="cnnh6.1"
                      >
                        <div className="flex items-center gap-2 mb-1" data-oid="0a0zvcr">
                          <PenTool className="w-3.5 h-3.5 text-orange-500" data-oid=":.hyqn1" />
                          <span
                            className="text-lg font-black text-slate-900 dark:text-white leading-none"
                            data-oid="-bxrars"
                          >
                            {passages.length}
                          </span>
                        </div>
                        <span
                          className="text-[9px] font-bold text-slate-500 uppercase tracking-wider"
                          data-oid="a7ap65r"
                        >
                          Total Tasks
                        </span>
                      </div>
                      <div
                        className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 border border-slate-100 dark:border-white/5"
                        data-oid="drrq14y"
                      >
                        <div className="flex items-center gap-2 mb-1" data-oid="y98-ao3">
                          <Users className="w-3.5 h-3.5 text-emerald-500" data-oid="np7k8t3" />
                          <span
                            className="text-lg font-black text-slate-900 dark:text-white leading-none"
                            data-oid=".b9ybq2"
                          >
                            1.8k
                          </span>
                        </div>
                        <span
                          className="text-[9px] font-bold text-slate-500 uppercase tracking-wider"
                          data-oid="2u2h-8x"
                        >
                          Active Users
                        </span>
                      </div>
                    </div>
                  </div>
                  <div
                    className="absolute -bottom-6 -right-6 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl"
                    data-oid="cvc4tb6"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        <div className="sticky top-4 z-40 px-1" data-oid="v0m1rfc">
          <div
            className="bg-white/80 dark:bg-[#0c0c0c]/80 backdrop-blur-3xl p-1.5 rounded-[1.8rem] md:rounded-[2.5rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] border border-slate-200/60 dark:border-white/10 flex flex-col lg:flex-row gap-2 lg:gap-4 items-center justify-between"
            data-oid="cb:jj24"
          >
            <div className="relative w-full lg:w-96 group" data-oid="843tr35">
              <div
                className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none"
                data-oid="r1:o:5n"
              >
                <Search
                  className="h-5 w-5 text-slate-400 group-focus-within:text-orange-500 transition-all duration-300 group-focus-within:scale-110"
                  data-oid="cm1ra4b"
                />
              </div>
              <Input
                placeholder="Find a task..."
                className="pl-14 h-11 md:h-14 bg-slate-100/50 dark:bg-white/5 border-none focus-visible:ring-2 focus-visible:ring-orange-500/20 rounded-[1.2rem] md:rounded-[1.5rem] text-sm md:text-base font-medium placeholder:text-slate-400 transition-all group-hover:bg-slate-100 dark:group-hover:bg-white/[0.08]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-oid="ny48c5d"
              />
            </div>

            <div
              className="flex items-center bg-white/60 dark:bg-white/5 backdrop-blur-xl p-2 rounded-2xl gap-2 w-full lg:w-auto overflow-x-auto no-scrollbar border border-slate-200/50 dark:border-white/10 px-3 lg:p-2"
              data-oid="818-g7u"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 rounded-xl md:rounded-2xl text-[10px] md:text-sm font-bold transition-all duration-300 whitespace-nowrap shrink-0 lg:flex-none uppercase tracking-wider',
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
                  )}
                  data-oid="pt6e2ac"
                >
                  <tab.icon className="w-4 h-4" data-oid="b4l3lsx" />
                  {tab.label}
                </button>
              ))}
            </div>

            <div
              className="hidden lg:flex items-center gap-4 px-6 border-l border-slate-200 dark:border-white/10 h-10"
              data-oid="2m3d5dt"
            >
              <div
                className="flex items-center gap-3 text-slate-400 hover:text-orange-500 transition-colors cursor-pointer group/view"
                data-oid="9vmiask"
              >
                <LayoutGrid
                  className="w-5 h-5 group-hover/view:scale-110 transition-transform"
                  data-oid="fqtf44."
                />

                <span className="text-xs font-black uppercase tracking-[0.1em]" data-oid="ak4vjyu">
                  Grid
                </span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500/20" data-oid="bg.5or5" />
              <div
                className="flex items-center gap-3 text-slate-300 dark:text-slate-700 cursor-not-allowed"
                data-oid="2j_mnta"
              >
                <List className="w-5 h-5" data-oid="at01rz2" />
                <span className="text-xs font-black uppercase tracking-[0.1em]" data-oid="7n0_zo7">
                  List
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tests Grid */}
        <div className="min-h-[600px]" data-oid="wex:qw8">
          {isLoading ? (
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8"
              data-oid="q61u_id"
            >
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-[#111111] rounded-2xl border border-slate-200 dark:border-white/5 p-6 flex flex-col h-full h-[400px]"
                  data-oid="2d804an"
                >
                  <div className="flex justify-between items-start mb-6" data-oid="cn292:d">
                    <Skeleton className="w-12 h-12 rounded-xl" data-oid="3rlo03b" />
                    <Skeleton className="h-6 w-20 rounded-lg" data-oid="qsdqolm" />
                  </div>
                  <div className="flex-grow space-y-4 shadow-none" data-oid=":pzsp8x">
                    <Skeleton className="h-7 w-3/4 rounded-lg" data-oid="73k:s9g" />
                    <Skeleton className="h-4 w-full rounded-lg" data-oid="qi342e." />
                  </div>
                  <Skeleton className="h-12 w-full rounded-xl mt-6" data-oid="jbb.5d4" />
                </div>
              ))}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8"
                data-oid="5.erghn"
              >
                {filteredTests.map((test) => {
                  const testId = String(test.id);
                  const latestSession = pickLatestSessionForTest(sessions, testId);
                  const hasFeedback = hasValidAiFeedback(latestSession?.content_data);
                  const isEffectivelyCompleted =
                    latestSession?.is_completed ||
                    hasFeedback ||
                    (latestSession?.score !== undefined && latestSession?.score !== null);
                  const session =
                    latestSession && !isEffectivelyCompleted ? latestSession : undefined;
                  const completedSession =
                    latestSession && isEffectivelyCompleted ? latestSession : undefined;

                  return (
                    <MemoizedTestCard
                      key={testId}
                      test={test}
                      session={session}
                      completedSession={completedSession}
                      takenCount={testCounts[test.id] || 0}
                      duration={durations[test.id]}
                      wordLimit={wordLimits[test.id]}
                      user={userData}
                      isAdmin={isAdmin}
                      hasMounted={hasMounted}
                      data-oid="hz6:45x"
                    />
                  );
                })}
                {filteredTests.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="col-span-full py-24 text-center bg-transparent"
                    data-oid="p2zjnef"
                  >
                    <div
                      className="w-24 h-24 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6"
                      data-oid="rc79rf2"
                    >
                      <PenTool
                        className="w-10 h-10 text-slate-300 dark:text-slate-600"
                        data-oid="8xium.d"
                      />
                    </div>
                    <h3
                      className="text-xl font-bold text-slate-900 dark:text-white mb-2"
                      data-oid="lv_4mec"
                    >
                      No tasks available
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400" data-oid="o-_p36c">
                      Admins haven't added any tasks yet.
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
        {/* Load More Trigger / Button */}
        {writingData?.hasMore && (
          <div className="flex justify-center mt-12 pb-12" data-oid="tz6lhrv">
            <Button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              variant="outline"
              className="rounded-full px-8 h-12 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold tracking-wide hover:bg-white dark:hover:bg-white/5 hover:border-orange-200 dark:hover:border-orange-900 transition-all shadow-sm"
              data-oid=":zzein4"
            >
              {isLoadingMore ? (
                <>
                  <div
                    className="w-4 h-4 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin mr-2"
                    data-oid="8tzdpys"
                  />
                  Loading...
                </>
              ) : (
                'Load More Tests'
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
