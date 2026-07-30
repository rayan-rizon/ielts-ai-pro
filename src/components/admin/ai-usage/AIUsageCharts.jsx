import DailyUsageChart from './DailyUsageChart';
import EndpointBreakdownChart from './EndpointBreakdownChart';

const AIUsageCharts = ({ dailyStats, endpointStats, itemVariants, dateRange }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <DailyUsageChart dailyStats={dailyStats} itemVariants={itemVariants} dateRange={dateRange} />
      <EndpointBreakdownChart
        endpointStats={endpointStats}
        itemVariants={itemVariants}
        dateRange={dateRange}
      />
    </div>
  );
};

export default AIUsageCharts;
