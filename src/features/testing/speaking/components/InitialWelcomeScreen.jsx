import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Check, Loader2, Mic2, Volume2 } from 'lucide-react';

import useSpeakingDeviceChecks from '../hooks/useSpeakingDeviceChecks';

const DEVICE_COPY = {
  microphone: {
    idle: ['Test microphone', 'Tap, then speak for two seconds'],
    testing: ['Listening…', 'Say a short sentence now'],
    ready: ['Microphone works', 'Your voice was detected clearly'],
    quiet: ['Try microphone again', 'No clear voice was detected'],
    error: ['Microphone unavailable', 'Allow access, then try again'],
  },
  speaker: {
    idle: ['Test speakers', 'Tap to play a short test tone'],
    testing: ['Playing test sound…', 'Listen for a soft two-note tone'],
    ready: ['Test sound played', 'Your speaker check is complete'],
    error: ['Speaker test unavailable', 'Check browser sound permissions'],
  },
};

const PART_INTROS = {
  1: "You'll answer a few questions about yourself and familiar topics.",
  2: "You'll prepare a topic, then speak about it for one to two minutes.",
  3: "You'll discuss broader ideas and explain your opinions in more detail.",
};

function ReadinessCard({ device, icon: Icon, status, onClick }) {
  const [label, detail] = DEVICE_COPY[device][status] || DEVICE_COPY[device].idle;
  const isTesting = status === 'testing';
  const isReady = status === 'ready';
  const needsAttention = status === 'quiet' || status === 'error';
  const toneClass = isReady
    ? 'border-emerald-500/20 bg-emerald-500/[0.055]'
    : needsAttention
      ? 'border-amber-500/25 bg-amber-500/[0.055]'
      : 'border-border/60 bg-background/65 hover:border-primary/25 hover:bg-background';

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={isTesting}
      whileTap={isTesting ? undefined : { scale: 0.985 }}
      className={`flex min-w-0 items-center gap-2 rounded-xl border p-2 text-left transition-colors sm:gap-3 sm:rounded-2xl sm:p-3 ${toneClass}`}
      aria-label={label}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9 sm:rounded-xl ${
          device === 'microphone'
            ? 'bg-emerald-500/[0.08] text-emerald-600 dark:text-emerald-400'
            : 'bg-blue-500/[0.08] text-blue-600 dark:text-blue-400'
        }`}
      >
        {isTesting ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Icon className="h-4 w-4" aria-hidden="true" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1 text-[10px] font-extrabold text-foreground sm:gap-1.5 sm:text-xs">
          {label}
          {isReady ? (
            <Check className="h-3 w-3 text-emerald-500" aria-hidden="true" />
          ) : needsAttention ? (
            <AlertCircle className="h-3 w-3 text-amber-500" aria-hidden="true" />
          ) : null}
        </span>
        <span className="mt-0.5 hidden truncate text-[9px] text-muted-foreground min-[360px]:block sm:text-[10px]">
          {detail}
        </span>
      </span>
    </motion.button>
  );
}

const InitialWelcomeScreen = ({ partNumber, title }) => {
  const { microphoneStatus, speakerStatus, testMicrophone, testSpeaker } =
    useSpeakingDeviceChecks();

  return (
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
          <ReadinessCard
            device="microphone"
            icon={Mic2}
            status={microphoneStatus}
            onClick={testMicrophone}
          />
          <ReadinessCard
            device="speaker"
            icon={Volume2}
            status={speakerStatus}
            onClick={testSpeaker}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default InitialWelcomeScreen;
