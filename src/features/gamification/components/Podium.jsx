import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Flame, Crown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100 },
  },
};

const Podium = React.memo(({ topThree }) => {
  if (!topThree || topThree.length === 0) return null;

  return (
    <div
      className="bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-transparent dark:from-indigo-500/15 dark:via-purple-500/10 dark:to-slate-900/40 rounded-3xl p-4 sm:p-6 border border-slate-200/50 dark:border-white/[0.08] shadow-2xl relative overflow-hidden backdrop-blur-xl"
      data-oid=":4ovv2_"
    >
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-12 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 blur-[80px] pointer-events-none animate-pulse"
        data-oid="o-9s-0o"
      />

      <div
        className="flex items-end justify-center gap-1.5 xs:gap-3 sm:gap-6 min-h-[120px] md:min-h-[160px] pb-2"
        data-oid="g_:lc29"
      >
        {/* 2nd Place */}
        {topThree[1] && (
          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center group cursor-pointer z-10"
            whileHover={{ y: -5 }}
            data-oid="www6azy"
          >
            <div className="relative mb-3" data-oid="bgo0fr7">
              <div
                className="w-10 h-10 md:w-12 md:h-12 rounded-full border-3 border-blue-300 dark:border-blue-700 p-1 bg-white dark:bg-slate-800 shadow-xl ring-3 ring-blue-200/50 dark:ring-blue-800/30"
                data-oid="4:vv9ab"
              >
                <Avatar className="w-full h-full" data-oid="5w5euos">
                  <AvatarImage src={topThree[1].avatar} data-oid="n_7lh-e" />
                  <AvatarFallback
                    className="bg-slate-100 text-slate-500 font-bold text-lg"
                    data-oid="1n_bmrt"
                  >
                    {topThree[1].name[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div
                className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold shadow-md border-2 border-white dark:border-slate-800 z-10 text-[10px]"
                data-oid="pgz5-0d"
              >
                2
              </div>
            </div>
            <div className="text-center mb-3" data-oid="haqty6.">
              <h3
                className="font-bold text-sm md:text-base text-foreground truncate max-w-[120px]"
                data-oid="y2:i2tp"
              >
                {topThree[1].name}
              </h3>
              <div className="text-xs font-semibold text-muted-foreground mt-1" data-oid="kt89axy">
                {topThree[1].points.toLocaleString()} XP
              </div>
              <div
                className="flex items-center justify-center gap-1 text-xs text-orange-500 mt-1"
                data-oid="o49huks"
              >
                <Flame className="w-3 h-3 fill-current" data-oid="2e.m_g9" /> {topThree[1].streak}
              </div>
            </div>
            <div
              className="h-16 w-10 md:w-14 bg-gradient-to-t from-blue-400 via-blue-300 to-blue-100 dark:from-blue-600 dark:via-blue-700 dark:to-blue-800/30 rounded-t-2xl opacity-90 shadow-lg shadow-blue-500/20"
              data-oid="4:.eziw"
            />
          </motion.div>
        )}

        {/* 1st Place */}
        {topThree[0] && (
          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center z-20 group cursor-pointer -mx-2 md:mx-0"
            whileHover={{ y: -5 }}
            data-oid="kugrs-5"
          >
            <div className="text-amber-500 mb-1 animate-bounce drop-shadow-lg" data-oid="reomh0z">
              <Crown className="w-5 h-5 fill-current" data-oid="mqj30t8" />
            </div>
            <div className="relative mb-3" data-oid="rix:e1q">
              <div
                className="w-16 h-16 md:w-20 md:h-20 rounded-full border-[4px] border-amber-400 p-1 bg-white dark:bg-slate-800 shadow-2xl relative ring-4 ring-amber-200/50 dark:ring-amber-800/30"
                data-oid="rv7:ubu"
              >
                <Avatar className="w-full h-full" data-oid="fyggjzh">
                  <AvatarImage src={topThree[0].avatar} data-oid="5xq-24r" />
                  <AvatarFallback
                    className="bg-amber-100 text-amber-600 font-bold text-2xl"
                    data-oid="3t.o_mx"
                  >
                    {topThree[0].name[0]}
                  </AvatarFallback>
                </Avatar>
                <div
                  className="absolute -top-1 -right-1 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full p-1 shadow-lg border-2 border-white dark:border-slate-800 animate-pulse"
                  data-oid="::vyk-j"
                >
                  <Trophy className="w-4 h-4 text-white fill-current" data-oid="tvtwfll" />
                </div>
              </div>
              <div
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-xs shadow-lg border-2 border-white dark:border-slate-800 z-10"
                data-oid="ppqvp23"
              >
                1
              </div>
            </div>
            <div className="text-center mb-3" data-oid="sjkvydw">
              <h3 className="font-bold text-lg text-foreground" data-oid="34coev7">
                {topThree[0].name}
              </h3>
              <div className="text-sm font-bold text-primary mt-0.5" data-oid="tl-apu2">
                {topThree[0].points.toLocaleString()} XP
              </div>
              <div
                className="flex items-center justify-center gap-1.5 text-xs text-orange-500 mt-1 font-medium bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-full"
                data-oid="okbf915"
              >
                <Flame className="w-3.5 h-3.5 fill-current" data-oid="5.v2s8s" />{' '}
                {topThree[0].streak} Day Streak
              </div>
            </div>
            <div
              className="h-16 xs:h-20 w-8 xs:w-12 sm:w-14 md:w-20 bg-gradient-to-t from-amber-400 via-amber-300 to-amber-100 dark:from-amber-600 dark:via-amber-700 dark:to-amber-800/30 rounded-t-2xl opacity-90 shadow-xl shadow-amber-500/30"
              data-oid="77gk7zs"
            />
          </motion.div>
        )}

        {/* 3rd Place */}
        {topThree[2] && (
          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center z-10 group cursor-pointer"
            whileHover={{ y: -5 }}
            data-oid="1kgz.sl"
          >
            <div className="relative mb-3" data-oid="690vm-a">
              <div
                className="w-10 h-10 md:w-12 md:h-12 rounded-full border-3 border-orange-300 dark:border-orange-700 p-1 bg-white dark:bg-slate-800 shadow-xl ring-3 ring-orange-200/50 dark:ring-orange-800/30"
                data-oid="n_nnohh"
              >
                <Avatar className="w-full h-full" data-oid="42b3kl6">
                  <AvatarImage src={topThree[2].avatar} data-oid="32vpovm" />
                  <AvatarFallback
                    className="bg-orange-100 text-orange-600 font-bold text-lg"
                    data-oid="fg93p_4"
                  >
                    {topThree[2].name[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div
                className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold shadow-lg border-2 border-white dark:border-slate-800 z-10 text-xs"
                data-oid="wge4_e-"
              >
                3
              </div>
            </div>
            <div className="text-center mb-3" data-oid="1kz3lfp">
              <h3
                className="font-bold text-sm md:text-base text-foreground truncate max-w-[120px]"
                data-oid="fufq0qn"
              >
                {topThree[2].name}
              </h3>
              <div className="text-xs font-semibold text-muted-foreground mt-1" data-oid="2dj6e9c">
                {topThree[2].points.toLocaleString()} XP
              </div>
              <div
                className="flex items-center justify-center gap-1 text-xs text-orange-500 mt-1"
                data-oid="90f2q1m"
              >
                <Flame className="w-3 h-3 fill-current" data-oid="5n4ru94" /> {topThree[2].streak}
              </div>
            </div>
            <div
              className="h-14 w-10 md:w-14 bg-gradient-to-t from-orange-400 via-orange-300 to-orange-100 dark:from-orange-600 dark:via-orange-700 dark:to-orange-800/30 rounded-t-2xl opacity-90 shadow-lg shadow-orange-500/20"
              data-oid="qxmyh8d"
            />
          </motion.div>
        )}
      </div>
    </div>
  );
});

Podium.displayName = 'Podium';
export default Podium;
