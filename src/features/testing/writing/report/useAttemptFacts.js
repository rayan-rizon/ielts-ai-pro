/** What the results card says about the sitting: its time and the last band. */
import { useWritingTestStore } from '../store/useWritingTestStore';
import { useLastBand } from './useLastBand';

export function useAttemptFacts({ sessionId, markedAt, taskType }) {
  const session = useWritingTestStore((state) => state.session);
  const attempt = session?.id === sessionId ? session : null;
  const previous = useLastBand({
    userId: attempt?.user_id,
    sessionId,
    markedAt,
    taskType,
  });
  return { seconds: attempt?.actual_duration_seconds, previous };
}
