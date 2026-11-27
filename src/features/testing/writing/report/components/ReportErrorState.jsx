import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowUpRight, Lock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { PANEL, Pill, WELL } from '@/features/dashboard/components/primitives.jsx';
import { useWritingTestStore } from '@/features/testing/writing/store/useWritingTestStore';
import { reportErrorView } from './reportErrorView';

const ICONS = { refresh: RefreshCw, lock: Lock, alert: AlertTriangle };
const CHIP = {
  accent:
    'border-[#d2d7f8] bg-[#efedff] text-[#5a63df] dark:border-indigo-400/25 dark:bg-indigo-400/10 dark:text-indigo-300',
  warn: 'border-[rgb(var(--signal-warn)/0.3)] bg-[rgb(var(--signal-warn)/0.1)] text-[rgb(var(--signal-warn))]',
  fault:
    'border-[rgb(var(--signal-fault)/0.3)] bg-[rgb(var(--signal-fault)/0.1)] text-[rgb(var(--signal-fault))]',
};

function Actions({ view, onRetry, onUpgrade }) {
  return (
    <div className="mt-5 flex w-full flex-col gap-2 sm:gap-2.5">
      {view.quota && (
        <Button
          onClick={onUpgrade}
          className="flex h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#5a63df] px-4 text-xs font-bold text-white transition-all hover:bg-[#4a52c9] active:scale-[0.98]"
        >
          <span>Upgrade to Pro</span>
          <ArrowUpRight className="h-4 w-4" strokeWidth={2.25} />
        </Button>
      )}
      <Button
        onClick={onRetry}
        variant={view.quota ? 'ghost' : 'default'}
        className={cn(
          'flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all active:scale-[0.98]',
          view.quota
            ? 'h-9 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            : 'h-11 bg-[#5a63df] text-white hover:bg-[#4a52c9]'
        )}
      >
        <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.25} />
        <span>{view.action}</span>
      </Button>
    </div>
  );
}

/** Shown while a review is pending or after it failed; the same screen as before. */
export function ReportErrorState({ feedbackError, handleGetFeedback }) {
  const setShowUpgradeDialog = useWritingTestStore((s) => s.setShowUpgradeDialog);
  const view = reportErrorView(feedbackError);
  const Icon = ICONS[view.icon];
  const iconTone = view.icon === 'refresh' ? 'accent' : view.tone;

  return (
    <motion.div
      key="error"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex min-h-[320px] flex-1 items-center justify-center p-4 sm:p-6"
    >
      <div className={cn(PANEL, 'w-full max-w-[460px] p-5 sm:p-6')}>
        <div className="flex flex-col items-start">
          <div
            className={cn(
              'mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border',
              CHIP[iconTone]
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={2.25} />
          </div>
          <div className="mb-2">
            <Pill tone={view.tone}>{view.pill}</Pill>
          </div>
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            {view.title}
          </h2>
          <div className={cn(WELL, 'mt-3 w-full rounded-lg px-3 py-3')}>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
              {view.explanation}
            </p>
          </div>
          <Actions
            view={view}
            onRetry={handleGetFeedback}
            onUpgrade={() => setShowUpgradeDialog(true)}
          />
        </div>
      </div>
    </motion.div>
  );
}
