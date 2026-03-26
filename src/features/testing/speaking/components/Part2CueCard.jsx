import React from 'react';
import { FileText, Timer, PlayCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const Part2CueCard = React.memo(({ cueCardTopic, prepTimeLeft, onStartSpeaking }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="w-full max-w-2xl px-2"
  >
    {/* Cue Card */}
    <div className="relative group mx-auto max-w-md mt-1">
      <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-orange-600/10 blur-3xl opacity-30 group-hover:opacity-60 transition-opacity" />

      <div className="relative bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-rose-500/10 dark:border-rose-500/5 rounded-[1.5rem] p-4 md:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-500 hover:shadow-[0_30px_60px_rgba(255,100,100,0.15)] group-hover:border-rose-500/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/20 transform -rotate-3 group-hover:rotate-0 transition-transform duration-500">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-black text-rose-600 dark:text-rose-500 uppercase tracking-widest text-[8px]">
                Official Task Card
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
                <p className="text-[8px] text-muted-foreground font-black uppercase tracking-[0.2em]">
                  Long Turn Evaluation
                </p>
              </div>
            </div>
          </div>
          <Badge className="bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-500/20 px-2 py-0.5 font-black text-[8px] tracking-[0.1em] uppercase rounded-full">
            IELTS
          </Badge>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <div className="w-1 h-2.5 bg-rose-500 rounded-full" />
              <p className="text-foreground/80 text-[9px] font-black uppercase tracking-widest">
                Discussion Points
              </p>
            </div>
            <ul className="grid grid-cols-1 gap-2">
              {cueCardTopic.bulletPoints.map((point, idx) => (
                <motion.li
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * (idx + 1) }}
                  className="flex items-center gap-3 p-3 bg-muted/30 dark:bg-black/20 rounded-xl border border-border/50 group/item hover:bg-white dark:hover:bg-muted/10 transition-all duration-300 hover:scale-[1.01] hover:shadow-md"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 ring-2 ring-rose-500/10 flex-shrink-0 group-hover/item:scale-125 transition-transform" />
                  <span className="text-foreground/90 font-bold text-xs tracking-tight leading-snug">
                    {point}
                  </span>
                </motion.li>
              ))}
            </ul>
          </div>

          <div className="pt-3 mt-1 border-t border-dashed border-rose-500/10">
            <div className="bg-rose-500/5 dark:bg-rose-500/10 p-3 rounded-lg border border-rose-500/10">
              <p className="text-rose-600/80 dark:text-rose-400/80 text-[10px] font-bold italic leading-tight text-center">
                "You should explain why this topic is significant to you."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Preparation Timer Area */}
    <div className="mt-4 mb-2 flex flex-col items-center space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="absolute inset-0 bg-rose-500 blur-lg opacity-10 animate-pulse" />
          <div className="relative w-12 h-12 glass-card-premium rounded-full flex items-center justify-center border-rose-500/20">
            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
              <circle
                className="text-muted/10 stroke-muted/20"
                strokeWidth="4"
                stroke="currentColor"
                fill="transparent"
                r="20"
                cx="24"
                cy="24"
              />
              <motion.circle
                className="text-rose-500"
                strokeWidth="4"
                stroke="currentColor"
                fill="transparent"
                r="20"
                cx="24"
                cy="24"
                strokeLinecap="round"
                initial={{ strokeDasharray: '125.6', strokeDashoffset: 0 }}
                animate={{ strokeDashoffset: 125.6 * (1 - prepTimeLeft / 60) }}
                transition={{ duration: 1, ease: 'linear' }}
              />
            </svg>
            <div className="text-center">
              <span className="block text-sm font-black text-foreground leading-none">
                {prepTimeLeft}
              </span>
              <span className="block text-[6px] font-black uppercase tracking-widest text-muted-foreground">
                Sec
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <Timer className="w-3 h-3 text-rose-500" />
            <span className="text-[8px] font-black uppercase tracking-widest">Planning</span>
          </div>
          <p className="text-[8px] text-muted-foreground font-medium leading-tight">
            Structure your thoughts.
          </p>
        </div>
      </div>

      <Button
        onClick={onStartSpeaking}
        className="bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 h-8 px-4 text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg hover-lift border-b border-zinc-700 dark:border-zinc-300 transition-colors"
      >
        <PlayCircle className="w-3 h-3 mr-1.5" />
        Start Now
      </Button>
    </div>
  </motion.div>
));

Part2CueCard.displayName = 'Part2CueCard';
export default Part2CueCard;
