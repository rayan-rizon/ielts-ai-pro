import { useCallback, useRef, useState } from 'react';
import MarketingService from '@/features/admin/services/MarketingService';

function isQueueExhausted(offset, queue) {
  if (offset <= 0) return false;
  if (!queue) return true;
  return queue.length === 0;
}

export function useCopilotState(initialOffset = 0) {
  const [state, setState] = useState(null);
  const [error, setError] = useState('');
  const [offset, setOffset] = useState(initialOffset);
  const generation = useRef(0);

  const refresh = useCallback(async () => {
    const request = ++generation.current;
    try {
      const result = await MarketingService.getCopilotState(offset);
      if (request !== generation.current) return;
      if (isQueueExhausted(offset, result.queue)) {
        setOffset(Math.max(0, offset - 20));
        return;
      }
      setState(result);
      setError('');
    } catch (err) {
      if (request === generation.current) {
        setError(err.message || 'Could not refresh Copilot');
      }
    }
  }, [offset]);

  return {
    state,
    error,
    offset,
    setOffset,
    generation,
    refresh,
  };
}

export default useCopilotState;
