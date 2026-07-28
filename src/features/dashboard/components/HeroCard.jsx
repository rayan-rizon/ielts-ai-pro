import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { ArrowRight, Target } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { createPageUrl } from '@/utils';

const AVATAR_SEEDS = [11, 12, 13, 14];

const ACTIVITY_MESSAGES = [
  '+1.2k others practicing now',
  '+856 active learners today',
  '+2.1k lessons completed',
  '+947 tests taken today',
  '+1.8k users online',
];

const SKILL_NAMES = ['Reading', 'Listening', 'Writing', 'Speaking'];

function clamp01(value) {
  const n = Number.isFinite(value) ? value : 0;
  return Math.max(0, Math.min(1, n));
}

function circleDash(progress) {
  const radius = 50;
  const c = 2 * Math.PI * radius;
  const p = clamp01(progress);
  const dash = c * p;
  return `${dash} ${c - dash}`;
}

function useTickerIndex(length, intervalTime) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % length);
    }, intervalTime);
    return () => clearInterval(interval);
  }, [length, intervalTime]);

  return index;
}

const LiveActivityTicker = React.memo(() => {
  const currentMessageIndex = useTickerIndex(ACTIVITY_MESSAGES.length, 3000);

  return (
    <m.span
      className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest leading-none"
      key={currentMessageIndex}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.5 }}
    >
      {ACTIVITY_MESSAGES[currentMessageIndex]}
    </m.span>
  );
});

const SkillTicker = React.memo(() => {
  const currentSkillIndex = useTickerIndex(SKILL_NAMES.length, 2000);

  return (
    <m.span
      className={cn('relative inline-block', 'text-indigo-600 dark:text-indigo-400', 'pb-1')}
      key={currentSkillIndex}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
    >
      {SKILL_NAMES[currentSkillIndex]}
    </m.span>
  );
});

const HeroMissionDetails = React.memo(({ recommended }) => {
  return (
    <div className="space-y-4 flex-1" data-oid="oqa--7o">
      <div className="flex items-center gap-3" data-oid="fzh:xnc">
        <div className="flex -space-x-2" data-oid="soedt_n">
          {AVATAR_SEEDS.map((seed) => (
            <div
              key={seed}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden shadow-lg ring-2 ring-indigo-500/20 transform hover:-translate-y-1 transition-transform"
              data-oid="a019ps-"
            >
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`}
                alt="avatar"
                width={32}
                height={32}
                {...(seed === AVATAR_SEEDS[0]
                  ? { fetchpriority: 'high', loading: 'eager' }
                  : { loading: 'lazy', fetchpriority: 'low' })}
                data-oid="r4:kk9k"
              />
            </div>
          ))}
        </div>
        <div className="flex flex-col" data-oid="hq7e366">
          <LiveActivityTicker />
          <span
            className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em] mt-1"
            data-oid="6jdzdh2"
          >
            Live Global Activity
          </span>
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4" data-oid="f70tekx">
        <h2
          className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]"
          data-oid="u--_w8q"
        >
          Master <SkillTicker /> Today
        </h2>
        <p
          className="text-slate-500 dark:text-slate-400 text-sm sm:text-base md:text-lg leading-relaxed max-w-xl font-medium"
          data-oid="9j8:n_4"
        >
          {recommended.description} Based on your stats, targeting{' '}
          <span
            className="text-indigo-600 dark:text-indigo-400 font-black decoration-indigo-500/30 underline underline-offset-4 decoration-2"
            data-oid="fmpm2-u"
          >
            {recommended.title}
          </span>{' '}
          will maximize your score improvement today.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 pt-2" data-oid="tvmkra9">
        <m.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} data-oid="y9s6-4:">
          <Button
            asChild
            className={cn(
              'rounded-2xl border-0 shadow-[0_12px_28px_-8px_rgba(99,85,238,0.45)] hover:shadow-[0_16px_34px_-8px_rgba(99,85,238,0.58)] px-5 sm:px-6 h-10 sm:h-12',
              'bg-gradient-to-r from-[#4f46e5] via-[#6366f1] to-[#7c3aed] text-white',
              'transition-all duration-300 relative overflow-hidden group/btn'
            )}
            data-oid="w2392.z"
          >
            <Link to={recommended.href} data-oid=".ns0o:i">
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_2s_infinite]"
                data-oid="ipwnesq"
              />

              <recommended.icon className="w-4 h-4 mr-2" data-oid="1gh_k-8" />
              <span
                className="font-extrabold text-sm sm:text-base tracking-tight"
                data-oid="u0._5v7"
              >
                Start Mission
              </span>
              <ArrowRight className="w-4 h-4 ml-2" data-oid="j5xh:2:" />
            </Link>
          </Button>
        </m.div>

        <m.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} data-oid="k12m05_">
          <Button
            asChild
            variant="ghost"
            className="rounded-2xl h-10 sm:h-12 px-5 sm:px-6 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 border border-indigo-200/50 dark:border-indigo-500/20 font-extrabold transition-all duration-300"
            data-oid="x866.x-"
          >
            <Link to={createPageUrl('Onboarding')} data-oid="4jgokg1">
              <Target className="w-4 h-4 mr-2" data-oid="2jb:mme" />
              <span className="text-sm tracking-tight" data-oid="f_q936u">
                Update Goals
              </span>
            </Link>
          </Button>
        </m.div>
      </div>
    </div>
  );
});
HeroMissionDetails.displayName = 'HeroMissionDetails';

const ProgressRingChart = React.memo(({ progressToTarget }) => {
  return (
    <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48" data-oid="gej.lip">
      <svg
        viewBox="0 0 120 120"
        className="w-full h-full drop-shadow-[0_0_35px_rgba(99,102,241,0.25)] dark:drop-shadow-[0_0_35px_rgba(99,102,241,0.15)]"
        data-oid="h9pe1am"
      >
        {/* Background ring */}
        <circle
          cx="60"
          cy="60"
          r="50"
          stroke="currentColor"
          strokeWidth="8"
          className="text-slate-100 dark:text-white/15"
          fill="none"
          opacity="0.8"
          data-oid="1en9ryy"
        />

        {/* Progress ring */}
        <m.circle
          cx="60"
          cy="60"
          r="50"
          stroke="url(#heroGradient)"
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circleDash(progressToTarget)}
          transform="rotate(-90 60 60)"
          initial={{ strokeDasharray: circleDash(0) }}
          animate={{ strokeDasharray: circleDash(progressToTarget) }}
          transition={{ duration: 1.5, ease: 'circOut' }}
          className="drop-shadow-[0_0_15px_rgba(99,102,241,0.4)] dark:drop-shadow-[0_0_15px_rgba(99,102,241,0.25)]"
          data-oid="4nh0su3"
        />

        {/* Inner glow ring */}
        <m.circle
          cx="60"
          cy="60"
          r="50"
          stroke="url(#heroGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circleDash(progressToTarget)}
          transform="rotate(-90 60 60)"
          initial={{ strokeDasharray: circleDash(0), opacity: 0 }}
          animate={{
            strokeDasharray: circleDash(progressToTarget),
            opacity: [0, 0.8, 0.8],
          }}
          transition={{ duration: 1.5, ease: 'circOut' }}
          className="opacity-60"
          data-oid="wmv:dyz"
        />

        <defs data-oid=":fxwh4:">
          <linearGradient id="heroGradient" x1="0%" y1="0%" x2="100%" y2="100%" data-oid="350yqm0">
            <stop offset="0%" stopColor="#4f46e5" data-oid="fto.o.u" />
            <stop offset="50%" stopColor="#7c3aed" data-oid="ci5nork" />
            <stop offset="100%" stopColor="#ec4899" data-oid="gvujh7w" />
          </linearGradient>
        </defs>
      </svg>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        data-oid="fka2yb2"
      >
        <m.span
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white leading-none tracking-tighter"
          data-oid="a61mwdp"
        >
          {Math.round(progressToTarget * 100)}
          <span className="text-lg sm:text-xl ml-0.5" data-oid="sbpsgu-">
            %
          </span>
        </m.span>
        <span
          className="text-[9px] sm:text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1 sm:mt-2 bg-slate-100 dark:bg-slate-800 px-2 sm:px-3 py-1 rounded-full"
          data-oid="q4_.l2:"
        >
          To Target
        </span>
      </div>
    </div>
  );
});
ProgressRingChart.displayName = 'ProgressRingChart';

const StatsGrid = React.memo(({ stats }) => {
  return (
    <div
      className="mt-6 sm:mt-8 grid grid-cols-2 gap-4 sm:gap-8 w-full max-w-[200px] sm:max-w-none"
      data-oid="ee.y806"
    >
      <div className="text-center relative" data-oid="z7kj80-">
        <div
          className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter"
          data-oid="4--ddxb"
        >
          {stats.todayTests}
        </div>
        <div
          className="text-[9px] sm:text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1"
          data-oid="blipsnc"
        >
          Today
        </div>
        <div
          className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-indigo-500 animate-ping"
          data-oid="f9-7yre"
        />
      </div>
      <div className="text-center" data-oid="rvbyciv">
        <div
          className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter"
          data-oid="5xez:0m"
        >
          {stats.totalTests}
        </div>
        <div
          className="text-[9px] sm:text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1"
          data-oid="v1_zg1l"
        >
          Total
        </div>
      </div>
    </div>
  );
});
StatsGrid.displayName = 'StatsGrid';

const TargetScoreBar = React.memo(({ stats, progressToTarget }) => {
  return (
    <div className="mt-5 sm:mt-6 w-full px-2 sm:px-4" data-oid="hc0c56j">
      <div
        className="flex items-center justify-between text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 sm:mb-3"
        data-oid="k9r3-5q"
      >
        <span data-oid="tkrcsfu">Target Band</span>
        <span className="text-indigo-600 dark:text-indigo-400 font-black" data-oid="8y.t_8a">
          {stats.targetScore || '7.0'}
        </span>
      </div>
      <div
        className="h-2.5 sm:h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-100 dark:border-white/5"
        data-oid="g5xf21p"
      >
        <m.div
          initial={{ width: 0 }}
          animate={{ width: `${progressToTarget * 100}%` }}
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"
          data-oid="bzjp7nl"
        />
      </div>
    </div>
  );
});
TargetScoreBar.displayName = 'TargetScoreBar';

const HeroStatsDisplay = React.memo(({ progressToTarget, stats }) => {
  return (
    <div
      className="flex flex-col items-center justify-center p-5 sm:p-6 bg-slate-50 dark:bg-slate-950/50 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-inner relative group/chart w-full lg:w-auto z-10"
      data-oid="hr4p9qs"
    >
      <div
        className="absolute inset-0 bg-indigo-500/5 blur-[40px] rounded-full pointer-events-none group-hover/chart:bg-indigo-500/10 transition-colors z-0"
        data-oid="xh7_1ih"
      />

      <div className="relative z-10 flex flex-col items-center justify-center w-full">
        <ProgressRingChart progressToTarget={progressToTarget} />
        <StatsGrid stats={stats} />
        <TargetScoreBar stats={stats} progressToTarget={progressToTarget} />
      </div>
    </div>
  );
});
HeroStatsDisplay.displayName = 'HeroStatsDisplay';

const HeroCard = React.memo(({ recommended, progressToTarget, stats }) => {
  return (
    <div className="relative group" data-oid="3rifi:q">
      {/* Permanent Vibrant Outer Glow */}
      <div
        className="absolute -inset-1.5 bg-gradient-to-r from-indigo-500/30 via-purple-500/10 to-indigo-500/30 dark:from-indigo-500/15 dark:via-purple-500/5 dark:to-indigo-500/15 rounded-[2.5rem] blur-2xl opacity-100 transition-opacity duration-700 -z-10"
        data-oid="cdy40do"
      />

      <Card
        className={cn(
          'relative rounded-[22px] transition-all duration-500 overflow-hidden',
          'border border-[#e0e4f1] dark:border-white/10 bg-gradient-to-br from-white via-[#faf9ff] to-[#f4f2ff] dark:from-[#10131f] dark:to-[#10131f]',
          'shadow-[0_20px_50px_-42px_rgba(48,58,128,0.72)]'
        )}
        data-oid="m4cfznh"
      >
        {/* Decorative background elements */}
        <div
          className="absolute top-[-10%] right-[-10%] w-[35rem] h-[35rem] bg-indigo-500/15 dark:bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none group-hover:scale-110 transition-transform duration-1000 will-change-transform"
          data-oid="b5m31uv"
        />

        <div
          className="absolute bottom-[-10%] left-[-10%] w-[25rem] h-[25rem] bg-purple-500/10 dark:bg-purple-500/8 rounded-full blur-[80px] pointer-events-none will-change-transform"
          data-oid="rvb:8ei"
        />

        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:24px_24px]"
          data-oid="2_.eg8o"
        />

        <CardContent className="p-4 sm:p-6 md:p-8 relative z-10" data-oid="28vc5mf">
          <div
            className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-8"
            data-oid="3njpb8a"
          >
            <HeroMissionDetails recommended={recommended} />
            <HeroStatsDisplay progressToTarget={progressToTarget} stats={stats} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

HeroCard.displayName = 'HeroCard';
LiveActivityTicker.displayName = 'LiveActivityTicker';
SkillTicker.displayName = 'SkillTicker';

export default HeroCard;
