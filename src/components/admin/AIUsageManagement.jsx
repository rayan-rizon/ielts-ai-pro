import { useLatestRequest } from '@/hooks/admin/useLatestRequest';
import { m } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, CalendarDays, RefreshCw } from 'lucide-react';
import { AIApiUsage } from '@/entities';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/cn';
import { MICRO, AdminPageHeader, STAGGER_CONTAINER, FADE_UP } from './ui/primitives';
import AIUsageStatsCards from './ai-usage/AIUsageStatsCards';
import AIUsageCharts from './ai-usage/AIUsageCharts';
import AIUsageTable from './ai-usage/AIUsageTable';

const RANGES = [
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
];

const AIUsageManagement = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [userStats, setUserStats] = useState([]);
  const [totals, setTotals] = useState({
    totalApiCalls: 0,
    totalCachedCalls: 0,
    totalTokens: 0,
    totalCost: 0,
    uniqueUsers: 0,
  });
  const [dailyStats, setDailyStats] = useState([]);
  const [endpointStats, setEndpointStats] = useState([]);
  const [coachBudget, setCoachBudget] = useState(null);
  const [dateRange, setDateRange] = useState(30);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [sortField, setSortField] = useState('totalCalls');
  const [sortDirection, setSortDirection] = useState('desc');

  const pageGate = useLatestRequest();
  const summaryGate = useLatestRequest();
  const chartGate = useLatestRequest();
  const [chartError, setChartError] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState('');
  const [hasSummary, setHasSummary] = useState(false);

  const fetchUserStats = useCallback(async () => {
    const request = pageGate.start();
    try {
      setLoading(true);
      const paginatedUsers = await AIApiUsage.getUserStatsPaginated({
        page: currentPage,
        pageSize,
        sortField,
        sortDirection,
      });
      if (!pageGate.isCurrent(request)) return;

      const formattedUsers = (paginatedUsers.data || []).map((u) => ({
        user: {
          id: u.user_id,
          full_name: u.full_name,
          email: u.email,
          avatar_url: u.avatar_url,
        },
        totalCalls: u.total_calls,
        completedCalls: u.completed_calls,
        pendingCalls: u.pending_calls,
        failedCalls: u.failed_calls,
        cachedCalls: u.cached_calls,
        totalTokens: u.total_tokens,
        trackedProviderCost: u.tracked_provider_cost,
        unpricedCompletedCalls: u.unpriced_completed_calls,
        hasLifecycleTelemetry: typeof u.completed_calls !== 'undefined',
        endpoints: u.endpoints || {},
        lastActivity: u.last_activity,
      }));

      setUserStats(formattedUsers);
      setTotalItems(paginatedUsers.total || 0);
      setTotalPages(Math.ceil((paginatedUsers.total || 0) / pageSize));

      setLastUpdatedAt(new Date());
    } catch (error) {
      if (!pageGate.isCurrent(request)) return;
      console.error('Error fetching user stats:', error);
      toast.error('Failed to load user statistics');
    } finally {
      if (pageGate.isCurrent(request)) setLoading(false);
    }
  }, [currentPage, pageSize, sortField, sortDirection, pageGate]);

  const fetchSummary = useCallback(async () => {
    const request = summaryGate.start();
    setSummaryLoading(true);
    try {
      const [aggTotals, coachBudgetStatus] = await Promise.all([
        AIApiUsage.getUsageAggregates(),
        AIApiUsage.getCoachBudgetStatus(),
      ]);
      if (!summaryGate.isCurrent(request)) return;
      setTotals(aggTotals || {});
      setCoachBudget(coachBudgetStatus);
      setHasSummary(true);
      setSummaryError('');
    } catch {
      if (summaryGate.isCurrent(request)) {
        setSummaryError(
          'Could not refresh usage totals and budget. Use Refresh to retry; previous values are retained when available.'
        );
        toast.error('Could not refresh usage totals and budget');
      }
    } finally {
      if (summaryGate.isCurrent(request)) setSummaryLoading(false);
    }
  }, [summaryGate]);

  const fetchChartStats = useCallback(async () => {
    const request = chartGate.start();
    try {
      const [daily, endpoints] = await Promise.all([
        AIApiUsage.getDailyStats(dateRange),
        AIApiUsage.getEndpointStats(dateRange),
      ]);
      if (!chartGate.isCurrent(request)) return;
      setDailyStats(daily || []);
      setEndpointStats(endpoints || []);
      setChartError('');
    } catch {
      if (chartGate.isCurrent(request))
        setChartError('Usage charts could not be refreshed. Showing the last available data.');
    }
  }, [dateRange, chartGate]);

  useEffect(() => {
    fetchUserStats();
    return pageGate.invalidate;
  }, [fetchUserStats, pageGate]);
  useEffect(() => {
    fetchSummary();
    return summaryGate.invalidate;
  }, [fetchSummary, summaryGate]);
  useEffect(() => {
    fetchChartStats();
    return chartGate.invalidate;
  }, [fetchChartStats, chartGate]);

  const refreshAll = async () => {
    setRefreshing(true);
    await Promise.all([fetchUserStats(), fetchSummary(), fetchChartStats()]);
    setRefreshing(false);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const maxCalls = Math.max(...userStats.map((u) => u.totalCalls), 1);

  return (
    <m.div
      variants={STAGGER_CONTAINER}
      initial="hidden"
      animate="visible"
      className="space-y-4 pb-10 pt-12 md:pt-0"
    >
      <m.div variants={FADE_UP}>
        <AdminPageHeader
          title="AI Usage"
          description={
            lastUpdatedAt
              ? `Last refreshed ${lastUpdatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'Loading the latest usage records'
          }
          tip="AI delivery, tokens, cache, and provider spend. See Global Settings for live faults."
        >
          <Select value={String(dateRange)} onValueChange={(value) => setDateRange(Number(value))}>
            <SelectTrigger
              aria-label="Chart time range"
              className={cn(
                MICRO,
                'h-8 w-[135px] rounded-md border-stone-300 dark:border-white/15 bg-white dark:bg-[#131315] text-stone-700 dark:text-stone-200'
              )}
            >
              <CalendarDays className="mr-1.5 h-3 w-3 text-stone-500 dark:text-stone-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGES.map((r) => (
                <SelectItem key={r.value} value={String(r.value)}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            onClick={() => {
              refreshAll();
            }}
            disabled={refreshing}
            className={cn(
              MICRO,
              'inline-flex items-center gap-1.5 rounded-md border border-stone-300 dark:border-white/15 h-8 px-3 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/5 transition-all duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-95 disabled:opacity-50'
            )}
          >
            <RefreshCw className={cn('w-3 h-3', refreshing && 'animate-spin')} />
            {refreshing ? 'Refreshing' : 'Refresh'}
          </button>
        </AdminPageHeader>
      </m.div>

      <m.div variants={FADE_UP}>
        {summaryError && (
          <p role="alert" className="mb-2 text-xs text-amber-700 dark:text-amber-300">
            {summaryError}
          </p>
        )}
        <AIUsageStatsCards
          totals={totals}
          loading={summaryLoading || (!hasSummary && Boolean(summaryError))}
        />
      </m.div>

      {coachBudget?.warning ? (
        <m.div
          variants={FADE_UP}
          role="status"
          className="flex items-start gap-2 rounded-xl border border-amber-300/70 bg-amber-50 px-3 py-2.5 text-amber-950 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-xs font-semibold">
            AI Coach has used ${Number(coachBudget.spentUsd || 0).toFixed(2)} of its $
            {Number(coachBudget.budgetUsd || 3).toFixed(2)} daily budget
            {coachBudget.exhausted ? ' and new replies are paused.' : '.'}
          </p>
        </m.div>
      ) : null}

      <m.div variants={FADE_UP}>
        {chartError && (
          <p role="alert" className="text-xs text-amber-700 dark:text-amber-300">
            {chartError}
          </p>
        )}
        <AIUsageCharts
          dailyStats={dailyStats}
          endpointStats={endpointStats}
          dateRange={dateRange}
        />
      </m.div>

      <m.div variants={FADE_UP}>
        <AIUsageTable
          sortedUsers={userStats}
          loading={loading}
          sortField={sortField}
          sortDirection={sortDirection}
          handleSort={handleSort}
          maxCalls={maxCalls}
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
          totalItems={totalItems}
        />
      </m.div>
    </m.div>
  );
};

export default AIUsageManagement;
