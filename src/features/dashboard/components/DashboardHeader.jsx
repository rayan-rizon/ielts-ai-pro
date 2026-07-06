import React from 'react';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { BadgeCheck, Crown, Flame, Clock, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
};

const DashboardHeader = React.memo(
  ({ dateLabel, greeting, user, progressToTarget, stats, recommended }) => {
    return (
      <m.header variants={itemVariants} className="space-y-6" data-oid="-l:v0.c">
        <div
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-6"
          data-oid="qqtbbbx"
        >
          <div className="flex-1" data-oid="1y.i40n">
            <div className="flex items-center gap-2" data-oid="ofvx95c">
              <Badge
                variant="outline"
                className="px-3 py-1 rounded-full bg-slate-500/5 dark:bg-slate-400/5 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider backdrop-blur-sm"
                data-oid="vjkq9d_"
              >
                {dateLabel}
              </Badge>
              {user?.subscription_tier === 'premium' ? (
                <Badge
                  variant="outline"
                  className="bg-purple-500/10 backdrop-blur-md border border-purple-500/20 text-purple-600 dark:text-purple-400 font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1.5 transition-all hover:bg-purple-500/20 hover:text-purple-700 dark:hover:text-purple-300"
                  data-oid="9tgmcle"
                >
                  <Crown
                    className="w-3 h-3 fill-purple-600/20 dark:fill-purple-400/20"
                    data-oid="rx3ewwh"
                  />
                  PREMIUM
                </Badge>
              ) : user?.subscription_tier === 'pro' ? (
                <Badge
                  variant="outline"
                  className="bg-blue-500/10 backdrop-blur-md border border-blue-500/20 text-blue-600 dark:text-blue-400 font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1.5 transition-all hover:bg-blue-500/20 hover:text-blue-700 dark:hover:text-blue-300"
                  data-oid="pro-badge"
                >
                  <Zap
                    className="w-3 h-3 fill-blue-600/20 dark:fill-blue-400/20"
                    data-oid="pro-icon"
                  />
                  PRO
                </Badge>
              ) : null}
            </div>
            <h1
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white mt-3 leading-tight"
              data-oid="yxy9dml"
            >
              {greeting},{' '}
              <span className="text-indigo-600 dark:text-indigo-400" data-oid=".wf7_d9">
                {user?.full_name?.split(' ')[0] || user?.username || 'Learner'}
              </span>{' '}
              👋
            </h1>
            <p
              className="text-slate-600 dark:text-slate-300 text-base md:text-lg font-medium max-w-xl mt-2"
              data-oid="2wz92qz"
            >
              You're{' '}
              <span className="text-indigo-600 dark:text-indigo-400 font-bold" data-oid="n3ifs4w">
                {progressToTarget * 100 === 0
                  ? 'just getting started'
                  : `${Math.round(progressToTarget * 100)}% of the way`}
              </span>{' '}
              {user?.target_band_score ? (
                <>to your target band {user.target_band_score}.</>
              ) : (
                <>on your IELTS success journey.</>
              )}
            </p>
          </div>

          <div
            className="flex flex-col xl:flex-row items-stretch xl:items-center gap-4"
            data-oid="5idu9qr"
          >
            {/* Floating Stats Bar - Premium Design */}
            <m.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                'grid grid-cols-2 md:flex md:flex-row items-center xl:items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-0 md:p-1 shadow-sm w-full xl:w-auto overflow-hidden',
                'hover:border-indigo-500/30 dark:hover:border-indigo-500/40 transition-all duration-300'
              )}
              data-oid="_y7fk07"
            >
              {/* Streak */}
              <div
                className="flex items-center gap-2 px-4 py-3 md:px-3 md:py-1 border-r border-b md:border-b-0 border-slate-100 dark:border-white/5"
                data-oid="r3_nfnv"
              >
                <div
                  className="w-9 h-9 rounded-full bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center shrink-0 border border-orange-100 dark:border-orange-500/20"
                  data-oid=".6.5oe3"
                >
                  <Flame
                    className="w-4.5 h-4.5 text-orange-700 dark:text-orange-300 fill-orange-500/30 dark:fill-orange-400/30"
                    data-oid="cp6oanu"
                  />
                </div>
                <div className="flex flex-col" data-oid="yrxhgsj">
                  <span
                    className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest leading-none"
                    data-oid="1nfohli"
                  >
                    Streak
                  </span>
                  <span
                    className="text-base font-black text-slate-900 dark:text-white mt-1 leading-none"
                    data-oid="n6u8r2o"
                  >
                    {stats.streak}{' '}
                    <span
                      className="text-xs text-slate-600 dark:text-slate-400 font-bold lowercase"
                      data-oid="28x:eto"
                    >
                      days
                    </span>
                  </span>
                </div>
              </div>

              {/* Level / XP */}
              <div
                className="flex items-center gap-2 px-4 py-3 md:px-3 md:py-1 border-b md:border-b-0 md:border-r border-slate-100 dark:border-white/5"
                data-oid="dlodwpk"
              >
                <div
                  className="w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-500/20"
                  data-oid="8x3rf_e"
                >
                  <Crown
                    className="w-4.5 h-4.5 text-amber-700 dark:text-amber-300 fill-amber-500/30 dark:fill-amber-400/30"
                    data-oid="b2t20cy"
                  />
                </div>
                <div className="flex flex-col" data-oid="b-yf8th">
                  <div className="flex items-center gap-1.5" data-oid="zr:fgrw">
                    <span
                      className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest leading-none"
                      data-oid=":0d74a6"
                    >
                      Level {Math.floor((stats.totalTests || 0) / 5) + 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1" data-oid="r8:50tr">
                    <span
                      className="text-base font-black text-slate-900 dark:text-white leading-none"
                      data-oid="wfoe.7k"
                    >
                      {stats.totalTests || 0}{' '}
                      <span
                        className="text-xs text-slate-600 dark:text-slate-400 font-bold lowercase"
                        data-oid="4ci-bcx"
                      >
                        XP
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Current Average */}
              <div
                className="flex items-center gap-2 px-4 py-3 md:px-3 md:py-1 border-r border-slate-100 dark:border-white/5"
                data-oid="rx1gh91"
              >
                <div
                  className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-500/20"
                  data-oid="s0dfo8u"
                >
                  <BadgeCheck
                    className="w-4.5 h-4.5 text-blue-700 dark:text-blue-300 fill-blue-500/20 dark:fill-blue-400/20"
                    data-oid="ujrzpo0"
                  />
                </div>
                <div className="flex flex-col" data-oid="ejndc4c">
                  <span
                    className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest leading-none"
                    data-oid="z-oy4-q"
                  >
                    Current
                  </span>
                  <span
                    className="text-base font-black text-slate-900 dark:text-white mt-1 leading-none"
                    data-oid="mva1c3c"
                  >
                    {stats.avgScore}{' '}
                    <span
                      className="text-xs text-slate-600 dark:text-slate-400 font-bold lowercase"
                      data-oid="dltn9u7"
                    >
                      Avg
                    </span>
                  </span>
                </div>
              </div>

              {/* Time Today */}
              <div className="flex items-center gap-2 px-4 py-3 md:px-3 md:py-1" data-oid="y8txs-.">
                <div
                  className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-500/20"
                  data-oid="sb3l:-5"
                >
                  <Clock
                    className="w-4.5 h-4.5 text-indigo-700 dark:text-indigo-300"
                    data-oid="abn:a0g"
                  />
                </div>
                <div className="flex flex-col" data-oid="7xffhj3">
                  <span
                    className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest leading-none"
                    data-oid="h7jalz-"
                  >
                    Today
                  </span>
                  <span
                    className="text-base font-black text-slate-900 dark:text-white mt-1 leading-none"
                    data-oid="e1uebgw"
                  >
                    {stats.todayMinutes}{' '}
                    <span
                      className="text-xs text-slate-600 dark:text-slate-400 font-bold lowercase"
                      data-oid="xtgodfe"
                    >
                      min
                    </span>
                  </span>
                </div>
              </div>
            </m.div>

            <Button
              asChild
              size="lg"
              className="rounded-full bg-slate-900 dark:bg-indigo-600 text-white hover:bg-slate-800 dark:hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 px-8 h-12 border-0 shadow-lg dark:shadow-indigo-500/20 w-full md:w-auto xl:w-auto overflow-hidden group/btn relative"
              data-oid="7dk3o4t"
            >
              <Link to={recommended.href} data-oid="28az_6k">
                <div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_2s_infinite]"
                  data-oid="20p9z4x"
                />

                <Zap className="w-4 h-4 mr-2 fill-current" data-oid="ixj0uso" />
                <span className="font-black tracking-tight" data-oid="y34-n:g">
                  Resume {recommended.title}
                </span>
              </Link>
            </Button>
          </div>
        </div>
      </m.header>
    );
  }
);

DashboardHeader.displayName = 'DashboardHeader';

export default DashboardHeader;
