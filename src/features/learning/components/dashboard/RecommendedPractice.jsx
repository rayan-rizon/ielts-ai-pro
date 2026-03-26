import React from 'react';
import { m } from 'framer-motion';
import { Sparkles, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { GlassCard } from '@/features/learning/components/SharedComponents';
import { cn } from '@/lib/utils';

export default function RecommendedPractice({ learningPath, className }) {
  const navigate = useNavigate();

  return (
    <GlassCard className={cn('p-5 md:p-8 border-t-2 border-t-indigo-500/30', className)}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center shadow-lg shadow-indigo-500/5">
          <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="space-y-0.5">
          <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
            Recommended Practice
          </h2>
          <div className="text-[11px] font-semibold text-muted-foreground">
            Extra practice picked by the AI
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {!(learningPath?.recommended_activities || []).length ? (
          <div className="py-10 text-center space-y-3 bg-slate-50/50 dark:bg-white/[0.02] rounded-3xl border border-dashed border-slate-200 dark:border-white/5">
            <Sparkles className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
            <div className="max-w-[240px] mx-auto space-y-1">
              <h4 className="text-sm font-black dark:text-white">No recommendations yet</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                Complete a few tests and follow your weekly plan — AI recommendations will appear
                here based on your performance.
              </p>
            </div>
          </div>
        ) : (
          (learningPath?.recommended_activities || []).slice(0, 3).map((a, i) => (
            <m.button
              key={i}
              type="button"
              whileHover={{ x: 5 }}
              onClick={() => {
                const explicit = a?.module ? String(a.module) : '';
                const title = String(a?.title || '');
                const t = title.toLowerCase();
                const guessed = t.includes('reading')
                  ? 'reading'
                  : t.includes('listening')
                    ? 'listening'
                    : t.includes('writing')
                      ? 'writing'
                      : t.includes('speaking')
                        ? 'speaking'
                        : '';
                const module = explicit || guessed;
                if (!module) return;
                navigate(createPageUrl(module.charAt(0).toUpperCase() + module.slice(1)));
              }}
              className="w-full text-left bg-slate-50/50 dark:bg-white/[0.03] p-4 rounded-2xl border border-slate-200 dark:border-white/[0.08] hover:border-indigo-500/30 transition-all group"
            >
              <div className="flex justify-between items-start mb-1">
                <h4 className="text-[11px] font-black tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-300 transition-colors">
                  {a.title}
                </h4>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-300 transition-colors shrink-0 mt-0.5" />
              </div>
              <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400 font-medium line-clamp-2">
                {a.description || a.reason}
              </p>
            </m.button>
          ))
        )}
      </div>
    </GlassCard>
  );
}
