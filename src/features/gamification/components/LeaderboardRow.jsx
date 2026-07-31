import React from 'react';
import { m } from 'framer-motion';
import { Crown, Flame, Medal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/cn';
import { MICRO, MUTED, NUM, Pill } from '@/features/dashboard/components/primitives';

const itemVariants = {
  hidden: { y: 10, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 120, damping: 15 } },
};

function RankBadge({ rank }) {
  if (rank === 1) {
    return (
      <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full border border-[#5a63df]/30 bg-[#5a63df]/10 text-[#5a63df]">
        <Crown className="h-4 w-4" />
      </div>
    );
  }
  if (rank === 2 || rank === 3) {
    return (
      <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full border border-[#e4e2f0] bg-[#f4f3fb] text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400">
        <Medal className="h-4 w-4" />
      </div>
    );
  }
  return (
    <span className={cn(NUM, 'text-xs font-bold text-slate-400 dark:text-slate-500')}>{rank}</span>
  );
}

const LeaderboardRow = React.memo(({ user, isCurrentUser, rank, isSticky = false }) => {
  const userRank = user.rank || rank;
  const highlighted = isSticky || isCurrentUser;

  return (
    <m.div
      variants={isSticky ? {} : itemVariants}
      className={cn(
        'group grid grid-cols-12 items-center gap-2 border-b border-[#eeedf7] px-3.5 py-2.5 transition-colors dark:border-white/[0.07] sm:gap-4 sm:px-5',
        isSticky
          ? 'bg-[#5a63df]/[0.06] dark:bg-[#5a63df]/[0.1]'
          : isCurrentUser
            ? 'bg-[#5a63df]/[0.04]'
            : 'hover:bg-[#f7f6fd] dark:hover:bg-white/[0.02]'
      )}
    >
      <div className="col-span-1 text-center">
        <RankBadge rank={userRank} />
      </div>

      <div className="col-span-6 flex min-w-0 items-center gap-2.5 sm:col-span-5">
        <Avatar
          className={cn(
            'h-8 w-8 shrink-0 border sm:h-9 sm:w-9',
            highlighted
              ? 'border-[#5a63df] ring-2 ring-[#5a63df]/20'
              : 'border-[#e4e2f0] dark:border-white/10'
          )}
        >
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback
            className={cn(
              'text-xs font-bold',
              highlighted
                ? 'bg-[#5a63df] text-white'
                : 'bg-[#f4f3fb] text-slate-500 dark:bg-white/[0.06] dark:text-slate-300'
            )}
          >
            {user.name?.[0] || 'U'}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <span
              className={cn(
                'truncate text-xs font-bold sm:text-sm',
                highlighted
                  ? 'text-[#5a63df] dark:text-[#a9afff]'
                  : 'text-slate-900 dark:text-slate-100'
              )}
            >
              {user.name}
            </span>
            {isCurrentUser && <Pill tone="accent">You</Pill>}
          </div>
          <div className={cn(MICRO, MUTED, 'truncate font-medium normal-case tracking-normal')}>
            {user.country || 'Global'}
          </div>
        </div>
      </div>

      <div className="col-span-3 hidden text-center sm:col-span-2 sm:block">
        <Pill
          tone={
            Number(user.bandScore) >= 7.5
              ? 'ok'
              : Number(user.bandScore) >= 6.5
                ? 'accent'
                : Number(user.bandScore) > 0
                  ? 'amber'
                  : 'neutral'
          }
        >
          {Number(user.bandScore) > 0 ? `Band ${user.bandScore}` : '—'}
        </Pill>
      </div>

      <div className="col-span-2 flex items-center justify-center gap-1 text-center sm:col-span-2">
        {user.streak > 0 ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
            <Flame className="h-3.5 w-3.5" />
            {user.streak}
          </span>
        ) : (
          <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
        )}
      </div>

      <div
        className={cn(
          NUM,
          'col-span-3 text-right text-xs font-bold sm:col-span-2 sm:text-sm',
          highlighted ? 'text-[#5a63df] dark:text-[#a9afff]' : 'text-slate-900 dark:text-white'
        )}
      >
        {user.points.toLocaleString()}{' '}
        <span className="text-[9px] font-bold uppercase text-slate-400">xp</span>
      </div>
    </m.div>
  );
});

LeaderboardRow.displayName = 'LeaderboardRow';
export default LeaderboardRow;
