import { StrictMode } from 'react';
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  usage: {
    getUserStatsPaginated: vi.fn(),
    getUsageAggregates: vi.fn(),
    getCoachBudgetStatus: vi.fn(),
    getDailyStats: vi.fn(),
    getEndpointStats: vi.fn(),
  },
  history: { manualPage: vi.fn(), stripePage: vi.fn() },
}));
vi.mock('@/entities', () => ({ AIApiUsage: mocks.usage }));
vi.mock('@/features/admin/services/PaymentHistoryService', () => ({
  PaymentHistoryService: mocks.history,
}));
vi.mock('@/components/admin/ai-usage/AIUsageStatsCards', () => ({
  default: ({ loading }) => (
    <div data-testid="summary">{loading ? 'Loading summary' : 'Summary ready'}</div>
  ),
}));
vi.mock('@/components/admin/ai-usage/AIUsageCharts', () => ({
  default: ({ dailyStats }) => <div data-testid="charts">{JSON.stringify(dailyStats)}</div>,
}));
vi.mock('@/components/admin/ai-usage/AIUsageTable', () => ({
  default: ({ sortedUsers, setCurrentPage, handleSort }) => (
    <div>
      <div data-testid="rows">{JSON.stringify(sortedUsers)}</div>
      <button onClick={() => setCurrentPage(2)}>Next page</button>
      <button onClick={() => handleSort('cost')}>Sort cost</button>
    </div>
  ),
}));
vi.mock('@/components/admin/ui/primitives', () => ({
  MICRO: '',
  STAGGER_CONTAINER: {},
  FADE_UP: {},
  AdminPageHeader: ({ children, title }) => (
    <div>
      {title}
      {children}
    </div>
  ),
}));
import AIUsageManagement from '@/components/admin/AIUsageManagement';
import { useLatestRequest } from '@/hooks/admin/useLatestRequest';
import { usePaymentHistory } from '@/hooks/admin/usePaymentHistory';
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
};
describe('admin request lifecycle', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.usage.getUserStatsPaginated.mockResolvedValue({ data: [], total: 50 });
    mocks.usage.getUsageAggregates.mockResolvedValue({});
    mocks.usage.getCoachBudgetStatus.mockResolvedValue(null);
    mocks.usage.getDailyStats.mockResolvedValue([]);
    mocks.usage.getEndpointStats.mockResolvedValue([]);
    mocks.history.manualPage.mockResolvedValue({ entries: [], cursor: null });
    mocks.history.stripePage.mockResolvedValue({ payments: [], cursor: null });
  });
  it('does not refetch totals, budget or charts on pagination/sort', async () => {
    render(<AIUsageManagement />);
    await waitFor(() => expect(mocks.usage.getCoachBudgetStatus).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByText('Next page'));
    await waitFor(() => expect(mocks.usage.getUserStatsPaginated).toHaveBeenCalledTimes(2));
    fireEvent.click(screen.getByText('Sort cost'));
    await waitFor(() => expect(mocks.usage.getUserStatsPaginated).toHaveBeenCalledTimes(3));
    ['getUsageAggregates', 'getCoachBudgetStatus', 'getDailyStats', 'getEndpointStats'].forEach(
      (key) => expect(mocks.usage[key]).toHaveBeenCalledTimes(1)
    );
    fireEvent.click(screen.getByText('Refresh'));
    await waitFor(() => expect(mocks.usage.getUsageAggregates).toHaveBeenCalledTimes(2));
  });
  it('ignores a slow superseded table page', async () => {
    const old = deferred();
    mocks.usage.getUserStatsPaginated.mockReturnValueOnce(old.promise).mockResolvedValue({
      data: [{ user_id: 'latest', full_name: 'Latest', total_calls: 2 }],
      total: 50,
    });
    render(<AIUsageManagement />);
    fireEvent.click(screen.getByText('Next page'));
    await waitFor(() => expect(screen.getByTestId('rows')).toHaveTextContent('Latest'));
    await act(async () => old.resolve({ data: [{ full_name: 'Old result' }], total: 50 }));
    expect(screen.getByTestId('rows')).not.toHaveTextContent('Old result');
  });

  it('keeps summary loading independent of table pagination', async () => {
    const page = deferred();
    mocks.usage.getUserStatsPaginated
      .mockResolvedValueOnce({ data: [], total: 50 })
      .mockReturnValue(page.promise);
    render(<AIUsageManagement />);
    await screen.findByText('Summary ready');
    fireEvent.click(screen.getByText('Next page'));
    expect(screen.getByTestId('summary')).toHaveTextContent('Summary ready');
    await act(async () => page.resolve({ data: [], total: 50 }));
  });

  it('shows unavailable initial totals as an error rather than false zero values', async () => {
    mocks.usage.getUsageAggregates.mockRejectedValue(new Error('offline'));
    render(<AIUsageManagement />);
    await screen.findByRole('alert');
    expect(screen.getByTestId('summary')).toHaveTextContent('Loading summary');
    expect(screen.queryByText('Summary ready')).not.toBeInTheDocument();
  });
  it('retains the latest chart data when a refresh fails', async () => {
    mocks.usage.getDailyStats
      .mockResolvedValueOnce([{ date: 'existing' }])
      .mockRejectedValue(new Error('offline'));
    render(<AIUsageManagement />);
    await waitFor(() => expect(screen.getByTestId('charts')).toHaveTextContent('existing'));
    fireEvent.click(screen.getByText('Refresh'));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('could not be refreshed')
    );
    expect(screen.getByTestId('charts')).toHaveTextContent('existing');
  });
  it('keeps the lifecycle gate valid through StrictMode and rejects old/unmounted generations', () => {
    const { result, unmount } = renderHook(() => useLatestRequest(), { wrapper: StrictMode });
    const first = result.current.start();
    expect(result.current.isCurrent(first)).toBe(true);
    const second = result.current.start();
    expect(result.current.isCurrent(first)).toBe(false);
    expect(result.current.isCurrent(second)).toBe(true);
    const gate = result.current;
    unmount();
    expect(gate.isCurrent(second)).toBe(false);
  });
  it('does not refetch Stripe on manual status changes and retains manual history on Stripe failure', async () => {
    mocks.history.manualPage.mockResolvedValue({
      entries: [{ id: 'manual', status: 'pending' }],
      cursor: null,
    });
    mocks.history.stripePage.mockRejectedValue(new Error('provider offline'));
    const { result, rerender } = renderHook(({ status }) => usePaymentHistory(status, ''), {
      initialProps: { status: 'all' },
    });
    await waitFor(() => expect(result.current.stripeError).toBeTruthy());
    expect(result.current.requests[0].id).toBe('manual');
    rerender({ status: 'pending' });
    await waitFor(() => expect(mocks.history.manualPage).toHaveBeenCalledTimes(2));
    expect(mocks.history.stripePage).toHaveBeenCalledTimes(1);
  });
  it('appends older payments, preserves cursor on failure, and deduplicates transaction records', async () => {
    const cursor = { date: '2026-10-01', id: 'manual-1' };
    mocks.history.manualPage
      .mockResolvedValueOnce({
        entries: [{ id: 'manual-1', payment_method: 'stripe', transaction_id: 'cs_one' }],
        cursor,
      })
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue({
        entries: [{ id: 'manual-2', transaction_id: 'trx_two' }],
        cursor: null,
      });
    mocks.history.stripePage.mockResolvedValue({
      payments: [{ id: 'stripe-one', transaction_id: 'cs_one' }],
      cursor: null,
    });
    const { result } = renderHook(() => usePaymentHistory('all', ''));
    await waitFor(() => expect(result.current.busy).toBe(false));
    expect(result.current.requests).toHaveLength(1);
    await act(() => result.current.loadMore());
    expect(result.current.hasMore).toBe(true);
    expect(result.current.manualError).toBeTruthy();
    await act(() => result.current.loadMore());
    expect(result.current.requests).toHaveLength(2);
    expect(result.current.hasMore).toBe(false);
  });

  it('renders manual payments while Stripe is still loading', async () => {
    const provider = deferred();
    mocks.history.manualPage.mockResolvedValue({
      entries: [{ id: 'manual', status: 'pending' }],
      cursor: null,
    });
    mocks.history.stripePage.mockReturnValue(provider.promise);
    const { result, unmount } = renderHook(() => usePaymentHistory('all', ''));
    await waitFor(() => expect(result.current.requests).toHaveLength(1));
    expect(result.current.loading).toBe(false);
    expect(result.current.stripeLoading).toBe(true);
    unmount();
    await act(async () => provider.resolve({ payments: [], cursor: null }));
  });

  it('retries a failed Stripe page without discarding earlier payments', async () => {
    const cursor = { checkout: 'cs_previous', invoice: null, institution: null };
    mocks.history.stripePage
      .mockResolvedValueOnce({
        payments: [{ id: 'stripe-first', transaction_id: 'cs_first' }],
        cursor,
      })
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue({
        payments: [{ id: 'stripe-older', transaction_id: 'cs_older' }],
        cursor: null,
      });
    const { result } = renderHook(() => usePaymentHistory('all', ''));
    await waitFor(() => expect(result.current.busy).toBe(false));
    await act(() => result.current.loadMore());
    expect(result.current.stripeError).toBeTruthy();
    await act(() => result.current.retryStripe());
    expect(mocks.history.stripePage).toHaveBeenLastCalledWith(cursor);
    expect(result.current.requests).toHaveLength(2);
  });
});
