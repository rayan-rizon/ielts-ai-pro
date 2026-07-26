import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Crown, Medal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const itemVariants = {
  hidden: { y: 10, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 120, damping: 15 },
  },
};

const LeaderboardRow = React.memo(({ user, isCurrentUser, rank, isSticky = false }) => {
  const userRank = user.rank || rank;

  // Custom Rank Indicator
  const renderRankBadge = () => {
    if (userRank === 1) {
      return (
        <div className="w-7 h-7 mx-auto rounded-full bg-amber-400/20 text-amber-500 flex items-center justify-center border border-amber-400/40 shadow-sm">
          <Crown className="w-4 h-4 fill-amber-400" />
        </div>
      );
    }
    if (userRank === 2) {
      return (
        <div className="w-7 h-7 mx-auto rounded-full bg-slate-300/30 text-slate-500 dark:text-slate-300 flex items-center justify-center border border-slate-300/40">
          <Medal className="w-4 h-4 fill-slate-400" />
        </div>
      );
    }
    if (userRank === 3) {
      return (
        <div className="w-7 h-7 mx-auto rounded-full bg-amber-700/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-600/40">
          <Medal className="w-4 h-4 fill-amber-600" />
        </div>
      );
    }
    return (
      <span
        className={`font-black text-xs sm:text-sm ${
          isSticky || isCurrentUser
            ? 'text-indigo-600 dark:text-indigo-400'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        {userRank}
      </span>
    );
  };

  return (
    <motion.div
      variants={isSticky ? {} : itemVariants}
      className={`grid grid-cols-12 gap-2 sm:gap-4 px-3 sm:px-6 py-2.5 sm:py-3 items-center transition-all group border-b border-slate-100 dark:border-white/[0.05] ${
        isSticky
          ? 'bg-indigo-50/90 dark:bg-indigo-500/15 border-l-4 border-indigo-500 relative shadow-md z-10'
          : isCurrentUser
            ? 'bg-indigo-50/40 dark:bg-indigo-500/10 border-l-4 border-indigo-500/80'
            : 'hover:bg-slate-50/80 dark:hover:bg-white/[0.02] border-l-4 border-transparent hover:border-indigo-500/40'
      }`}
    >
      {/* Rank */}
      <div className="col-span-1 text-center shrink-0">{renderRankBadge()}</div>

      {/* User Info */}
      <div className="col-span-6 sm:col-span-5 flex items-center gap-2.5 min-w-0">
        <Avatar
          className={`h-8 w-8 sm:h-9 sm:w-9 border shrink-0 transition-colors ${
            userRank === 1
              ? 'ring-2 ring-amber-400 border-amber-400'
              : isSticky || isCurrentUser
                ? 'ring-2 ring-indigo-500 border-indigo-500'
                : 'border-slate-200 dark:border-slate-700 group-hover:border-indigo-400'
          }`}
        >
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback
            className={`font-semibold text-xs ${
              isSticky || isCurrentUser
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {user.name?.[0] || 'U'}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={`font-bold text-xs sm:text-sm truncate transition-colors ${
                isSticky || isCurrentUser
                  ? 'text-indigo-600 dark:text-indigo-400 font-extrabold'
                  : 'text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
              }`}
            >
              {user.name}
            </span>

            {isCurrentUser && (
              <Badge className="px-1.5 py-0 text-[9px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 rounded-md shrink-0">
                YOU
              </Badge>
            )}
          </div>

          <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate font-medium">
            {user.country || 'Global'}
          </div>
        </div>
      </div>

      {/* Band Score */}
      <div className="col-span-3 sm:col-span-2 text-center hidden sm:block">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
            Number(user.bandScore) >= 7.5
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
              : Number(user.bandScore) >= 6.5
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                : Number(user.bandScore) > 0
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
          }`}
        >
          {Number(user.bandScore) > 0 ? `Band ${user.bandScore}` : '-'}
        </span>
      </div>

      {/* Streak */}
      <div className="col-span-2 sm:col-span-2 text-center flex items-center justify-center gap-1 text-xs">
        {user.streak > 0 ? (
          <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
            <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 group-hover:scale-110 transition-transform" />
            <span>{user.streak}</span>
          </span>
        ) : (
          <span className="text-slate-300 dark:text-slate-600 text-xs">-</span>
        )}
      </div>

      {/* Total XP */}
      <div
        className={`col-span-3 sm:col-span-2 text-right font-black text-xs sm:text-sm ${
          isSticky || isCurrentUser
            ? 'text-indigo-600 dark:text-indigo-400'
            : 'text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
        }`}
      >
        {user.points.toLocaleString()}{' '}
        <span className="text-[9px] font-bold text-slate-400 uppercase">XP</span>
      </div>
    </motion.div>
  );
});

LeaderboardRow.displayName = 'LeaderboardRow';
export default LeaderboardRow;
