import React, { useState, memo, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import {
  Search,
  BookOpen,
  Headphones,
  PenTool,
  Mic,
  GraduationCap,
  ChevronRight,
  CheckCircle2,
  Lock,
  Sparkles,
  Play,
  Award,
  TrendingUp,
  Target,
  LayoutGrid,
  List,
  Users,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { User } from '@/features/auth/services/User';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useDataQuery } from '@/hooks/useDataQuery';
import { useDebounce } from '@/hooks/useDebounce';

const MODULE_THEMES = {
  reading: {
    color: 'blue',
    url: '/reading-test',
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    border: 'border-blue-500/30 dark:border-blue-400/30',
    shadow: 'shadow-[0_0_15px_rgba(59,130,246,0.1)]',
    iconActive: 'bg-blue-500 text-white shadow-blue-500/20',
    iconHover: 'group-hover/module:text-blue-500',
    textMain: 'text-blue-700 dark:text-blue-300',
    textSub: 'text-blue-600 dark:text-blue-400',
    textResume: 'text-blue-500',
  },
  listening: {
    color: 'purple',
    url: '/listening-test',
    bg: 'bg-purple-500/10 dark:bg-purple-500/20',
    border: 'border-purple-500/30 dark:border-purple-400/30',
    shadow: 'shadow-[0_0_15px_rgba(168,85,247,0.1)]',
    iconActive: 'bg-purple-500 text-white shadow-purple-500/20',
    iconHover: 'group-hover/module:text-purple-500',
    textMain: 'text-purple-700 dark:text-purple-300',
    textSub: 'text-purple-600 dark:text-purple-400',
    textResume: 'text-purple-500',
  },
  writing: {
    color: 'orange',
    url: '/writing-task?taskId=',
    bg: 'bg-orange-500/10 dark:bg-orange-500/20',
    border: 'border-orange-500/30 dark:border-orange-400/30',
    shadow: 'shadow-[0_0_15px_rgba(249,115,22,0.1)]',
    iconActive: 'bg-orange-500 text-white shadow-orange-500/20',
    iconHover: 'group-hover/module:text-orange-500',
    textMain: 'text-orange-700 dark:text-orange-300',
    textSub: 'text-orange-600 dark:text-orange-400',
    textResume: 'text-orange-500',
  },
  speaking: {
    color: 'rose',
    url: '/speaking-test',
    bg: 'bg-rose-500/10 dark:bg-rose-500/20',
    border: 'border-rose-500/30 dark:border-rose-400/30',
    shadow: 'shadow-[0_0_15px_rgba(244,63,94,0.1)]',
    iconActive: 'bg-rose-500 text-white shadow-rose-500/20',
    iconHover: 'group-hover/module:text-rose-500',
    textMain: 'text-rose-700 dark:text-rose-300',
    textSub: 'text-rose-600 dark:text-rose-400',
    textResume: 'text-rose-500',
  },
};

const ModuleLink = ({ type, data, session, isLocked }) => {
  if (!data)
    return (
      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 opacity-40 cursor-not-allowed h-[52px]"
        data-oid="a:viu2i"
      >
        {type === 'reading' && (
          <BookOpen className="w-4 h-4 text-slate-400 shrink-0" data-oid="nb-8esl" />
        )}
        {type === 'listening' && (
          <Headphones className="w-4 h-4 text-slate-400 shrink-0" data-oid="y4v7q7n" />
        )}
        {type === 'writing' && (
          <PenTool className="w-4 h-4 text-slate-400 shrink-0" data-oid="h56y1gb" />
        )}
        {type === 'speaking' && (
          <Mic className="w-4 h-4 text-slate-400 shrink-0" data-oid="77txrqc" />
        )}
        <span
          className="text-[10px] font-black uppercase tracking-wider text-slate-400 truncate"
          data-oid="u2hrqpi"
        >
          {type}
        </span>
      </div>
    );

  const isResuming = !!session;
  const theme = MODULE_THEMES[type];
  let href = type === 'writing' ? `${theme.url}${data.id}` : `${theme.url}/${data.id}`;

  const gradientClasses = {
    blue: 'from-blue-500',
    purple: 'from-purple-500',
    orange: 'from-orange-500',
    rose: 'from-rose-500',
  };

  return (
    <Link
      to={isLocked ? '#' : href}
      className={cn('block group/module h-[52px]', isLocked && 'cursor-not-allowed')}
      data-oid="q3p34_4"
    >
      <div
        className={cn(
          'flex items-center gap-2.5 p-2 rounded-[1.25rem] border transition-all duration-300 h-full relative overflow-hidden',
          theme.bg,
          theme.border,
          isResuming ? theme.shadow : 'hover:shadow-md opacity-80 hover:opacity-100'
        )}
        data-oid="nz9t:m4"
      >
        {isResuming && (
          <div
            className={cn(
              'absolute inset-0 opacity-[0.05] dark:opacity-[0.1] bg-gradient-to-br to-transparent',
              gradientClasses[theme.color]
            )}
            data-oid="qvrbzoa"
          />
        )}

        <div
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm transition-all duration-300 group-hover/module:scale-105',
            isResuming
              ? theme.iconActive
              : cn(
                  'bg-white dark:bg-slate-800/80 border border-white/50 dark:border-white/10',
                  theme.textResume // Use theme color for the icon/text
                )
          )}
          data-oid="nlwbe.w"
        >
          {type === 'reading' && <BookOpen className="w-4 h-4" data-oid="m0t0rzc" />}
          {type === 'listening' && <Headphones className="w-4 h-4" data-oid="3_ty1xz" />}
          {type === 'writing' && <PenTool className="w-4 h-4" data-oid="vv5apgx" />}
          {type === 'speaking' && <Mic className="w-4 h-4" data-oid="6l80m7l" />}
        </div>

        <div className="flex flex-col flex-1 min-w-0 relative z-10" data-oid="t6rwjoz">
          <span
            className={cn(
              'text-[10px] font-black uppercase tracking-tight leading-none',
              isResuming ? theme.textMain : 'text-slate-700 dark:text-slate-300'
            )}
            data-oid="avbjq01"
          >
            {type}
          </span>
          <span
            className={cn(
              'text-[8px] font-bold uppercase tracking-tighter opacity-70',
              isResuming ? theme.textSub : 'text-slate-400 dark:text-slate-500'
            )}
            data-oid="d-is4gf"
          >
            {isResuming ? 'Resume' : 'Start Now'}
          </span>
        </div>

        {isLocked ? (
          <Lock
            className="w-3 h-3 text-slate-300 dark:text-slate-600 ml-auto shrink-0"
            data-oid="d8nfzwq"
          />
        ) : (
          <div className="ml-auto shrink-0 relative z-10" data-oid="8v5ti5f">
            {isResuming ? (
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center bg-white/50 dark:bg-black/20',
                  theme.textResume
                )}
                data-oid="5a51zxh"
              >
                <Play
                  className="w-2 h-2 fill-current transition-transform group-hover/module:scale-110"
                  data-oid="i:funu7"
                />
              </div>
            ) : (
              <ChevronRight
                className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover/module:translate-x-0.5 transition-transform"
                data-oid="k0x72op"
              />
            )}
          </div>
        )}
      </div>
    </Link>
  );
};

const CARD_THEMES = {
  blue: {
    bg: 'bg-gradient-to-br from-blue-50/90 via-white to-blue-50/60 dark:from-blue-500/[0.12] dark:via-[#080808] dark:to-blue-500/[0.04] border-blue-200/50 dark:border-blue-500/20',
    glow: 'bg-blue-400',
    icon: 'bg-blue-100/50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30 shadow-blue-500/10',
    badge:
      'bg-blue-100/80 dark:bg-blue-500/20 border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-300',
    badgeDot: 'bg-blue-500 dark:bg-blue-400',
    officialBadge: 'bg-blue-600/10 dark:bg-blue-400/20 border-blue-200/50 dark:border-blue-400/30',
    officialIcon: 'text-blue-600 dark:text-blue-400',
    officialText: 'text-blue-700 dark:text-blue-100',
    masteryText: 'text-blue-600 dark:text-blue-400',
    masteryBar: 'from-blue-500 via-indigo-500 to-blue-600',
  },
  indigo: {
    bg: 'bg-gradient-to-br from-indigo-50/90 via-white to-indigo-50/60 dark:from-indigo-500/[0.12] dark:via-[#080808] dark:to-indigo-500/[0.04] border-indigo-200/50 dark:border-indigo-500/20',
    glow: 'bg-indigo-400',
    icon: 'bg-indigo-100/50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30 shadow-indigo-500/10',
    badge:
      'bg-indigo-100/80 dark:bg-indigo-500/20 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300',
    badgeDot: 'bg-indigo-500 dark:bg-indigo-400',
    officialBadge:
      'bg-indigo-600/10 dark:bg-indigo-400/20 border-indigo-200/50 dark:border-indigo-400/30',
    officialIcon: 'text-indigo-600 dark:text-indigo-400',
    officialText: 'text-indigo-700 dark:text-indigo-100',
    masteryText: 'text-indigo-600 dark:text-indigo-400',
    masteryBar: 'from-indigo-500 via-violet-500 to-indigo-600',
  },
  violet: {
    bg: 'bg-gradient-to-br from-violet-50/90 via-white to-violet-50/60 dark:from-violet-500/[0.12] dark:via-[#080808] dark:to-violet-500/[0.04] border-violet-200/50 dark:border-violet-500/20',
    glow: 'bg-violet-400',
    icon: 'bg-violet-100/50 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-500/30 shadow-violet-500/10',
    badge:
      'bg-violet-100/80 dark:bg-violet-500/20 border-violet-200 dark:border-violet-500/30 text-violet-700 dark:text-violet-300',
    badgeDot: 'bg-violet-500 dark:bg-violet-400',
    officialBadge:
      'bg-violet-600/10 dark:bg-violet-400/20 border-violet-200/50 dark:border-violet-400/30',
    officialIcon: 'text-violet-600 dark:text-violet-400',
    officialText: 'text-violet-700 dark:text-violet-100',
    masteryText: 'text-violet-600 dark:text-violet-400',
    masteryBar: 'from-violet-500 via-fuchsia-500 to-violet-600',
  },
  sky: {
    bg: 'bg-gradient-to-br from-sky-50/90 via-white to-sky-50/60 dark:from-sky-500/[0.12] dark:via-[#080808] dark:to-sky-500/[0.04] border-sky-200/50 dark:border-sky-500/20',
    glow: 'bg-sky-400',
    icon: 'bg-sky-100/50 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-500/30 shadow-sky-500/10',
    badge:
      'bg-sky-100/80 dark:bg-sky-500/20 border-sky-200 dark:border-sky-500/30 text-sky-700 dark:text-sky-300',
    badgeDot: 'bg-sky-500 dark:bg-sky-400',
    officialBadge: 'bg-sky-600/10 dark:bg-sky-400/20 border-sky-200/50 dark:border-sky-400/30',
    officialIcon: 'text-sky-600 dark:text-sky-400',
    officialText: 'text-sky-700 dark:text-sky-100',
    masteryText: 'text-sky-600 dark:text-sky-400',
    masteryBar: 'from-sky-500 via-blue-500 to-sky-600',
  },
};

const CambridgeTestCard = ({ title, modules, sessions }) => {
  const getColor = (str) => {
    const colors = ['blue', 'indigo', 'violet', 'sky'];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const color = getColor(title);
  const theme = CARD_THEMES[color];

  const moduleTypes = ['reading', 'listening', 'writing', 'speaking'];
  const totalInGroup = moduleTypes.filter((k) => modules[k]).length;
  const completedInGroup = moduleTypes.filter(
    (k) => modules[k] && sessions[modules[k].id]?.is_completed
  ).length;

  const progressPercent =
    totalInGroup > 0 ? Math.round((completedInGroup / totalInGroup) * 100) : 0;

  const isLocked = false;

  // Calculate band scores for completed modules
  const moduleScores = moduleTypes.reduce((acc, type) => {
    const module = modules[type];
    if (module && sessions[module.id]?.is_completed && sessions[module.id]?.score != null) {
      acc[type] = parseFloat(sessions[module.id].score);
    }
    return acc;
  }, {});

  const completedScores = Object.values(moduleScores);
  const hasScores = completedScores.length > 0;
  const overallBandScore = hasScores
    ? (completedScores.reduce((sum, s) => sum + s, 0) / completedScores.length).toFixed(1)
    : null;

  const moduleLabels = { reading: 'R', listening: 'L', writing: 'W', speaking: 'S' };

  return (
    <div
      className={cn(
        'rounded-[2.5rem] border p-7 shadow-xl dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] group flex flex-col h-full relative transition-all duration-500 hover:shadow-2xl hover:translate-y-[-4px] overflow-hidden backdrop-blur-3xl',
        theme.bg
      )}
      data-oid="dck9ud6"
    >
      {/* Premium Background Effects */}
      <div
        className={cn(
          'absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[80px] opacity-[0.1] dark:opacity-[0.15] transition-opacity duration-700 group-hover:opacity-[0.15] dark:group-hover:opacity-[0.2]',
          theme.glow
        )}
        data-oid="e03du1h"
      />

      <div className="flex justify-between items-start mb-6 relative z-10" data-oid="8sel9ep">
        <div
          className={cn(
            'w-14 h-14 rounded-2xl flex items-center justify-center border shadow-inner transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3',
            theme.icon
          )}
          data-oid="ls7v:rv"
        >
          <GraduationCap className="w-7 h-7" data-oid="rfocrk7" />
        </div>

        {progressPercent > 0 ? (
          <div
            className={cn(
              'flex items-center gap-2 rounded-full px-4 py-1.5 border backdrop-blur-md shadow-sm',
              theme.badge
            )}
            data-oid="jh6zxy-"
          >
            <div
              className={cn(
                'w-1.5 h-1.5 rounded-full',
                theme.badgeDot,
                'shadow-[0_0_10px_rgba(0,0,0,0.1)]'
              )}
              data-oid="sj3wqzt"
            />

            <span className="text-[11px] font-black tracking-widest uppercase" data-oid="89kduby">
              {progressPercent}%{' '}
              <span className="text-[8px] opacity-70" data-oid="m.x7-mm">
                Done
              </span>
            </span>
          </div>
        ) : (
          <div
            className={cn(
              'flex items-center gap-1.5 rounded-full px-4 py-1.5 border backdrop-blur-md shadow-sm',
              theme.officialBadge
            )}
            data-oid="mt9_.qf"
          >
            <ShieldCheck className={cn('w-3.5 h-3.5', theme.officialIcon)} data-oid="da53ahe" />
            <span
              className={cn(
                'text-[10px] font-black tracking-[0.2em] uppercase',
                theme.officialText
              )}
              data-oid=":re1ysy"
            >
              OFFICIAL
            </span>
          </div>
        )}
      </div>

      <div className="flex-grow flex flex-col min-h-0 relative z-10 mb-8" data-oid="6d1m55k">
        <h3
          className="text-2xl font-black text-slate-900 dark:text-white leading-tight mb-3 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400 tracking-tight"
          data-oid="317hn8k"
        >
          {title}
        </h3>
        <p
          className="text-sm text-slate-500 dark:text-slate-400 font-bold leading-relaxed line-clamp-2 mb-6 uppercase tracking-tight opacity-80"
          data-oid="9u05k7b"
        >
          Full IELTS exam simulation including all four skills.
        </p>

        <div className="mt-auto grid grid-cols-2 gap-3" data-oid="8h7-m86">
          {moduleTypes.map((type) => (
            <ModuleLink
              key={type}
              type={type}
              data={modules[type]}
              session={modules[type] && sessions[modules[type].id]}
              isLocked={isLocked}
              data-oid="ztd65ro"
            />
          ))}
        </div>
      </div>

      {/* Band Score Section */}
      {hasScores && (
        <div className="relative z-10 pt-1" data-oid="-.uw1ba">
          <div
            className="bg-white/40 dark:bg-white/[0.02] rounded-2xl p-2 border border-white/40 dark:border-white/5 backdrop-blur-md flex items-center justify-between gap-3 transition-all duration-300 hover:bg-white/60 dark:hover:bg-white/[0.04]"
            data-oid="u:8w8.z"
          >
            {/* Overall Band Score */}
            <div className="flex items-center gap-2.5" data-oid="f5u_ci_">
              <div className="relative group/band" data-oid="ft.1x2n">
                <div
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-white via-slate-50 to-slate-200 dark:from-slate-800 dark:via-slate-900 dark:to-black flex items-center justify-center shadow-md border border-white dark:border-white/20 relative overflow-hidden transition-transform duration-500 group-hover/band:scale-105"
                  data-oid="lb_xse9"
                >
                  <div
                    className="absolute inset-0 bg-gradient-to-tr from-blue-500/[0.03] to-purple-500/[0.03] dark:from-white/5 dark:to-transparent"
                    data-oid="nfjr::9"
                  />

                  <span
                    className="text-xl font-black text-slate-900 dark:text-white relative z-10 tracking-tight"
                    data-oid="pw3ma:1"
                  >
                    {overallBandScore}
                  </span>
                </div>
                <div
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border border-slate-50 dark:border-white/10 flex items-center justify-center shadow-sm"
                  data-oid="r_b4jv2"
                >
                  <Award className="w-3 h-3 text-blue-600 dark:text-blue-400" data-oid="6pm4_-b" />
                </div>
              </div>
              <div className="flex flex-col min-w-0" data-oid="6ro681d">
                <span
                  className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5 truncate"
                  data-oid="-hopyiu"
                >
                  Overall
                </span>
                <span
                  className="text-[10px] font-black text-slate-600 dark:text-slate-300 truncate"
                  data-oid="hg:-.c1"
                >
                  {completedScores.length}/4
                </span>
              </div>
            </div>

            {/* Individual Module Scores */}
            <div
              className="flex items-center gap-1.5 p-1 bg-black/[0.02] dark:bg-white/[0.03] rounded-xl"
              data-oid="_20uvex"
            >
              {moduleTypes.map((type) => {
                const score = moduleScores[type];
                const hasModule = modules[type];
                if (!hasModule) return null;
                return (
                  <div
                    key={type}
                    className={cn(
                      'flex flex-col items-center min-w-[28px] px-1.5 py-1 rounded-lg transition-all duration-300',
                      score != null
                        ? 'bg-white dark:bg-white/10 shadow-sm border border-slate-100 dark:border-white/5'
                        : 'opacity-20 grayscale scale-95'
                    )}
                    data-oid="5ip1e8-"
                  >
                    <span
                      className="text-[8px] font-black uppercase tracking-tighter text-slate-400 mb-0.5"
                      data-oid="3-7td03"
                    >
                      {moduleLabels[type]}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-black',
                        score != null
                          ? 'text-slate-900 dark:text-white'
                          : 'text-slate-300 dark:text-slate-700'
                      )}
                      data-oid="csgw9i7"
                    >
                      {score != null ? score.toFixed(1) : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar (only when in progress and no scores yet) */}
      {progressPercent > 0 && progressPercent < 100 && !hasScores && (
        <div
          className="relative z-10 pt-5 border-t border-slate-50 dark:border-white/[0.03]"
          data-oid="v_rdp8x"
        >
          <div className="flex justify-between items-center mb-2.5 px-0.5" data-oid="eejrznz">
            <span
              className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400/80"
              data-oid="idbk:kx"
            >
              Overall Kit Completion
            </span>
            <motion.span
              initial={{ opacity: 0, x: 5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className={cn('text-xs font-black tracking-tight', theme.masteryText)}
              data-oid="wqns64h"
            >
              {progressPercent}%
            </motion.span>
          </div>
          <div
            className="h-2.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden p-[1px] border border-slate-200/50 dark:border-white/10 shadow-inner"
            data-oid=":y6mekb"
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
              className={cn(
                'h-full rounded-full shadow-lg relative overflow-hidden',
                'bg-gradient-to-r',
                theme.masteryBar
              )}
              data-oid="wl5af98"
            >
              <div
                className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-50"
                data-oid="al9lmnx"
              />
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
};

const MemoizedCambridgeTestCard = memo(CambridgeTestCard);

export default function CambridgeTests() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  /* Refactored for maximum robustness and optimal performance */
  const fetcher = useCallback(async () => {
    let userData = null;
    try {
      userData = await User.me();
    } catch (e) {
      console.warn('Authentication error or no user:', e.message);
    }

    const [passagesResult, sessionsResult] = await Promise.all([
      supabase
        .from('passages')
        .select(
          'id, title, test_type, cambridge_year, cambridge_test_number, is_official_cambridge, is_active'
        )
        .eq('is_active', true)
        .or('is_official_cambridge.eq.true,title.ilike.%cambridge%,cambridge_year.gt.0')
        .order('cambridge_year', { ascending: false }),
      userData
        ? supabase
            .from('test_sessions')
            .select('id, passage_id, is_completed, score')
            .eq('user_id', userData.id)
        : Promise.resolve({ data: [] }),
    ]);

    if (passagesResult.error) throw passagesResult.error;

    // Data is already filtered by the database query
    const passages = passagesResult.data || [];

    const sessionData = sessionsResult?.data || [];

    // Process Sessions
    const userSessions = {};
    sessionData.forEach((s) => {
      // Use passage_id directly now that we aren't fetching content_data
      const pId = s.passage_id;
      if (pId) userSessions[pId] = s;
    });

    // Process Groups
    const groups = {};
    passages.forEach((p) => {
      const year = p.cambridge_year || 0;
      const testNum = p.cambridge_test_number || 0;
      const groupKey = `${year}-${testNum}`;
      const bookNumber = year - 2005;
      const titleLower = (p.title || '').toLowerCase();
      let type = '';
      if (titleLower.includes('general training') || titleLower.includes(' gt ')) {
        type = ' GT';
      }

      const groupTitle =
        year && testNum
          ? `IELTS ${bookNumber}${type} • Test ${testNum} (${year})`
          : p.title.replace(/\s+(Reading|Listening|Writing|Speaking|Task\s+\d+).*$/i, '').trim() ||
            'Uncategorized';

      if (!groups[groupKey]) {
        groups[groupKey] = {
          title: groupTitle,
          year,
          testNumber: testNum,
          modules: { reading: null, listening: null, writing: null, speaking: null },
        };
      }

      const typeKey = (p.test_type || '').toLowerCase();
      if (Object.keys(groups[groupKey].modules).includes(typeKey)) {
        groups[groupKey].modules[typeKey] = p;
      }
    });

    const sortedGroups = Object.values(groups).sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return b.testNumber - a.testNumber;
    });

    return {
      groupedTests: sortedGroups,
      sessions: userSessions,
      user: userData,
    };
  }, []);

  const { userProfile: userData, isAdmin } = useAuth();
  const { data: cambridgeData, loading: isLoading } = useDataQuery(
    `cambridge-tests-data-${userData?.id || 'anon'}`,
    fetcher
  );

  const groupedTests = useMemo(
    () => cambridgeData?.groupedTests || [],
    [cambridgeData?.groupedTests]
  );
  const sessions = cambridgeData?.sessions || {};
  const user = cambridgeData?.user || null;
  const loading = isLoading;

  const uniqueYears = [...new Set(groupedTests.map((g) => g.year).filter((y) => y))].sort(
    (a, b) => b - a
  );
  const tabs = [
    { id: 'all', label: 'All Series', icon: LayoutGrid },
    ...uniqueYears.map((year) => ({ id: year.toString(), label: year.toString(), icon: Award })),
  ];

  const filteredGroups = useMemo(() => {
    return groupedTests.filter((group) => {
      const matchesYear = activeTab === 'all' || group.year.toString() === activeTab;
      const matchesSearch = group.title.toLowerCase().includes(debouncedSearch.toLowerCase());
      return matchesYear && matchesSearch;
    });
  }, [groupedTests, activeTab, debouncedSearch]);

  return (
    <div
      className="min-h-screen bg-[#FDFDFF] dark:bg-[#050505] font-sans text-slate-900 dark:text-slate-100"
      data-oid="ynth8s."
    >
      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-4" data-oid="c_8ei7c">
        {/* Header Section */}
        <div
          className="relative group overflow-hidden rounded-[2.5rem] p-3 md:p-4 border border-indigo-200/60 dark:border-indigo-800/40 bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/80 dark:from-indigo-500/5 dark:via-transparent dark:to-purple-500/5 backdrop-blur-3xl shadow-xl shadow-indigo-500/10 dark:shadow-indigo-500/20"
          data-oid=".vvf0ma"
        >
          <div
            className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-indigo-500/5 to-transparent -z-10"
            data-oid="hlgk1_o"
          />

          <div
            className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-400/10 dark:bg-indigo-500/10 rounded-full blur-[80px] -z-10 group-hover:scale-110 transition-transform duration-1000"
            data-oid="1upqi3f"
          />

          <div
            className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10"
            data-oid="frjulib"
          >
            <div className="space-y-4 max-w-2xl text-center md:text-left" data-oid="qcz_hsx">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-600/5 dark:bg-indigo-400/10 border border-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase tracking-[0.2em] backdrop-blur-md"
                data-oid="a10tj_7"
              >
                <Sparkles className="w-3 h-3" data-oid="p-u1o7u" />
                <span data-oid="5azqc22">Standard Mastery Kits</span>
              </motion.div>

              <div className="space-y-2" data-oid="vycb:7s">
                <h1
                  className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight"
                  data-oid="u65.dti"
                >
                  Cambridge{' '}
                  <span
                    className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 dark:from-indigo-400 dark:via-violet-400 dark:to-purple-400"
                    data-oid="4zxf2bn"
                  >
                    Series
                  </span>
                </h1>
                <p
                  className="text-slate-500 dark:text-slate-400 text-base md:text-lg font-semibold leading-relaxed max-w-lg mx-auto md:mx-0"
                  data-oid="1:07-hm"
                >
                  Precision-curated full exam kits from official Cambridge IELTS books 10 through
                  20.
                </p>
              </div>

              <div
                className="flex flex-wrap gap-3 items-center justify-center md:justify-start"
                data-oid="8ktzzqi"
              >
                <div
                  className="flex items-center gap-3 bg-white/70 dark:bg-white/5 border border-white dark:border-white/10 px-3 py-2 rounded-2xl shadow-sm backdrop-blur-2xl"
                  data-oid="rose1y4"
                >
                  <div
                    className="w-7 h-7 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20"
                    data-oid="ukyq-of"
                  >
                    <TrendingUp className="w-4 h-4" data-oid="sjyj9gf" />
                  </div>
                  <div className="flex flex-col" data-oid="aqrugca">
                    <h4
                      className="text-base font-black text-slate-900 dark:text-white leading-none"
                      data-oid="s0l5a13"
                    >
                      Official
                    </h4>
                    <span
                      className="text-[10px] font-bold text-slate-500 uppercase tracking-widest"
                      data-oid="qp4:ues"
                    >
                      Materials
                    </span>
                  </div>
                </div>
                <div
                  className="flex items-center gap-3 bg-white/70 dark:bg-white/5 border border-white dark:border-white/10 px-3 py-2 rounded-2xl shadow-sm backdrop-blur-2xl"
                  data-oid="qtd-obm"
                >
                  <div
                    className="w-7 h-7 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20"
                    data-oid="4vnz-ga"
                  >
                    <CheckCircle2 className="w-4 h-4" data-oid="welbb7a" />
                  </div>
                  <div className="flex flex-col" data-oid=".jazib_">
                    <h4
                      className="text-base font-black text-slate-900 dark:text-white leading-none"
                      data-oid="m4.b856"
                    >
                      Simulation
                    </h4>
                    <span
                      className="text-[10px] font-bold text-slate-500 uppercase tracking-widest"
                      data-oid="nx3e9un"
                    >
                      Full Kits
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:block hidden" data-oid="j.8jnt9">
              <div className="relative p-1" data-oid="e_oixsc">
                <div
                  className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-[3rem] blur-2xl opacity-50"
                  data-oid="ea6memu"
                />

                <div
                  className="relative w-72 bg-white/90 dark:bg-slate-900/80 backdrop-blur-3xl border border-white dark:border-white/10 rounded-[2.5rem] p-4 shadow-2xl overflow-hidden"
                  data-oid="liejukw"
                >
                  <div className="absolute top-0 right-0 p-5" data-oid="il:smx9">
                    <div
                      className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20"
                      data-oid="-bbprnq"
                    >
                      <Target
                        className="w-5 h-5 text-blue-600 dark:text-blue-400"
                        data-oid="4nipkju"
                      />
                    </div>
                  </div>
                  <div className="space-y-3" data-oid="z885cgf">
                    <div className="flex flex-col" data-oid="pz8bv7v">
                      <span
                        className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1"
                        data-oid="mb8ewh1"
                      >
                        Weekly Challenge
                      </span>
                      <h4
                        className="text-xl font-black text-slate-900 dark:text-white"
                        data-oid="2w2b:uw"
                      >
                        Full Exam Prep
                      </h4>
                    </div>
                    <div className="space-y-3" data-oid="rq8_1-g">
                      <div className="flex justify-between items-end" data-oid="xq64u2d">
                        <span className="text-xs font-bold text-slate-500" data-oid="z0qjw.o">
                          2 Kits Fully Done
                        </span>
                        <span className="text-sm font-black text-blue-600" data-oid="66fjrbu">
                          25%
                        </span>
                      </div>
                      <div
                        className="h-2 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden p-[1px] border border-slate-200 dark:border-white/10"
                        data-oid="-h.ul00"
                      >
                        <div
                          style={{ width: '25%' }}
                          className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"
                          data-oid="s94dp_0"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pb-1" data-oid="a2ke1ln">
                      <div
                        className="bg-slate-50 dark:bg-white/5 rounded-2xl p-3 border border-slate-100 dark:border-white/5"
                        data-oid="_cy1g-g"
                      >
                        <div className="flex items-center gap-2 mb-1" data-oid="vaa5kkm">
                          <BookOpen className="w-3.5 h-3.5 text-blue-500" data-oid="2dm3qcg" />
                          <span
                            className="text-lg font-black text-slate-900 dark:text-white leading-none"
                            data-oid="1wdmnn7"
                          >
                            {groupedTests.length}
                          </span>
                        </div>
                        <span
                          className="text-[9px] font-bold text-slate-500 uppercase tracking-widest"
                          data-oid="61.bbrw"
                        >
                          Total Kits
                        </span>
                      </div>
                      <div
                        className="bg-slate-50 dark:bg-white/5 rounded-2xl p-3 border border-slate-100 dark:border-white/5"
                        data-oid="9h2:12f"
                      >
                        <div className="flex items-center gap-2 mb-1" data-oid="tt.3l76">
                          <Users className="w-3.5 h-3.5 text-emerald-500" data-oid=":4bhcfx" />
                          <span
                            className="text-lg font-black text-slate-900 dark:text-white leading-none"
                            data-oid="hq7nm7q"
                          >
                            3.1k
                          </span>
                        </div>
                        <span
                          className="text-[9px] font-bold text-slate-500 uppercase tracking-widest"
                          data-oid=".pp1xbe"
                        >
                          Active Today
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="sticky top-6 z-40" data-oid="lf.b.95">
          <div
            className="bg-white/80 dark:bg-[#0c0c0c]/85 backdrop-blur-3xl p-2 rounded-[2rem] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] border border-slate-200/50 dark:border-white/10 flex flex-col lg:flex-row gap-4 items-center justify-between"
            data-oid="s:_lyw7"
          >
            <div className="relative w-full lg:max-w-md group" data-oid="93milaj">
              <div
                className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none"
                data-oid=".5br913"
              >
                <Search
                  className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-all duration-300 group-focus-within:scale-110"
                  data-oid="kbcu647"
                />
              </div>
              <Input
                placeholder="Find a series or book..."
                className="pl-14 h-12 bg-slate-100/60 dark:bg-white/5 border-none focus-visible:ring-2 focus-visible:ring-blue-500/25 rounded-[1.5rem] text-sm font-semibold placeholder:text-slate-400 transition-all group-hover:bg-slate-200/50 dark:group-hover:bg-white/[0.08]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-oid="4bg9zu4"
              />
            </div>

            <div
              className="flex items-center bg-white/60 dark:bg-white/5 backdrop-blur-xl p-1.5 rounded-2xl gap-2 w-full lg:w-auto overflow-x-auto no-scrollbar border border-slate-200/50 dark:border-white/10"
              data-oid="jwdtsc-"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex shrink-0 items-center gap-2 px-5 py-2 rounded-xl text-xs font-black transition-all duration-300 whitespace-nowrap uppercase tracking-widest',
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
                  )}
                  data-oid="0auvr6i"
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div
              className="hidden lg:flex items-center gap-4 px-6 border-l border-slate-200/60 dark:border-white/10 h-8"
              data-oid="ejp7ofd"
            >
              <div
                className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer group/view"
                data-oid="cuh_:20"
              >
                <LayoutGrid className="w-4.5 h-4.5" data-oid="cq70_7c" />
                <span
                  className="text-[10px] font-black uppercase tracking-widest"
                  data-oid="qpo59pg"
                >
                  Grid
                </span>
              </div>
              <div className="w-1 h-1 rounded-full bg-blue-500/20" data-oid="-lqp7rj" />
              <div
                className="flex items-center gap-2 text-slate-300 dark:text-slate-700 cursor-not-allowed"
                data-oid="66_7rl-"
              >
                <List className="w-4.5 h-4.5" data-oid="pe-nivb" />
                <span
                  className="text-[10px] font-black uppercase tracking-widest"
                  data-oid="r6jhnzc"
                >
                  List
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tests Grid */}
        <div className="min-h-[700px] pt-2" data-oid="9qj_8j.">
          {loading ? (
            <div
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 md:gap-8"
              data-oid="x7a7vjg"
            >
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-[#111111] rounded-[2rem] border border-slate-200 dark:border-white/5 p-6 h-[420px] shadow-sm"
                  data-oid="a1-8opu"
                >
                  <Skeleton className="w-12 h-12 rounded-xl mb-6" data-oid="c13c_da" />
                  <Skeleton className="h-6 w-3/4 rounded-lg mb-4" data-oid="42egy-t" />
                  <Skeleton className="h-4 w-full rounded-lg mb-2" data-oid="8bxxg-y" />
                  <Skeleton className="h-4 w-2/3 rounded-lg mb-8" data-oid="xwzbv6x" />
                  <div className="grid grid-cols-2 gap-3" data-oid="uyiz9lz">
                    <Skeleton className="h-10 rounded-xl" data-oid="kfcgbuf" />
                    <Skeleton className="h-10 rounded-xl" data-oid="o:khh81" />
                    <Skeleton className="h-10 rounded-xl" data-oid="fa.j262" />
                    <Skeleton className="h-10 rounded-xl" data-oid="g946qo5" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 md:gap-8"
              data-oid="dtmn256"
            >
              {filteredGroups.map((group, index) => (
                <MemoizedCambridgeTestCard
                  key={index}
                  title={group.title}
                  modules={group.modules}
                  sessions={sessions}
                  user={user}
                  isAdmin={isAdmin}
                  data-oid="nezo2pa"
                />
              ))}
              {filteredGroups.length === 0 && (
                <div className="col-span-full py-24 text-center" data-oid="-7xgolz">
                  <div
                    className="w-24 h-24 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6"
                    data-oid="8d2m:2i"
                  >
                    <BookOpen
                      className="w-10 h-10 text-slate-300 dark:text-slate-600"
                      data-oid="7rnkjdj"
                    />
                  </div>
                  <h3
                    className="text-xl font-black text-slate-900 dark:text-white mb-2"
                    data-oid="zi7ni-5"
                  >
                    No kits found
                  </h3>
                  <p
                    className="text-slate-500 dark:text-slate-400 font-semibold"
                    data-oid="af9h--8"
                  >
                    Try searching for a different year or book series.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
