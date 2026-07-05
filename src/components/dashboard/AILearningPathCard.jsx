import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Zap, ChevronRight, Sparkles, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/cn';
import { calculateDaysUntilExam } from '@/services/adaptiveLearningService';

const AILearningPathCard = React.memo(
  ({ focus: propFocus, progress: propProgress, isLoading: propIsLoading }) => {
    const { user: authUser, loading: authLoading } = useAuth();

    const user = authUser;
    const focus = propFocus || null;
    const progress = propProgress || null;
    const isLoading = propIsLoading || authLoading;
    const daysUntilExam = user?.test_date ? calculateDaysUntilExam(user.test_date) : null;

    if (isLoading) {
      return (
        <Card
          className={cn(
            'relative rounded-2xl h-full flex flex-col overflow-hidden',
            'bg-white/40 dark:bg-slate-950/40 border border-white/20 dark:border-white/5'
          )}
        >
          <CardHeader className="p-5 pb-1 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <Skeleton className="h-6 w-32 rounded-lg" />
              </div>
              <Skeleton className="w-8 h-8 rounded-lg" />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-4 flex-1 flex flex-col space-y-6">
            <div className="space-y-3">
              <Skeleton className="h-3 w-24 rounded-full" />
              <Skeleton className="h-8 w-3/4 rounded-lg" />
              <Skeleton className="h-4 w-full rounded-md" />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-2 w-16" />
                  <Skeleton className="h-2 w-8" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-2 w-20" />
                  <Skeleton className="h-2 w-12" />
                </div>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-1.5 flex-1 rounded-full" />
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-auto pt-4 space-y-4">
              <Skeleton className="h-32 w-full rounded-[1.5rem]" />
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton
                        key={i}
                        className="w-7 h-7 rounded-full border-2 border-background"
                      />
                    ))}
                  </div>
                  <div className="space-y-1">
                    <Skeleton className="h-2 w-20" />
                    <Skeleton className="h-2 w-24" />
                  </div>
                </div>
                <div className="space-y-1 text-right">
                  <Skeleton className="h-5 w-8 ml-auto" />
                  <Skeleton className="h-2 w-12 ml-auto" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    const isPro = user?.subscription_tier === 'pro' || user?.subscription_tier === 'premium';
    const readinessScore = progress?.percentage || 0;

    // Dynamic description based on real AI reason or fallback
    const missionDescription =
      focus?.ai_reason ||
      (isPro
        ? 'Master your high-impact areas today to maximize your potential score across all sections.'
        : 'Lock in your progress and get a personal plan that improves as you practice.');

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="group relative h-full"
        data-oid="xgkm25h"
      >
        <Card
          className={cn(
            'relative rounded-2xl transition-all duration-300 overflow-hidden group/card h-full flex flex-col',
            'bg-white dark:bg-slate-900',
            'border border-slate-200 dark:border-slate-800',
            'shadow-sm',
            'hover:shadow-md transition-shadow duration-300',
            'hover:border-indigo-500/40 dark:hover:border-indigo-500/40'
          )}
          data-oid=":5z6c6x"
        >
          {/* Decorative pattern */}
          <div
            className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:24px_24px]"
            data-oid=".p0.d6v"
          />

          <CardHeader className="p-5 pb-1 relative z-10" data-oid="a4wj2vf">
            <div className="flex items-center justify-between" data-oid="y5oqiz5">
              <CardTitle
                className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2.5"
                data-oid="a_3nazj"
              >
                <div
                  className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shadow-sm transition-transform group-hover/card:rotate-12"
                  data-oid="0o-fwt2"
                >
                  <Sparkles
                    className="w-4 h-4 transition-transform duration-500 group-hover/card:scale-110 text-indigo-500"
                    data-oid="klfhoj3"
                  />
                </div>
                <div data-oid="q2o0w:y">
                  <span className="tracking-tight leading-tight" data-oid="es-fm85">
                    AI Learning Path
                  </span>
                </div>
              </CardTitle>
              <div
                className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-600/20 transform group-hover/card:rotate-6 transition-transform duration-500 shrink-0"
                data-oid="u8yw0tf"
              >
                <Zap className="w-4 h-4 text-white" data-oid=".oxiryc" />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 pt-2.5 flex-1 flex flex-col relative z-10" data-oid="xvy-.uk">
            <div className="space-y-4 flex-1" data-oid="l6.3pes">
              <div className="flex items-center gap-2 mb-1 text-left" data-oid="e1:.u7s">
                <div
                  className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse"
                  data-oid="aet_php"
                />

                <span
                  className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none"
                  data-oid="dsum7uu"
                >
                  Personalized Focus
                </span>
              </div>

              <div className="text-left space-y-2" data-oid="1nqqtfk">
                <h3
                  className="text-3xl font-black text-slate-900 dark:text-white leading-tight tracking-tight"
                  data-oid="das10fk"
                >
                  Your Daily{' '}
                  <span
                    className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-500 dark:from-blue-400 dark:via-purple-400 dark:to-purple-400"
                    data-oid="p4o19w6"
                  >
                    AI Learning Path
                  </span>
                </h3>

                <p
                  className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed"
                  data-oid="by:ctym"
                >
                  {isPro
                    ? `Optimized AI-driven lessons for your exam in ${daysUntilExam || 'a few'} days.`
                    : 'Practice daily to unlock your AI personalized study roadmap and premium learning insights.'}
                </p>
              </div>

              {/* Metrics Section */}
              <div className="grid grid-cols-2 gap-5 pt-1" data-oid="uac5j6:">
                <div className="space-y-1.5" data-oid="zx:pagp">
                  <div
                    className="flex items-center justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest"
                    data-oid="l2evnk2"
                  >
                    <span data-oid="-.kgb.m">Readiness</span>
                    <span className="text-indigo-600 font-bold text-[10px]" data-oid="6af17nt">
                      {readinessScore}%
                    </span>
                  </div>
                  <div
                    className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden"
                    data-oid="p5s_3on"
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${readinessScore}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full bg-indigo-500"
                      data-oid="rjw3a5j"
                    />
                  </div>
                </div>
                <div className="space-y-1.5" data-oid="._0e.wq">
                  <div
                    className="flex items-center justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest"
                    data-oid="o.xpbwb"
                  >
                    <span data-oid="_cllu30">Consistency</span>
                    <span className="text-purple-600 font-bold text-[10px]" data-oid="20r7ujt">
                      {(() => {
                        const score = (progress?.recentConsistency || []).filter(Boolean).length;
                        if (progress?.todayCompleted > 0) return 'Active';
                        if (score >= 4) return 'Strong';
                        if (score >= 2) return 'Steady';
                        return 'Inactive';
                      })()}
                    </span>
                  </div>
                  <div className="flex gap-1" data-oid="81009uj">
                    {(progress?.recentConsistency || [0, 0, 0, 0, 0]).map((v, i) => (
                      <div
                        key={i}
                        className={cn(
                          'h-1.5 flex-1 rounded-full transition-colors duration-500',
                          v ? 'bg-purple-500' : 'bg-slate-100 dark:bg-white/5'
                        )}
                        data-oid="e-duepf"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-4" data-oid="d45vy06">
              <div
                className={cn(
                  'relative overflow-hidden rounded-[1.5rem] p-5 transition-all duration-500',
                  'bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950/20 dark:via-slate-900/40 dark:to-purple-950/20 border border-indigo-100 dark:border-indigo-500/20 shadow-[0_8px_32px_-8px_rgba(79,70,229,0.15)] dark:shadow-[0_8px_32px_-8px_rgba(79,70,229,0.3)]'
                )}
                data-oid="yn2kpns"
              >
                <div className="relative z-10" data-oid="ylckurf">
                  <div
                    className="flex items-center justify-between mb-2 text-left"
                    data-oid="5t:ysp2"
                  >
                    <h4
                      className="text-[11px] font-black text-slate-900 dark:text-white flex items-center gap-2"
                      data-oid="hv615kb"
                    >
                      Today's Mission
                      <Activity className="w-3.5 h-3.5 text-indigo-500" data-oid="ee::wke" />
                    </h4>
                    <div
                      className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md"
                      data-oid=":1zl78o"
                    >
                      +50 XP
                    </div>
                  </div>
                  <p
                    className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mb-4 leading-normal opacity-90 text-left"
                    data-oid="kc3f:mg"
                  >
                    {missionDescription}
                  </p>
                  <Button
                    asChild
                    className="w-full bg-slate-900 dark:bg-indigo-600 hover:bg-black dark:hover:bg-indigo-500 text-white rounded-xl h-11 font-black text-[10px] uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 border-0"
                    data-oid="i5jtyqw"
                  >
                    <Link
                      to={isPro ? createPageUrl('LearningPath') : createPageUrl('Pricing')}
                      data-oid="y:qbt_f"
                    >
                      {isPro ? 'START MISSION' : 'UPGRADE NOW'}{' '}
                      <ChevronRight className="w-4 h-4 ml-1" data-oid="xh1sc.f" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between px-1" data-oid="i-xhh9_">
                <div className="flex items-center gap-2.5" data-oid="2jy4.j-">
                  <div className="flex -space-x-1.5" data-oid="hsncfa-">
                    {[32, 45, 67, 89].map((seed) => (
                      <div
                        key={seed}
                        className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-sm transition-transform hover:-translate-y-1"
                        data-oid=".nud8br"
                      >
                        <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`}
                          alt="avatar"
                          loading="lazy"
                          fetchPriority="low"
                          data-oid="pyh6m_l"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="text-left leading-none" data-oid="q2n77_.">
                    <p
                      className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-tight"
                      data-oid="-ud7k3t"
                    >
                      AI LEARNING ACTIVE
                    </p>
                    <p
                      className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 mt-1"
                      data-oid="1mwj12n"
                    >
                      1542+ Students
                    </p>
                  </div>
                </div>
                <div className="text-right" data-oid="rf-pdji">
                  <span
                    className="text-base font-black text-slate-900 dark:text-white leading-none"
                    data-oid="y4kihdr"
                  >
                    {daysUntilExam || '0'}
                  </span>
                  <span
                    className="text-[8px] font-black text-slate-400 uppercase tracking-tighter ml-1 align-middle"
                    data-oid="he.jtyo"
                  >
                    Days Left
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }
);

AILearningPathCard.displayName = 'AILearningPathCard';

export default AILearningPathCard;
