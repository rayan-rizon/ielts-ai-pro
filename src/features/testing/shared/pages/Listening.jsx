import React, { useState, useEffect, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Search,
  Headphones,
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
import { useAuth } from '@/features/auth/context/AuthContext';

import { useDebounce } from '@/hooks/useDebounce';
import { createPageUrl } from '@/utils';

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
    const tier = (user?.subscription_tier || 'free').toLowerCase();
    const hasPremiumAccess = tier === 'pro' || tier === 'premium' || isAdmin;

    if (test.access_tier && test.access_tier !== 'free') {
      return !hasPremiumAccess;
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

  // Calculate display title for official Cambridge tests
  let displayTitle = test.title;
  if (test.is_official_cambridge && test.cambridge_year) {
    const bookNumber = test.cambridge_year - 2005;
    displayTitle = `IELTS ${bookNumber} Listening ${test.cambridge_year} Test ${test.cambridge_test_number || test.title.match(/Test\s*(\d+)/i)?.[1] || '1'}`;
  }

  const color = getColor(displayTitle || 'default');
  const Icon = test.test_format?.toLowerCase() === 'academic' ? GraduationCap : Headphones;

  const ContainerLink = isLocked ? 'div' : Link;
  const linkProps = isLocked
    ? { onClick: () => (window.location.href = createPageUrl('Pricing')) }
    : {
        to: isResuming
          ? `/listening-test/${session.id}`
          : isCompleted
            ? `/listening-test/${completedSession.id}`
            : `/listening-test?test-id=${test.id}`,
      };

  return (
    <motion.div
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
      data-oid="btx93bn"
    >
      {/* Subtle Gradient Overlay on Hover - intensified */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-tr transition-opacity duration-500 opacity-0 group-hover:opacity-100 rounded-[2rem]',
          colorVariants[color].hover
        )}
        data-oid="q9_c.1g"
      />

      <div className="flex justify-between items-start mb-6 relative z-10" data-oid="-xggla1">
        <div
          className={cn(
            'w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300',
            `bg-white dark:bg-white/5`,
            colorVariants[color].text,
            `shadow-[0_10px_20px_-5px_rgba(0,0,0,0.1)] dark:shadow-none border`,
            colorVariants[color].border,
            'group-hover:scale-110 group-hover:rotate-3'
          )}
          data-oid="khiofoo"
        >
          <Icon className="w-7 h-7" data-oid="vw4j3wj" />
        </div>

        <div className="flex flex-col items-end gap-2.5" data-oid="hvcscgp">
          {isLocked ? (
            <div
              className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center shadow-lg transform rotate-12"
              data-oid="puzjzk:"
            >
              <Lock className="w-4 h-4 text-white" data-oid="6.4dlv6" />
            </div>
          ) : isResuming ? (
            <div
              className={cn(
                'flex items-center gap-2 rounded-full px-3 py-1 border',
                colorVariants[color].badge
              )}
              data-oid=".7_4yg1"
            >
              <span className="relative flex h-2 w-2" data-oid=".4:6y-2">
                <span
                  className={cn(
                    'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                    colorVariants[color].ping
                  )}
                  data-oid="2d_zlt2"
                ></span>
                <span
                  className={cn(
                    'relative inline-flex rounded-full h-2 w-2',
                    colorVariants[color].dot
                  )}
                  data-oid=".q.aw.c"
                ></span>
              </span>
              <span className="text-[11px] font-bold tracking-wide uppercase" data-oid="2ai1p:n">
                In Progress
              </span>
            </div>
          ) : isCompleted ? (
            <div
              className={cn(
                'flex items-center gap-2 rounded-full px-3 py-1 border',
                colorVariants[color].badge
              )}
              data-oid="sgvut42"
            >
              <CheckCircle2 className="w-3.5 h-3.5" data-oid="h0vdzud" />
              <span className="text-[11px] font-bold tracking-wide uppercase" data-oid="._2u976">
                Completed
              </span>
            </div>
          ) : (
            <Badge
              variant="outline"
              className="bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 px-3 py-1 text-[11px] font-bold tracking-wider uppercase"
              data-oid=":ru6h.x"
            >
              New Test
            </Badge>
          )}
        </div>
      </div>

      {/* Title and Description */}
      <div
        className={cn('mb-6 flex-grow relative z-10', isLocked && 'filter blur-sm select-none')}
        data-oid=".oab7r_"
      >
        <ContainerLink {...linkProps} className="block group/title" data-oid="9p884jn">
          <h3
            className={cn(
              'text-xl font-bold text-slate-900 dark:text-white leading-snug mb-2 transition-colors cursor-pointer line-clamp-2',
              `group-hover:${colorVariants[color].text.split(' ')[0]}`
            )}
            data-oid=":5.rb64"
          >
            {displayTitle}
          </h3>
        </ContainerLink>
        <p
          className="text-sm text-slate-500 dark:text-slate-400 font-medium line-clamp-2"
          data-oid="p2p:jse"
        >
          {test.description || 'Authentic IELTS Listening practice with curated audio.'}
        </p>
      </div>

      {/* Meta Bar */}
      <div
        className={cn('mb-6 relative z-10 space-y-4', isLocked && 'filter blur-sm select-none')}
        data-oid="apa78t7"
      >
        <div className="flex flex-wrap items-center gap-2" data-oid="r3s1c_o">
          <div
            className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2"
            data-oid="h.5qss_"
          >
            <Clock className="w-3.5 h-3.5 text-slate-400" data-oid="_4jhnu_" />
            <span
              className="text-xs font-semibold text-slate-600 dark:text-slate-300"
              data-oid="36e0ore"
            >
              {duration} min
            </span>
          </div>
          <div
            className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2"
            data-oid="yrapggm"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" data-oid="jzm1wu6" />
            <span
              className="text-xs font-semibold text-slate-600 dark:text-slate-300"
              data-oid=":9nvzvw"
            >
              {questionCount} Qs
            </span>
          </div>
          {takenCount > 0 && (
            <div
              className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2"
              data-oid="kee--ua"
            >
              <Users className="w-3.5 h-3.5 text-slate-400" data-oid="gmu:5mm" />
              <span
                className="text-xs font-semibold text-slate-600 dark:text-slate-300"
                data-oid="rffwes3"
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
            data-oid="top3ay1"
          >
            <div
              className="flex justify-between text-xs font-bold tracking-wide"
              data-oid="tm-lhiv"
            >
              <span className="text-slate-700 dark:text-slate-300 uppercase" data-oid="f6jq2e:">
                Completion
              </span>
              <span
                className={cn('font-black', colorVariants[color].text.split(' ')[0])}
                data-oid="bu-w0nx"
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
              data-oid="aepwvm3"
            />
          </div>
        ) : isCompleted && completedSession?.score !== undefined ? (
          <div className="pt-2 border-t border-slate-100 dark:border-white/5" data-oid="3uym7ns">
            <div className="flex items-center justify-between" data-oid="7i51l6z">
              <span
                className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wide uppercase"
                data-oid="cvpqv4v"
              >
                Your Score
              </span>
              <div className="flex items-center gap-2" data-oid="::9948a">
                <span
                  className={cn('text-2xl font-black', colorVariants[color].text.split(' ')[0])}
                  data-oid="j6n6pur"
                >
                  {typeof completedSession.score === 'number'
                    ? completedSession.score.toFixed(1)
                    : completedSession.score}
                </span>
                <span className="text-xs text-slate-400" data-oid="5n97km3">
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
        data-oid="sb.z3.s"
      >
        {isLocked ? (
          <Link to={createPageUrl('Pricing')} className="block mt-4" data-oid="6f54-28">
            <Button
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl h-11 text-sm shadow-lg transition-all"
              data-oid="2y7skz4"
            >
              <Crown className="w-4 h-4 mr-2" data-oid="x4.g6_1" /> Upgrade to Access
            </Button>
          </Link>
        ) : isResuming ? (
          <Link to={`/listening-test/${session.id}`} className="block mt-4" data-oid="e_q77pi">
            <Button
              className={cn(
                'w-full bg-white dark:bg-transparent border-2 font-bold rounded-xl h-11 text-sm shadow-none transition-all',
                colorVariants[color].button
              )}
              data-oid="_xi2m30"
            >
              Resume Test <Play className="w-3.5 h-3.5 ml-2 fill-current" data-oid="ao0d17w" />
            </Button>
          </Link>
        ) : isCompleted ? (
          <div className="flex gap-2 mt-4" data-oid="md2t5av">
            <Link
              to={`/listening-test/${completedSession.id}?view-results=true`}
              className="flex-1"
              data-oid="xen9x6s"
            >
              <Button
                className={cn(
                  'w-full bg-white dark:bg-transparent border-2 font-bold rounded-xl h-11 text-sm shadow-none transition-all',
                  colorVariants[color].button
                )}
                data-oid=":wjp-tm"
              >
                View Results <ArrowRight className="w-3.5 h-3.5 ml-2" data-oid="l:6zj85" />
              </Button>
            </Link>
            <Link to={`/listening-test?test-id=${test.id}&retake=true`} data-oid="s7nhj-:">
              <Button
                variant="outline"
                className="h-11 px-4 rounded-xl border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                data-oid="4o7c:12"
              >
                <RotateCcw className="w-4 h-4" data-oid="hza09sh" />
              </Button>
            </Link>
          </div>
        ) : (
          <Link to={`/listening-test?test-id=${test.id}`} className="block mt-4" data-oid="esgyqo:">
            <Button
              className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-purple-600 dark:hover:bg-purple-500 text-white font-bold rounded-xl h-11 text-sm shadow-lg shadow-slate-900/20 dark:shadow-purple-900/40 transition-all group-hover:scale-[1.02] border-0"
              data-oid="r9e2siq"
            >
              Start Practice <ChevronRight className="w-4 h-4 ml-1.5" data-oid=".z1x14b" />
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
    prevProps.questionCount === nextProps.questionCount &&
    prevProps.duration === nextProps.duration &&
    prevProps.user?.subscription_tier === nextProps.user?.subscription_tier &&
    prevProps.isAdmin === nextProps.isAdmin &&
    prevProps.hasMounted === nextProps.hasMounted
  );
});

// PERFORMANCE: Accept user from context instead of fetching redundantly
const fetchListeningData = async (user, page = 1, pageSize = 12, existingData = null) => {
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
    .eq('test_type', 'listening')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (passageError) {
    console.error('Error fetching passages:', passageError);
  }

  // REVERTED: Use standard select query instead of RPC
  let sessionsData = [];
  const takenCountsResult = await supabase.rpc('get_test_taken_counts', {
    type_filter: 'listening',
  });

  // Extract passage IDs for optimized fetching
  const passageIds = testsData?.map((t) => t.id) || [];

  if (user && passageIds.length > 0) {
    const { data, error } = await supabase
      .from('test_sessions')
      .select(
        'id, passage_id, is_completed, score, content_data, created_at, completed_at, user_responses'
      )
      .eq('user_id', user.id)
      .eq('test_type', 'listening')
      .in('passage_id', passageIds)
      .order('created_at', { ascending: false });

    if (!error && data) {
      sessionsData = data;
    }
  }

  // Helper to extract passage_id safely
  const getPassageId = (s) => s.passage_id || s.content_data?.passage_id || s.content_data?.id;

  const sessionsByPassage = {};
  sessionsData.forEach((s) => {
    const pId = getPassageId(s);
    if (
      pId &&
      (!sessionsByPassage[pId] ||
        new Date(s.created_at) > new Date(sessionsByPassage[pId].created_at))
    ) {
      sessionsByPassage[pId] = {
        id: s.id,
        passage_id: pId,
        is_completed: s.is_completed,
        score: s.score,
        progress: 0, // Calculated in TestCard if needed
        content_data: s.content_data || { passage_id: pId },
        user_responses: s.user_responses || {},
        completed_questions: s.is_completed
          ? 40
          : s.user_responses
            ? Array.isArray(s.user_responses)
              ? s.user_responses.length
              : Object.keys(s.user_responses).length
            : 0,
        created_at: s.created_at,
        completed_at: s.completed_at,
      };
    }
  });

  const taken = existingData?.testCounts || {};
  if (takenCountsResult?.data) {
    takenCountsResult.data.forEach((item) => {
      if (item.passage_id) {
        taken[item.passage_id] = item.taken_count;
      }
    });
  }

  const qCounts = existingData?.questionCounts || {};
  const durs = existingData?.durations || {};

  if (testsData) {
    testsData.forEach((test) => {
      qCounts[test.id] = test.total_questions || 40;
      durs[test.id] = test.duration_minutes || 30;
    });
  }

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

export default function Listening() {
  // PERFORMANCE: Get user from context instead of refetching
  const { userProfile: userData, isAdmin, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [listeningData, setListeningData] = useState(null);
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
    if (listeningData?.currentUser?.id === userData?.id) return;

    const loadInitialData = async () => {
      if (!listeningData) setIsLoading(true);
      try {
        const data = await fetchListeningData(userData, 1, 12);
        setListeningData(data);
      } catch (error) {
        console.error('Error loading listening data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, [userData, authLoading, listeningData]);
  // userData is now from context, no need for listeningData?.currentUser

  // Load more handler - memoized for performance
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !listeningData?.hasMore) return;

    setIsLoadingMore(true);
    try {
      const nextPage = (listeningData?.currentPage || 1) + 1;
      const moreData = await fetchListeningData(userData, nextPage, 12, listeningData);
      setListeningData(moreData);
    } catch (error) {
      console.error('Error loading more tests:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, listeningData, userData]);

  const passages = listeningData?.passages || [];
  const sessions = listeningData?.sessions || [];
  const testCounts = listeningData?.testCounts || {};
  const questionCounts = listeningData?.questionCounts || {};
  const durations = listeningData?.durations || {};

  const tabs = [
    { id: 'all', label: 'All Tests', icon: LayoutGrid },
    { id: 'cambridge', label: 'Cambridge', icon: Award },
    { id: 'in-progress', label: 'In Progress', icon: Clock },
  ];

  const filteredTests = passages
    .filter((test) => {
      const session = sessions.find((s) => s.passage_id === test.id && !s.is_completed);

      let matchesTab = false;
      if (activeTab === 'all') {
        matchesTab = true;
      } else if (activeTab === 'in-progress') {
        matchesTab = !!session;
      } else if (activeTab === 'cambridge') {
        matchesTab = test.is_official_cambridge;
      } else {
        matchesTab =
          test.test_type?.toLowerCase() === activeTab.toLowerCase() ||
          test.type?.toLowerCase() === activeTab.toLowerCase() ||
          test.test_format?.toLowerCase() === activeTab.toLowerCase();
      }

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
      data-oid="x1o6_.o"
    >
      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-4" data-oid=".onrc0s">
        {/* Header Section */}
        <div
          className="relative group overflow-hidden rounded-[2.5rem] p-3 md:p-4 border border-indigo-200/60 dark:border-indigo-800/40 bg-gradient-to-br from-indigo-50/80 via-white to-violet-50/80 dark:from-indigo-500/5 dark:via-transparent dark:to-violet-500/5 backdrop-blur-3xl shadow-xl shadow-indigo-500/10 dark:shadow-indigo-500/20"
          data-oid="ank11-u"
        >
          <div
            className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-indigo-500/5 to-transparent -z-10"
            data-oid="lgetz5a"
          />

          <div
            className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-400/10 dark:bg-indigo-500/10 rounded-full blur-[80px] -z-10 group-hover:scale-110 transition-transform duration-1000"
            data-oid="srzfakw"
          />

          <div
            className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10"
            data-oid="wxhx6rn"
          >
            <div className="space-y-4 max-w-2xl" data-oid="bio6-rq">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-600/5 dark:bg-indigo-400/10 border border-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase tracking-[0.2em] backdrop-blur-md"
                data-oid="slh5_e3"
              >
                <Sparkles className="w-3 h-3" data-oid="zk71zjc" />
                <span data-oid="jmvrhr0">Premium Audio Hub</span>
              </motion.div>

              <div className="space-y-2" data-oid="q8irssn">
                <h1
                  className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight"
                  data-oid="z82pk:e"
                >
                  Listening{' '}
                  <span
                    className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 dark:from-indigo-400 dark:via-violet-400 dark:to-purple-400"
                    data-oid="z0l:4:t"
                  >
                    Library
                  </span>
                </h1>
                <p
                  className="text-slate-500 dark:text-slate-400 text-base md:text-lg font-medium leading-relaxed max-w-lg"
                  data-oid="wy7imfg"
                >
                  Improve your listening skills with our authentic, Cambridge-style curated audio
                  tests.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 items-center" data-oid="x8fanmt">
                <div
                  className="flex items-center gap-3 bg-white/60 dark:bg-white/5 border border-white dark:border-white/10 px-3 py-2 rounded-2xl shadow-sm backdrop-blur-xl"
                  data-oid="08.4e9q"
                >
                  <div
                    className="w-7 h-7 rounded-lg bg-purple-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/20"
                    data-oid="wbjq6gv"
                  >
                    <TrendingUp className="w-4 h-4" data-oid="lzghcui" />
                  </div>
                  <div className="flex flex-col" data-oid="exegu5l">
                    <h4
                      className="text-base font-black text-slate-900 dark:text-white leading-none"
                      data-oid="o:wrfcl"
                    >
                      92%
                    </h4>
                    <span
                      className="text-[9px] font-bold text-slate-500 uppercase tracking-wider"
                      data-oid="0.f.z3i"
                    >
                      Success
                    </span>
                  </div>
                </div>
                <div
                  className="flex items-center gap-3 bg-white/60 dark:bg-white/5 border border-white dark:border-white/10 px-3 py-2 rounded-2xl shadow-sm backdrop-blur-xl"
                  data-oid="zkx8x7d"
                >
                  <div
                    className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20"
                    data-oid="ye5m_n7"
                  >
                    <Award className="w-4 h-4" data-oid="lb1irq7" />
                  </div>
                  <div className="flex flex-col" data-oid="h3q465l">
                    <h4
                      className="text-base font-black text-slate-900 dark:text-white leading-none"
                      data-oid="vqv7.7l"
                    >
                      Official
                    </h4>
                    <span
                      className="text-[9px] font-bold text-slate-500 uppercase tracking-wider"
                      data-oid="d_qto_p"
                    >
                      Content
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Library Insights Card */}
            <div className="lg:block hidden" data-oid="pz53ft_">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative p-1"
                data-oid="-:nrj03"
              >
                <div
                  className="absolute -inset-2 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-[2.5rem] blur-xl opacity-50 group-hover:opacity-100 transition-opacity"
                  data-oid="koo_g:d"
                />

                <div
                  className="relative w-72 bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl border border-white dark:border-white/10 rounded-[2rem] p-4 shadow-2xl overflow-hidden"
                  data-oid="95if:01"
                >
                  <div className="absolute top-0 right-0 p-4" data-oid="17ch09:">
                    <div
                      className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20"
                      data-oid="htr21-u"
                    >
                      <Target
                        className="w-5 h-5 text-purple-600 dark:text-purple-400"
                        data-oid="c:yts1y"
                      />
                    </div>
                  </div>

                  <div className="space-y-3" data-oid="5an1eea">
                    <div className="flex flex-col" data-oid="qeff6zw">
                      <span
                        className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1"
                        data-oid="ahu-rrg"
                      >
                        Weekly Target
                      </span>
                      <h4
                        className="text-xl font-black text-slate-900 dark:text-white"
                        data-oid="wunuigk"
                      >
                        Listening Mastery
                      </h4>
                    </div>

                    <div className="space-y-3" data-oid="n3x:u72">
                      <div className="flex justify-between items-end" data-oid="-eyvzrx">
                        <span className="text-xs font-bold text-slate-500" data-oid=":81ub94">
                          8 of 12 Tests Completed
                        </span>
                        <span className="text-sm font-black text-purple-600" data-oid=".l7x5_q">
                          75%
                        </span>
                      </div>
                      <div
                        className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden p-[1px] border border-slate-200 dark:border-white/5"
                        data-oid="1xd4ix."
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: '75%' }}
                          className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full shadow-[0_0_10px_rgba(147,51,234,0.4)]"
                          data-oid="iajpl1d"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2" data-oid=":7k9sxu">
                      <div
                        className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 border border-slate-100 dark:border-white/5"
                        data-oid="snslbr5"
                      >
                        <div className="flex items-center gap-2 mb-1" data-oid="5u0qdwg">
                          <Headphones className="w-3.5 h-3.5 text-indigo-500" data-oid="o04p1j_" />
                          <span
                            className="text-lg font-black text-slate-900 dark:text-white leading-none"
                            data-oid="yktm_u0"
                          >
                            {passages.length}
                          </span>
                        </div>
                        <span
                          className="text-[9px] font-bold text-slate-500 uppercase tracking-wider"
                          data-oid="51bglu1"
                        >
                          Total Tests
                        </span>
                      </div>
                      <div
                        className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 border border-slate-100 dark:border-white/5"
                        data-oid="dp7:0o2"
                      >
                        <div className="flex items-center gap-2 mb-1" data-oid="cx7dfx.">
                          <Users className="w-3.5 h-3.5 text-emerald-500" data-oid="sc5.elz" />
                          <span
                            className="text-lg font-black text-slate-900 dark:text-white leading-none"
                            data-oid="a6_8v74"
                          >
                            2.4k
                          </span>
                        </div>
                        <span
                          className="text-[9px] font-bold text-slate-500 uppercase tracking-wider"
                          data-oid="fxa_pg8"
                        >
                          Active Users
                        </span>
                      </div>
                    </div>
                  </div>
                  <div
                    className="absolute -bottom-6 -right-6 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl"
                    data-oid="yqknwvn"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        <div className="sticky top-4 z-40 px-1" data-oid="yc7s23:">
          <div
            className="bg-white/80 dark:bg-[#0c0c0c]/80 backdrop-blur-3xl p-1.5 rounded-[1.8rem] md:rounded-[2.5rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] border border-slate-200/60 dark:border-white/10 flex flex-col lg:flex-row gap-2 lg:gap-4 items-center justify-between"
            data-oid="rq8rvfu"
          >
            <div className="relative w-full lg:w-96 group" data-oid="fhuqjr6">
              <div
                className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none"
                data-oid="37w571r"
              >
                <Search
                  className="h-5 w-5 text-slate-400 group-focus-within:text-purple-500 transition-all duration-300 group-focus-within:scale-110"
                  data-oid="jm62-hz"
                />
              </div>
              <Input
                placeholder="Find a test..."
                className="pl-14 h-11 md:h-14 bg-slate-100/50 dark:bg-white/5 border-none focus-visible:ring-2 focus-visible:ring-purple-500/20 rounded-[1.2rem] md:rounded-[1.5rem] text-sm md:text-base font-medium placeholder:text-slate-400 transition-all group-hover:bg-slate-100 dark:group-hover:bg-white/[0.08]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-oid="mu5yg:."
              />
            </div>

            <div
              className="flex items-center bg-white/60 dark:bg-white/5 backdrop-blur-xl p-2 rounded-2xl gap-2 w-full lg:w-auto overflow-x-auto no-scrollbar border border-slate-200/50 dark:border-white/10 px-3 lg:p-2"
              data-oid="2.g:oxq"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 rounded-xl md:rounded-2xl text-[10px] md:text-sm font-bold transition-all duration-300 whitespace-nowrap shrink-0 lg:flex-none uppercase tracking-wider',
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/25'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
                  )}
                  data-oid="b235th5"
                >
                  <tab.icon className="w-4 h-4" data-oid="ev02.by" />
                  {tab.label}
                </button>
              ))}
            </div>

            <div
              className="hidden lg:flex items-center gap-4 px-6 border-l border-slate-200 dark:border-white/10 h-10"
              data-oid="t5:vw.y"
            >
              <div
                className="flex items-center gap-3 text-slate-400 hover:text-purple-500 transition-colors cursor-pointer group/view"
                data-oid="f5dqni4"
              >
                <LayoutGrid
                  className="w-5 h-5 group-hover/view:scale-110 transition-transform"
                  data-oid="eac47qg"
                />

                <span className="text-xs font-black uppercase tracking-[0.1em]" data-oid="h8jyimm">
                  Grid
                </span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500/20" data-oid="ou-capb" />
              <div
                className="flex items-center gap-3 text-slate-300 dark:text-slate-700 cursor-not-allowed"
                data-oid="mlx233."
              >
                <List className="w-5 h-5" data-oid="efv7oen" />
                <span className="text-xs font-black uppercase tracking-[0.1em]" data-oid="mtz16z1">
                  List
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tests Grid */}
        <div className="min-h-[600px]" data-oid="cf:fvu4">
          {isLoading ? (
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8"
              data-oid="0xafw-s"
            >
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-[#111111] rounded-2xl border border-slate-200 dark:border-white/5 p-6 flex flex-col h-full h-[400px]"
                  data-oid="ssoa:hd"
                >
                  <div className="flex justify-between items-start mb-6" data-oid="14yg59c">
                    <Skeleton className="w-12 h-12 rounded-xl" data-oid="a_vntsm" />
                    <Skeleton className="h-6 w-20 rounded-lg" data-oid="va9v0x2" />
                  </div>
                  <div className="flex-grow space-y-4" data-oid="s:q0bvz">
                    <Skeleton className="h-7 w-3/4 rounded-lg" data-oid="-0a6enh" />
                    <Skeleton className="h-4 w-full rounded-lg" data-oid="q30fovp" />
                    <div className="grid grid-cols-2 gap-4 pt-4" data-oid="ay7blho">
                      <Skeleton className="h-10 rounded-xl" data-oid="vbqbrea" />
                      <Skeleton className="h-10 rounded-xl" data-oid="kxefces" />
                    </div>
                  </div>
                  <Skeleton className="h-12 w-full rounded-xl mt-6" data-oid="nyhg4q-" />
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
                data-oid="2z-r1f0"
              >
                {filteredTests.map((test) => {
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
                      data-oid="tkxp-7-"
                    />
                  );
                })}
                {filteredTests.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="col-span-full py-24 text-center bg-transparent"
                    data-oid="_:.6.5v"
                  >
                    <div
                      className="w-24 h-24 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6"
                      data-oid="f.rgw_2"
                    >
                      <Headphones
                        className="w-10 h-10 text-slate-300 dark:text-slate-600"
                        data-oid="cpi7t2v"
                      />
                    </div>
                    <h3
                      className="text-xl font-bold text-slate-900 dark:text-white mb-2"
                      data-oid="5oeqigm"
                    >
                      No tests available
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400" data-oid="ba1tm9t">
                      {searchQuery
                        ? `No tests matching "${searchQuery}"`
                        : "Admins haven't added any tests yet."}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
        {/* Load More Trigger / Button */}
        {listeningData?.hasMore && (
          <div className="flex justify-center mt-12 pb-12" data-oid="6bj5o:h">
            <Button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              variant="outline"
              className="rounded-full px-8 h-12 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold tracking-wide hover:bg-white dark:hover:bg-white/5 hover:border-purple-200 dark:hover:border-purple-900 transition-all shadow-sm"
              data-oid="o243ouf"
            >
              {isLoadingMore ? (
                <>
                  <div
                    className="w-4 h-4 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin mr-2"
                    data-oid="37s27-z"
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
