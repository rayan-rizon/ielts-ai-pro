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
        'bg-amber-50 text-amber-600 ring-1 ring-amber-200/70 dark:bg-amber-500/15 dark:text-amber-300',
    },
    {
      id: 'match',
      name: 'Match Pairs',
      icon: Target,
      start: onStartMatchPairs,
      desc: 'Pair high-impact words with definitions.',
      iconBg:
        'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/70 dark:bg-emerald-500/15 dark:text-emerald-300',
    },
    {
      id: 'flashcards',
      name: 'Smart Flashcards',
      icon: Layers,
      start: onStartSpeedQuiz,
      desc: 'Interactive active recall card deck.',
      iconBg:
        'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200/70 dark:bg-indigo-500/15 dark:text-indigo-300',
    },
    {
      id: 'gapfill',
      name: 'Sentence Fill',
      icon: PenTool,
      start: onStartMatchPairs,
      desc: 'Insert target vocabulary in context.',
      iconBg:
        'bg-violet-50 text-violet-600 ring-1 ring-violet-200/70 dark:bg-violet-500/15 dark:text-violet-300',
    },
  ];

  return (
    <Card className="w-full border border-[#e0e4f1] dark:border-white/10 bg-gradient-to-br from-white via-[#faf9ff] to-[#f4f2ff] dark:from-[#10131f] dark:to-[#10131f] shadow-[0_20px_50px_-42px_rgba(48,58,128,0.72)] rounded-[22px] overflow-hidden relative">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#505bdd]/10 blur-xl" />

      <CardHeader className="p-4 pb-3 border-b border-slate-200/80 dark:border-white/10 relative">
        <CardTitle className="flex items-center justify-between text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#efedff] text-[#5862df] dark:bg-indigo-500/20 dark:text-indigo-300 flex items-center justify-center ring-1 ring-[#5862df]/15 dark:ring-indigo-500/30 shadow-xs">
              <Zap className="w-4 h-4" strokeWidth={2.5} />
            </div>
            <span>Practice Arena</span>
          </div>
          <button
            onClick={onStartSpeedQuiz}
            className="text-[11px] font-extrabold text-[#5661e9] dark:text-indigo-300 uppercase tracking-wider hover:underline flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>EXPLORE ALL</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-3.5 space-y-2.5 relative">
        {games.map((game) => (
          <div
            key={game.id}
            onClick={game.start}
            className="group relative flex items-center justify-between p-3 rounded-xl border border-[#e0e4f1] dark:border-white/10 bg-white/80 dark:bg-white/5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-[#6570ee]/40 hover:shadow-md"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs transition-transform duration-200 group-hover:scale-105',
                  game.iconBg
                )}
              >
                <game.icon className="w-4.5 h-4.5" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-xs tracking-tight group-hover:text-[#5661e9] dark:group-hover:text-indigo-300 transition-colors truncate">
                  {game.name}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                  {game.desc}
                </p>
              </div>
            </div>

            <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-white/10 group-hover:bg-[#5661e9] group-hover:text-white transition-all flex items-center justify-center shrink-0 ml-2 shadow-2xs">
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
