import React from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100 },
  },
};

const LeaderboardRow = React.memo(({ user, isCurrentUser, rank, isSticky = false }) => {
  return (
    <motion.div
      variants={isSticky ? {} : itemVariants}
      className={`grid grid-cols-12 gap-4 px-8 py-5 items-center transition-all group cursor-pointer border-b border-slate-100 dark:border-white/[0.05] ${
        isSticky
          ? 'bg-indigo-50/80 dark:bg-indigo-500/10 border-l-4 border-indigo-500 relative shadow-lg z-10'
          : 'hover:bg-slate-50/80 dark:hover:bg-white/[0.02] hover:border-l-4 hover:border-indigo-500/50 transition-all border-l-4 border-transparent'
      }`}
      data-oid="a0e-vv0"
    >
      <div
        className={`col-span-1 text-center font-bold transition-colors ${
          isSticky ? 'text-primary text-lg' : 'text-muted-foreground group-hover:text-primary'
        }`}
        data-oid="mqdwgsn"
      >
        {user.rank}
      </div>
      <div className="col-span-6 md:col-span-5 flex items-center gap-3" data-oid="4uex4wj">
        <Avatar
          className={`h-10 w-10 border transition-colors ${
            isSticky
              ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
              : 'border-border group-hover:border-primary/50'
          }`}
          data-oid="rfyd8up"
        >
          <AvatarImage src={user.avatar} data-oid="5zolwl8" />
          <AvatarFallback
            className={`${isSticky ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'} font-semibold`}
            data-oid="_74ax8r"
          >
            {user.name[0]}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0" data-oid="q4uhfr7">
          <div
            className={`font-bold text-sm truncate flex items-center gap-2 transition-colors ${
              isSticky ? 'text-primary' : 'text-foreground group-hover:text-primary'
            }`}
            data-oid="l4j-rxh"
          >
            {user.name}
            {isCurrentUser && !isSticky && (
              <span
                className="ml-2 text-[9px] font-black uppercase tracking-wider bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20"
                data-oid="4r38-9u"
              >
                YOU
              </span>
            )}
            {isSticky && (
              <span
                className="hidden md:flex h-2 w-2 rounded-full bg-green-500 animate-pulse"
                data-oid="xu98dek"
              ></span>
            )}
          </div>
          <div
            className="text-[10px] text-muted-foreground truncate flex items-center gap-1"
            data-oid="r_9si4x"
          >
            {user.country}
          </div>
        </div>
      </div>
      <div className="col-span-3 md:col-span-2 text-center hidden md:block" data-oid="l.1woaa">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isSticky
              ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300'
              : Number(user.bandScore) >= 7.5
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : Number(user.bandScore) >= 6.5
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
          }`}
          data-oid="7o0tpu6"
        >
          {user.bandScore}
        </span>
      </div>
      <div
        className="col-span-2 md:col-span-2 text-center flex justify-center items-center gap-1 text-muted-foreground font-medium text-sm"
        data-oid="5jnzyc9"
      >
        {user.streak > 0 ? (
          <>
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500" data-oid="6536.kx" />
            <span
              className={`font-medium ${isSticky ? 'text-orange-600 dark:text-orange-400 font-bold' : 'text-orange-600 dark:text-orange-400'}`}
              data-oid="r.tk20f"
            >
              {user.streak}
            </span>
          </>
        ) : (
          <span className="opacity-50" data-oid="ns3ffs4">
            -
          </span>
        )}
      </div>
      <div
        className={`col-span-3 md:col-span-2 text-right font-bold transition-colors ${
          isSticky ? 'text-primary text-lg' : 'text-foreground group-hover:text-primary'
        }`}
        data-oid="tdezao."
      >
        {user.points.toLocaleString()}
      </div>
    </motion.div>
  );
});

LeaderboardRow.displayName = 'LeaderboardRow';
export default LeaderboardRow;
