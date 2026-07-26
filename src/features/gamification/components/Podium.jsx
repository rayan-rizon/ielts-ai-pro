import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Flame, Crown, Medal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const itemVariants = {
  hidden: { y: 15, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 120, damping: 14 },
  },
};

const Podium = React.memo(({ topThree }) => {
  if (!topThree || topThree.length === 0) return null;

  const first = topThree[0];
  const second = topThree[1];
  const third = topThree[2];

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-white/10 shadow-sm relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10 blur-2xl pointer-events-none" />

      <div className="flex items-end justify-center gap-2 sm:gap-4 md:gap-6 pt-2 pb-1 relative z-10 max-w-2xl mx-auto">
        {/* 2nd Place (Silver) */}
        {second && (
          <motion.div
            variants={itemVariants}
            className="flex-1 flex flex-col items-center group cursor-pointer max-w-[170px]"
            whileHover={{ y: -3 }}
          >
            {/* Avatar & Rank Badge */}
            <div className="relative mb-2">
              <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-full border-2 border-slate-300 dark:border-slate-600 p-0.5 bg-white dark:bg-slate-800 shadow-md ring-2 ring-slate-200/50 dark:ring-slate-700/50 transition-transform group-hover:scale-105">
                <Avatar className="w-full h-full">
                  <AvatarImage src={second.avatar} alt={second.name} />
                  <AvatarFallback className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm">
                    {second.name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 text-white font-bold text-[10px] flex items-center justify-center shadow border-2 border-white dark:border-slate-900">
                2
              </div>
            </div>

            {/* Info */}
            <div className="text-center w-full mb-2">
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                {second.name}
              </h4>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                {second.points.toLocaleString()} <span className="text-[9px] uppercase">XP</span>
              </p>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                {Number(second.bandScore) > 0 && (
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1.5 py-0 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 font-bold"
                  >
                    Band {second.bandScore}
                  </Badge>
                )}
                {second.streak > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                    {second.streak}
                  </span>
                )}
              </div>
            </div>

            {/* Pedestal Bar */}
            <div className="w-full h-11 sm:h-14 bg-gradient-to-t from-slate-200 via-slate-100 to-slate-50 dark:from-slate-800 dark:via-slate-700/60 dark:to-slate-700/30 rounded-t-xl border-t-2 border-slate-300 dark:border-slate-500/40 shadow-inner flex items-center justify-center text-slate-400 dark:text-slate-500 font-black text-xs">
              <Medal className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            </div>
          </motion.div>
        )}

        {/* 1st Place (Gold) */}
        {first && (
          <motion.div
            variants={itemVariants}
            className="flex-1 flex flex-col items-center group cursor-pointer max-w-[190px] -mx-1"
            whileHover={{ y: -4 }}
          >
            {/* Crown Icon */}
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className="text-amber-500 mb-1 drop-shadow-sm"
            >
              <Crown className="w-5 h-5 sm:w-6 sm:h-6 fill-amber-400 text-amber-500" />
            </motion.div>

            {/* Avatar & Rank Badge */}
            <div className="relative mb-2">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-3 border-amber-400 dark:border-amber-400 p-0.5 bg-white dark:bg-slate-800 shadow-lg ring-4 ring-amber-400/20 dark:ring-amber-400/30 transition-transform group-hover:scale-105 relative">
                <Avatar className="w-full h-full">
                  <AvatarImage src={first.avatar} alt={first.name} />
                  <AvatarFallback className="bg-amber-100 text-amber-700 font-bold text-base sm:text-lg">
                    {first.name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -top-1 -right-1 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full p-1 shadow border-2 border-white dark:border-slate-900">
                  <Trophy className="w-3 h-3 text-white fill-white" />
                </div>
              </div>
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-white font-black text-xs flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900">
                1
              </div>
            </div>

            {/* Info */}
            <div className="text-center w-full mb-2">
              <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                {first.name}
              </h4>
              <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                {first.points.toLocaleString()} <span className="text-[9px] uppercase">XP</span>
              </p>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                {Number(first.bandScore) > 0 && (
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1.5 py-0 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold"
                  >
                    Band {first.bandScore}
                  </Badge>
                )}
                {first.streak > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20">
                    <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                    {first.streak}d
                  </span>
                )}
              </div>
            </div>

            {/* Pedestal Bar */}
            <div className="w-full h-14 sm:h-18 bg-gradient-to-t from-amber-300/80 via-amber-200/50 to-amber-100/40 dark:from-amber-900/50 dark:via-amber-800/30 dark:to-amber-700/20 rounded-t-xl border-t-2 border-amber-400 dark:border-amber-500/60 shadow-inner flex items-center justify-center text-amber-600 dark:text-amber-400 font-black text-sm">
              <Trophy className="w-5 h-5 text-amber-500/80" />
            </div>
          </motion.div>
        )}

        {/* 3rd Place (Bronze) */}
        {third && (
          <motion.div
            variants={itemVariants}
            className="flex-1 flex flex-col items-center group cursor-pointer max-w-[170px]"
            whileHover={{ y: -3 }}
          >
            {/* Avatar & Rank Badge */}
            <div className="relative mb-2">
              <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-full border-2 border-amber-600/60 dark:border-amber-700 p-0.5 bg-white dark:bg-slate-800 shadow-md ring-2 ring-amber-600/20 dark:ring-amber-700/30 transition-transform group-hover:scale-105">
                <Avatar className="w-full h-full">
                  <AvatarImage src={third.avatar} alt={third.name} />
                  <AvatarFallback className="bg-amber-100/60 text-amber-800 dark:text-amber-300 font-bold text-xs sm:text-sm">
                    {third.name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 text-white font-bold text-[10px] flex items-center justify-center shadow border-2 border-white dark:border-slate-900">
                3
              </div>
            </div>

            {/* Info */}
            <div className="text-center w-full mb-2">
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                {third.name}
              </h4>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                {third.points.toLocaleString()} <span className="text-[9px] uppercase">XP</span>
              </p>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                {Number(third.bandScore) > 0 && (
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1.5 py-0 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-bold"
                  >
                    Band {third.bandScore}
                  </Badge>
                )}
                {third.streak > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                    {third.streak}
                  </span>
                )}
              </div>
            </div>

            {/* Pedestal Bar */}
            <div className="w-full h-9 sm:h-11 bg-gradient-to-t from-amber-200/60 via-amber-100/40 to-amber-50/20 dark:from-amber-900/30 dark:via-amber-800/20 dark:to-slate-800 rounded-t-xl border-t-2 border-amber-600/40 dark:border-amber-700/40 shadow-inner flex items-center justify-center text-amber-700/60 dark:text-amber-500/60 font-black text-xs">
              <Medal className="w-3.5 h-3.5" />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
});

Podium.displayName = 'Podium';
export default Podium;
