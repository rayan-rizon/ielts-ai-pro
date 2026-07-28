import React from 'react';
import { Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { buildActivityUrl } from '@/features/learning/utils/activityRoutes';
import { GlassCard } from '@/features/learning/components/SharedComponents';
import { cn } from '@/lib/cn';
import {
  EmptyPracticeState,
  PracticeItem,
  RecommendedPracticeLoading,
} from './RecommendedPracticeComponents';

const SKILLS = ['reading', 'listening', 'writing', 'speaking', 'grammar', 'vocabulary'];

function getModuleName(a) {
  if (a?.module) return String(a.module);
  const title = String(a?.title || '').toLowerCase();
  for (const skill of SKILLS) {
    if (title.includes(skill)) return skill;
  }
  return '';
}

const HEADER_CONTENT = {
  true: {
    title: 'Quick Practice Picks',
    description: 'Short extras if you have time',
    limit: 2,
  },
  false: {
    title: 'Optional Extra Practice',
    description: 'Use this if you have extra time today',
    limit: 3,
  },
};

const handleItemClick = (a, navigate) => {
  const module = getModuleName(a);
  if (!module) return;
  navigate(
    buildActivityUrl({
      ...a,
      module,
      routing: a?.routing || { route: module, mode: 'practice' },
    })
  );
};

export default function RecommendedPractice({
  learningPath,
  className,
  loading = false,
  compact = false,
}) {
  const navigate = useNavigate();
  const config = HEADER_CONTENT[String(!!compact)];
  const items = (learningPath?.recommended_activities || []).slice(0, config.limit);

  if (loading) {
    return <RecommendedPracticeLoading compact={compact} className={className} />;
  }

  return (
    <GlassCard
      className={cn(
        compact ? 'relative p-5' : 'relative p-5 sm:p-6 md:p-8',
        'bg-gradient-to-br from-cyan-50/80 via-indigo-50/40 to-white/90 border border-cyan-100/90 shadow-lg shadow-cyan-500/10 hover:shadow-xl hover:shadow-cyan-500/15 rounded-3xl dark:from-slate-900 dark:via-cyan-950/30 dark:to-slate-900 dark:border-cyan-500/20 transition-all duration-300 overflow-hidden',
        className
      )}
    >
      {/* Decorative Aura / Glows */}
      <div className="absolute -top-24 -left-20 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none dark:bg-cyan-500/5" />
      <div className="absolute -bottom-24 -right-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none dark:bg-blue-500/5" />

      <div className="relative z-10">
        <div className={cn('flex items-center gap-3', compact ? 'mb-4' : 'mb-6')}>
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 dark:bg-cyan-400/10 flex items-center justify-center shadow-lg shadow-cyan-500/5">
            <Sparkles className="w-5 h-5 text-cyan-700 dark:text-cyan-300" />
          </div>
          <div className="space-y-0.5">
            <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
              {config.title}
            </h2>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {config.description}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {!items.length ? (
            <EmptyPracticeState compact={compact} />
          ) : (
            items.map((a, i) => (
              <PracticeItem
                key={i}
                item={a}
                compact={compact}
                onClick={(item) => handleItemClick(item, navigate)}
              />
            ))
          )}
        </div>
      </div>
    </GlassCard>
  );
}
