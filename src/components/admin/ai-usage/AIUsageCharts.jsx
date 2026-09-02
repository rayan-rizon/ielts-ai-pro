import DailyUsageChart from './DailyUsageChart';
import EndpointBreakdownChart from './EndpointBreakdownChart';

const AIUsageCharts = ({ dailyStats, endpointStats, dateRange }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
    <DailyUsageChart dailyStats={dailyStats} dateRange={dateRange} />
    <EndpointBreakdownChart endpointStats={endpointStats} dateRange={dateRange} />
  </div>
);

export default AIUsageCharts;
