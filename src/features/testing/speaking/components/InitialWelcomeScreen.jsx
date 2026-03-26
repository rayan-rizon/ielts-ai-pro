import React from 'react';
import { motion } from 'framer-motion';
import { Headphones, Mic, Sparkles, Wifi, Volume2 } from 'lucide-react';

const InitialWelcomeScreen = ({ partNumber, title }) => {
  return (
    <div className="h-full min-h-[300px] flex flex-col items-center justify-center p-4 text-center space-y-6">
      {/* Animated Icon Container */}
      <div className="relative w-40 h-40 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="w-20 h-20 bg-gradient-to-br from-rose-100 to-orange-100 dark:from-rose-900/20 dark:to-orange-900/20 rounded-full flex items-center justify-center relative z-10"
        >
          <Headphones className="w-10 h-10 text-rose-500" />
        </motion.div>

        {/* Orbiting Elements */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-2 z-0"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-7 h-7 bg-white dark:bg-zinc-800 rounded-full shadow-lg flex items-center justify-center border border-rose-100 dark:border-rose-900/50">
            <Mic className="w-3.5 h-3.5 text-orange-500" />
          </div>
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-7 h-7 bg-white dark:bg-zinc-800 rounded-full shadow-lg flex items-center justify-center border border-rose-100 dark:border-rose-900/50">
            <Wifi className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-7 h-7 bg-white dark:bg-zinc-800 rounded-full shadow-lg flex items-center justify-center border border-rose-100 dark:border-rose-900/50">
            <Volume2 className="w-3.5 h-3.5 text-orange-500" />
          </div>
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-7 h-7 bg-white dark:bg-zinc-800 rounded-full shadow-lg flex items-center justify-center border border-rose-100 dark:border-rose-900/50">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
          </div>
        </motion.div>

        {/* Pulsing Rings */}
        <div className="absolute inset-4 rounded-full border border-rose-500/10 scale-125 animate-[ping_3s_ease-in-out_infinite]" />
        <div className="absolute inset-8 rounded-full border border-orange-500/10 scale-110 animate-[pulse_4s_ease-in-out_infinite]" />
      </div>

      {/* Text Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4 max-w-md"
      >
        <div className="space-y-1">
          <h2 className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-rose-600 to-orange-600">
            IELTS Speaking Test
          </h2>
          <p className="text-lg font-bold text-foreground/80">
            Part {partNumber}: {title}
          </p>
        </div>

        <p className="text-muted-foreground leading-relaxed text-sm max-w-sm mx-auto">
          Your AI Examiner is ready. Find a quiet space and ensure your microphone is working.
        </p>

        {/* Tips Grid */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-muted/30 p-2 rounded-lg border border-border/50 text-xs font-semibold text-muted-foreground flex items-center justify-center gap-2 text-center">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Speak Naturally
          </div>
          <div className="bg-muted/30 p-2 rounded-lg border border-border/50 text-xs font-semibold text-muted-foreground flex items-center justify-center gap-2 text-center">
            <Volume2 className="w-3 h-3 text-blue-500" />
            Clear Audio
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default InitialWelcomeScreen;
