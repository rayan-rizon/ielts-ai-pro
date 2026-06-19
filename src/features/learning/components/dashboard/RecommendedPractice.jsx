import React from 'react';
import { Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { GlassCard } from '@/features/learning/components/SharedComponents';
import { cn } from '@/lib/cn';
import {
  EmptyPracticeState,
  PracticeItem,
  RecommendedPracticeLoading,
} from './RecommendedPracticeComponents';

const SKILLS = ['reading', 'listening', 'writing', 'speaking'];

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
  navigate(createPageUrl(module.charAt(0).toUpperCase() + module.slice(1)));
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
        compact
          ? 'p-4 sm:p-5 md:p-6 border-t-2 border-t-slate-300/60 dark:border-t-slate-700/70'
          : 'p-4 sm:p-5 md:p-8 border-t-2 border-t-slate-300/60 dark:border-t-slate-700/70',
        className
      )}
    >
      <div className={cn('flex items-center gap-3', compact ? 'mb-4' : 'mb-6')}>
        <div className="w-10 h-10 rounded-2xl bg-slate-500/10 flex items-center justify-center shadow-lg shadow-slate-500/5">
          <Sparkles className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </div>
        <div className="space-y-0.5">
          <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
            {config.title}
          </h2>
          <div className="text-[11px] font-semibold text-muted-foreground">
            {config.description}
          </div>
        </div>
      </div>

      <div className="space-y-4">
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
    </GlassCard>
  );
}
