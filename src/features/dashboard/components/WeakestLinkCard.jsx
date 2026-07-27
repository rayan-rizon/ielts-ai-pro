import React from 'react';
import { motion as m } from 'framer-motion';
import { Target, ArrowRight, Activity } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { createPageUrl } from '@/utils';

const formatSkillName = (code) => {
  if (!code) return 'General Practice';

  const map = {
    TFNG: 'True / False / Not Given',
    YNNG: 'Yes / No / Not Given',
    MCQ: 'Multiple Choice Questions',
    MATCHING_HEADINGS: 'Matching Headings',
    SUMMARY_COMPLETION: 'Summary Completion',
    MATCHING_PARAGRAPH_INF: 'Matching Paragraph Info',
    SENTENCE_COMPLETION: 'Sentence Completion',
    MULTIPLE_CHOICE: 'Multiple Choice Questions',
    'Task 1': 'Writing Task 1',
    'Task 2': 'Writing Task 2',
    Fluency: 'Fluency and Coherence',
    Lexical: 'Lexical Resource',
    Grammar: 'Grammatical Range',
    Pronunciation: 'Pronunciation',
  };

  if (map[code]) return map[code];

  return code
    .toString()
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

const WeakestLinkCard = React.memo(({ weakestSkill }) => {
  if (!weakestSkill) {
    // Empty state if no skill tracking data yet
    return (
      <Card
        className={cn(
          'relative rounded-2xl transition-all duration-300 overflow-hidden group h-full flex flex-col',
          'bg-white dark:bg-slate-900',
          'border border-slate-200 dark:border-slate-800',
          'shadow-sm'
        )}
      >
        <CardContent className="p-6 flex-1 flex flex-col justify-center items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
            <Target className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Targeted Practice
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[200px]">
            Complete more tests to unlock precision targeting for weak skills.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { skill_code, module, mastery_probability, practice_count } = weakestSkill;
  const masteryPercentage = Math.round((mastery_probability || 0) * 100);
  const skillName = formatSkillName(skill_code);

  return (
    <Card
      className={cn(
        'relative rounded-2xl transition-all duration-300 overflow-hidden group h-full flex flex-col isolate transform-gpu',
        'bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl',
        'border border-rose-200/80 dark:border-rose-500/25',
        'shadow-[0_10px_30px_-10px_rgba(244,63,94,0.1)]',
        'hover:shadow-[0_15px_35px_-10px_rgba(244,63,94,0.16)] hover:border-rose-300 dark:hover:border-rose-400/40 transition-all duration-300'
      )}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/15 dark:bg-rose-500/10 rounded-full blur-[80px] -mr-10 -mt-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-rose-400/10 dark:bg-rose-400/5 rounded-full blur-[60px] -ml-10 -mb-10 pointer-events-none" />

      <CardContent className="p-6 flex-1 flex flex-col relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-rose-500/80 dark:text-rose-400/80 uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="w-3 h-3" />
              Focus Area
            </span>
            <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
              {skillName}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center shrink-0 border border-rose-200/50 dark:border-rose-500/30">
            <Target className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
        </div>

        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 capitalize px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              {module || 'General'}
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {practice_count || 0} attempts
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-white/[0.03] rounded-2xl p-4 border border-slate-100 dark:border-white/10">
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Recent Accuracy
              </span>
              <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                {masteryPercentage}%
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-2 overflow-hidden">
              <m.div
                initial={{ width: 0 }}
                animate={{ width: `${masteryPercentage}%` }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="bg-rose-500 dark:bg-rose-500 h-full rounded-full shadow-[0_0_12px_rgba(244,63,94,0.4)]"
              />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Button
            asChild
            className={cn(
              'w-full rounded-xl h-11 font-extrabold transition-all duration-300 group/btn relative overflow-hidden',
              'bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600 text-white shadow-[0_10px_25px_-6px_rgba(244,63,94,0.4)] hover:shadow-[0_14px_30px_-6px_rgba(244,63,94,0.55)]',
              'hover:scale-[1.02] active:scale-[0.98] border-0'
            )}
          >
            <Link
              to={createPageUrl(
                module === 'reading'
                  ? 'Reading'
                  : module === 'listening'
                    ? 'Listening'
                    : module === 'writing'
                      ? 'Writing'
                      : module === 'speaking'
                        ? 'Speaking'
                        : 'Dashboard'
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_2s_infinite]" />
              <span className="font-bold flex items-center justify-center w-full relative z-10">
                Practice Required
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
              </span>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

WeakestLinkCard.displayName = 'WeakestLinkCard';

export default WeakestLinkCard;
