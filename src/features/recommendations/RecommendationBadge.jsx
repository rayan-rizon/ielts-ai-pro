import { Sparkles } from 'lucide-react';
import { Pill } from '@/features/dashboard/components/primitives';

export default function RecommendationBadge({ recommendation }) {
  if (!recommendation) return null;

  return (
    <span title={recommendation.reason} aria-label={`Recommended: ${recommendation.reason}`}>
      <Pill tone="accent" className="whitespace-nowrap">
        <Sparkles className="h-2.5 w-2.5" /> Recommended
      </Pill>
    </span>
  );
}
