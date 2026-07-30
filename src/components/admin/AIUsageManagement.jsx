import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Cpu, RefreshCw, CalendarDays } from 'lucide-react';
import { AIApiUsage } from '@/entities';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import AIUsageStatsCards from './ai-usage/AIUsageStatsCards';
import AIUsageCharts from './ai-usage/AIUsageCharts';
import AIUsageTable from './ai-usage/AIUsageTable';

const AIUsageManagement = () => {
  // Pagination State
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

  const fetchUserStats = async ({ isManualRefresh = false } = {}) => {
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
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, sortField, sortDirection]);

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

  const sortedUsers = userStats;
  const maxCalls = Math.max(...userStats.map((u) => u.totalCalls), 1);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-10 pt-12 md:pt-0"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-1">
        <motion.div variants={itemVariants} className="space-y-0.5 min-w-0">
          <h2 className="text-lg sm:text-2xl font-black tracking-tight text-slate-950 dark:text-white flex items-center gap-2.5">
            <div className="p-2 sm:p-2.5 bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400 rounded-xl border border-violet-200/50 dark:border-violet-800/50 shadow-2xs shrink-0">
              <Cpu className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="truncate">AI Usage Analytics</span>
          </h2>
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
            Operational view of AI request delivery, token volume, cache efficiency, and recorded
            provider spend.
          </p>
          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
            {lastUpdatedAt
              ? `Last refreshed ${lastUpdatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'Loading the latest usage records'}
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="flex items-center gap-2 w-full sm:w-auto shrink-0 mt-1 sm:mt-0"
        >
          <Select value={String(dateRange)} onValueChange={(value) => setDateRange(Number(value))}>
            <SelectTrigger
              aria-label="Chart time range"
              className="flex-1 sm:flex-none justify-center h-9 w-full sm:w-[130px] rounded-xl border-slate-200/90 bg-white text-xs font-bold text-slate-700 shadow-2xs dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
            >
              <CalendarDays className="mr-1.5 h-3.5 w-3.5 text-violet-500" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => {
              fetchUserStats({ isManualRefresh: true });
              fetchChartStats();
            }}
            disabled={refreshing}
            variant="outline"
            className="flex-1 sm:flex-none justify-center h-9 px-3.5 font-extrabold text-xs text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-white/10 shadow-2xs rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-violet-500 ${refreshing ? 'animate-spin' : ''}`}
            />
            <span>{refreshing ? 'Refreshing' : 'Refresh'}</span>
          </Button>
        </motion.div>
      </div>

      <AIUsageStatsCards totals={totals} loading={loading} itemVariants={itemVariants} />

      <AIUsageCharts
        dailyStats={dailyStats}
        endpointStats={endpointStats}
        itemVariants={itemVariants}
        dateRange={dateRange}
      />

      <AIUsageTable
        sortedUsers={sortedUsers}
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
        itemVariants={itemVariants}
      />
    </motion.div>
  );
};

export default AIUsageManagement;
