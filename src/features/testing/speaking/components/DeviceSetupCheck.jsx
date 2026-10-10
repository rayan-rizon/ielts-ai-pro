import React from 'react';
import { AlertCircle, Check, Mic2, Volume2 } from 'lucide-react';

import { cn } from '@/lib/cn';
import { MUTED, PANEL } from '@/features/dashboard/components/primitives';

import useSpeakingDeviceChecks from '../hooks/useSpeakingDeviceChecks';

// One status line per state. `tone` maps to the signal colours, so colour only
// ever means "works", "check this" or "blocked".
const DEVICES = {
  microphone: {
    name: 'Microphone',
    icon: Mic2,
    action: 'Test microphone',
    states: {
      idle: { text: 'Not tested yet. Speak for two seconds after you press Test.' },
      testing: { text: 'Listening…', hint: 'Say a short sentence now.' },
      ready: { text: 'Microphone works', hint: 'Your voice came through clearly.', tone: 'ok' },
      quiet: {
        text: 'No voice heard',
        hint: 'Move closer or speak a little louder, then test again.',
        tone: 'warn',
      },
      error: {
        text: 'Microphone blocked',
        hint: 'Allow it from the icon at the left of the address bar.',
        tone: 'fault',
      },
    },
  },
  speaker: {
    name: 'Speakers',
    icon: Volume2,
    action: 'Test speakers',
    states: {
      idle: { text: 'Not tested yet. You will hear a short two-note tone.' },
      testing: { text: 'Playing test sound…' },
      ready: {
        text: 'Test sound played',
        hint: 'Turn the volume up if it was hard to hear.',
        tone: 'ok',
      },
      error: {
        text: 'Sound could not play',
        hint: 'Check your volume and browser sound settings.',
        tone: 'fault',
      },
    },
  },
};

const TONE_TEXT = {
  ok: 'text-[rgb(var(--signal-ok))]',
  warn: 'text-[rgb(var(--signal-warn))]',
  fault: 'text-[rgb(var(--signal-fault))]',
};

const TONE_CHIP = {
  ok: 'bg-[rgb(var(--signal-ok)/0.12)] text-[rgb(var(--signal-ok))]',
  warn: 'bg-[rgb(var(--signal-warn)/0.12)] text-[rgb(var(--signal-warn))]',
  fault: 'bg-[rgb(var(--signal-fault)/0.12)] text-[rgb(var(--signal-fault))]',
};

/** Five bars that rise and fall while the microphone test is listening. */
function ListeningBars() {
  return (
    <span className="flex h-4 items-end gap-[3px]" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((bar) => (
        <span
          key={bar}
          className="w-[3px] origin-bottom rounded-full bg-[#5a63df] motion-safe:animate-[speaking-check-level_0.9s_ease-in-out_infinite] dark:bg-[#8f97ff]"
          style={{ height: `${[45, 80, 100, 70, 50][bar]}%`, animationDelay: `${bar * 0.12}s` }}
        />
      ))}
    </span>
  );
}

function DeviceRow({ device, status, onTest }) {
  const config = DEVICES[device];
  const state = config.states[status] || config.states.idle;
  const Icon = config.icon;
  const isTesting = status === 'testing';
  const hasRun = status !== 'idle' && !isTesting;

  return (
    <div className="flex min-w-0 items-center gap-3 px-3.5 py-3">
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          state.tone
            ? TONE_CHIP[state.tone]
            : 'bg-[#5a63df]/10 text-[#5a63df] dark:bg-[#8f97ff]/15 dark:text-[#afb5ff]'
        )}
      >
        {state.tone === 'ok' ? (
          <Check className="h-4 w-4" aria-hidden="true" />
        ) : state.tone ? (
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Icon className="h-4 w-4" aria-hidden="true" />
        )}
      </span>

      <div className="min-w-0 flex-1" aria-live="polite">
        <p className="text-[13px] font-extrabold text-slate-900 dark:text-slate-50">
          {config.name}
        </p>
        <p
          className={cn(
            'mt-0.5 flex items-center gap-2 text-xs leading-snug',
            state.tone ? TONE_TEXT[state.tone] : 'text-slate-600 dark:text-slate-300',
            state.tone && 'font-semibold'
          )}
        >
          {isTesting && device === 'microphone' && <ListeningBars />}
          <span>{state.text}</span>
        </p>
        {state.hint && <p className={cn(MUTED, 'mt-0.5 text-[11px] leading-snug')}>{state.hint}</p>}
      </div>

      <button
        type="button"
        onClick={onTest}
        disabled={isTesting}
        aria-label={config.action}
        className="h-8 shrink-0 cursor-pointer rounded-md border border-[#e4e2f0] bg-white px-3 text-xs font-bold text-slate-800 transition-colors hover:border-[#5a63df]/40 hover:text-[#5a63df] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-1 disabled:cursor-default disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:text-[#afb5ff]"
      >
        {isTesting ? 'Testing' : hasRun ? 'Test again' : 'Test'}
      </button>
    </div>
  );
}

export default function DeviceSetupCheck() {
  const { microphoneStatus, speakerStatus, testMicrophone, testSpeaker } =
    useSpeakingDeviceChecks();

  return (
    <section aria-label="Check your microphone and speakers" className="w-full max-w-2xl text-left">
      <p className="mb-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
        Check your setup before you begin
      </p>
      <div
        className={cn(
          PANEL,
          'grid divide-y divide-[#e4e2f0] sm:grid-cols-2 sm:divide-x sm:divide-y-0 dark:divide-white/[0.07]'
        )}
      >
        <DeviceRow device="microphone" status={microphoneStatus} onTest={testMicrophone} />
        <DeviceRow device="speaker" status={speakerStatus} onTest={testSpeaker} />
      </div>
    </section>
  );
}
