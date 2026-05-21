import React, { useState, useEffect, memo, useCallback } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';
import {
  Search,
  BookOpen,
  Clock,
  HelpCircle,
  ArrowRight,
  Play,
  RotateCcw,
  CheckCircle2,
  LayoutGrid,
  List,
  Sparkles,
  ChevronRight,
  GraduationCap,
  Users,
  Lock,
  Crown,
  TrendingUp,
  Target,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

import { useDebounce } from '@/hooks/useDebounce';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/features/auth/context/AuthContext';

const TestCard = ({
  test,
  session,
  completedSession,
  takenCount,
  questionCount,
  duration,
  user,
  isAdmin,
  hasMounted,
}) => {
  const isResuming = !!session && !session.is_completed;
  const isCompleted = !!completedSession && completedSession.is_completed;

  // Access Control Logic
  const isLocked = (() => {
    if (test.access_tier && test.access_tier !== 'free') {
      return !(
        user?.subscription_tier === 'pro' ||
        user?.subscription_tier === 'premium' ||
        isAdmin
      );
    }
    return false;
  })();

  // Calculate progress if resuming
  const progress = isResuming
    ? Math.round(
        ((session.completed_questions || Object.keys(session.user_responses || {}).length || 0) /
          (test.total_questions || questionCount || 40)) *
          100
      )
    : 0;

  // Dynamic color assignment based on title hash
  const getColor = (str) => {
    const colors = ['violet', 'orange', 'blue', 'indigo', 'rose', 'cyan'];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const colorVariants = {
    violet: {
      gradient:
        'from-violet-50/80 via-white to-white dark:from-violet-900/10 dark:via-[#151515] dark:to-[#151515]',
      hover: 'from-violet-100/50 via-transparent to-transparent dark:from-violet-900/30',
      text: 'text-violet-500 dark:text-violet-400',
      border: 'border-violet-100 dark:border-white/10',
      badge:
        'bg-violet-50 dark:bg-violet-900/30 border-violet-100 dark:border-violet-800 text-violet-700 dark:text-violet-300',
      button:
        'border-violet-600 dark:border-violet-500 text-violet-700 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20',
      ping: 'bg-violet-400',
      dot: 'bg-violet-500',
    },
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
  };

  let displayTitle = test.title;
  if (test.is_official_cambridge && test.cambridge_year) {
    const bookNumber = test.cambridge_year - 2005;
    displayTitle = `IELTS ${bookNumber} Reading ${test.cambridge_year} Test ${test.cambridge_test_number || test.title.match(/Test\s*(\d+)/i)?.[1] || '1'}`;
  }

  const color = getColor(displayTitle || 'default');
  const Icon = test.test_format?.toLowerCase() === 'academic' ? GraduationCap : BookOpen;

  const ContainerLink = isLocked ? 'div' : Link;
  const linkProps = isLocked
    ? { onClick: () => (window.location.href = createPageUrl('Pricing')) }
    : {
        to: isResuming
          ? `/reading-test/${session.id}`
          : isCompleted
            ? `/reading-test/${completedSession.id}`
            : `/reading-test?test-id=${test.id}`,
      };

  return (
    <m.div
      initial={hasMounted ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn(
        'group relative flex flex-col h-full rounded-[1.5rem] sm:rounded-[2rem] p-4 xs:p-5 sm:p-6 transition-all duration-500 ease-sidebar',
        'bg-white dark:bg-[#121212] border border-slate-200/60 dark:border-white/5',
        // Base Gradient (Static lookup)
        `bg-gradient-to-b ${colorVariants[color].gradient}`,
        'shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] hover:shadow-[0_60px_120px_-30px_rgba(0,0,0,0.15)]',
        'dark:shadow-[0_10px_40px_-15px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)]',
        'hover:-translate-y-2 will-change-transform',
        isLocked && 'opacity-90 grayscale-[0.2]'
      )}
      data-oid="kznwcsl"
    >
      {/* Subtle Gradient Overlay on Hover - intensified */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-tr transition-opacity duration-500 opacity-0 group-hover:opacity-100 rounded-[2rem]',
          colorVariants[color].hover
        )}
        data-oid="6oom_dy"
      />

      <div className="flex justify-between items-start mb-6 relative z-10" data-oid="7243sbp">
        <div
          className={cn(
            'w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300',
            `bg-white dark:bg-white/5`,
            colorVariants[color].text,
            `shadow-[0_10px_20px_-5px_rgba(0,0,0,0.1)] dark:shadow-none border`,
            colorVariants[color].border,
            'group-hover:scale-110 group-hover:rotate-3'
          )}
          data-oid="hwmntep"
        >
          <Icon className="w-7 h-7" data-oid="kfw2o4t" />
        </div>

        <div className="flex flex-col items-end gap-2.5" data-oid="iis2dge">
          {isLocked ? (
            <div
              className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center shadow-lg transform rotate-12"
              data-oid="jx_c_07"
            >
              <Lock className="w-4 h-4 text-white" data-oid="xo3i_dy" />
            </div>
          ) : isResuming ? (
            <div
              className={cn(
                'flex items-center gap-2 rounded-full px-3 py-1 border',
                colorVariants[color].badge
              )}
              data-oid="ym.thci"
            >
              <span className="relative flex h-2 w-2" data-oid="4cnsne.">
                <span
                  className={cn(
                    'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                    colorVariants[color].ping
                  )}
                  data-oid="gsdkoz1"
                ></span>
                <span
                  className={cn(
                    'relative inline-flex rounded-full h-2 w-2',
                    colorVariants[color].dot
                  )}
                  data-oid="y3bg-tn"
                ></span>
              </span>
              <span className="text-[11px] font-bold tracking-wide uppercase" data-oid="l8u4l2c">
                In Progress
              </span>
            </div>
          ) : isCompleted ? (
            <div
              className={cn(
                'flex items-center gap-2 rounded-full px-3 py-1 border',
                colorVariants[color].badge
              )}
              data-oid="w4vpfj-"
            >
              <CheckCircle2 className="w-3.5 h-3.5" data-oid="c6-sh8k" />
              <span className="text-[11px] font-bold tracking-wide uppercase" data-oid="fasg:of">
                Completed
              </span>
            </div>
          ) : (
            <Badge
              variant="outline"
              className="bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 px-3 py-1 text-[11px] font-bold tracking-wider uppercase"
              data-oid="5rlvbu5"
            >
              New Test
            </Badge>
          )}
        </div>
      </div>

      {/* Title and Description */}
      <div
        className={cn('mb-6 flex-grow relative z-10', isLocked && 'filter blur-sm select-none')}
        data-oid="zkj9a0t"
      >
        <ContainerLink {...linkProps} className="block group/title" data-oid="3wc-6qv">
          <h3
            className={cn(
              'text-xl font-bold text-slate-900 dark:text-white leading-snug mb-2 transition-colors cursor-pointer line-clamp-2',
              `group-hover:${colorVariants[color].text.split(' ')[0]}`
            )}
            data-oid="ro8v-ow"
          >
            {displayTitle}
          </h3>
        </ContainerLink>
        <p
          className="text-sm text-slate-500 dark:text-slate-400 font-medium line-clamp-2"
          data-oid="53.i6u:"
        >
          {test.description || 'Authentic IELTS Reading practice with curated passages.'}
        </p>
      </div>

      {/* Meta Bar */}
      <div
        className={cn('mb-6 relative z-10 space-y-4', isLocked && 'filter blur-sm select-none')}
        data-oid="poq6spf"
      >
        <div className="flex flex-wrap items-center gap-2" data-oid="1:75gmx">
          <div
            className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2"
            data-oid="1dr4wej"
          >
            <Clock className="w-3.5 h-3.5 text-slate-400" data-oid="4iuckbh" />
            <span
              className="text-xs font-semibold text-slate-600 dark:text-slate-300"
              data-oid="hcu16dd"
            >
              {duration} min
            </span>
          </div>
          <div
            className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2"
            data-oid="chqdca8"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" data-oid="hdn9t8g" />
            <span
              className="text-xs font-semibold text-slate-600 dark:text-slate-300"
              data-oid="27c3f.7"
            >
              {questionCount} Qs
            </span>
          </div>
          {takenCount > 0 && (
            <div
              className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2"
              data-oid="3x1tv_1"
            >
              <Users className="w-3.5 h-3.5 text-slate-400" data-oid="8io1hgn" />
              <span
                className="text-xs font-semibold text-slate-600 dark:text-slate-300"
                data-oid="acfxxw8"
              >
                {takenCount} Taken
              </span>
            </div>
          )}
        </div>

        {/* Progress or Score */}
        {isResuming ? (
          <div
            className="space-y-4 pt-2 border-t border-slate-100 dark:border-white/5"
            data-oid="i3sj1k8"
          >
            <div
              className="flex justify-between text-xs font-bold tracking-wide"
              data-oid="49_bho0"
            >
              <span className="text-slate-700 dark:text-slate-300 uppercase" data-oid="ilb5gxy">
                Completion
              </span>
              <span
                className={cn('font-black', colorVariants[color].text.split(' ')[0])}
                data-oid="ih.cv4u"
              >
                {progress}%
              </span>
            </div>
            <Progress
              value={progress}
              className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full"
              indicatorClassName={cn(
                'bg-gradient-to-r',
                color === 'violet'
                  ? 'from-violet-500 to-indigo-600'
                  : color === 'orange'
                    ? 'from-orange-400 to-orange-600'
                    : color === 'cyan'
                      ? 'from-cyan-400 to-cyan-600'
                      : color === 'blue'
                        ? 'from-blue-400 to-blue-600'
                        : color === 'rose'
                          ? 'from-rose-400 to-rose-600'
                          : 'from-indigo-400 to-indigo-600'
              )}
              data-oid="z.a866b"
            />
          </div>
        ) : isCompleted && completedSession?.score !== undefined ? (
          <div className="pt-2 border-t border-slate-100 dark:border-white/5" data-oid="qpmbtc_">
            <div className="flex items-center justify-between" data-oid="roj4ndc">
              <span
                className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wide uppercase"
                data-oid="hy8h1cb"
              >
                Your Score
              </span>
              <div className="flex items-center gap-2" data-oid="::krmiq">
                <span
                  className={cn('text-2xl font-black', colorVariants[color].text.split(' ')[0])}
                  data-oid="5aeli2w"
                >
                  {typeof completedSession.score === 'number'
                    ? completedSession.score.toFixed(1)
                    : completedSession.score}
                </span>
                <span className="text-xs text-slate-400" data-oid="tjsedhl">
                  / 9.0
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Actions */}
      <div
        className="relative z-10 mt-auto pt-2 border-t border-slate-50 dark:border-white/5"
        data-oid="j-ihb1_"
      >
        {isLocked ? (
          <Link to={createPageUrl('Pricing')} className="block mt-4" data-oid="p:qw.u8">
            <Button
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl h-11 text-sm shadow-lg transition-all"
              data-oid=".z4b.pp"
            >
              <Crown className="w-4 h-4 mr-2" data-oid="ybgertq" /> Upgrade to Access
            </Button>
          </Link>
        ) : isResuming ? (
          <Link to={`/reading-test/${session.id}`} className="block mt-4" data-oid="dpbkae:">
            <Button
              className={cn(
                'w-full bg-white dark:bg-transparent border-2 font-bold rounded-xl h-11 text-sm shadow-none transition-all',
                colorVariants[color].button
              )}
              data-oid="ru02_92"
            >
              Resume Test <Play className="w-3.5 h-3.5 ml-2 fill-current" data-oid="-t13h0_" />
            </Button>
          </Link>
        ) : isCompleted ? (
          <div className="flex gap-2 mt-4" data-oid="w7xpwnp">
            <Link
              to={`/reading-test/${completedSession.id}?view-results=true`}
              className="flex-1"
              data-oid="pa5e:mx"
            >
              <Button
                className={cn(
                  'w-full bg-white dark:bg-transparent border-2 font-bold rounded-xl h-11 text-sm shadow-none transition-all',
                  colorVariants[color].button
                )}
                data-oid="1.0n5kb"
              >
                View Results <ArrowRight className="w-3.5 h-3.5 ml-2" data-oid="2nb6rv2" />
              </Button>
            </Link>
            <Link to={`/reading-test?test-id=${test.id}&retake=true`} data-oid="2:6nne9">
              <Button
                variant="outline"
                className="h-11 px-4 rounded-xl border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                data-oid="1q78zwe"
              >
                <RotateCcw className="w-4 h-4" data-oid="515r7cu" />
              </Button>
            </Link>
          </div>
        ) : (
          <Link to={`/reading-test?test-id=${test.id}`} className="block mt-4" data-oid="5dnutpa">
            <Button
              className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold rounded-xl h-11 text-sm shadow-lg shadow-slate-900/20 dark:shadow-blue-900/40 transition-all group-hover:scale-[1.02] border-0"
              data-oid="s9zb8u5"
            >
              Start Practice <ChevronRight className="w-4 h-4 ml-1.5" data-oid="g-or.q6" />
            </Button>
          </Link>
        )}
      </div>
    </m.div>
  );
};

// Memoize TestCard to prevent re-renders when grid re-filters
const MemoizedTestCard = memo(TestCard, (prevProps, nextProps) => {
  return (
    prevProps.test.id === nextProps.test.id &&
    prevProps.session?.id === nextProps.session?.id &&
    prevProps.completedSession?.id === nextProps.completedSession?.id &&
    prevProps.takenCount === nextProps.takenCount &&
    prevProps.questionCount === nextProps.questionCount &&
    prevProps.duration === nextProps.duration &&
    prevProps.user?.subscription_tier === nextProps.user?.subscription_tier &&
    prevProps.isAdmin === nextProps.isAdmin &&
    prevProps.hasMounted === nextProps.hasMounted
  );
});

// PERFORMANCE: Accept user from context instead of fetching redundantly
const fetchReadingData = async (user, page = 1, pageSize = 12, existingData = null) => {
  // Use passed user - no more redundant User.me() call!

  // Fetch passages with pagination
  const offset = (page - 1) * pageSize;

  // Build paginated query
  const {
    data: testsData,
    count: totalCount,
    error: passageError,
  } = await supabase
    .from('passages')
    .select(
      'id, title, is_official_cambridge, cambridge_year, cambridge_test_number, test_type, test_format, is_active, total_questions, created_at',
      { count: 'exact' }
    )
    .eq('test_type', 'reading')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (passageError) {
    console.error('Error fetching passages:', passageError);
  }

  // Extract passage IDs for optimized fetching
  const passageIds = testsData?.map((t) => t.id) || [];

  // Parallel fetch for sessions and counts
  const [sessionsResult, takenCountsResult] = await Promise.all([
    user && passageIds.length > 0
      ? supabase
          .from('test_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('test_type', 'reading')
          .in('passage_id', passageIds)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    supabase.rpc('get_test_taken_counts', { type_filter: 'reading' }),
  ]);

  // Process session data (Handle multiple sessions per passage - pick latest)
  const sessionsData = sessionsResult?.data || [];
  const sessionsByPassage = {};

  // Sort by created_at desc to ensuring we process latest first
  sessionsData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  sessionsData.forEach((s) => {
    // Only keep the first (latest) session we encounter for each passage
    if (s.passage_id && !sessionsByPassage[s.passage_id]) {
      sessionsByPassage[s.passage_id] = {
        id: s.id,
        passage_id: s.passage_id,
        is_completed: s.is_completed,
        score: s.score,
        progress:
          s.progress_percentage ||
          (s.user_responses
            ? Math.round(
                (Object.keys(s.user_responses).length / (s.content_data?.total_questions || 40)) *
                  100
              )
            : 0),
        content_data: s.content_data || { passage_id: s.passage_id },
        user_responses: s.user_responses || {},
        completed_questions: s.user_responses ? Object.keys(s.user_responses).length : 0,
        created_at: s.created_at,
        completed_at: s.completed_at,
      };
    }
  });

  // Process global taken counts from RPC
  const taken = existingData?.testCounts || {};
  if (takenCountsResult?.data) {
    takenCountsResult.data.forEach((item) => {
      if (item.passage_id) {
        taken[item.passage_id] = item.taken_count;
      }
    });
  }

  // Use pre-computed question counts from passages table OR calculate from content
  const qCounts = existingData?.questionCounts || {};
  const durs = existingData?.durations || {};

  if (testsData) {
    testsData.forEach((test) => {
      // Use total_questions from DB if available
      qCounts[test.id] = test.total_questions || 40;

      // Default duration to 60 minutes (IELTS standard)
      durs[test.id] = 60;
    });
  }

  // Convert sessionsByPassage back to array format for compatibility
  const newSessionsArray = Object.values(sessionsByPassage);

  // Merge with existing sessions if loading more (preserve previous page sessions)
  const allSessions = existingData
    ? [
        ...existingData.sessions.filter((s) => !sessionsByPassage[s.passage_id]),
        ...newSessionsArray,
      ]
    : newSessionsArray;

  // Merge with existing passages if loading more
  const allPassages = existingData
    ? [...existingData.passages, ...(testsData || [])]
    : testsData || [];

  return {
    passages: allPassages,
    sessions: allSessions,
    testCounts: taken,
    questionCounts: qCounts,
    durations: durs,
    currentUser: user,
    totalCount: totalCount || 0,
    currentPage: page,
    hasMore: allPassages.length < (totalCount || 0),
  };
};

export default function Reading() {
  // PERFORMANCE: Get user from context instead of refetching
  const { userProfile: userData, isAdmin, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [readingData, setReadingData] = useState(null);
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
    if (readingData?.currentUser?.id === userData?.id) return;

    const loadInitialData = async () => {
      if (!readingData) setIsLoading(true);
      try {
        const data = await fetchReadingData(userData, 1, 12);
        setReadingData(data);
      } catch (error) {
        console.error('Error loading reading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, [userData, authLoading, readingData]);
  // userData is now from context, no need for readingData?.currentUser

  // Load more handler - memoized for performance
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !readingData?.hasMore) return;

    setIsLoadingMore(true);
    try {
      const nextPage = (readingData?.currentPage || 1) + 1;
      const moreData = await fetchReadingData(userData, nextPage, 12, readingData);
      setReadingData(moreData);
    } catch (error) {
      console.error('Error loading more tests:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, readingData, userData]);

  const passages = readingData?.passages || [];
  const sessions = readingData?.sessions || [];
  const testCounts = readingData?.testCounts || {};
  const questionCounts = readingData?.questionCounts || {};
  const durations = readingData?.durations || {};

  const tabs = [
    { id: 'all', label: 'All Tests', icon: LayoutGrid },
    { id: 'cambridge', label: 'Cambridge', icon: Award },
    { id: 'in-progress', label: 'In Progress', icon: Clock },
  ];

  const filteredTests = passages
    .filter((test) => {
      // Find active session for this test (RPC returns one session per test with passage_id)
      const session = sessions.find((s) => s.passage_id === test.id && !s.is_completed);

      let matchesTab = false;
      if (activeTab === 'all') {
        matchesTab = true;
      } else if (activeTab === 'in-progress') {
        matchesTab = !!session;
      } else if (activeTab === 'cambridge') {
        matchesTab = test.is_official_cambridge;
      } else if (activeTab === 'academic') {
        matchesTab = test.test_format?.toLowerCase() === 'academic';
      } else {
        matchesTab =
          test.test_type?.toLowerCase() === activeTab.toLowerCase() ||
          test.type?.toLowerCase() === activeTab.toLowerCase() ||
          test.test_format?.toLowerCase() === activeTab.toLowerCase();
      }

      // Check if title or description matches debounced search
      const matchesSearch =
        (test.title || '').toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        (test.description &&
          test.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase()));

      return matchesTab && matchesSearch;
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <div
      className="min-h-screen bg-[#FDFDFF] dark:bg-[#050505] font-sans text-slate-900 dark:text-slate-100"
      data-oid="wm8:xgq"
    >
      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-4" data-oid="f56k7km">
        {/* Header Section - Compact & Stunning with Light Gradient */}
        <div
          className="relative group overflow-hidden rounded-[2.5rem] p-3 md:p-4 border border-indigo-200/60 dark:border-indigo-800/40 bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/80 dark:from-blue-500/5 dark:via-transparent dark:to-indigo-500/5 backdrop-blur-3xl shadow-xl shadow-blue-500/10 dark:shadow-blue-500/20"
          data-oid="q3yh4__"
        >
          {/* Subtle Decorative Elements */}
          <div
            className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-500/5 to-transparent -z-10"
            data-oid="1cwgv0f"
          />

          <div
            className="absolute -top-24 -right-24 w-80 h-80 bg-blue-400/10 dark:bg-blue-500/10 rounded-full blur-[80px] -z-10 group-hover:scale-110 transition-transform duration-1000"
            data-oid="1_5wycc"
          />

          <div
            className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10"
            data-oid="p.3vb3x"
          >
            <div className="space-y-4 max-w-2xl" data-oid="ihd0sbo">
              <m.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600/5 dark:bg-blue-400/10 border border-blue-500/10 text-blue-600 dark:text-blue-400 text-[9px] font-black uppercase tracking-[0.2em] backdrop-blur-md"
                data-oid="q:ms_70"
              >
                <Sparkles className="w-3 h-3" data-oid="agv7rce" />
                <span data-oid="eoq63i.">Premium Practice Hub</span>
              </m.div>

              <div className="space-y-2" data-oid="50ypi0v">
                <h1
                  className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight"
                  data-oid="fohbhse"
                >
                  Reading{' '}
                  <span
                    className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 dark:from-blue-400 dark:via-indigo-400 dark:to-violet-400"
                    data-oid="fz_0bs2"
                  >
                    Library
                  </span>
                </h1>
                <p
                  className="text-slate-500 dark:text-slate-400 text-base md:text-lg font-medium leading-relaxed max-w-lg"
                  data-oid="5-rlh65"
                >
                  Master the IELTS Reading section with our authentic, Cambridge-style practice
                  materials.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 items-center" data-oid="xlv0qgd">
                <div
                  className="flex items-center gap-3 bg-white/60 dark:bg-white/5 border border-white dark:border-white/10 px-3 py-2 rounded-2xl shadow-sm backdrop-blur-xl"
                  data-oid="wwgtu11"
                >
                  <div
                    className="w-7 h-7 rounded-lg bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20"
                    data-oid="-vtnkg0"
                  >
                    <TrendingUp className="w-4 h-4" data-oid="dr53sd9" />
                  </div>
                  <div className="flex flex-col" data-oid="8z53chw">
                    <h4
                      className="text-base font-black text-slate-900 dark:text-white leading-none"
                      data-oid="vfb_aoe"
                    >
                      87%
                    </h4>
                    <span
                      className="text-[9px] font-bold text-slate-500 uppercase tracking-wider"
                      data-oid="gyv::x2"
                    >
                      Success
                    </span>
                  </div>
                </div>
                <div
                  className="flex items-center gap-3 bg-white/60 dark:bg-white/5 border border-white dark:border-white/10 px-3 py-2 rounded-2xl shadow-sm backdrop-blur-xl"
                  data-oid="z4r_-cf"
                >
                  <div
                    className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20"
                    data-oid="7v0.68k"
                  >
                    <Award className="w-4 h-4" data-oid="k9fs:i8" />
                  </div>
                  <div className="flex flex-col" data-oid="e7lr5:g">
                    <h4
                      className="text-base font-black text-slate-900 dark:text-white leading-none"
                      data-oid="s-jacan"
                    >
                      Official
                    </h4>
                    <span
                      className="text-[9px] font-bold text-slate-500 uppercase tracking-wider"
                      data-oid="gydfxgz"
                    >
                      Content
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Redesigned Right Side: Library Insights Card */}
            <div className="lg:block hidden" data-oid="16_8cht">
              <m.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative p-1"
                data-oid="6zifozt"
              >
                <div
                  className="absolute -inset-2 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-[2.5rem] blur-xl opacity-50 group-hover:opacity-100 transition-opacity"
                  data-oid="9y-amia"
                />

                <div
                  className="relative w-72 bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl border border-white dark:border-white/10 rounded-[2rem] p-4 shadow-2xl overflow-hidden"
                  data-oid="6d2v9jr"
                >
                  <div className="absolute top-0 right-0 p-4" data-oid="393o.gg">
                    <div
                      className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20"
                      data-oid=":u.0rv2"
                    >
                      <Target
                        className="w-5 h-5 text-blue-600 dark:text-blue-400"
                        data-oid="dhqluy5"
                      />
                    </div>
                  </div>

                  <div className="space-y-3" data-oid="72nwm1n">
                    <div className="flex flex-col" data-oid="q_tpwyo">
                      <span
                        className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1"
                        data-oid=".pg4_8y"
                      >
                        Weekly Target
                      </span>
                      <h4
                        className="text-xl font-black text-slate-900 dark:text-white"
                        data-oid="rhi41c1"
                      >
                        Mastery Progress
                      </h4>
                    </div>

                    <div className="space-y-3" data-oid="c1.n3a3">
                      <div className="flex justify-between items-end" data-oid="z6zbqet">
                        <span className="text-xs font-bold text-slate-500" data-oid="16ffq.h">
                          6 of 10 Tests Completed
                        </span>
                        <span className="text-sm font-black text-blue-600" data-oid="vfo1y-4">
                          60%
                        </span>
                      </div>
                      <div
                        className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden p-[1px] border border-slate-200 dark:border-white/5"
                        data-oid="7esgde1"
                      >
                        <m.div
                          initial={{ width: 0 }}
                          animate={{ width: '60%' }}
                          className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                          data-oid="762zpv."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2" data-oid="w92129j">
                      <div
                        className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 border border-slate-100 dark:border-white/5"
                        data-oid="z0k-p_y"
                      >
                        <div className="flex items-center gap-2 mb-1" data-oid="oy33w-d">
                          <BookOpen className="w-3.5 h-3.5 text-indigo-500" data-oid="qrk0pgc" />
                          <span
                            className="text-lg font-black text-slate-900 dark:text-white leading-none"
                            data-oid="k4f:iyv"
                          >
                            {passages.length}
                          </span>
                        </div>
                        <span
                          className="text-[9px] font-bold text-slate-500 uppercase tracking-wider"
                          data-oid="tf3.7fb"
                        >
                          Total Tests
                        </span>
                      </div>
                      <div
                        className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 border border-slate-100 dark:border-white/5"
                        data-oid="fk9kca4"
                      >
                        <div className="flex items-center gap-2 mb-1" data-oid="rjf.xhm">
                          <Users className="w-3.5 h-3.5 text-emerald-500" data-oid="aftyioe" />
                          <span
                            className="text-lg font-black text-slate-900 dark:text-white leading-none"
                            data-oid="vjn5e44"
                          >
                            1.2k
                          </span>
                        </div>
                        <span
                          className="text-[9px] font-bold text-slate-500 uppercase tracking-wider"
                          data-oid="3am2o_2"
                        >
                          Active Users
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Glassy Overlay Elements */}
                  <div
                    className="absolute -bottom-6 -right-6 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl"
                    data-oid="bvuv_6l"
                  />
                </div>
              </m.div>
            </div>
          </div>
        </div>

        <div className="sticky top-4 z-40 px-1" data-oid="-grkhau">
          <div
            className="bg-white/80 dark:bg-[#0c0c0c]/80 backdrop-blur-3xl p-1.5 rounded-[1.8rem] md:rounded-[2.5rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] border border-slate-200/60 dark:border-white/10 flex flex-col lg:flex-row gap-2 lg:gap-4 items-center justify-between"
            data-oid="xd1qy0_"
          >
            {/* Search */}
            <div className="relative w-full lg:w-96 group" data-oid="5kw.jjs">
              <div
                className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none"
                data-oid="use5357"
              >
                <Search
                  className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-all duration-300 group-focus-within:scale-110"
                  data-oid="r-0-fs9"
                />
              </div>
              <Input
                placeholder="Find a test..."
                className="pl-14 h-11 md:h-14 bg-slate-100/50 dark:bg-white/5 border-none focus-visible:ring-2 focus-visible:ring-blue-500/20 rounded-[1.2rem] md:rounded-[1.5rem] text-sm md:text-base font-medium placeholder:text-slate-400 transition-all group-hover:bg-slate-100 dark:group-hover:bg-white/[0.08]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-oid=".fh_dnl"
              />
            </div>

            {/* Enhanced Tabs */}
            <div
              className="flex items-center bg-white/60 dark:bg-white/5 backdrop-blur-xl p-1.5 rounded-2xl gap-2 w-full lg:w-auto overflow-x-auto no-scrollbar border border-slate-200/50 dark:border-white/10 px-2 lg:px-1.5"
              data-oid="1:8gpt2"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 rounded-xl md:rounded-2xl text-[10px] md:text-sm font-bold transition-all duration-300 whitespace-nowrap shrink-0 lg:flex-none uppercase tracking-wider',
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
                  )}
                  data-oid="h1xq3rz"
                >
                  <tab.icon className="w-4 h-4" data-oid="ya.z1d1" />
                  {tab.label}
                </button>
              ))}
            </div>

            <div
              className="hidden lg:flex items-center gap-4 px-6 border-l border-slate-200 dark:border-white/10 h-10"
              data-oid="01zsb50"
            >
              <div
                className="flex items-center gap-3 text-slate-400 hover:text-blue-500 transition-colors cursor-pointer group/view"
                data-oid="sz4h8ye"
              >
                <LayoutGrid
                  className="w-5 h-5 group-hover/view:scale-110 transition-transform"
                  data-oid="j1di5cd"
                />

                <span className="text-xs font-black uppercase tracking-[0.1em]" data-oid="b2eu3g3">
                  Grid
                </span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500/20" data-oid="7njz_rt" />
              <div
                className="flex items-center gap-3 text-slate-300 dark:text-slate-700 cursor-not-allowed"
                data-oid="wickpbq"
              >
                <List className="w-5 h-5" data-oid="2t:8lmq" />
                <span className="text-xs font-black uppercase tracking-[0.1em]" data-oid="cxwazf-">
                  List
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tests Grid */}
        <div className="min-h-[600px]" data-oid="e0wud_g">
          {isLoading ? (
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8"
              data-oid="5ulgv:0"
            >
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-[#111111] rounded-2xl border border-slate-200 dark:border-white/5 p-6 flex flex-col h-full h-[400px]"
                  data-oid="8jmbac6"
                >
                  <div className="flex justify-between items-start mb-6" data-oid="4q.1kty">
                    <Skeleton className="w-12 h-12 rounded-xl" data-oid="3sz_:w6" />
                    <Skeleton className="h-6 w-20 rounded-lg" data-oid="yu6llhz" />
                  </div>
                  <div className="flex-grow space-y-4" data-oid="wyme42k">
                    <Skeleton className="h-7 w-3/4 rounded-lg" data-oid="x..jr:w" />
                    <Skeleton className="h-4 w-full rounded-lg" data-oid="r38kioy" />
                    <div className="grid grid-cols-2 gap-4 pt-4" data-oid="-gr:w8z">
                      <Skeleton className="h-10 rounded-xl" data-oid="-z1w49d" />
                      <Skeleton className="h-10 rounded-xl" data-oid="dndw:vr" />
                    </div>
                  </div>
                  <Skeleton className="h-12 w-full rounded-xl mt-6" data-oid="rher5bf" />
                </div>
              ))}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <m.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8"
                data-oid="35fc5ra"
              >
                {filteredTests.map((test) => {
                  // With RPC, we get exactly one session per test (the latest one)
                  const testSession = sessions.find((s) => s.passage_id === test.id);

                  const session =
                    testSession && !testSession.is_completed ? testSession : undefined;
                  const completedSession =
                    testSession && testSession.is_completed ? testSession : undefined;

                  return (
                    <MemoizedTestCard
                      key={test.id}
                      test={test}
                      session={session}
                      completedSession={completedSession}
                      takenCount={testCounts[test.id] || 0}
                      questionCount={questionCounts[test.id] || 0}
                      duration={durations[test.id]}
                      user={userData}
                      isAdmin={isAdmin}
                      hasMounted={hasMounted}
                      data-oid="tkx5f:w"
                    />
                  );
                })}
                {filteredTests.length === 0 && (
                  <div
                    className="col-span-full py-24 text-center bg-transparent"
                    data-oid="4h-agyx"
                  >
                    <div
                      className="w-24 h-24 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6"
                      data-oid="izfjl8f"
                    >
                      <BookOpen
                        className="w-10 h-10 text-slate-300 dark:text-slate-600"
                        data-oid="4.whk-q"
                      />
                    </div>
                    <h3
                      className="text-xl font-bold text-slate-900 dark:text-white mb-2"
                      data-oid="0d_yb9b"
                    >
                      No tests available
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400" data-oid="ga3vx93">
                      {searchQuery
                        ? `No tests matching "${searchQuery}"`
                        : "Admins haven't added any tests yet."}
                    </p>
                  </div>
                )}
              </m.div>
            </AnimatePresence>
          )}

          {/* Load More Button */}
          {!isLoading && readingData?.hasMore && (
            <div className="flex justify-center mt-12" data-oid="zv16_e_">
              <Button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                variant="outline"
                className="px-8 py-3 rounded-2xl border-2 border-blue-500/20 bg-white/80 dark:bg-white/5 backdrop-blur-xl text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest text-xs hover:bg-blue-500/10 hover:border-blue-500/40 transition-all duration-300 shadow-lg shadow-blue-500/5"
                data-oid="y.p0nr8"
              >
                {isLoadingMore ? (
                  <span className="flex items-center gap-2" data-oid=":buau7:">
                    <span
                      className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"
                      data-oid="jhn5o2k"
                    />
                    Loading...
                  </span>
                ) : (
                  <span className="flex items-center gap-2" data-oid="b3l8otd">
                    Load More Tests
                    <ChevronRight className="w-4 h-4" data-oid="q-gcize" />
                  </span>
                )}
              </Button>
            </div>
          )}

          {/* Show total count */}
          {!isLoading && readingData?.totalCount > 0 && (
            <p className="text-center text-xs text-slate-400 mt-4" data-oid="74nc1:d">
              Showing {filteredTests.length} of {readingData.totalCount} tests
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
