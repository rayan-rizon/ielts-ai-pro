import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Cpu, RefreshCw } from 'lucide-react';
import { AIApiUsage } from '@/entities';
import { toast } from 'sonner';

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
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState('totalCalls');
  const [sortDirection, setSortDirection] = useState('desc');

  const fetchUserStats = async () => {
    try {
      setLoading(true);

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
        cachedCalls: u.cached_calls,
        totalTokens: u.total_tokens,
        cost: u.estimated_cost,
        endpoints: u.endpoints || {},
        lastActivity: u.last_activity,
      }));

      setUserStats(formattedUsers);
      setTotalItems(paginatedUsers.total || 0);
      setTotalPages(Math.ceil((paginatedUsers.total || 0) / pageSize));

      setTotals(aggTotals || {});
    } catch (error) {
      console.error('Error fetching user stats:', error);
      toast.error('Failed to load user statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchChartStats = async () => {
    try {
      const [daily, endpoints] = await Promise.all([
        AIApiUsage.getDailyStats(30).catch(() => []),
        AIApiUsage.getEndpointStats().catch(() => []),
      ]);
      setDailyStats(daily || []);
      setEndpointStats(endpoints || []);
    } catch (error) {
      console.error('Error fetching chart stats:', error);
    }
  };

  useEffect(() => {
    fetchUserStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, sortField, sortDirection]);

  useEffect(() => {
    fetchChartStats();
  }, []);

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
      className="space-y-6 pb-10"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-1">
        <motion.div variants={itemVariants} className="space-y-0.5">
          <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white flex items-center gap-2.5">
            <div className="p-2.5 bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400 rounded-xl border border-violet-200/50 dark:border-violet-800/50 shadow-2xs">
              <Cpu className="w-5 h-5" />
            </div>
            <span>AI Usage Analytics</span>
          </h2>
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
            Monitor real-time AI API consumption, token quotas, cache efficiency, and costs per
            candidate
          </p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Button
            onClick={() => {
              fetchUserStats();
              fetchChartStats();
            }}
            variant="outline"
            className="h-9 px-3.5 font-extrabold text-xs text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-white/10 shadow-2xs rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5 text-violet-500" />
            <span>Refresh Data</span>
          </Button>
        </motion.div>
      </div>

      <AIUsageStatsCards totals={totals} loading={loading} itemVariants={itemVariants} />

      <AIUsageCharts
        dailyStats={dailyStats}
        endpointStats={endpointStats}
        itemVariants={itemVariants}
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
