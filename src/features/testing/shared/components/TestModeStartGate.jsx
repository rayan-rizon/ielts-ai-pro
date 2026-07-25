import React from 'react';
import { ArrowLeft, Check, Clock3, GraduationCap, Play, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';

const MODES = [
  {
    id: 'practice',
    label: 'Practice',
    description: 'Use learning aids and work at your own pace.',
    icon: Sparkles,
  },
  {
    id: 'exam',
    label: 'Exam',
    description: 'Strict timing and real-test restrictions.',
    icon: GraduationCap,
  },
];

export default function TestModeStartGate({
  title,
  skill,
  selectedMode,
  onModeChange,
  examEligibility,
  onStart,
  isStarting = false,
  onExit,
}) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-50 dark:bg-[#05060B]">
      <header className="flex min-h-16 items-center justify-between border-b border-slate-200/70 bg-white/90 px-3 py-2 backdrop-blur-xl dark:border-white/10 dark:bg-[#0B0C1A]/95 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onExit}
            className="h-9 w-9 shrink-0 rounded-full"
            aria-label={`Exit ${skill} test`}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-slate-900 dark:text-white">{title}</p>
            <p className="text-xs font-medium text-slate-500">{skill} test setup</p>
          </div>
        </div>
        <Badge variant="outline" className="hidden rounded-full px-3 py-1 sm:inline-flex">
          Not started
        </Badge>
      </header>

      <main className="grid flex-1 place-items-center overflow-y-auto p-4 sm:p-8">
        <section className="w-full max-w-2xl rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xl shadow-slate-900/5 dark:border-white/10 dark:bg-slate-900 sm:p-8">
          <div className="mb-6">
            <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
              Choose your mode
            </p>
            <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              How would you like to take this test?
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              You can choose a different mode for this attempt. Your Profile default will not
              change.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Test mode">
            {MODES.map(({ id, label, description, icon: Icon }) => {
              const disabled = id === 'exam' && !examEligibility.eligible;
              const selected = selectedMode === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={disabled}
                  onClick={() => onModeChange(id)}
                  className={cn(
                    'relative rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/20',
                    selected
                      ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500 dark:bg-indigo-500/10'
                      : 'border-slate-200 hover:border-indigo-300 dark:border-white/10',
                    disabled && 'cursor-not-allowed opacity-45'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
                        selected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 dark:text-white">{label}</span>
                        {selected ? <Check className="h-4 w-4 text-indigo-600" /> : null}
                      </div>
                      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        {description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {!examEligibility.eligible ? (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium leading-5 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
              {examEligibility.reason} Practice Mode has been selected for this attempt; your
              Profile preference is unchanged.
            </p>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Clock3 className="h-4 w-4" />
              The session and timer begin only after Start Test.
            </div>
            <Button
              onClick={() => onStart(selectedMode)}
              disabled={isStarting}
              className="h-11 rounded-xl bg-indigo-600 px-6 font-black text-white hover:bg-indigo-700"
            >
              <Play className="mr-2 h-4 w-4 fill-current" />
              {isStarting ? 'Starting…' : 'Start Test'}
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
