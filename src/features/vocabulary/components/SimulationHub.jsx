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
        'bg-amber-100/80 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/80 dark:border-amber-900/40',
      hoverBorder: 'hover:border-amber-300 dark:hover:border-amber-800',
    },
    {
      id: 'match',
      name: 'Match Pairs',
      icon: Target,
      start: onStartMatchPairs,
      desc: 'Pair high-impact words with definitions.',
      iconBg:
        'bg-emerald-100/80 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-900/40',
      hoverBorder: 'hover:border-emerald-300 dark:hover:border-emerald-800',
    },
    {
      id: 'flashcards',
      name: 'Smart Flashcards',
      icon: Layers,
      start: onStartSpeedQuiz,
      desc: 'Interactive active recall card deck.',
      iconBg:
        'bg-indigo-100/80 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-900/40',
      hoverBorder: 'hover:border-indigo-300 dark:hover:border-indigo-800',
    },
    {
      id: 'gapfill',
      name: 'Sentence Fill',
      icon: PenTool,
      start: onStartMatchPairs,
      desc: 'Insert target vocabulary in context.',
      iconBg:
        'bg-purple-100/80 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200/80 dark:border-purple-900/40',
      hoverBorder: 'hover:border-purple-300 dark:hover:border-purple-800',
    },
  ];

  return (
    <Card className="w-full border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm rounded-2xl overflow-hidden">
      <CardHeader className="p-4 pb-2.5 border-b border-slate-100 dark:border-slate-800/60">
        <CardTitle className="flex items-center justify-between text-sm font-black text-slate-900 dark:text-white">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <span>Practice Arena</span>
          </div>
          <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider hover:underline cursor-pointer">
            Explore All
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-2">
        {games.map((game) => (
          <div
            key={game.id}
            onClick={game.start}
            className={cn(
              'group flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/40 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm',
              game.hoverBorder
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-105',
                  game.iconBg
                )}
              >
                <game.icon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 dark:text-white text-xs">
                  {game.name}
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                  {game.desc}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-transform group-hover:translate-x-1" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
