import { cn } from '@/lib/cn';
import { evidenceMeta } from '../constants';

export default function GrammarEvidenceBadge({ evidenceClass, observations, compact = false }) {
  const meta = evidenceMeta(evidenceClass);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-bold',
        compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        meta.className
      )}
      title={meta.description}
    >
      {meta.label}
      {Number(observations) > 0 && (
        <span className="font-extrabold">
          · {Number(observations)} {Number(observations) === 1 ? 'answer' : 'answers'}
        </span>
      )}
    </span>
  );
}
