import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Zap, Clock, Target, ChevronRight, Layers, PenTool } from 'lucide-react';
import { cn } from '@/lib/cn';

export default function SimulationHub({ onStartSpeedQuiz, onStartMatchPairs }) {
  const games = [
    {
      id: 'quiz',
      name: 'Speed Match',
      icon: Clock,
      start: onStartSpeedQuiz,
      desc: 'Race against the clock to match terms.',
      iconBg:
        'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-500/20',
      hoverBorder: 'hover:border-amber-400 dark:hover:border-amber-500',
    },
    {
      id: 'match',
      name: 'Match Pairs',
      icon: Target,
      start: onStartMatchPairs,
      desc: 'Pair high-impact words with definitions.',
      iconBg:
        'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20',
      hoverBorder: 'hover:border-emerald-400 dark:hover:border-emerald-500',
    },
    {
      id: 'flashcards',
      name: 'Smart Flashcards',
      icon: Layers,
      start: onStartSpeedQuiz,
      desc: 'Interactive active recall card deck.',
      iconBg:
        'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-500/20',
      hoverBorder: 'hover:border-indigo-400 dark:hover:border-indigo-500',
    },
    {
      id: 'gapfill',
      name: 'Sentence Fill',
      icon: PenTool,
      start: onStartMatchPairs,
      desc: 'Insert target vocabulary in context.',
      iconBg:
        'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-500/20',
      hoverBorder: 'hover:border-purple-400 dark:hover:border-purple-500',
    },
  ];

  return (
    <Card className="w-full border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
      <CardHeader className="p-3.5 sm:p-4 pb-2.5 border-b border-slate-100 dark:border-white/[0.08]">
        <CardTitle className="flex items-center justify-between text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-2xs">
              <Zap className="w-3.5 h-3.5 fill-amber-500/20" />
            </div>
            <span>Practice Arena</span>
          </div>
          <button
            onClick={onStartSpeedQuiz}
            className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider hover:underline flex items-center gap-1 transition-colors"
          >
            <span>Explore All</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-3 space-y-2">
        {games.map((game) => (
          <div
            key={game.id}
            onClick={game.start}
            className={cn(
              'group relative flex items-center justify-between p-3 rounded-xl border border-slate-200/70 dark:border-slate-800/80 bg-white dark:bg-slate-950/40 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
              game.hoverBorder
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105',
                  game.iconBg
                )}
              >
                <game.icon className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                  {game.name}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                  {game.desc}
                </p>
              </div>
            </div>

            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-600 group-hover:text-white transition-all flex items-center justify-center shrink-0 ml-2 shadow-2xs">
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
