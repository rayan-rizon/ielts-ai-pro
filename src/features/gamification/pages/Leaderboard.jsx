import React, { useState, useMemo } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { m } from 'framer-motion';
import { Flame, Search, Sparkles, Clock, X } from 'lucide-react';
import { useLeaderboard } from '@/features/gamification/hooks/useLeaderboard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Empty, MICRO, MUTED, NUM, PANEL, Pill } from '@/features/dashboard/components/primitives';
import { cn } from '@/lib/cn';
import Podium from '../components/Podium';
import LeaderboardRow from '../components/LeaderboardRow';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
};
const FADE_UP = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.23, 1, 0.32, 1] } },
};

const TIME_FILTERS = [
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'all_time', label: 'All time' },
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

  const users = useMemo(() => data?.pages.flatMap((page) => page.users) || [], [data]);
  const totalCount = data?.pages[0]?.totalCount || 0;
  const topThree = useMemo(() => users.slice(0, 3), [users]);

  const currentUserRankInfo = useMemo(() => {
    if (!currentUser) return null;
    return users.find((u) => u.id === currentUser.id);
  }, [users, currentUser]);

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
    <main className="relative min-h-full overflow-hidden bg-[#f8f8fb] px-3 py-4 pb-10 text-slate-950 dark:bg-[#08080a] dark:text-white sm:px-4 md:px-5 md:py-5">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(#5a63df_1.2px,transparent_1.2px)] bg-[size:20px_20px] opacity-[0.10] dark:opacity-[0.14]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 -z-0 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(210,204,255,0.55),transparent_70%)] dark:bg-[radial-gradient(circle,rgba(90,99,223,0.16),transparent_70%)]"
      />

      <m.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto max-w-[1200px] space-y-3"
      >
        <m.header
          variants={FADE_UP}
          className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Global leaderboard
              </h1>
              <Pill tone="amber">Top learners</Pill>
            </div>
            <p className={cn('mt-0.5 text-sm font-medium', MUTED)}>
              Compete with IELTS performers worldwide and rise through the ranks.
            </p>
          </div>

          <div className="inline-flex items-center gap-1 rounded-full border border-[#e4e2f0] bg-white p-1 dark:border-white/10 dark:bg-white/[0.04]">
            {TIME_FILTERS.map((tf) => {
              const isActive = timeFilter === tf.id;
              return (
                <button
                  key={tf.id}
                  onClick={() => setTimeFilter(tf.id)}
                  className={cn(
                    'rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors duration-200',
                    isActive
                      ? 'bg-[#5a63df] text-white'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  )}
                >
                  {tf.label}
                </button>
              );
            })}
          </div>
        </m.header>

        {currentUserRankInfo && (
          <m.div
            variants={FADE_UP}
            className={cn(
              PANEL,
              'border-[#5a63df]/30 flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between'
            )}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 shrink-0 border-2 border-[#5a63df]/30">
                <AvatarImage src={currentUserRankInfo.avatar} alt={currentUserRankInfo.name} />
                <AvatarFallback className="bg-[#5a63df]/10 font-bold text-[#5a63df]">
                  {currentUserRankInfo.name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-extrabold text-slate-900 dark:text-white">
                    {currentUserRankInfo.name}
                  </h3>
                  <Pill tone="accent">Your rank #{currentUserRankInfo.rank}</Pill>
                </div>
                <p className={cn('text-xs font-medium', MUTED)}>
                  <span className={cn(NUM, 'font-bold text-slate-700 dark:text-slate-200')}>
                    {currentUserRankInfo.points.toLocaleString()}
                  </span>{' '}
                  total XP · keep solving tests to climb
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              {currentUserRankInfo.streak > 0 && (
                <Pill tone="amber">
                  <Flame className="h-3 w-3" />
                  {currentUserRankInfo.streak} day streak
                </Pill>
              )}
              {Number(currentUserRankInfo.bandScore) > 0 && (
                <Pill tone="accent">Band {currentUserRankInfo.bandScore}</Pill>
              )}
            </div>
          </m.div>
        )}

        {!loading && topThree.length > 0 && (
          <m.div variants={FADE_UP}>
            <Podium topThree={topThree} />
          </m.div>
        )}

        <m.div variants={FADE_UP} className={cn(PANEL, 'overflow-hidden')}>
          <div className="flex flex-col items-center justify-between gap-3 border-b border-[#eeedf7] p-3.5 dark:border-white/[0.07] sm:flex-row">
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                Rankings
              </span>
              <Pill tone="neutral">{totalCount} learners</Pill>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Search learner or rank..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 rounded-lg border-[#e2e5f2] bg-white pl-9 pr-8 text-xs dark:border-white/10 dark:bg-white/[0.04]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div
            className={cn(
              MICRO,
              MUTED,
              'grid grid-cols-12 gap-2 border-b border-[#eeedf7] px-3.5 py-2 dark:border-white/[0.07] sm:gap-4 sm:px-5'
            )}
          >
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-6 sm:col-span-5">Learner</div>
            <div className="col-span-3 hidden text-center sm:col-span-2 sm:block">Band</div>
            <div className="col-span-2 text-center sm:col-span-2">Streak</div>
            <div className="col-span-3 text-right sm:col-span-2">Total XP</div>
          </div>

          <div>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="grid grid-cols-12 items-center gap-2 px-3.5 py-3 sm:gap-4 sm:px-5"
                >
                  <div className="col-span-1 text-center">
                    <Skeleton className="mx-auto h-4 w-4 rounded" />
                  </div>
                  <div className="col-span-6 flex items-center gap-3 sm:col-span-5">
                    <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                    <div className="min-w-0 flex-1 space-y-1">
                      <Skeleton className="h-3.5 w-28 rounded" />
                      <Skeleton className="h-2.5 w-16 rounded" />
                    </div>
                  </div>
                  <div className="col-span-3 hidden text-center sm:col-span-2 sm:block">
                    <Skeleton className="mx-auto h-5 w-14 rounded-md" />
                  </div>
                  <div className="col-span-2 text-center sm:col-span-2">
                    <Skeleton className="mx-auto h-4 w-8 rounded" />
                  </div>
                  <div className="col-span-3 text-right sm:col-span-2">
                    <Skeleton className="ml-auto h-4 w-16 rounded" />
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
              <Empty>No learners match your search. Try a different name or rank.</Empty>
            )}
          </div>

          {currentUser &&
            currentUserRankInfo &&
            !filteredUsers.some((u) => u.id === currentUser.id) && (
              <div className="border-t-2 border-[#5a63df]/40">
                <LeaderboardRow user={currentUserRankInfo} isCurrentUser={true} isSticky={true} />
              </div>
            )}

          <div className="flex flex-col items-center justify-between gap-3 border-t border-[#eeedf7] p-3.5 dark:border-white/[0.07] sm:flex-row">
            <span className={cn('text-xs font-medium', MUTED)}>
              Showing {filteredUsers.length} of {totalCount} learners
            </span>

            {hasMore && !searchQuery && (
              <button
                type="button"
                onClick={loadMoreUsers}
                disabled={loadingMore}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#e2e5f2] bg-white px-4 text-xs font-bold text-[#5a63df] transition-colors hover:border-[#c9cdf3] disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04]"
              >
                {loadingMore ? (
                  <>
                    <Clock className="h-3.5 w-3.5 animate-spin" />
                    Loading learners...
                  </>
                ) : (
                  'Load more learners'
                )}
              </button>
            )}

            {!hasMore && filteredUsers.length > 0 && !searchQuery && (
              <span className="flex items-center gap-1 text-xs font-bold text-[rgb(var(--signal-ok))]">
                <Sparkles className="h-3.5 w-3.5" />
                All top learners loaded
              </span>
            )}
          </div>
        </m.div>
      </m.div>
    </main>
  );
}
