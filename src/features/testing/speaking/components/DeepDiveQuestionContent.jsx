import React from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';

function GrammaticalErrorItem({ err }) {
  return (
    <div className="bg-rose-50/30 dark:bg-rose-950/10 p-3 rounded-lg border border-rose-500/20 flex flex-col gap-1.5">
      <div className="flex items-start gap-2">
        <span className="line-through text-rose-500/70 text-[13px] font-medium decoration-rose-500/50 break-words">
          {err.incorrect}
        </span>
        <ArrowRight className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
        <span className="text-emerald-600 dark:text-emerald-400 text-[13px] font-bold break-words">
          {err.correct}
        </span>
      </div>
      <p className="text-[12px] text-muted-foreground/80 dark:text-zinc-400 italic">
        {err.explanation}
      </p>
    </div>
  );
}

export default function DeepDiveQuestionContent({ item }) {
  return (
    <div className="space-y-4 border-t border-border/50 p-4 pt-2">
      {/* Candidate Answer */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
            Your Response
          </span>
        </div>
        <p className="text-[14px] text-foreground font-medium bg-white dark:bg-zinc-900/80 p-4 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] leading-relaxed">
          {item.candidateAnswer}
        </p>
      </div>

      {/* Topic Drift Warning */}
      {item.topicDrift && item.topicDrift !== 'null' && (
        <div className="space-y-2.5 relative group/drift mt-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
              Topic Drift Detected
            </span>
          </div>
          <div className="bg-amber-50/50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-500/20 dark:border-amber-500/20">
            <p className="text-[13px] text-amber-900 dark:text-amber-100 font-medium leading-relaxed">
              {item.topicDrift}
            </p>
          </div>
        </div>
      )}

      {/* Grammatical Errors */}
      {item.grammaticalErrors && item.grammaticalErrors.length > 0 && (
        <div className="space-y-3 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-600 dark:text-rose-400">
              Grammar & Vocabulary Errors ({item.grammaticalErrors.length})
            </span>
          </div>
          <div className="space-y-2">
            {item.grammaticalErrors.map((err, errIdx) => (
              <GrammaticalErrorItem key={errIdx} err={err} />
            ))}
          </div>
        </div>
      )}

      {/* Sample & Feedback Split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="space-y-2.5 relative group/suggest">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
              Improved sample response
            </span>
          </div>
          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-500/20 dark:border-emerald-500/20 relative group-hover/suggest:border-emerald-500/40 transition-colors">
            <p className="text-[13px] md:text-[14px] text-emerald-950 dark:text-emerald-50 font-semibold leading-relaxed">
              {item.suggestedAnswer}
            </p>
          </div>
        </div>

        <div className="space-y-2.5 relative group/feedback">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-600 dark:text-rose-400">
              Examiner Feedback
            </span>
          </div>
          <div className="bg-rose-50/70 dark:bg-rose-950/30 p-4 rounded-xl border border-rose-200/80 dark:border-rose-900/40 relative group-hover/feedback:border-rose-400 transition-colors">
            <p className="text-[13px] md:text-[14px] text-slate-800 dark:text-zinc-100 font-semibold leading-relaxed">
              {item.feedback}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
