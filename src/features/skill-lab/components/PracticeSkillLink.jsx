import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { SKILL_LAB_ENABLED, skillLabUrl, existingPracticeUrl } from '../skills';
export default function PracticeSkillLink({ module, skill, sourceId, activityId }) {
  const existingUrl = existingPracticeUrl(module, skill);
  if (module === 'writing' && !existingUrl) return null;
  if (module !== 'writing' && !SKILL_LAB_ENABLED) return null;
  return (
    <Link
      to={existingUrl || skillLabUrl({ module, skill, sourceId, activityId })}
      className="inline-flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border border-[#e4e2f0] bg-white/70 px-2.5 text-xs font-semibold text-slate-700 transition-[transform,background-color,border-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-[#5a63df]/40 hover:bg-[#5a63df]/8 hover:text-[#5a63df] active:scale-[0.97] focus-visible:outline-2 dark:border-white/[0.11] dark:bg-white/[0.03] dark:text-slate-200 dark:hover:border-[#8f97ff]/40 dark:hover:bg-[#8f97ff]/12 dark:hover:text-[#afb5ff]"
    >
      {existingUrl === '/grammar'
        ? 'Open Grammar Lab'
        : existingUrl === '/vocabulary'
          ? 'Open Vocabulary'
          : 'Practise this skill'}
      <ArrowRight className="h-3 w-3" aria-hidden="true" />
    </Link>
  );
}
