import { Sparkles } from 'lucide-react';
import { Pill } from '@/features/dashboard/components/primitives';
import { cn } from '@/lib/cn';

export default function RecommendationBadge({ recommendation, className }) {
  if (!recommendation) return null;

  return (
    <span
      title={recommendation.reason}
      aria-label={`Recommended: ${recommendation.reason}`}
      className={cn('inline-flex shrink-0 items-center', className)}
    >
      <Pill tone="accent" className="whitespace-nowrap">
        <Sparkles className="h-2.5 w-2.5" /> Recommended
      </Pill>
    </span>
  );
}
