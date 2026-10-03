import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLatestRequest } from './useLatestRequest';
import { PaymentHistoryService } from '@/features/admin/services/PaymentHistoryService';
import { mergePaymentHistory } from '@/components/admin/paymentHistory';

export function usePaymentHistory(status, search) {
  const [manual, setManual] = useState([]);
  const [stripe, setStripe] = useState([]);
  const [manualCursor, setManualCursor] = useState(null);
  const [stripeCursor, setStripeCursor] = useState(null);
  const [manualLoading, setManualLoading] = useState(true);
  const [stripeLoading, setStripeLoading] = useState(true);
  const [manualError, setManualError] = useState('');
  const [stripeError, setStripeError] = useState('');
  const manualGate = useLatestRequest();
  const stripeGate = useLatestRequest();
  const failedManualCursor = useRef(null);
  const failedStripeCursor = useRef();
  const [query, setQuery] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchManual = useCallback(
    async (cursor = null) => {
      const request = manualGate.start();
      setManualLoading(true);
      try {
        const page = await PaymentHistoryService.manualPage({ status, search: query, cursor });
        if (!manualGate.isCurrent(request)) return;
        setManual((old) => (cursor ? [...old, ...page.entries] : page.entries));
        setManualCursor(page.cursor);
        setManualError('');
        failedManualCursor.current = null;
      } catch {
        if (manualGate.isCurrent(request)) {
          failedManualCursor.current = cursor;
          setManualError('Manual payment history could not be refreshed.');
        }
      } finally {
        if (manualGate.isCurrent(request)) setManualLoading(false);
      }
    },
    [status, query, manualGate]
  );

  const fetchStripe = useCallback(
    async (cursor) => {
      const request = stripeGate.start();
      setStripeLoading(true);
      try {
        const page = await PaymentHistoryService.stripePage(cursor);
        if (!stripeGate.isCurrent(request)) return;
        setStripe((old) => (cursor ? [...old, ...(page.payments || [])] : page.payments || []));
        setStripeCursor(page.cursor || null);
        setStripeError('');
        failedStripeCursor.current = undefined;
      } catch {
        if (stripeGate.isCurrent(request)) {
          failedStripeCursor.current = cursor;
          setStripeError('Stripe history is unavailable. Manual payments remain available.');
        }
      } finally {
        if (stripeGate.isCurrent(request)) setStripeLoading(false);
      }
    },
    [stripeGate]
  );

  useEffect(() => {
    fetchManual();
    return manualGate.invalidate;
  }, [fetchManual, manualGate]);
  useEffect(() => {
    fetchStripe();
    return stripeGate.invalidate;
  }, [fetchStripe, stripeGate]);

  const requests = useMemo(() => {
    const unique = new Map(mergePaymentHistory(manual, stripe).map((row) => [row.id, row]));
    return [...unique.values()].filter((row) => status === 'all' || row.status === status);
  }, [manual, stripe, status]);
  const moreStripe =
    ['all', 'approved'].includes(status) &&
    stripeCursor &&
    Object.values(stripeCursor).some(Boolean);
  const hasMore = Boolean(manualCursor || moreStripe);
  const loading = manualLoading && !manual.length && !stripe.length;
  const loadMore = async () => {
    if (manualLoading || stripeLoading) return;
    await Promise.all([
      manualCursor ? fetchManual(manualCursor) : Promise.resolve(),
      moreStripe ? fetchStripe(stripeCursor) : Promise.resolve(),
    ]);
  };
  return {
    requests,
    loading,
    busy: manualLoading || stripeLoading,
    hasMore,
    loadMore,
    refreshManual: () => fetchManual(),
    retryManual: () => fetchManual(failedManualCursor.current),
    retryStripe: () => fetchStripe(failedStripeCursor.current),
    refreshStripe: () => fetchStripe(),
    stripeLoading,
    manualError,
    stripeError,
  };
}
