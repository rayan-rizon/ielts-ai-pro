import React from 'react';
import { Bot, ChevronDown, ChevronUp, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DeepDiveHeader({ detailedFeedback, isAllExpanded, onToggleExpandAll }) {
  return (
    <div className="mb-5 flex items-center justify-between border-b border-slate-200/80 pb-4 dark:border-white/10">
      <h3 className="flex items-center gap-3 text-lg font-black text-slate-900 dark:text-white md:text-xl">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-500/20 dark:bg-rose-500/10">
          <Bot className="h-5 w-5 text-rose-600 dark:text-rose-400" />
        </div>
        Question Deep Dive
      </h3>
      <div className="flex items-center gap-3">
        {detailedFeedback && (
          <ExpandCollapseButton isAllExpanded={isAllExpanded} onClick={onToggleExpandAll} />
        )}
      </div>
    </div>
  );
}

function ExpandCollapseButton({ isAllExpanded, onClick }) {
  const Icon = isAllExpanded ? ChevronUp : ChevronDown;
  const label = isAllExpanded ? 'Collapse All' : 'Expand All';

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="hidden text-xs font-black uppercase tracking-wider text-rose-600 transition-colors hover:bg-rose-500/10 hover:text-rose-700 dark:text-rose-400 md:flex"
    >
      <Icon className="mr-1.5 h-4 w-4" /> {label}
    </Button>
  );
}

export function DeepDiveErrorState({ onRetry }) {
  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center shadow-sm">
      <p className="mb-4 text-sm font-semibold text-slate-600 dark:text-zinc-300">
        Deep dive analysis could not be generated.
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={onRetry}
        className="rounded-xl border-red-500/30 text-xs font-black uppercase tracking-wider text-red-600 hover:bg-red-500/10"
      >
        <RefreshCw className="mr-2 h-3.5 w-3.5" /> Retry
      </Button>
    </div>
  );
}

export function DeepDiveEmptyPrompt({ onGenerate }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-rose-200/80 bg-gradient-to-br from-white via-rose-50/30 to-white p-6 text-center shadow-md shadow-rose-950/5 dark:border-rose-500/20 dark:from-zinc-950 dark:via-rose-950/20 dark:to-zinc-950">
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-rose-500/10 blur-2xl" />
      <p className="mx-auto mb-4 max-w-lg text-xs font-semibold leading-relaxed text-slate-600 dark:text-zinc-300">
        Generate an optional question-by-question review when you need detailed corrections and
        stronger sample answers.
      </p>
      <Button
        onClick={onGenerate}
        className="h-10 rounded-xl bg-white px-5 text-xs font-black text-rose-700 border border-rose-200 shadow-sm hover:bg-rose-50 hover:scale-105 active:scale-95 transition-all dark:bg-rose-600 dark:text-white dark:border-transparent dark:hover:bg-rose-700"
      >
        <Sparkles className="mr-2 h-4 w-4 text-rose-500 dark:text-white" /> Generate Deep Dive
      </Button>
    </div>
  );
}
