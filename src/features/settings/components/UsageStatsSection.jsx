import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PenLine,
  Mic,
  BookOpen,
  Target,
  FileText,
  Headphones,
  TrendingUp,
  Crown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserUsageStats } from '../hooks/useUserUsageStats';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100 },
  },
};

// Circular Progress Ring Component - Compact
function ProgressRing({ progress, size = 110, strokeWidth = 8, color, children }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(progress, 100) / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }} data-oid="rk89enu">
      <svg className="transform -rotate-90" width={size} height={size} data-oid="_wknj8n">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-slate-200/50 dark:stroke-white/10"
          data-oid="-4ftfu6"
        />

        {/* Progress ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={color}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          data-oid="gw0ryi3"
        />
      </svg>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        data-oid="yn8181_"
      >
        {children}
      </div>
    </div>
  );
}

// Progress Bar Component - Compact
function ProgressBar({ value, max, color, label }) {
  const percentage = max === Infinity ? 0 : Math.min((value / max) * 100, 100);
  const displayMax = max === Infinity ? '∞' : max;

  return (
    <div className="space-y-1.5" data-oid="2squr7:">
      <div className="flex justify-between items-center text-xs" data-oid="7glnooq">
        <span className="font-bold text-muted-foreground" data-oid="z.2b81m">
          {label}
        </span>
        <span className="font-black tabular-nums text-foreground" data-oid="c:2mova">
          {value} / {displayMax}
        </span>
      </div>
      <div
        className="h-2.5 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden"
        data-oid="wm-jwd2"
      >
        <motion.div
          className={cn('h-full rounded-full', color)}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          data-oid="dno_ubj"
        />
      </div>
    </div>
  );
}

// Stat Card Component - Compact Premium
function StatCard({ icon: Icon, value, label, color }) {
  return (
    <motion.div
      variants={itemVariants}
      className={cn(
        'flex items-center gap-3 p-4 rounded-2xl border transition-all hover:scale-[1.02] cursor-default',
        'bg-white/40 dark:bg-white/5 border-border/50',
        'hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5'
      )}
      data-oid="v9v61p:"
    >
      <div
        className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm',
          color
        )}
        data-oid="0mxwj-8"
      >
        <Icon className="w-5 h-5" data-oid="8271z3z" />
      </div>
      <div className="flex-1 min-w-0" data-oid="vqu8nt3">
        <p className="text-2xl font-black tabular-nums text-foreground" data-oid="p-unfc8">
          {value}
        </p>
        <p className="text-xs font-bold text-muted-foreground truncate" data-oid="agn-_j4">
          {label}
        </p>
      </div>
    </motion.div>
  );
}

export default function UsageStatsSection() {
  const { data: stats, isLoading, error } = useUserUsageStats();

  const writingPercent =
    stats?.ai?.writing?.limit === 0
      ? 0
      : (stats?.ai?.writing?.used / stats?.ai?.writing?.limit) * 100 || 0;
  const speakingPercent =
    stats?.ai?.speaking?.limit === 0
      ? 0
      : (stats?.ai?.speaking?.used / stats?.ai?.speaking?.limit) * 100 || 0;

  const totalTests =
    (stats?.tests?.reading || 0) +
    (stats?.tests?.listening || 0) +
    (stats?.tests?.writing || 0) +
    (stats?.tests?.speaking || 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full"
          >
            <div className="glass-card-premium rounded-[2rem] p-5 md:p-6 h-[20rem]">
              <Skeleton className="h-6 w-32 mb-6" />
              <div className="grid grid-cols-2 gap-6">
                <Skeleton className="h-32 rounded-2xl" />
                <Skeleton className="h-32 rounded-2xl" />
              </div>
            </div>
            <div className="glass-card-premium rounded-[2rem] p-5 md:p-6 h-[20rem] flex flex-col justify-between">
              <Skeleton className="h-6 w-32 mb-6" />
              <div className="space-y-4 w-full">
                <Skeleton className="h-10 rounded-full" />
                <Skeleton className="h-10 rounded-full" />
              </div>
            </div>
            <div className="lg:col-span-2 glass-card-premium rounded-[2rem] p-5 md:p-6">
              <Skeleton className="h-6 w-48 mb-6" />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Skeleton className="h-[76px] rounded-2xl" />
                <Skeleton className="h-[76px] rounded-2xl" />
                <Skeleton className="h-[76px] rounded-2xl" />
                <Skeleton className="h-[76px] rounded-2xl" />
              </div>
            </div>
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-rose-500/5 border border-rose-500/20 rounded-3xl p-8 text-center"
          >
            <p className="text-rose-500 font-bold">Failed to load usage statistics</p>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full"
          >
            {/* AI Usage Section */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="glass-card-premium rounded-[2rem] p-5 md:p-6"
              data-oid="m7zbkwz"
            >
              <div className="flex items-center justify-between mb-6" data-oid="mkb18et">
                <div data-oid="-6bbvqk">
                  <h3 className="text-lg font-black text-foreground" data-oid="xl16brq">
                    AI Usage
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium" data-oid=":elkw:4">
                    Monthly limits
                  </p>
                </div>
                <Badge
                  className={cn(
                    'px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] shadow-sm',
                    stats.tier === 'premium'
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-0'
                      : stats.tier === 'pro'
                        ? 'bg-indigo-600 text-white border-0'
                        : 'bg-secondary text-secondary-foreground'
                  )}
                  data-oid="txau55a"
                >
                  <Crown className="w-3 h-3 mr-1" data-oid="27f1c82" />
                  {stats.tier}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" data-oid="s_85brk">
                {/* Writing */}
                <motion.div
                  variants={itemVariants}
                  className="flex flex-col items-center p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100/50 dark:border-indigo-500/10 transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
                  data-oid="-q4ltm9"
                >
                  <ProgressRing
                    progress={writingPercent}
                    size={100}
                    strokeWidth={10}
                    color="stroke-indigo-500 dark:stroke-indigo-400"
                    data-oid="u9kc.lk"
                  >
                    <PenLine
                      className="w-6 h-6 text-indigo-500 dark:text-indigo-400"
                      data-oid="9wg-o5v"
                    />
                  </ProgressRing>
                  <div className="text-center mt-3" data-oid="n00xkh_">
                    <h4
                      className="text-sm font-black text-indigo-700 dark:text-indigo-300"
                      data-oid="u609aa2"
                    >
                      Writing
                    </h4>
                    <p
                      className="text-xs text-muted-foreground font-bold flex items-center justify-center gap-1"
                      data-oid="77-pszn"
                    >
                      <span data-oid="x7uvgiv">
                        {stats.ai.writing.used} / {stats.ai.writing.limit}
                      </span>
                      {stats.ai.writing.bonus > 0 && (
                        <Badge
                          variant="outline"
                          className="h-4 px-1 text-[8px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
                          data-oid="3fc8.r3"
                        >
                          +{stats.ai.writing.bonus} Bonus
                        </Badge>
                      )}
                    </p>
                  </div>
                </motion.div>

                {/* Speaking */}
                <motion.div
                  variants={itemVariants}
                  className="flex flex-col items-center p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100/50 dark:border-emerald-500/10 transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                  data-oid="c.qf1bm"
                >
                  <ProgressRing
                    progress={speakingPercent}
                    size={100}
                    strokeWidth={10}
                    color="stroke-emerald-500 dark:stroke-emerald-400"
                    data-oid="89vrl7v"
                  >
                    <Mic
                      className="w-6 h-6 text-emerald-500 dark:text-emerald-400"
                      data-oid="pv-hb1d"
                    />
                  </ProgressRing>
                  <div className="text-center mt-3" data-oid="hlh.4yi">
                    <h4
                      className="text-sm font-black text-emerald-700 dark:text-emerald-300"
                      data-oid="whel.qy"
                    >
                      Speaking
                    </h4>
                    <p
                      className="text-xs text-muted-foreground font-bold flex items-center justify-center gap-1"
                      data-oid="gs6ct88"
                    >
                      <span data-oid="5m2d7v6">
                        {stats.ai.speaking.used} /{' '}
                        {stats.ai.speaking.limit === 0 ? '0' : stats.ai.speaking.limit}
                      </span>
                      {stats.ai.speaking.bonus > 0 && (
                        <Badge
                          variant="outline"
                          className="h-4 px-1 text-[8px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          data-oid="o-gtm44"
                        >
                          +{stats.ai.speaking.bonus} Bonus
                        </Badge>
                      )}
                    </p>
                  </div>
                  {stats.ai.speaking.limit === 0 && (
                    <Link to="/pricing" className="mt-2" data-oid="fr5ajty">
                      <Badge
                        variant="outline"
                        className="text-[9px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20 cursor-pointer"
                        data-oid="q92rqhb"
                      >
                        Unlock
                      </Badge>
                    </Link>
                  )}
                </motion.div>
              </div>
            </motion.div>

            {/* Vocabulary Section */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="glass-card-premium rounded-[2rem] p-5 md:p-6 flex flex-col justify-between"
              data-oid="0u2u_nj"
            >
              <div className="flex items-center gap-3 mb-6" data-oid="vu-s58s">
                <div
                  className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400"
                  data-oid="qpb4tpk"
                >
                  <BookOpen className="w-5 h-5" data-oid="q6jffwb" />
                </div>
                <div data-oid="8w9t5mi">
                  <h3 className="text-lg font-black text-foreground" data-oid="ak5lcvm">
                    Vocabulary
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium" data-oid="66ul.vy">
                    Bank & Mastery
                  </p>
                </div>
              </div>

              <div
                className="grid grid-cols-1 sm:grid-cols-2 gap-6 h-full items-end"
                data-oid="_7c-ysu"
              >
                <div className="space-y-4 w-full" data-oid="a:ej4i-">
                  <ProgressBar
                    value={stats.vocabulary.total}
                    max={stats.vocabulary.limit}
                    color="bg-gradient-to-r from-amber-500 to-orange-500"
                    label="Saved"
                    data-oid="f3jjxmp"
                  />

                  <ProgressBar
                    value={stats.vocabulary.mastered}
                    max={stats.vocabulary.total || 1}
                    color="bg-gradient-to-r from-emerald-500 to-teal-500"
                    label="Mastered"
                    data-oid="arf7jl3"
                  />
                </div>

                <div
                  className="bg-amber-50/50 dark:bg-amber-500/5 border border-amber-100/50 dark:border-amber-500/10 rounded-2xl p-4 text-center"
                  data-oid="1mfd9sp"
                >
                  <div className="flex items-center justify-center gap-2 mb-1" data-oid=":tq.qop">
                    <Target className="w-5 h-5 text-amber-500" data-oid="3:-ijob" />
                    <span
                      className="text-3xl font-black text-amber-600 dark:text-amber-400"
                      data-oid="0sunoo9"
                    >
                      {stats.vocabulary.total}
                    </span>
                  </div>
                  <p
                    className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider"
                    data-oid="4z6i3pq"
                  >
                    Total Words
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Test Completion Stats - Full Width */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="lg:col-span-2 glass-card-premium rounded-[2rem] p-5 md:p-6"
              data-oid="ai3y3m4"
            >
              <div className="flex items-center justify-between mb-5" data-oid="ql9wzhn">
                <div className="flex items-center gap-3" data-oid="19_3vhh">
                  <div
                    className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400"
                    data-oid="5g:2p9q"
                  >
                    <TrendingUp className="w-5 h-5" data-oid="ezuheyo" />
                  </div>
                  <div data-oid="o5xmx0q">
                    <h3 className="text-lg font-black text-foreground" data-oid="x_1zgc:">
                      Practice Tests
                    </h3>
                    <p className="text-xs text-muted-foreground font-medium" data-oid="d4n10ks">
                      Completed history
                    </p>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="px-3 py-1 bg-secondary/50 text-secondary-foreground font-bold rounded-full text-[10px]"
                  data-oid="bms434f"
                >
                  {totalTests} Total
                </Badge>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-oid="6u7i:5o">
                <StatCard
                  icon={FileText}
                  value={stats.tests.reading}
                  label="Reading"
                  color="bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  data-oid="ccyvs81"
                />

                <StatCard
                  icon={Headphones}
                  value={stats.tests.listening}
                  label="Listening"
                  color="bg-purple-500/10 text-purple-600 dark:text-purple-400"
                  data-oid="dezj2cv"
                />

                <StatCard
                  icon={PenLine}
                  value={stats.tests.writing}
                  label="Writing"
                  color="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                  data-oid="r8ynquz"
                />

                <StatCard
                  icon={Mic}
                  value={stats.tests.speaking}
                  label="Speaking"
                  color="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  data-oid="h5chqis"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
