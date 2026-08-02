import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

export default function DeepDiveLoading() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-rose-500/20 bg-white p-6 text-center shadow-sm dark:bg-[#131315] md:p-8">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-rose-500/20 rounded-full blur-[60px] animate-pulse" />
      </div>
      <div className="relative z-10 space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-rose-500/20 bg-gradient-to-br from-rose-500/20 to-red-500/20 shadow-md">
          <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
        </div>
        <div>
          <h4 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            Generating Deep Dive Analysis
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium leading-relaxed max-w-sm mx-auto">
            Reviewing every question and response. Your detailed feedback will appear here shortly.
          </p>
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-2">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-rose-500/70">
            <Sparkles className="w-3 h-3" /> Auto-generating analysis
          </span>
        </div>
      </div>
    </div>
  );
}
