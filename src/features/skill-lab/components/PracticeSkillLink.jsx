import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { SKILL_LAB_ENABLED, skillLabUrl, existingPracticeUrl } from '../skills';
export default function PracticeSkillLink({ module, skill, sourceId, activityId }) {
  if (!SKILL_LAB_ENABLED) return null;
  return (
    <Link
      to={
        existingPracticeUrl(module, skill) || skillLabUrl({ module, skill, sourceId, activityId })
      }
      className="inline-flex items-center gap-1 rounded-lg border border-[#5a63df]/20 px-2.5 py-1.5 text-xs font-semibold text-[#5a63df] hover:bg-[#5a63df]/5 focus-visible:outline-2 dark:text-[#a9afff]"
    >
      Practise this skill
      <ArrowRight className="h-3 w-3" aria-hidden="true" />
    </Link>
  );
}
