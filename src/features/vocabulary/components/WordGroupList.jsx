import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const WordGroupList = memo(({ curatedLists, user, onSelect, onViewAll }) => {
  if (!curatedLists || curatedLists.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <div className="space-y-0.5">
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            Premium Word Kits
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            Master high-scoring vocabulary curated by IELTS specialists.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-[11px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 gap-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl"
          onClick={onViewAll}
        >
          Expand Library <ArrowRight className="w-3 h-3" />
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pt-2 pb-4 no-scrollbar -mx-2 px-2">
        {curatedLists.map((list) => {
          const hasAccess = () => {
            if (list.access_tier === 'free') return true;
            if (!user) return false;
            const tiers = { free: 0, pro: 1, premium: 2 };
            return tiers[user.subscription_tier || 'free'] >= tiers[list.access_tier];
          };
          const locked = !hasAccess();

          return (
            <motion.div
              key={list.id}
              whileHover={{ y: -4 }}
              onClick={() => onSelect(list)}
              className="flex-shrink-0 w-64 p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/[0.12] shadow-sm hover:shadow-xl dark:hover:shadow-indigo-500/20 hover:border-indigo-500/30 transition-all cursor-pointer relative overflow-hidden group"
            >
              {locked && (
                <div className="absolute top-3 right-3 z-10">
                  <div className="bg-slate-900/50 backdrop-blur-md p-1.5 rounded-xl border border-white/10">
                    <Lock className="w-3 h-3 text-white" />
                  </div>
                </div>
              )}
              <div className="space-y-3">
                <Badge
                  className={cn(
                    'px-2 py-0.5 rounded-lg border-none text-[10px] font-black uppercase tracking-widest',
                    list.access_tier === 'free'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                      : list.access_tier === 'pro'
                        ? 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                        : 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400'
                  )}
                >
                  {list.access_tier}
                </Badge>
                <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight line-clamp-2 min-h-[2.5rem] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {list.title}
                </h4>
                <div className="flex items-center justify-between text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pt-2 border-t border-slate-100 dark:border-white/5">
                  <span>{JSON.parse(list.content || '[]').length} Words</span>
                  <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
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
