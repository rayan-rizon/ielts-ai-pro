import React, { useState, useMemo } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Flame,
  Search,
  Crown,
  User as UserIcon,
  Sparkles,
  Clock,
  TrendingUp,
  X,
} from 'lucide-react';
import { useLeaderboard } from '@/features/gamification/hooks/useLeaderboard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Podium from '../components/Podium';
import LeaderboardRow from '../components/LeaderboardRow';

const containerVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: 'easeOut', staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { y: 10, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 120, damping: 15 },
  },
};

const TIME_FILTERS = [
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'all_time', label: 'All Time' },
];

export default function Leaderboard() {
  const { user: currentUser } = useAuth();
  const [timeFilter, setTimeFilter] = useState('all_time');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data,
    isLoading: loading,
    isFetchingNextPage: loadingMore,
    hasNextPage: hasMore,
    fetchNextPage: loadMoreUsers,
  } = useLeaderboard(timeFilter, currentUser?.id);

  // Flatten infinite query pages into single array
  const users = useMemo(() => {
    return data?.pages.flatMap((page) => page.users) || [];
  }, [data]);

  const totalCount = data?.pages[0]?.totalCount || 0;
  const topThree = useMemo(() => users.slice(0, 3), [users]);

  // Current logged in user rank from dataset
  const currentUserRankInfo = useMemo(() => {
    if (!currentUser) return null;
    return users.find((u) => u.id === currentUser.id);
  }, [users, currentUser]);

  // Search filter
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase().trim();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(query) ||
        u.country?.toLowerCase().includes(query) ||
        u.rank.toString() === query
    );
  }, [users, searchQuery]);

  return (
    <div className="relative min-h-screen pb-16 bg-slate-50 dark:bg-[#020617] transition-colors duration-300 font-sans">
      {/* Background Subtle Gradient & Grid */}
      <div aria-hidden="true" className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[-5%] left-[-5%] w-[45rem] h-[45rem] rounded-full bg-indigo-500/10 blur-[100px]" />
        <div className="absolute top-[25%] right-[-5%] w-[40rem] h-[40rem] rounded-full bg-amber-500/10 blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-3 sm:p-5 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-4 sm:space-y-5 relative z-10"
      >
        {/* Header Bar */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-white/10"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20 shadow-sm">
              <Trophy className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-none sm:leading-tight">
                  Global Leaderboard
                </h1>
                <Badge className="px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 rounded-md font-semibold text-xs uppercase tracking-wider">
                  Top Learners
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                Compete with IELTS performers worldwide and rise through the ranks.
              </p>
            </div>
          </div>

          {/* Time Filter Segmented Control */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-1 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm flex items-center gap-1 self-start md:self-auto">
            {TIME_FILTERS.map((tf) => {
              const isActive = timeFilter === tf.id;
              return (
                <button
                  key={tf.id}
                  onClick={() => setTimeFilter(tf.id)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                  }`}
                >
                  {tf.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Current Logged-in User Quick Standing Banner */}
        {currentUserRankInfo && (
          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 rounded-2xl p-3.5 sm:p-4 text-white shadow-md shadow-indigo-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative overflow-hidden"
          >
            <div className="flex items-center gap-3 relative z-10">
              <Avatar className="h-10 w-10 sm:h-11 sm:w-11 border-2 border-white/40 shadow-sm shrink-0">
                <AvatarImage src={currentUserRankInfo.avatar} alt={currentUserRankInfo.name} />
                <AvatarFallback className="bg-white/20 text-white font-bold">
                  {currentUserRankInfo.name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm sm:text-base text-white truncate">
                    {currentUserRankInfo.name}
                  </h3>
                  <Badge className="bg-white/20 text-white border-0 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md">
                    Your Rank #{currentUserRankInfo.rank}
                  </Badge>
                </div>
                <p className="text-xs text-indigo-100/90 font-medium">
                  {currentUserRankInfo.points.toLocaleString()} total XP • Keep solving tests to
                  climb!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 relative z-10 shrink-0 self-end sm:self-auto">
              {currentUserRankInfo.streak > 0 && (
                <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-white/15">
                  <Flame className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>{currentUserRankInfo.streak} Day Streak</span>
                </div>
              )}
              {Number(currentUserRankInfo.bandScore) > 0 && (
                <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold border border-white/15">
                  Band {currentUserRankInfo.bandScore}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Compact Podium for Top 3 */}
        {!loading && topThree.length > 0 && (
          <motion.div variants={itemVariants}>
            <Podium topThree={topThree} />
          </motion.div>
        )}

        {/* Leaderboard Table Container */}
        <motion.div
          variants={itemVariants}
          className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden"
        >
          {/* Table Toolbar & Search */}
          <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 dark:bg-white/[0.01]">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-tight">
                Rankings
              </span>
              <Badge variant="secondary" className="text-[11px] font-bold px-2 py-0 rounded-md">
                {totalCount} Learners
              </Badge>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search learner or rank..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9 pr-8 text-xs rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus-visible:ring-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Table Columns Header */}
          <div className="grid grid-cols-12 gap-2 sm:gap-4 px-3 sm:px-6 py-2.5 text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-white/[0.05] bg-slate-50/30 dark:bg-slate-950/30">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-6 sm:col-span-5">Learner</div>
            <div className="col-span-3 sm:col-span-2 text-center hidden sm:block">Band Score</div>
            <div className="col-span-2 sm:col-span-2 text-center">Streak</div>
            <div className="col-span-3 sm:col-span-2 text-right">Total XP</div>
          </div>

          {/* Table Content */}
          <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
            {loading ? (
              // Loading Skeletons
              [...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="grid grid-cols-12 gap-2 sm:gap-4 px-3 sm:px-6 py-3 items-center"
                >
                  <div className="col-span-1 text-center">
                    <Skeleton className="h-4 w-4 mx-auto rounded" />
                  </div>
                  <div className="col-span-6 sm:col-span-5 flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                    <div className="space-y-1 min-w-0 flex-1">
                      <Skeleton className="h-3.5 w-28 rounded" />
                      <Skeleton className="h-2.5 w-16 rounded" />
                    </div>
                  </div>
                  <div className="col-span-3 sm:col-span-2 text-center hidden sm:block">
                    <Skeleton className="h-5 w-14 mx-auto rounded-md" />
                  </div>
                  <div className="col-span-2 sm:col-span-2 text-center">
                    <Skeleton className="h-4 w-8 mx-auto rounded" />
                  </div>
                  <div className="col-span-3 sm:col-span-2 text-right">
                    <Skeleton className="h-4 w-16 ml-auto rounded" />
                  </div>
                </div>
              ))
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <LeaderboardRow
                  key={user.id || user.rank}
                  user={user}
                  isCurrentUser={user.id === currentUser?.id}
                />
              ))
            ) : (
              <div className="py-12 px-4 text-center text-slate-500 dark:text-slate-400 space-y-2">
                <p className="text-sm font-semibold">No learners match your search.</p>
                <p className="text-xs text-slate-400">
                  Try searching for a different name or clear filters.
                </p>
              </div>
            )}
          </div>

          {/* Sticky Current User Row if user is not in currently rendered list */}
          {currentUser &&
            currentUserRankInfo &&
            !filteredUsers.some((u) => u.id === currentUser.id) && (
              <div className="border-t-2 border-indigo-500/50">
                <LeaderboardRow user={currentUserRankInfo} isCurrentUser={true} isSticky={true} />
              </div>
            )}

          {/* Footer & Pagination */}
          <div className="p-4 bg-slate-50/50 dark:bg-white/[0.01] border-t border-slate-100 dark:border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">
              Showing {filteredUsers.length} of {totalCount} learners
            </span>

            {hasMore && !searchQuery && (
              <Button
                variant="outline"
                size="sm"
                onClick={loadMoreUsers}
                disabled={loadingMore}
                className="rounded-xl px-4 h-9 font-semibold text-xs text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
              >
                {loadingMore ? (
                  <>
                    <Clock className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Loading learners...
                  </>
                ) : (
                  'Load More Learners'
                )}
              </Button>
            )}

            {!hasMore && filteredUsers.length > 0 && !searchQuery && (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                All top learners loaded!
              </span>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
