import React from 'react';
import { m } from 'framer-motion';
import { Crown, Flame, Trophy } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/cn';
import { NUM, PANEL, Pill } from '@/features/dashboard/components/primitives';

const itemVariants = {
  hidden: { y: 12, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 120, damping: 15 } },
};

function PodiumPlace({ user, place }) {
  const isFirst = place === 1;
  const size = isFirst ? 'h-16 w-16 sm:h-18 sm:w-18' : 'h-12 w-12 sm:h-14 sm:w-14';
  const pedestalHeight = isFirst ? 'h-14 sm:h-16' : place === 2 ? 'h-10 sm:h-12' : 'h-8 sm:h-9';

  return (
    <m.div
      variants={itemVariants}
      whileHover={{ y: -3 }}
      className={cn('flex max-w-[170px] flex-1 flex-col items-center', isFirst && 'max-w-[190px]')}
    >
      {isFirst && <Crown className="mb-1 h-5 w-5 text-amber-500" />}

      <div className="relative mb-2">
        <Avatar
          className={cn(
            size,
            'border-2',
            isFirst
              ? 'border-[#5a63df] ring-4 ring-[#5a63df]/15'
              : 'border-[#e4e2f0] dark:border-white/15'
          )}
        >
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback className="bg-[#5a63df]/10 font-bold text-[#5a63df]">
            {user.name?.[0] || 'U'}
          </AvatarFallback>
        </Avatar>
        <div
          className={cn(
            'absolute -bottom-1.5 left-1/2 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full border-2 border-white text-[10px] font-black text-white dark:border-[#08080a]',
            isFirst ? 'bg-[#5a63df]' : 'bg-slate-400 dark:bg-slate-600'
          )}
        >
          {place}
        </div>
      </div>

      <div className="mb-2 w-full text-center">
        <h4 className="truncate text-xs font-extrabold text-slate-900 dark:text-white sm:text-sm">
          {user.name}
        </h4>
        <p className={cn(NUM, 'mt-0.5 text-[11px] font-bold text-slate-500 dark:text-slate-400')}>
          {user.points.toLocaleString()} <span className="text-[9px] uppercase">xp</span>
        </p>
        <div className="mt-1 flex items-center justify-center gap-1.5">
          {Number(user.bandScore) > 0 && <Pill tone="accent">Band {user.bandScore}</Pill>}
          {user.streak > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
              <Flame className="h-3 w-3" />
              {user.streak}
            </span>
          )}
        </div>
      </div>

      <div
        className={cn(
          'flex w-full items-center justify-center rounded-t-lg',
          pedestalHeight,
          isFirst
            ? 'border-t-2 border-[#5a63df]/30 bg-[#5a63df]/[0.08]'
            : 'border-t-2 border-[#e4e2f0] bg-[#f4f3fb] dark:border-white/10 dark:bg-white/[0.03]'
        )}
      >
        <Trophy className={cn('h-4 w-4', isFirst ? 'text-[#5a63df]' : 'text-slate-400')} />
      </div>
    </m.div>
  );
}

const Podium = React.memo(({ topThree }) => {
  if (!topThree || topThree.length === 0) return null;
  const [first, second, third] = topThree;

  return (
    <div className={cn(PANEL, 'p-4 sm:p-5')}>
      <div className="mx-auto flex max-w-2xl items-end justify-center gap-2 sm:gap-4 md:gap-6">
        {second && <PodiumPlace user={second} place={2} />}
        {first && <PodiumPlace user={first} place={1} />}
        {third && <PodiumPlace user={third} place={3} />}
      </div>
    </div>
  );
});

Podium.displayName = 'Podium';
export default Podium;
