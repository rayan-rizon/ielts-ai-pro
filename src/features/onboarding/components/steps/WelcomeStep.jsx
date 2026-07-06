import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Sparkles, Target, Timer } from 'lucide-react';

export default function WelcomeStep() {
  return (
    <div className="text-center space-y-5 py-4" data-oid="8mzhnvn">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20,
          delay: 0.1,
        }}
        className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto"
        data-oid="oc5mlwr"
      >
        <div
          className="absolute inset-0 bg-gradient-to-br from-primary/60 to-violet-500/60 rounded-[1.5rem] blur-2xl animate-pulse dark:from-primary/80 dark:to-violet-600/80"
          data-oid="k-q27.q"
        />

        <div
          className="relative w-full h-full bg-gradient-to-br from-primary via-indigo-600 to-violet-600 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-primary/40 border-2 border-white/30 dark:border-white/40"
          data-oid="r51jk_j"
        >
          <Sparkles
            className="w-10 h-10 sm:w-16 sm:h-16 text-white drop-shadow-lg"
            data-oid="9q:5zib"
          />

          {/* Decorative floating elements */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-3 -right-3 w-6 h-6 sm:w-8 sm:h-8 bg-white/20 dark:bg-white/30 backdrop-blur-md rounded-lg border-2 border-white/30 dark:border-white/40 flex items-center justify-center shadow-lg"
            data-oid="bp_z7sa"
          >
            <Brain className="w-3 h-3 sm:w-4 sm:h-4 text-white" data-oid="27bww:v" />
          </motion.div>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute -bottom-2 -left-4 w-8 h-8 sm:w-10 sm:h-10 bg-white/20 dark:bg-white/30 backdrop-blur-md rounded-xl border-2 border-white/30 dark:border-white/40 flex items-center justify-center shadow-lg"
            data-oid="b.yzdcq"
          >
            <Target className="w-4 h-4 sm:w-5 sm:h-5 text-white" data-oid="opf5c:4" />
          </motion.div>
        </div>
      </motion.div>

      <div className="space-y-3 px-2 sm:px-6" data-oid="h2.gsll">
        <p
          className="text-base sm:text-lg font-medium text-foreground dark:text-white leading-relaxed balance"
          data-oid="q8tqi6f"
        >
          Get a{' '}
          <span
            className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-600 font-black dark:from-primary dark:to-violet-400"
            data-oid="a090:_9"
          >
            personalized AI study plan
          </span>{' '}
          tailored to your schedule and weaknesses.
        </p>

        <div className="flex flex-col items-center gap-2 pt-1" data-oid="hyt2jhz">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/20 dark:bg-primary/30 rounded-full border-2 border-primary/40 dark:border-primary/50 text-[9px] sm:text-[10px] font-black text-primary dark:text-white shadow-md tracking-wider uppercase"
            data-oid="fldw6rv"
          >
            <Timer
              className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary dark:text-white"
              data-oid="hpyfne."
            />
            <span data-oid="f1xiza5">{'Prep time: < 2 mins'}</span>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <div className="flex -space-x-2" data-oid="ymbj:z8">
              {[1, 2, 3, 4].map((i) => (
                <img
                  key={i}
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`}
                  alt="User"
                  className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-background dark:border-slate-800 ring-2 ring-primary/10 dark:ring-primary/20 shadow-lg"
                  data-oid="08swkcd"
                />
              ))}
              <div
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-background dark:border-slate-800 bg-secondary dark:bg-slate-700 flex items-center justify-center text-[8px] sm:text-[10px] font-black text-muted-foreground dark:text-white ring-2 ring-primary/10 dark:ring-primary/20"
                data-oid="3-u0.8d"
              >
                +15k
              </div>
            </div>
            <p
              className="text-[9px] sm:text-[10px] uppercase tracking-widest font-black text-muted-foreground/80 dark:text-slate-300"
              data-oid="i8cl:4n"
            >
              Joined by 15k+ serious learners
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
