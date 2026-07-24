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

const DEFAULT_TOPIC_KITS = [
  {
    id: 'default-kit-1',
    title: 'IELTS Writing',
    description: 'High-impact words for Task 1 & 2',
    access_tier: 'pro',
    wordCount: 312,
    progressPercent: 72,
    icon: PenTool,
  },
  {
    id: 'default-kit-2',
    title: 'IELTS Speaking',
    description: 'Express ideas fluently and naturally',
    access_tier: 'free',
    wordCount: 258,
    progressPercent: 68,
    icon: MessageSquare,
  },
  {
    id: 'default-kit-3',
    title: 'IELTS Reading',
    description: 'Academic words for reading passages',
    access_tier: 'pro',
    wordCount: 356,
    progressPercent: 64,
    icon: BookOpen,
  },
  {
    id: 'default-kit-4',
    title: 'Academic Word List',
    description: 'Essential academic vocabulary',
    access_tier: 'premium',
    wordCount: 570,
    progressPercent: 58,
    icon: GraduationCap,
  },
];

const WordGroupList = memo(({ curatedLists = [], user, onSelect, onViewAll }) => {
  const displayKits =
    curatedLists.length >= 4
      ? curatedLists.map((list) => ({
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
          rawList: list,
        }))
      : DEFAULT_TOPIC_KITS;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-0.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="w-5.5 h-5.5 rounded-lg bg-indigo-50 text-[#635BFF] dark:bg-indigo-950/60 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
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
          className="text-xs font-black text-[#635BFF] dark:text-indigo-400 gap-1 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl h-8 px-2.5"
          onClick={onViewAll}
        >
          View all kits <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>

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

          return (
            <motion.div
              key={kit.id}
              whileHover={{ y: -2 }}
              onClick={() => onSelect(kit.rawList || kit)}
              className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-sm hover:border-[#635BFF]/50 dark:hover:border-indigo-700 transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between group"
            >
              {locked && (
                <div className="absolute top-2.5 right-2.5 z-10">
                  <div className="bg-slate-900/90 backdrop-blur-md p-1 rounded-lg border border-slate-700 shadow-xs">
                    <Lock className="w-3 h-3 text-amber-400" />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {/* Top Header: Icon & Title */}
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-slate-800 text-[#635BFF] dark:text-indigo-300 border border-indigo-100/80 dark:border-slate-700 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight group-hover:text-[#635BFF] dark:group-hover:text-indigo-400 transition-colors truncate">
                      {kit.title}
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 block">
                      {kit.wordCount} words
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium line-clamp-1 leading-snug">
                  {kit.description}
                </p>
              </div>

              {/* Sleek Cohesive Progress Footer */}
              <div className="pt-2 mt-2 space-y-1">
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#635BFF] transition-all duration-500"
                    style={{ width: `${kit.progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-end">
                  <span className="text-[9px] font-black text-slate-400">
                    {kit.progressPercent}%
                  </span>
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
