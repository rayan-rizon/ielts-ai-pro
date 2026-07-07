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
      className="space-y-8 pb-10"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <motion.div variants={itemVariants} className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2 bg-violet-500/10 rounded-lg text-violet-500 shadow-sm border border-violet-500/20">
              <Cpu className="w-6 h-6" />
            </div>
            AI Usage Analytics
          </h2>
          <p className="text-muted-foreground text-lg ml-1">
            Monitor AI API consumption and costs per user
          </p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Button
            onClick={() => {
              fetchUserStats();
              fetchChartStats();
            }}
            variant="outline"
            className="h-10 gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
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
