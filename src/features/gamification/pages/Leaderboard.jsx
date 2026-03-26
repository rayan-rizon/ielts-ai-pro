import React, { useState, useMemo } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { motion } from 'framer-motion';
import {
  Trophy,
  Flame,
  Search,
  Medal,
  Crown,
  User as UserIcon,
  ChevronDown,
  LayoutDashboard,
  Calendar,
  Clock,
} from 'lucide-react';
import { User } from '@/entities';
import { useLeaderboard } from '@/features/gamification/hooks/useLeaderboard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Podium from '../components/Podium';
import LeaderboardRow from '../components/LeaderboardRow';

// Animation Variants
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

const PAGE_SIZE = 25;

export default function Leaderboard() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const [timeFilter, setTimeFilter] = useState('all_time');

  const {
    data,
    isLoading: loading,
    isFetchingNextPage: loadingMore,
    hasNextPage: hasMore,
    fetchNextPage: loadMoreUsers,
  } = useLeaderboard(timeFilter, currentUser?.id);

  // Flatten pages into a single users array
  const users = useMemo(() => {
    return data?.pages.flatMap((page) => page.users) || [];
  }, [data]);

  const totalCount = data?.pages[0]?.totalCount || 0;
  const topThree = useMemo(() => users.slice(0, 3), [users]);
  const tableUsers = users;

  const userRank = useMemo(() => {
    if (!currentUser) return null;
    return users.find((u) => u.id === currentUser.id);
  }, [users, currentUser]);

  return (
    <div
      className="relative min-h-screen pb-20 bg-slate-50 dark:bg-[#020617] transition-colors duration-500 overflow-hidden"
      data-oid=".p4x6lj"
    >
      {/* ... Background and Surface colors ... */}
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 pointer-events-none overflow-hidden"
        data-oid="26kd_93"
      >
        <div
          className="absolute top-[-10%] left-[-10%] w-[70rem] h-[70rem] rounded-full bg-slate-200/30 dark:bg-indigo-950/20 blur-[120px]"
          data-oid="dsqvhe-"
        />
        <div
          className="absolute bottom-[-20%] right-[-10%] w-[60rem] h-[60rem] rounded-full bg-indigo-100/20 dark:bg-slate-900/10 blur-[120px]"
          data-oid="tt11g_4"
        />
        <div
          className="absolute top-[20%] right-[10%] w-[40rem] h-[40rem] rounded-full bg-slate-200/10 dark:bg-slate-900/15 blur-[80px]"
          data-oid="podgkpv"
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-0 dark:opacity-40 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.03)_0%,transparent_70%)]"
          data-oid=":d8xozi"
        />
        <div
          className="absolute inset-0 opacity-[0.2] dark:opacity-40 bg-[radial-gradient(at_top_left,rgba(71,85,105,0.05)_0%,transparent_50%),radial-gradient(at_bottom_right,rgba(30,41,59,0.05)_0%,transparent_50%)]"
          data-oid="kd5wex:"
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:48px_48px]"
          data-oid=":e3ix-u"
        />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-4 md:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-8 relative z-10"
        data-oid="gexe8al"
      >
        {/* Header */}
        <motion.header
          variants={itemVariants}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 max-w-5xl mx-auto w-full"
          data-oid="5dwo8ob"
        >
          <div className="flex-1" data-oid=":qmxmyb">
            <div className="flex items-center gap-3" data-oid="k7-ishb">
              <div
                className="bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-400/20 dark:to-amber-600/10 text-amber-600 dark:text-amber-400 p-2.5 rounded-2xl shadow-lg border border-amber-200/50 dark:border-amber-400/30"
                data-oid="r.0ybka"
              >
                <Trophy className="w-5 h-5 fill-current" data-oid="7ojc0ta" />
              </div>
              <Badge
                variant="outline"
                className="px-3 py-1 rounded-full bg-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400 font-black text-[10px] uppercase tracking-[0.15em]"
                data-oid="70s5klq"
              >
                Global Ranking
              </Badge>
            </div>
            <h1
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white mt-3 leading-tight italic"
              data-oid="idp38.y"
            >
              Top{' '}
              <span
                className="text-transparent bg-clip-text bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 dark:from-amber-400 dark:via-orange-400 dark:to-amber-500"
                data-oid="e:n39tk"
              >
                Learners
              </span>{' '}
              🏆
            </h1>
            <p
              className="text-slate-500 dark:text-slate-400 text-base md:text-lg font-medium max-w-xl leading-relaxed"
              data-oid="8maro:3"
            >
              Ranking the best IELTS performers worldwide. Rise to the top of the leaderboard!
            </p>
          </div>

          <div
            className="flex bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl p-1.5 rounded-2xl shadow-sm border border-slate-200/50 dark:border-white/10 self-start lg:self-center"
            data-oid="tvycqqw"
          >
            {['Weekly', 'Monthly', 'All Time'].map((filter) => {
              const value = filter.toLowerCase().replace(' ', '_');
              const isActive = timeFilter === value;
              return (
                <button
                  key={value}
                  onClick={() => setTimeFilter(value)}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/20 scale-[1.02]'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  data-oid="jx.9:a6"
                >
                  {filter}
                </button>
              );
            })}
          </div>
        </motion.header>

        {/* Podium Section */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mb-10 relative max-w-5xl mx-auto"
          data-oid="zo-8igq"
        >
          <Podium topThree={topThree} />
        </motion.section>

        {/* List Section */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-5xl mx-auto"
          data-oid="67k5iox"
        >
          <div
            className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-2xl rounded-3xl border border-slate-200/50 dark:border-white/[0.12] shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden"
            data-oid="qp4qkul"
          >
            {/* List Header */}
            <div
              className="p-6 md:p-8 border-b border-slate-100 dark:border-white/[0.08] flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50 dark:bg-white/[0.02]"
              data-oid="0.ugugw"
            >
              <h3
                className="font-black text-xl uppercase tracking-tight flex items-center gap-3 text-slate-900 dark:text-white"
                data-oid="h3-3-:n"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                  <LayoutDashboard className="w-4 h-4" data-oid="5l0_-5p" />
                </div>
                Top Learners
              </h3>
              <div className="flex items-center gap-3" data-oid="bx:lp_l">
                <span
                  className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                  data-oid=":3okarf"
                >
                  Sort by:
                </span>
                <Select defaultValue="xp" data-oid="j_8ygi6">
                  <SelectTrigger
                    className="w-[160px] h-9 bg-background border-border"
                    data-oid="_a.2egx"
                  >
                    <SelectValue placeholder="Sort order" data-oid="qaf26w-" />
                  </SelectTrigger>
                  <SelectContent data-oid="0ovm9kg">
                    <SelectItem value="xp" data-oid="tewhk3_">
                      Overall XP
                    </SelectItem>
                    <SelectItem value="time" data-oid=":8nk8fm">
                      Study Time
                    </SelectItem>
                    <SelectItem value="tests" data-oid="3hte_oz">
                      Tests Completed
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table Headers */}
            <div
              className="grid grid-cols-12 gap-4 px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-white/[0.05]"
              data-oid="tuj:5xi"
            >
              <div className="col-span-1 text-center" data-oid="i-ini.b">
                #
              </div>
              <div className="col-span-6 md:col-span-5" data-oid="q0xsctq">
                User
              </div>
              <div
                className="col-span-3 md:col-span-2 text-center hidden md:block"
                data-oid="dx9i4-:"
              >
                Band Score
              </div>
              <div
                className="col-span-2 md:col-span-2 text-center text-[10px] md:text-xs"
                data-oid="aazd9r."
              >
                Streak
              </div>
              <div className="col-span-3 md:col-span-2 text-right" data-oid="fy8gd.7">
                Total XP
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-border/50" data-oid="nk:lbrm">
              {loading ? (
                // Loading Skeletons
                [...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-12 gap-4 px-6 py-4 items-center"
                    data-oid="axiv:6."
                  >
                    <div className="col-span-1" data-oid="hra_:de">
                      <Skeleton className="h-4 w-4 mx-auto" data-oid="wpopa:l" />
                    </div>
                    <div
                      className="col-span-6 md:col-span-5 flex items-center gap-3"
                      data-oid="mwbc:kt"
                    >
                      <Skeleton className="h-10 w-10 rounded-full" data-oid="hs3p.0z" />
                      <div className="space-y-1" data-oid="xt717.4">
                        <Skeleton className="h-4 w-24" data-oid="3ih_b7_" />
                        <Skeleton className="h-3 w-16" data-oid="tpo5fj0" />
                      </div>
                    </div>
                    <div className="col-span-3 md:col-span-2 hidden md:block" data-oid="zigsv2-">
                      <Skeleton className="h-6 w-12 mx-auto rounded-full" data-oid="e4j72oz" />
                    </div>
                    <div className="col-span-2 md:col-span-2" data-oid="olpp7if">
                      <Skeleton className="h-4 w-8 mx-auto" data-oid="tkoi1z6" />
                    </div>
                    <div className="col-span-3 md:col-span-2" data-oid="k8p9p9x">
                      <Skeleton className="h-5 w-16 ml-auto" data-oid="sxr1gbt" />
                    </div>
                  </div>
                ))
              ) : tableUsers.length > 0 ? (
                tableUsers.map((user) => (
                  <LeaderboardRow
                    key={user.id}
                    user={user}
                    isCurrentUser={user.id === currentUser?.id}
                  />
                ))
              ) : (
                <div className="p-12 text-center text-muted-foreground" data-oid=".5fpjrv">
                  No users found.
                </div>
              )}

              {/* Current User Row (if not in top 3 and within view, or just sticky at bottom highlight) */}
              {currentUser && userRank && userRank.rank > 3 && (
                <LeaderboardRow user={userRank} isCurrentUser={true} isSticky={true} />
              )}
            </div>

            <div
              className="p-4 bg-muted/20 text-center text-xs text-muted-foreground border-t border-border flex flex-col items-center gap-2"
              data-oid="xm8v5gu"
            >
              <span data-oid="9iqb236">
                Showing {tableUsers.length} of {totalCount} learners
              </span>
              {hasMore && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadMoreUsers}
                  disabled={loadingMore}
                  className="text-primary font-semibold"
                  data-oid="mu5cnfo"
                >
                  {loadingMore ? (
                    <>
                      <span className="animate-spin mr-2" data-oid="1kinpc8">
                        ⏳
                      </span>
                      Loading...
                    </>
                  ) : (
                    `Load More (${Math.min(PAGE_SIZE, totalCount - tableUsers.length)} more)`
                  )}
                </Button>
              )}
              {!hasMore && tableUsers.length > 0 && (
                <span
                  className="text-emerald-600 dark:text-emerald-400 font-medium"
                  data-oid="hq.a2c_"
                >
                  🏆 All learners loaded!
                </span>
              )}
            </div>
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
}
