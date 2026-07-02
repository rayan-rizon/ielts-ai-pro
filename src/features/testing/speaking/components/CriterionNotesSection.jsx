import React from 'react';
import { Bot } from 'lucide-react';

export default function CriterionNotesSection({ conciseFeedback, criterionCards }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Examiner's Feedback */}
      {conciseFeedback && (
        <div className="lg:col-span-12 p-5 md:p-6 bg-zinc-950 border border-white/10 text-zinc-100 rounded-[1.75rem] shadow-xl shadow-zinc-900/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-24 w-48 bg-rose-500/20 blur-[70px]" />
          <div className="relative z-10 grid gap-3 md:grid-cols-[180px_1fr] md:items-start">
            <h4 className="text-[10px] font-black uppercase tracking-[0.28em] text-rose-400 flex items-center gap-2">
              <Bot className="w-4 h-4" />
              Summary
            </h4>
            <p className="text-sm md:text-base font-semibold leading-relaxed text-zinc-100">
              {conciseFeedback}
            </p>
          </div>
        </div>
      )}

      {/* Criterion Notes Cards */}
      {criterionCards.length > 0 && (
        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
          {criterionCards.map((criterion) => (
            <div
              key={criterion.title}
              className={`p-4 ${criterion.bgColor} ${criterion.borderColor} border rounded-2xl flex flex-col h-full`}
            >
              <div className="flex items-center gap-3 mb-2.5">
                <div
                  className={`w-9 h-9 rounded-xl bg-gradient-to-br ${criterion.color} flex items-center justify-center text-white text-[10px] font-black shadow-lg shadow-rose-500/10`}
                >
                  {criterion.icon}
                </div>
                <h5 className="text-[10px] font-black text-foreground dark:text-zinc-100 uppercase tracking-widest leading-tight">
                  {criterion.title}
                </h5>
              </div>
              <p className="text-[13px] text-muted-foreground dark:text-zinc-300 leading-relaxed font-medium">
                {criterion.analysis}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
