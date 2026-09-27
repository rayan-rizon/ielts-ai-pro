import { Link } from 'react-router-dom';
import { MessageCircleMore } from 'lucide-react';
import { AI_COACH_ENABLED, saveCoachDraft } from '../config';
import { cn } from '@/lib/cn';
import WavingCoachArtwork from './WavingCoachArtwork';

export default function AskAiCoachButton({
  draft,
  sourceReference = null,
  className,
  compact = false,
  showAvatar = false,
}) {
  if (!AI_COACH_ENABLED) return null;
  return (
    <Link
      to="/ai-coach"
      onClick={() => saveCoachDraft({ message: draft, sourceReference })}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#5a63df]/25 bg-[#5a63df]/[0.07] px-3 py-2 text-xs font-bold text-[#4a52c9] transition-colors hover:bg-[#5a63df]/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] dark:text-[#c3c7ff]',
        className
      )}
    >
      {showAvatar ? (
        <span className="ask-ai-coach-avatar h-7 w-7 shrink-0" aria-hidden="true">
          <WavingCoachArtwork className="h-full w-full overflow-visible" />
        </span>
      ) : (
        <MessageCircleMore className="h-4 w-4" />
      )}
      {compact ? 'Ask coach' : 'Ask AI Coach'}
    </Link>
  );
}
