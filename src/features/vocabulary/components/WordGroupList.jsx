import React, { memo } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  Lock,
  BookOpen,
  GraduationCap,
  MessageSquare,
  PenTool,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const DEFAULT_TOPIC_KITS = [
  {
    id: 'default-kit-1',
    title: 'IELTS Writing',
    description: 'High-impact words & academic phrases for Task 1 & 2',
    access_tier: 'pro',
    wordCount: 312,
    progressPercent: 72,
    icon: PenTool,
    theme: {
      iconBg:
        'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-500/20',
      progressBar: 'bg-indigo-600 dark:bg-indigo-500',
      badgeBg:
        'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-500/20',
    },
  },
  {
    id: 'default-kit-2',
    title: 'IELTS Speaking',
    description: 'Express complex ideas fluently and naturally in Parts 1-3',
    access_tier: 'free',
    wordCount: 258,
    progressPercent: 68,
    icon: MessageSquare,
    theme: {
      iconBg:
        'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-500/20',
      progressBar: 'bg-rose-600 dark:bg-rose-500',
      badgeBg:
        'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-500/20',
    },
  },
  {
    id: 'default-kit-3',
    title: 'IELTS Reading',
    description: 'Academic vocabulary & collocations for reading passages',
    access_tier: 'pro',
    wordCount: 356,
    progressPercent: 64,
    icon: BookOpen,
    theme: {
      iconBg:
        'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20',
      progressBar: 'bg-emerald-600 dark:bg-emerald-500',
      badgeBg:
        'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-500/20',
    },
  },
  {
    id: 'default-kit-4',
    title: 'Academic Word List',
    description: 'Essential high-frequency vocabulary for Band 7.5+',
    access_tier: 'premium',
    wordCount: 570,
    progressPercent: 58,
    icon: GraduationCap,
    theme: {
      iconBg:
        'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-500/20',
      progressBar: 'bg-blue-600 dark:bg-blue-500',
      badgeBg:
        'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-500/20',
    },
  },
];

const FALLBACK_THEMES = [
  {
    iconBg:
      'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-500/20',
    progressBar: 'bg-indigo-600 dark:bg-indigo-500',
    badgeBg:
      'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-500/20',
  },
  {
    iconBg:
      'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-500/20',
    progressBar: 'bg-rose-600 dark:bg-rose-500',
    badgeBg:
      'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-500/20',
  },
  {
    iconBg:
      'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20',
    progressBar: 'bg-emerald-600 dark:bg-emerald-500',
    badgeBg:
      'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-500/20',
  },
  {
    iconBg:
      'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-500/20',
    progressBar: 'bg-blue-600 dark:bg-blue-500',
    badgeBg:
      'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-500/20',
  },
];

const WordGroupList = memo(({ curatedLists = [], user, onSelect, onViewAll }) => {
  const displayKits =
    curatedLists.length >= 4
      ? curatedLists.map((list, index) => ({
          id: list.id,
          title: list.title,
          description: list.description || 'Curated vocabulary list by IELTS experts.',
          access_tier: list.access_tier || 'free',
          wordCount: JSON.parse(list.content || '[]').length || 200,
          progressPercent: Math.min(
            100,
            Math.max(30, ((JSON.parse(list.content || '[]').length || 10) * 13) % 85)
          ),
          icon: BookOpen,
          theme: FALLBACK_THEMES[index % FALLBACK_THEMES.length],
          rawList: list,
        }))
      : DEFAULT_TOPIC_KITS;

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between px-0.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="w-5.5 h-5.5 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-3.5 h-3.5 fill-white/20" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
              Smart Vocabulary Kits
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Curated word lists to boost your IELTS band score.
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 gap-1 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-xl h-8 px-2.5 transition-colors"
          onClick={onViewAll}
        >
          View all kits <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Grid of Compact, High-Style Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {displayKits.map((kit) => {
          const hasAccess = () => {
            if (kit.access_tier === 'free') return true;
            if (!user) return false;
            const tiers = { free: 0, pro: 1, premium: 2 };
            return tiers[user.subscription_tier || 'free'] >= tiers[kit.access_tier];
          };
          const locked = !hasAccess();
          const Icon = kit.icon || BookOpen;
          const theme = kit.theme || FALLBACK_THEMES[0];

          return (
            <motion.div
              key={kit.id}
              whileHover={{ y: -2 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              onClick={() => onSelect(kit.rawList || kit)}
              className="group relative rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xs hover:shadow-md hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                {/* Header Row: Icon & Badges */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl ${theme.iconBg} flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105`}
                    >
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                        {kit.title}
                      </h4>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block">
                        {kit.wordCount} words
                      </span>
                    </div>
                  </div>

                  {/* Tier / Lock Badge */}
                  {locked ? (
                    <Badge className="bg-slate-900 text-amber-400 border border-slate-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                      <Lock className="w-2.5 h-2.5" />
                      <span className="uppercase">{kit.access_tier}</span>
                    </Badge>
                  ) : kit.access_tier !== 'free' ? (
                    <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase shrink-0">
                      {kit.access_tier}
                    </Badge>
                  ) : null}
                </div>

                {/* Description */}
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed line-clamp-1">
                  {kit.description}
                </p>
              </div>

              {/* Progress Footer */}
              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 mt-2.5">
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Progress
                  </span>
                  <span className="text-slate-900 dark:text-white font-extrabold text-xs">
                    {kit.progressPercent}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${theme.progressBar} transition-all duration-500 ease-out`}
                    style={{ width: `${kit.progressPercent}%` }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
});

WordGroupList.displayName = 'WordGroupList';

export default WordGroupList;
