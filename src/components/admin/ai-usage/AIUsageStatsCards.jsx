import { Kpi } from '../ui/primitives';

const AIUsageStatsCards = ({ totals, loading }) => {
  const completedCalls = totals.completedCalls || 0;
  const totalRequests = totals.totalRequests || 0;
  const cacheRate = completedCalls > 0 ? (totals.totalCachedCalls / completedCalls) * 100 : 0;
  const coverageRate =
    completedCalls > 0 ? (totals.pricedCompletedCalls / completedCalls) * 100 : 0;
  const hasCostTelemetry = totals.costTelemetryAvailable === true;

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-stone-200/80 dark:border-white/[0.07] bg-white dark:bg-[#131315] p-4 h-[86px] animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="animate-panel-in grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
      <Kpi
        label="Requests"
        value={totalRequests.toLocaleString()}
        sub={`${completedCalls.toLocaleString()} delivered`}
        tip="All AI calls recorded in the selected window."
      />
      <Kpi
        label="Provider cost"
        value={hasCostTelemetry ? `$${Number(totals.trackedProviderCost || 0).toFixed(2)}` : '—'}
        sub={
          !hasCostTelemetry
            ? 'telemetry unavailable'
            : totals.unpricedCompletedCalls > 0
              ? `${totals.unpricedCompletedCalls.toLocaleString()} unpriced`
              : 'full coverage'
        }
        tip="Reported provider cost. Unpriced calls are excluded."
      />
      <Kpi
        label="Tokens"
        value={
          totals.totalTokens >= 1000000
            ? `${(totals.totalTokens / 1000000).toFixed(1)}M`
            : totals.totalTokens >= 1000
              ? `${(totals.totalTokens / 1000).toFixed(1)}K`
              : (totals.totalTokens || 0).toLocaleString()
        }
        sub="input + output"
        tip="Tokens processed across delivered calls."
      />
      <Kpi
        label="Cache hits"
        value={(totals.totalCachedCalls || 0).toLocaleString()}
        sub={`${cacheRate.toFixed(0)}% of delivered`}
        tip="Requests served from cache. Higher is better."
      />
      <Kpi
        label="Active users"
        value={(totals.uniqueUsers || 0).toLocaleString()}
        sub={`${(totals.totalUsers || 0).toLocaleString()} registered`}
        tip="Users who made at least one AI call in this window."
      />
      <Kpi
        label={
          !hasCostTelemetry
            ? 'Cost telemetry'
            : totals.pendingCalls > 0
              ? 'Awaiting finalisation'
              : 'Request health'
        }
        value={
          !hasCostTelemetry ? '—' : totals.pendingCalls > 0 ? totals.pendingCalls : completedCalls
        }
        sub={
          !hasCostTelemetry
            ? 'migration required'
            : totals.pendingCalls > 0
              ? `${totals.failedCalls || 0} failed`
              : `${coverageRate.toFixed(0)}% cost coverage`
        }
        tip="Calls reserved but not yet finalised. Check Platform Health if non-zero."
      />
    </div>
  );
};

export default AIUsageStatsCards;
