import React, { useState, useEffect, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';
import {
  Search,
  Mic,
  Clock,
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
  MessageSquare,
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
  const isCompleted = !!completedSession;

  // Access Control Logic
  const isLocked = (() => {
    const tier = (user?.subscription_tier || 'free').toLowerCase();
    const hasPremiumAccess = tier === 'pro' || tier === 'premium' || isAdmin;

    if (test.access_tier && test.access_tier !== 'free') {
      return !hasPremiumAccess;
    }
    return false;
  })();

  const progress = isResuming
    ? Math.round(
        ((session.content_data?.currentPart || 0) / (test.total_questions || questionCount || 3)) *
          100
      )
    : 0;

  // Dynamic color assignment based on title hash
  const getColor = (str) => {
    const colors = ['rose', 'orange', 'blue', 'indigo', 'violet', 'cyan'];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const colorVariants = {
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
    displayTitle = `IELTS ${bookNumber} Speaking ${test.cambridge_year} Test ${test.cambridge_test_number || test.title.match(/Test\s*(\d+)/i)?.[1] || '1'}`;
  }

  const color = getColor(displayTitle || 'default');
  const Icon = test.test_format?.toLowerCase() === 'academic' ? GraduationCap : Mic;

  const ContainerLink = isLocked ? 'div' : Link;
  const linkProps = isLocked
    ? { onClick: () => (window.location.href = createPageUrl('Pricing')) }
    : {
        to: isResuming
          ? `/speaking-test/${test.id}`
          : isCompleted
            ? `/speaking-test/${completedSession.id}?view-score=true`
            : `/speaking-test?test-id=${test.id}`,
      };

  return (
    <motion.div
      initial={hasMounted ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn(
        'group relative flex flex-col h-full rounded-[2rem] p-6 transition-all duration-500 ease-sidebar',
        'bg-white dark:bg-[#121212] border border-slate-200/60 dark:border-white/5',
        `bg-gradient-to-b ${colorVariants[color].gradient}`,
        'shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] hover:shadow-[0_60px_120px_-30px_rgba(0,0,0,0.15)]',
        'dark:shadow-[0_10px_40px_-15px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)]',
        'hover:-translate-y-2 will-change-transform',
        isLocked && 'opacity-90 grayscale-[0.2]'
      )}
      data-oid="t9f1m7e"
    >
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-tr transition-opacity duration-500 opacity-0 group-hover:opacity-100 rounded-[2rem]',
          colorVariants[color].hover
        )}
        data-oid="bp:.te-"
      />

      <div className="flex justify-between items-start mb-6 relative z-10" data-oid="ifdqc.z">
        <div
          className={cn(
            'w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300',
            `bg-white dark:bg-white/5`,
            colorVariants[color].text,
            `shadow-[0_10px_20px_-5px_rgba(0,0,0,0.1)] dark:shadow-none border`,
            colorVariants[color].border,
            'group-hover:scale-110 group-hover:rotate-3'
          )}
          data-oid="sy9nen7"
        >
          <Icon className="w-7 h-7" data-oid="nots4-d" />
        </div>

        <div className="flex flex-col items-end gap-2.5" data-oid="ngizc_n">
          {isLocked ? (
            <div
              className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center shadow-lg transform rotate-12"
              data-oid="5bm:9ax"
            >
              <Lock className="w-4 h-4 text-white" data-oid="96riw8z" />
            </div>
          ) : isResuming ? (
            <div
              className={cn(
                'flex items-center gap-2 rounded-full px-3 py-1 border',
                colorVariants[color].badge
              )}
              data-oid="w3:66zz"
            >
              <span className="relative flex h-2 w-2" data-oid="nngk90m">
                <span
                  className={cn(
                    'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                    colorVariants[color].ping
                  )}
                  data-oid="bgb6jg0"
                ></span>
                <span
                  className={cn(
                    'relative inline-flex rounded-full h-2 w-2',
                    colorVariants[color].dot
                  )}
                  data-oid="si_fvbl"
                ></span>
              </span>
              <span className="text-[11px] font-bold tracking-wide uppercase" data-oid="sjobrqa">
                In Progress
              </span>
            </div>
          ) : isCompleted ? (
            <div
              className={cn(
                'flex items-center gap-2 rounded-full px-3 py-1 border',
                colorVariants[color].badge
              )}
              data-oid="8c4b9yh"
            >
              <CheckCircle2 className="w-3.5 h-3.5" data-oid="cji.oc:" />
              <span className="text-[11px] font-bold tracking-wide uppercase" data-oid="grtthm:">
                Completed
              </span>
            </div>
          ) : (
            <Badge
              variant="outline"
              className="bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 px-3 py-1 text-[11px] font-bold tracking-wider uppercase"
              data-oid=":u9d0cl"
            >
              New Practice
            </Badge>
          )}
        </div>
      </div>

      <div
        className={cn('mb-6 flex-grow relative z-10', isLocked && 'filter blur-sm select-none')}
        data-oid="dsiggr1"
      >
        <ContainerLink {...linkProps} className="block group/title" data-oid="ptwizl8">
          <h3
            className={cn(
              'text-xl font-bold text-slate-900 dark:text-white leading-snug mb-2 transition-colors cursor-pointer line-clamp-2',
              `group-hover:${colorVariants[color].text.split(' ')[0]}`
            )}
            data-oid="-4myz11"
          >
            {displayTitle}
          </h3>
        </ContainerLink>
        <p
          className="text-sm text-slate-500 dark:text-slate-400 font-medium line-clamp-2"
          data-oid="lj4:12b"
        >
          {test.description || 'Authentic IELTS Speaking practice with interactive AI models.'}
        </p>
      </div>

      <div
        className={cn('mb-6 relative z-10 space-y-4', isLocked && 'filter blur-sm select-none')}
        data-oid="06pani."
      >
        <div className="flex flex-wrap items-center gap-2" data-oid="ayj1gw.">
          <div
            className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2"
            data-oid="8:vrw0v"
          >
            <Clock className="w-3.5 h-3.5 text-slate-400" data-oid="5bass4-" />
            <span
              className="text-xs font-semibold text-slate-600 dark:text-slate-300"
              data-oid="bx4z_m1"
            >
              {duration} min
            </span>
          </div>
          <div
            className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2"
            data-oid="y2s:j2q"
          >
            <MessageSquare className="w-3.5 h-3.5 text-slate-400" data-oid="8pdnfnd" />
            <span
              className="text-xs font-semibold text-slate-600 dark:text-slate-300"
              data-oid="jfhh80-"
            >
              3 Parts
            </span>
          </div>
          {takenCount > 0 && (
            <div
              className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2"
              data-oid="a7ca:--"
            >
              <Users className="w-3.5 h-3.5 text-slate-400" data-oid="l2w0mp1" />
              <span
                className="text-xs font-semibold text-slate-600 dark:text-slate-300"
                data-oid="ek7qvh4"
              >
                {takenCount} Taken
              </span>
            </div>
          )}
        </div>

        {isResuming ? (
          <div
            className="space-y-4 pt-2 border-t border-slate-100 dark:border-white/5"
            data-oid="z.tomk1"
          >
            <div
              className="flex justify-between text-xs font-bold tracking-wide"
              data-oid="oa2tksl"
            >
              <span className="text-slate-700 dark:text-slate-300 uppercase" data-oid="fycg16p">
                Completion
              </span>
              <span
                className={cn('font-black', colorVariants[color].text.split(' ')[0])}
                data-oid="lo2yfyj"
              >
                {progress}%
              </span>
            </div>
            <Progress
              value={progress}
              className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full"
              indicatorClassName={cn(
                'bg-gradient-to-r',
                color === 'rose' ? 'from-rose-500 to-red-600' : 'from-violet-500 to-indigo-600'
              )}
              data-oid="fg5uxrp"
            />
          </div>
        ) : isCompleted && completedSession?.score !== undefined ? (
          <div className="pt-2 border-t border-slate-100 dark:border-white/5" data-oid="18slee0">
            <div className="flex items-center justify-between" data-oid="om0e4zl">
              <span
                className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wide uppercase"
                data-oid="nbh.cz8"
              >
                Your Score
              </span>
              <div className="flex items-center gap-2" data-oid="shpc1n3">
                <span
                  className={cn('text-2xl font-black', colorVariants[color].text.split(' ')[0])}
                  data-oid="8lelnw9"
                >
                  {typeof completedSession.score === 'number'
                    ? completedSession.score.toFixed(1)
                    : completedSession.score}
                </span>
                <span className="text-xs text-slate-400" data-oid="lvrgg68">
                  / 9.0
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div
        className="relative z-10 mt-auto pt-2 border-t border-slate-50 dark:border-white/5"
        data-oid="df7:163"
      >
        {isLocked ? (
          <Link to={createPageUrl('Pricing')} className="block mt-4" data-oid="1-3e0hv">
            <Button
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl h-11 text-sm shadow-lg transition-all"
              data-oid="5fm42bn"
            >
              <Crown className="w-4 h-4 mr-2" data-oid="5-w_or7" /> Upgrade to Access
            </Button>
          </Link>
        ) : isResuming ? (
          <Link to={`/speaking-test/${test.id}`} className="block mt-4" data-oid=":zh0p1.">
            <Button
              className={cn(
                'w-full bg-white dark:bg-transparent border-2 font-bold rounded-xl h-11 text-sm shadow-none transition-all',
                colorVariants[color].button
              )}
              data-oid="kkql700"
            >
              Resume Test <Play className="w-3.5 h-3.5 ml-2 fill-current" data-oid="3itzqz:" />
            </Button>
          </Link>
        ) : isCompleted ? (
          <div className="flex gap-2 mt-4" data-oid="z7ec8v0">
            <Link
              to={`/speaking-test/${completedSession.id}?view-score=true`}
              className="flex-1"
              data-oid="6pcyt9-"
            >
              <Button
                className={cn(
                  'w-full bg-white dark:bg-transparent border-2 font-bold rounded-xl h-11 text-sm shadow-none transition-all',
                  colorVariants[color].button
                )}
                data-oid="qhptw:o"
              >
                View Feedback <ArrowRight className="w-3.5 h-3.5 ml-2" data-oid="kqmoi6:" />
              </Button>
            </Link>
            <Link to={`/speaking-test?test-id=${test.id}&retake=true`} data-oid="uyc57.d">
              <Button
                variant="outline"
                className="h-11 px-4 rounded-xl border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                data-oid="mwvc8dz"
              >
                <RotateCcw className="w-4 h-4" data-oid="pdh8st4" />
              </Button>
            </Link>
          </div>
        ) : (
          <Link to={`/speaking-test?test-id=${test.id}`} className="block mt-4" data-oid="telg.3f">
            <Button
              className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-rose-600 dark:hover:bg-rose-500 text-white font-bold rounded-xl h-11 text-sm shadow-lg shadow-slate-900/20 dark:shadow-rose-900/40 transition-all group-hover:scale-[1.02] border-0"
              data-oid="7ks8n2n"
            >
              Start Practice <ChevronRight className="w-4 h-4 ml-1.5" data-oid="yuz4ryn" />
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
    prevProps.user?.subscription_tier === nextProps.user?.subscription_tier &&
    prevProps.isAdmin === nextProps.isAdmin &&
    prevProps.hasMounted === nextProps.hasMounted
  );
});

// PERFORMANCE: Accept user from context instead of fetching redundantly
const fetchSpeakingData = async (user, page = 1, pageSize = 12, existingData = null) => {
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
    .eq('test_type', 'speaking')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (passageError) {
    console.error('Error fetching passages:', passageError);
  }

  // REVERTED: Use standard select query instead of RPC
  // Map RPC session data to match component expectation
  // The RPC returns { session_id, passage_id, is_completed, score, progress_percentage, content_data, ... }
  // We need to map it to what the component uses.
  let sessionsData = [];
  const takenCountsResult = await supabase.rpc('get_test_taken_counts', {
    type_filter: 'speaking',
  });

  // Extract passage IDs for optimized fetching
  const passageIds = testsData?.map((t) => t.id) || [];

  if (user && passageIds.length > 0) {
    const { data, error } = await supabase
      .from('test_sessions')
      .select('id, passage_id, is_completed, score, content_data, created_at, completed_at')
      .eq('user_id', user.id)
      .eq('test_type', 'speaking')
      .in('passage_id', passageIds)
      .order('created_at', { ascending: false });

    if (!error && data) {
      sessionsData = data;
    }
  }

  // Process session data — deduplicate by passage_id, keeping only latest session per passage
  // (Matches Reading.jsx pattern: retake creates a new session that replaces the old completed one)
  const sessionsByPassage = {};

  // sessionsData is already sorted by created_at desc from the query
  sessionsData.forEach((s) => {
    const passageId = s.passage_id || s.content_data?.passage_id || s.content_data?.id;
    // Only keep the first (latest) session we encounter for each passage
    if (passageId && !sessionsByPassage[passageId]) {
      sessionsByPassage[passageId] = {
        id: s.id,
        passage_id: passageId,
        is_completed: s.is_completed,
        score: s.score,
        content_data: s.content_data || {},
        test_type: 'speaking',
        created_at: s.created_at,
      };
    }
  });

  const taken = existingData?.testCounts || {};
  if (takenCountsResult?.data) {
    takenCountsResult.data.forEach((item) => {
      if (item.passage_id) taken[item.passage_id] = item.taken_count;
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

  const qCounts = {};
  const durs = {};
  if (testsData) {
    testsData.forEach((test) => {
      qCounts[test.id] = test.total_questions || 3;
      durs[test.id] = test.duration_minutes || 15;
    });
  }

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

export default function Speaking() {
  // PERFORMANCE: Get user from context instead of refetching
  const { userProfile: userData, isAdmin, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [speakingData, setSpeakingData] = useState(null);
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
    if (speakingData?.currentUser?.id === userData?.id) return;

    const loadInitialData = async () => {
      if (!speakingData) setIsLoading(true);
      try {
        const data = await fetchSpeakingData(userData, 1, 12);
        setSpeakingData(data);
      } catch (error) {
        console.error('Error loading speaking data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, [userData, authLoading, speakingData]);
  // userData is now from context, no need for speakingData?.currentUser

  // Load more handler - memoized for performance
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !speakingData?.hasMore) return;

    setIsLoadingMore(true);
    try {
      const nextPage = (speakingData?.currentPage || 1) + 1;
      const moreData = await fetchSpeakingData(userData, nextPage, 12, speakingData);
      setSpeakingData(moreData);
    } catch (error) {
      console.error('Error loading more tests:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, speakingData, userData]);

  const passages = speakingData?.passages || [];
  const sessions = speakingData?.sessions || [];
  const testCounts = speakingData?.testCounts || {};
  const questionCounts = speakingData?.questionCounts || {};
  const durations = speakingData?.durations || {};

  const tabs = [
    { id: 'all', label: 'All Tests', icon: LayoutGrid },
    { id: 'cambridge', label: 'Cambridge', icon: Award },
    { id: 'inprogress', label: 'In Progress', icon: Clock },
  ];

  const filteredTests = passages
    .filter((test) => {
      // With dedup-by-passage, find the single session for this test
      const testSession = sessions.find((s) => s.passage_id === test.id);
      const session = testSession && !testSession.is_completed ? testSession : undefined;

      let matchesTab = false;
      if (activeTab === 'all') matchesTab = true;
      else if (activeTab === 'inprogress') matchesTab = !!session;
      else if (activeTab === 'cambridge') matchesTab = test.is_official_cambridge;
      else matchesTab = test.test_type === activeTab;

      const matchesSearch = (test.title || '')
        .toLowerCase()
        .includes(debouncedSearchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <div
      className="min-h-screen bg-[#FDFDFF] dark:bg-[#050505] font-sans text-slate-900 dark:text-slate-100"
      data-oid="b-dgzsd"
    >
      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-4" data-oid="_:ejdhs">
        {/* Header Section */}
        <div
          className="relative group overflow-hidden rounded-[2.5rem] p-3 md:p-4 border border-rose-200/60 dark:border-rose-800/40 bg-gradient-to-br from-rose-50/80 via-white to-pink-50/80 dark:from-rose-500/5 dark:via-transparent dark:to-pink-500/5 backdrop-blur-3xl shadow-xl shadow-rose-500/10 dark:shadow-rose-500/20"
          data-oid="55oqyi7"
        >
          <div
            className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-rose-500/5 to-transparent -z-10"
            data-oid="qvxb36l"
          />

          <div
            className="absolute -top-24 -right-24 w-80 h-80 bg-rose-400/10 dark:bg-rose-500/10 rounded-full blur-[80px] -z-10 group-hover:scale-110 transition-transform duration-1000"
            data-oid="5-2ceye"
          />

          <div
            className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10"
            data-oid="u4on23a"
          >
            <div className="space-y-4 max-w-2xl" data-oid="f0-1nmy">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-600/5 dark:bg-rose-400/10 border border-rose-500/10 text-rose-600 dark:text-rose-400 text-[9px] font-black uppercase tracking-[0.2em] backdrop-blur-md"
                data-oid="ba7l05n"
              >
                <Sparkles className="w-3 h-3" data-oid="wvccnu5" />
                <span data-oid="v67w132">Premium Interaction Hub</span>
              </motion.div>

              <div className="space-y-2" data-oid="-hc.:j7">
                <h1
                  className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight"
                  data-oid="i49_317"
                >
                  Speaking{' '}
                  <span
                    className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 dark:from-rose-400 dark:via-pink-400 dark:to-fuchsia-400"
                    data-oid="1l-e4hf"
                  >
                    Library
                  </span>
                </h1>
                <p
                  className="text-slate-500 dark:text-slate-400 text-base md:text-lg font-medium leading-relaxed max-w-lg"
                  data-oid="ghxze1t"
                >
                  Enhance your speaking confidence with real-world scenarios and instant AI-driven
                  performance insights.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 items-center" data-oid="8cx_a2m">
                <div
                  className="flex items-center gap-3 bg-white/60 dark:bg-white/5 border border-white dark:border-white/10 px-3 py-2 rounded-2xl shadow-sm backdrop-blur-xl"
                  data-oid="jgx96wq"
                >
                  <div
                    className="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/20"
                    data-oid="g1dg7ka"
                  >
                    <TrendingUp className="w-4 h-4" data-oid="d5-1jcl" />
                  </div>
                  <div className="flex flex-col" data-oid="s2jp4bf">
                    <h4
                      className="text-base font-black text-slate-900 dark:text-white leading-none"
                      data-oid="myo9xci"
                    >
                      78%
                    </h4>
                    <span
                      className="text-[9px] font-bold text-slate-500 uppercase tracking-wider"
                      data-oid="y9doff3"
                    >
                      Fluency
                    </span>
                  </div>
                </div>
                <div
                  className="flex items-center gap-3 bg-white/60 dark:bg-white/5 border border-white dark:border-white/10 px-3 py-2 rounded-2xl shadow-sm backdrop-blur-xl"
                  data-oid="7d7yrth"
                >
                  <div
                    className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20"
                    data-oid="ne3w_9w"
                  >
                    <Award className="w-4 h-4" data-oid="y:v.x7w" />
                  </div>
                  <div className="flex flex-col" data-oid="96tcjna">
                    <h4
                      className="text-base font-black text-slate-900 dark:text-white leading-none"
                      data-oid="46ewmms"
                    >
                      Official
                    </h4>
                    <span
                      className="text-[9px] font-bold text-slate-500 uppercase tracking-wider"
                      data-oid="94hilly"
                    >
                      Content
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Library Insights Card */}
            <div className="lg:block hidden" data-oid="joksnyb">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative p-1"
                data-oid="0obb40s"
              >
                <div
                  className="absolute -inset-2 bg-gradient-to-r from-rose-500/20 to-orange-500/20 rounded-[2.5rem] blur-xl opacity-50 group-hover:opacity-100 transition-opacity"
                  data-oid="l76twcx"
                />

                <div
                  className="relative w-72 bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl border border-white dark:border-white/10 rounded-[2rem] p-4 shadow-2xl overflow-hidden"
                  data-oid="-msck35"
                >
                  <div className="absolute top-0 right-0 p-4" data-oid="gh9xdh:">
                    <div
                      className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20"
                      data-oid="y_2cziw"
                    >
                      <Target
                        className="w-5 h-5 text-rose-600 dark:text-rose-400"
                        data-oid="o5:7l0f"
                      />
                    </div>
                  </div>

                  <div className="space-y-3" data-oid="jsqm04q">
                    <div className="flex flex-col" data-oid="w9c4j3-">
                      <span
                        className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-1"
                        data-oid="x--cuk7"
                      >
                        Weekly Target
                      </span>
                      <h4
                        className="text-xl font-black text-slate-900 dark:text-white"
                        data-oid="zpulp5_"
                      >
                        Speaking Fluency
                      </h4>
                    </div>

                    <div className="space-y-3" data-oid=".t-00iz">
                      <div className="flex justify-between items-end" data-oid="2z8z4xc">
                        <span className="text-xs font-bold text-slate-500" data-oid="fte5wt8">
                          4 of 6 Tests Completed
                        </span>
                        <span className="text-sm font-black text-rose-600" data-oid="2:jvn-y">
                          66%
                        </span>
                      </div>
                      <div
                        className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden p-[1px] border border-slate-200 dark:border-white/5"
                        data-oid="6umq2zj"
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: '66%' }}
                          className="h-full bg-gradient-to-r from-rose-600 to-orange-600 rounded-full shadow-[0_0_10px_rgba(225,29,72,0.4)]"
                          data-oid="ctk33p4"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2" data-oid="zh_6xw5">
                      <div
                        className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 border border-slate-100 dark:border-white/5"
                        data-oid="c6h2_7i"
                      >
                        <div className="flex items-center gap-2 mb-1" data-oid="5:ftp_3">
                          <Mic className="w-3.5 h-3.5 text-rose-500" data-oid="e3d3o:_" />
                          <span
                            className="text-lg font-black text-slate-900 dark:text-white leading-none"
                            data-oid="b8.u17h"
                          >
                            {passages.length}
                          </span>
                        </div>
                        <span
                          className="text-[9px] font-bold text-slate-500 uppercase tracking-wider"
                          data-oid="-:ok6mh"
                        >
                          Total Tests
                        </span>
                      </div>
                      <div
                        className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 border border-slate-100 dark:border-white/5"
                        data-oid="ic72jyr"
                      >
                        <div className="flex items-center gap-2 mb-1" data-oid="03q:7l2">
                          <Users className="w-3.5 h-3.5 text-emerald-500" data-oid="mqwwlrl" />
                          <span
                            className="text-lg font-black text-slate-900 dark:text-white leading-none"
                            data-oid="8y_su.6"
                          >
                            0.8k
                          </span>
                        </div>
                        <span
                          className="text-[9px] font-bold text-slate-500 uppercase tracking-wider"
                          data-oid="0gpzll-"
                        >
                          Active Users
                        </span>
                      </div>
                    </div>
                  </div>
                  <div
                    className="absolute -bottom-6 -right-6 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl"
                    data-oid="m5l.oro"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Pro Banner For Free Users */}
        {userData && (userData.subscription_tier || 'free').toLowerCase() === 'free' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative group mt-2"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 via-orange-500/10 to-amber-500/10 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 transition-duration-500" />

            <div className="relative overflow-hidden rounded-[2rem] border border-rose-200/50 dark:border-rose-500/20 bg-white/50 dark:bg-[#121212]/80 backdrop-blur-2xl p-1 shadow-2xl shadow-rose-500/5">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-rose-500/10 to-orange-500/10 rounded-full blur-3xl -z-10" />

              <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 md:p-8 rounded-[1.8rem] bg-white/40 dark:bg-white/5">
                <div className="flex items-center gap-6">
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-rose-500 to-orange-500 blur-lg opacity-40 animate-pulse" />
                    <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-500/20 dark:to-orange-500/20 border border-rose-100 dark:border-rose-500/30 flex items-center justify-center">
                      <Crown className="w-8 h-8 text-rose-500 dark:text-rose-400 fill-current" />
                    </div>
                  </div>

                  <div className="text-center md:text-left space-y-1.5">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                      Unlock Speaking Mastery <span className="hidden md:inline-block">🚀</span>
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 font-medium text-sm md:text-base max-w-xl leading-relaxed">
                      Get{' '}
                      <span className="text-rose-600 dark:text-rose-400 font-bold">
                        unlimited AI evaluations
                      </span>
                      , instant band scores (0-9), and deeper insights to ace your IELTS Speaking
                      test.
                    </p>
                  </div>
                </div>

                <Link to={createPageUrl('Pricing')} className="flex-shrink-0 w-full md:w-auto">
                  <Button className="w-full md:w-auto h-12 md:h-14 px-8 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold text-base shadow-xl shadow-slate-900/10 dark:shadow-white/5 hover:scale-[1.02] active:scale-[0.98] transition-all border border-transparent group/btn">
                    Upgrade Now{' '}
                    <Sparkles className="w-4 h-4 ml-2 group-hover/btn:animate-spin-slow" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        <div className="sticky top-4 z-40 px-1" data-oid="byc4r65">
          <div
            className="bg-white/80 dark:bg-[#0c0c0c]/80 backdrop-blur-3xl p-1 rounded-[1.5rem] md:rounded-[2rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] border border-slate-200/60 dark:border-white/10 flex flex-col lg:flex-row gap-2 lg:gap-4 items-center justify-between"
            data-oid="sqrqf27"
          >
            <div className="relative w-full lg:max-w-md group" data-oid=":27klze">
              <div
                className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none"
                data-oid=".j1xgc."
              >
                <Search
                  className="h-5 w-5 text-slate-400 group-focus-within:text-rose-500 transition-all duration-300 group-focus-within:scale-110"
                  data-oid="pjdla74"
                />
              </div>
              <Input
                placeholder="Find a speaking practice..."
                className="pl-14 h-10 md:h-12 bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-transparent focus-visible:ring-2 focus-visible:ring-rose-500/20 rounded-[1.3rem] md:rounded-[1.8rem] text-sm md:text-base font-medium placeholder:text-slate-400 transition-all group-hover:bg-slate-100 dark:group-hover:bg-white/[0.08]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-oid="w7teu3z"
              />
            </div>

            <div
              className="flex items-center bg-white/60 dark:bg-white/5 backdrop-blur-xl p-1 rounded-xl gap-1.5 w-full lg:w-auto overflow-x-auto no-scrollbar border border-slate-200/50 dark:border-white/10 px-2 lg:p-1"
              data-oid="ql-ky:c"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-1.5 md:px-5 md:py-2 rounded-xl md:rounded-2xl text-[10px] md:text-sm font-bold transition-all duration-300 whitespace-nowrap shrink-0 lg:flex-none uppercase tracking-wider',
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-lg shadow-rose-500/25'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
                  )}
                  data-oid="g948a2q"
                >
                  <tab.icon className="w-4 h-4" data-oid="i6rrr_d" />
                  {tab.label}
                </button>
              ))}
            </div>

            <div
              className="hidden lg:flex items-center gap-4 px-6 border-l border-slate-200 dark:border-white/10 h-10"
              data-oid="qr:_z5g"
            >
              <div
                className="flex items-center gap-3 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer group/view"
                data-oid="e4fsof6"
              >
                <LayoutGrid
                  className="w-5 h-5 group-hover/view:scale-110 transition-transform"
                  data-oid="iheum.h"
                />

                <span className="text-xs font-black uppercase tracking-[0.1em]" data-oid="3mhqyd6">
                  Grid
                </span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500/20" data-oid="5uzb.uw" />
              <div
                className="flex items-center gap-3 text-slate-300 dark:text-slate-700 cursor-not-allowed"
                data-oid="8itbfh_"
              >
                <List className="w-5 h-5" data-oid="cwdw7j5" />
                <span className="text-xs font-black uppercase tracking-[0.1em]" data-oid="-o22g2y">
                  List
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tests Grid */}
        <div className="min-h-[600px]" data-oid="toaita2">
          {isLoading ? (
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8"
              data-oid="650soz."
            >
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-[#111111] rounded-2xl border border-slate-200 dark:border-white/5 p-6 flex flex-col h-full h-[400px]"
                  data-oid="100:8ew"
                >
                  <div className="flex justify-between items-start mb-6" data-oid="ks1ujq2">
                    <Skeleton className="w-12 h-12 rounded-xl" data-oid="w368d.-" />
                    <Skeleton className="h-6 w-20 rounded-lg" data-oid="rzg-50d" />
                  </div>
                  <div className="flex-grow space-y-4" data-oid="h96l49a">
                    <Skeleton className="h-7 w-3/4 rounded-lg" data-oid="mf0m1uf" />
                    <Skeleton className="h-4 w-full rounded-lg" data-oid="gjscu8z" />
                  </div>
                  <Skeleton className="h-12 w-full rounded-xl mt-6" data-oid="o51t76q" />
                </div>
              ))}
            </div>
          ) : (
            <AnimatePresence>
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8"
                data-oid="f:qit:j"
              >
                {filteredTests.map((test) => {
                  // With dedup-by-passage, we get exactly one session per test (the latest one)
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
                      duration={durations[test.id]}
                      questionCount={questionCounts[test.id]}
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
                    data-oid="4yqk4q6"
                  >
                    <div
                      className="w-24 h-24 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6"
                      data-oid="45-2:h5"
                    >
                      <Mic
                        className="w-10 h-10 text-slate-300 dark:text-slate-600"
                        data-oid="8x2:p.1"
                      />
                    </div>
                    <h3
                      className="text-xl font-bold text-slate-900 dark:text-white mb-2"
                      data-oid="t5l_0n_"
                    >
                      No speaking tests available
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400" data-oid="6e2r-_z">
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
        {speakingData?.hasMore && (
          <div className="flex justify-center mt-12 pb-12" data-oid=".rl8k_q">
            <Button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              variant="outline"
              className="rounded-full px-8 h-12 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold tracking-wide hover:bg-white dark:hover:bg-white/5 hover:border-rose-200 dark:hover:border-rose-900 transition-all shadow-sm"
              data-oid="m1vzfzh"
            >
              {isLoadingMore ? (
                <>
                  <div
                    className="w-4 h-4 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin mr-2"
                    data-oid="4ie-gdy"
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
