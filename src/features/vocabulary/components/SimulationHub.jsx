import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Zap, Clock, Target, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SimulationHub({ onStartSpeedQuiz, onStartMatchPairs }) {
  const games = [
    {
      id: 'quiz',
      name: 'Speed Match',
      icon: Clock,
      color: 'bg-red-500',
      hover: 'hover:border-red-500/30 hover:bg-red-500/5',
      start: onStartSpeedQuiz,
      desc: 'Race against time.',
    },
    {
      id: 'match',
      name: 'Match Pairs',
      icon: Target,
      color: 'bg-purple-500',
      hover: 'hover:border-purple-500/30 hover:bg-purple-500/5',
      start: onStartMatchPairs,
      desc: 'Match word meanings.',
    },
  ];

  return (
    <Card className="w-full border-none shadow-[0_20px_50px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] bg-white/95 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-white/[0.12] overflow-hidden">
      <CardHeader className="p-6 pb-2">
        <CardTitle className="flex items-center gap-3 text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
          <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Zap className="w-5 h-5 stroke-[2.5px] fill-current" />
          </div>
          Practice Arena
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {games.map((game) => (
          <div
            key={game.id}
            onClick={game.start}
            className={cn(
              'group flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-white/[0.12] cursor-pointer transition-all duration-300 hover:shadow-lg',
              game.hover
            )}
          >
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  'w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-xl transition-transform group-hover:scale-110 group-hover:rotate-3',
                  game.color
                )}
              >
                <game.icon className="w-5 h-5 stroke-[2.5px]" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-black text-slate-800 dark:text-slate-100 text-[13px] uppercase tracking-tight italic">
                  {game.name}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">
                  {game.desc}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-all translate-x-0 group-hover:translate-x-1" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
