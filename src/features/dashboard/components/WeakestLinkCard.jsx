import React from 'react';
import { Target, ArrowRight, Activity, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
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
  const cardContainerClass =
    'relative rounded-[22px] border border-[#e0e4f1] dark:border-white/10 bg-gradient-to-br from-white via-[#faf9ff] to-[#f4f2ff] dark:from-[#10131f] dark:to-[#10131f] shadow-[0_20px_50px_-42px_rgba(48,58,128,0.72)] transition-all duration-300 overflow-hidden group h-full flex flex-col';

  if (!weakestSkill) {
    return (
      <Card className={cardContainerClass}>
        <CardContent className="p-5 flex-1 flex flex-col justify-center items-center text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#efedff] text-[#5862df] ring-1 ring-[#5862df]/15 dark:bg-indigo-500/20 dark:text-indigo-300 mb-3 shadow-xs">
            <Target className="w-5.5 h-5.5" strokeWidth={2.2} />
          </div>
          <h3 className="text-sm font-black text-slate-950 dark:text-white mb-1 tracking-tight">
            Targeted Practice
          </h3>
          <p className="text-xs font-semibold text-slate-400 max-w-[200px] leading-relaxed">
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
    <Card className={cardContainerClass}>
      <CardContent className="p-5 flex-1 flex flex-col relative z-10 justify-between">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1 min-w-0">
              <span className="text-[9.5px] font-black text-[#5661e9] dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3 h-3" />
                Focus Area
              </span>
              <h3 className="text-base font-black text-slate-950 dark:text-white leading-tight truncate">
                {skillName}
              </h3>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#efedff] text-[#5862df] ring-1 ring-[#5862df]/15 dark:bg-indigo-500/20 dark:text-indigo-300 shrink-0 shadow-xs">
              <Target className="w-4.5 h-4.5" strokeWidth={2.2} />
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Current Mastery
              </span>
              <span className="font-black text-[#5661e9] dark:text-indigo-300">
                {masteryPercentage}%
              </span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-[#5661e9] transition-all duration-500"
                style={{ width: `${Math.max(masteryPercentage, 4)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10.5px] font-semibold text-slate-400">
              <span>{practice_count || 0} practice sessions</span>
              <span className="uppercase text-[9px] font-black text-[#5661e9] bg-[#efedff] px-2 py-0.5 rounded-full">
                {module || 'General'}
              </span>
            </div>
          </div>

          {/* AI Focus Recommendation banner */}
          <div className="rounded-xl border border-indigo-100/80 bg-white/90 dark:bg-slate-900/60 p-2.5 flex items-start gap-2 text-left shadow-2xs">
            <Zap className="w-3.5 h-3.5 text-[#5661e9] shrink-0 mt-0.5" />
            <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 leading-snug">
              Targeted drills recommended for {skillName.toLowerCase()} to boost band score.
            </p>
          </div>
        </div>

        <div className="pt-3">
          <Button
            asChild
            className="w-full h-10 bg-[#5661e9] hover:bg-[#4852d4] text-white border-0 font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all hover:scale-[1.01]"
          >
            <Link
              to={createPageUrl(
                module ? module.charAt(0).toUpperCase() + module.slice(1) : 'Reading'
              )}
            >
              <span>Train Skill Now</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

WeakestLinkCard.displayName = 'WeakestLinkCard';

export default WeakestLinkCard;
