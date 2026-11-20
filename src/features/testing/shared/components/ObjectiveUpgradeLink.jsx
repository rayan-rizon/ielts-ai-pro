import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

export default function ObjectiveUpgradeLink({ test, compact = false }) {
  const plan = test.access_tier === 'premium' ? 'Premium' : 'Pro';

  return (
    <Link
      to={`/pricing?plan=${plan.toLowerCase()}`}
      className={cn(
        'flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[#5a63df]/25 px-2 text-xs font-bold text-[#4f57cf] hover:bg-[#5a63df]/8 dark:text-[#b4b9ff]',
        compact ? 'h-8' : 'h-9 w-full'
      )}
    >
      <Lock className="h-3.5 w-3.5" />
      {compact ? plan : `Unlock with ${plan}`}
    </Link>
  );
}
