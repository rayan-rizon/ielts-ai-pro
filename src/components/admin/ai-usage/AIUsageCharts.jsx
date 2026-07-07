import DailyUsageChart from './DailyUsageChart';
import EndpointBreakdownChart from './EndpointBreakdownChart';

const AIUsageCharts = ({ dailyStats, endpointStats, itemVariants }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <DailyUsageChart dailyStats={dailyStats} itemVariants={itemVariants} />
      <EndpointBreakdownChart endpointStats={endpointStats} itemVariants={itemVariants} />
    </div>
  );
};

export default AIUsageCharts;
