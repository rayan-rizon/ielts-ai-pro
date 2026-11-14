import { useCallback, useEffect, useRef, useState } from 'react';
import { PaymentHistoryService } from '@/features/admin/services/PaymentHistoryService';
export function usePaymentOverview() {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const request = ++generation.current;
    setState((old) => ({ ...old, loading: true, error: '' }));
    try {
      const data = await PaymentHistoryService.overview();
      if (request === generation.current) setState({ data, loading: false, error: '' });
    } catch {
      if (request === generation.current)
        setState((old) => ({
          ...old,
          loading: false,
          error:
            'Subscription overview could not be refreshed. Payment alerts have not been dismissed.',
        }));
    }
  }, []);
  useEffect(() => {
    const requests = generation;
    refresh();
    return () => {
      requests.current++;
    };
  }, [refresh]);
  return { ...state, refresh };
}
