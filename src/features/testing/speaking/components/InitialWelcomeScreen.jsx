import React from 'react';
import { motion } from 'framer-motion';
import { Check, Mic2, Volume2 } from 'lucide-react';

const readinessItems = [
  {
    icon: Mic2,
    label: 'Microphone ready',
    detail: 'Allow access when prompted',
    className: 'bg-emerald-500/[0.07] text-emerald-600 dark:text-emerald-400',
  },
  {
    icon: Volume2,
    label: 'Sound on',
    detail: 'Listen for each question',
    className: 'bg-primary/[0.07] text-primary',
  },
];

const PART_INTROS = {
  1: "You'll answer a few questions about yourself and familiar topics.",
  2: "You'll prepare a topic, then speak about it for one to two minutes.",
  3: "You'll discuss broader ideas and explain your opinions in more detail.",
};

const InitialWelcomeScreen = ({ partNumber, title }) => (
  <div className="flex h-full min-h-[280px] items-center justify-center px-0 py-1 sm:min-h-[390px] sm:px-5 sm:py-3 xl:min-h-0 xl:py-1 2xl:py-4">
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="flex w-full max-w-3xl flex-col items-center text-center"
    >
      <div className="relative w-full max-w-[12rem] sm:max-w-[16rem] 2xl:max-w-[21rem]">
        <img
          src="/speaking-assets/examiner-welcome-v1.png"
          alt="AI speaking examiner wearing a headset"
          className="aspect-[3/2] w-full object-cover object-center mix-blend-multiply dark:mix-blend-normal"
          loading="eager"
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-card to-transparent"
          aria-hidden="true"
        />
      </div>

      <h2 className="mt-0.5 text-xl font-black tracking-[-0.035em] text-foreground sm:text-3xl">
        Ready to start Part {partNumber}?
      </h2>
      <p className="mt-1 text-xs font-bold text-rose-500 sm:text-sm">{title}</p>
      <p className="mt-1.5 max-w-xl text-xs leading-5 text-muted-foreground sm:text-sm sm:leading-6">
        {PART_INTROS[partNumber] || 'Answer naturally, listen carefully, and speak clearly.'}
        <br className="hidden sm:block" /> Answer naturally and speak clearly.
      </p>

      <div className="mt-3 grid w-full max-w-lg grid-cols-2 gap-2">
        {readinessItems.map(({ icon: Icon, label, detail, className }) => (
          <div
            key={label}
            className="flex min-w-0 items-center gap-2 rounded-xl border border-border/60 bg-background/65 p-2 text-left sm:gap-3 sm:rounded-2xl sm:p-3"
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9 sm:rounded-xl ${className}`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="flex items-center gap-1 text-[10px] font-extrabold text-foreground sm:gap-1.5 sm:text-xs">
                {label}
                <Check className="h-3 w-3 text-emerald-500" aria-hidden="true" />
              </p>
              <p className="mt-0.5 hidden truncate text-[9px] text-muted-foreground min-[360px]:block sm:text-[10px]">
                {detail}
              </p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  </div>
);

export default InitialWelcomeScreen;
