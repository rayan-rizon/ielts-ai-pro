import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Volume2, VolumeX, Clock, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/cn';
import { motion } from 'framer-motion';

// Pure utility — no component state dependency
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const TestHeader = React.memo(
  ({
    currentPartNumber,
    currentPart,
    totalParts,
    currentQuestionIndex,
    timeLeft,
    testTitle,
    isMuted,
    setIsMuted,
    isTestComplete,
    conversationLength,
    onShowExitDialog,
  }) => (
    <header className="sticky top-2 sm:top-4 z-50 mb-4 sm:mb-6 px-2">
      <div className="glass-card-premium p-3 sm:p-4 md:p-5 rounded-3xl sm:rounded-[2rem] border-none shadow-2xl backdrop-blur-xl bg-white/70 dark:bg-zinc-900/70 border border-white/20 dark:border-white/5">
        {/* Top Navigation Row inside Card */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <Button
            variant="ghost"
            onClick={() => {
              if (!isTestComplete && conversationLength > 1) {
                onShowExitDialog();
              } else {
                onShowExitDialog();
              }
            }}
            className="text-muted-foreground hover:text-foreground transition-colors group px-2 h-8"
          >
            <ArrowLeft className="w-4 h-4 sm:mr-2 transition-transform group-hover:-translate-x-1" />
            <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">
              Back to Speaking
            </span>
          </Button>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMuted(!isMuted)}
              className="w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>

            <div className="h-8 px-2 sm:px-3 flex items-center gap-1.5 sm:gap-2 rounded-full bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/20 dark:border-rose-500/10 shadow-sm">
              <Clock
                className={cn(
                  'w-3.5 h-3.5',
                  timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-rose-500'
                )}
              />
              <span
                className={cn(
                  'font-mono font-black text-xs sm:text-sm',
                  timeLeft < 60 ? 'text-red-500' : 'text-rose-600 dark:text-rose-400'
                )}
              >
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
        </div>

        {/* Main Info Area */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4">
          <div className="space-y-1 sm:space-y-1.5 flex-1 w-full min-w-0">
            <div className="flex items-center gap-2 mb-1 sm:mb-1.5">
              <Badge
                variant="outline"
                className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-2 py-0.5"
              >
                Part {currentPartNumber}
              </Badge>
              <div className="w-1 h-1 rounded-full bg-rose-500/40 shrink-0" />
              <span className="text-[9px] sm:text-[10px] whitespace-nowrap font-black text-rose-500/60 uppercase tracking-widest animate-pulse">
                Live Session
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-foreground leading-tight truncate">
              {currentPart?.title}
            </h1>
            <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground font-bold uppercase tracking-wider opacity-60 truncate">
              {testTitle}
            </p>
          </div>

          <div className="flex flex-row md:flex-col items-center justify-between md:items-end gap-2 w-full md:w-auto shrink-0 mt-1 md:mt-0">
            <div className="flex items-center gap-2 text-[9px] sm:text-[10px] font-black text-muted-foreground/80 uppercase tracking-widest">
              <span className="hidden sm:inline">Progress</span>{' '}
              <span className="hidden sm:inline opacity-30">|</span> {currentPartNumber} of{' '}
              {totalParts}
            </div>
            <div className="w-24 sm:w-32 md:w-40 h-2 bg-muted/50 dark:bg-white/5 rounded-full overflow-hidden p-[1px] sm:p-0.5 border border-white/10 shrink-0">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(currentPartNumber / totalParts) * 100}%` }}
                transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                className="h-full bg-gradient-to-r from-rose-500 to-orange-500 rounded-full"
              />
            </div>
            <p className="text-[9px] sm:text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.15em] sm:tracking-[0.2em] flex items-center gap-1.5">
              <Target className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />Q{currentQuestionIndex + 1}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
);

TestHeader.displayName = 'TestHeader';
export default TestHeader;
