import { useState, useEffect, useCallback } from 'react';
import { CalendarDays, RefreshCw } from 'lucide-react';
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
import { MICRO, AdminPageHeader } from './ui/primitives';
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
  const [dateRange, setDateRange] = useState(30);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [sortField, setSortField] = useState('totalCalls');
  const [sortDirection, setSortDirection] = useState('desc');

  const fetchUserStats = useCallback(
    async ({ isManualRefresh = false } = {}) => {
      try {
        if (isManualRefresh) setRefreshing(true);
        else setLoading(true);

        const [paginatedUsers, aggTotals] = await Promise.all([
          AIApiUsage.getUserStatsPaginated({
            page: currentPage,
            pageSize,
            sortField,
            sortDirection,
          }),
          AIApiUsage.getUsageAggregates(),
        ]);

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

        setTotals(aggTotals || {});
        setLastUpdatedAt(new Date());
      } catch (error) {
        console.error('Error fetching user stats:', error);
        toast.error('Failed to load user statistics');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [currentPage, pageSize, sortField, sortDirection]
  );

  const fetchChartStats = useCallback(async () => {
    try {
      const [daily, endpoints] = await Promise.all([
        AIApiUsage.getDailyStats(dateRange).catch(() => []),
        AIApiUsage.getEndpointStats(dateRange).catch(() => []),
      ]);
      setDailyStats(daily || []);
      setEndpointStats(endpoints || []);
    } catch (error) {
      console.error('Error fetching chart stats:', error);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchUserStats();
  }, [fetchUserStats]);

  useEffect(() => {
    fetchChartStats();
  }, [fetchChartStats]);

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
    <div className="space-y-4 pb-10 pt-12 md:pt-0">
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
            fetchUserStats({ isManualRefresh: true });
            fetchChartStats();
          }}
          disabled={refreshing}
          className={cn(
            MICRO,
            'inline-flex items-center gap-1.5 rounded-md border border-stone-300 dark:border-white/15 h-8 px-3 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50'
          )}
        >
          <RefreshCw className={cn('w-3 h-3', refreshing && 'animate-spin')} />
          {refreshing ? 'Refreshing' : 'Refresh'}
        </button>
      </AdminPageHeader>

      <AIUsageStatsCards totals={totals} loading={loading} />

      <AIUsageCharts dailyStats={dailyStats} endpointStats={endpointStats} dateRange={dateRange} />

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
    </div>
  );
};

export default AIUsageManagement;
