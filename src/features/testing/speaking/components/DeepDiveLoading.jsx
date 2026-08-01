import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

export default function DeepDiveLoading() {
  return (
    <div className="p-12 md:p-16 text-center bg-gradient-to-b from-white to-[#faf9ff] dark:from-[#131315] dark:to-[#131315] rounded-[2.5rem] border-2 border-rose-500/20 shadow-inner relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-rose-500/20 rounded-full blur-[60px] animate-pulse" />
      </div>
      <div className="relative z-10 space-y-4">
        <div className="w-16 h-16 bg-gradient-to-br from-rose-500/20 to-orange-500/20 rounded-2xl mx-auto flex items-center justify-center border border-rose-500/20 shadow-lg">
          <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
        </div>
        <div>
          <h4 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-50">
            Generating Deep Dive Analysis
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium leading-relaxed max-w-sm mx-auto">
            Reviewing every question and response. Your detailed feedback will appear here shortly.
          </p>
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-2">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-rose-500/70">
            <Sparkles className="w-3 h-3" /> Auto-generating analysis
          </span>
        </div>
      </div>
    </div>
  );
}
