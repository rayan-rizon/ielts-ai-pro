import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { cn } from '@/lib/cn';
import { AnalyticsService } from '@/features/admin/services/AnalyticsService';
import { AdminOverviewSections } from './overview/AdminOverviewSections';
import { MICRO, PANEL } from './ui/primitives';
import PremiumLoading from '@/components/ui/PremiumLoading';

const BANGLADESH_UTC_OFFSET_HOURS = 6;

const normalizeHourlyActivity = (data) =>
  (data?.hourly || [])
    .map((entry) => ({
      ...entry,
      hour:
        data?.hourTimezone === 'Asia/Dhaka'
          ? entry.hour
          : (entry.hour + BANGLADESH_UTC_OFFSET_HOURS) % 24,
    }))
    .sort((left, right) => left.hour - right.hour);

// Same PremiumLoading component every other loading state in the admin nav
// path uses now, rather than its own one-off spinner+text — a fresh admin
// nav used to flash through five visually different loaders in sequence
// before this data landed. `fullScreen` (not `false`) matters here too: the
// inline mode centers within the normal document flow, which shifts with
// whatever's stacked above it (the announcement banner, scroll position);
// `fixed` positioning is viewport-anchored and immune to that, which is the
// only way every stage in the sequence lands at the same pixel.
const LoadingState = () => <PremiumLoading />;

const ErrorState = ({ error, onRetry }) => (
  <div className={cn(PANEL, 'p-6 max-w-md')}>
    <p className="text-sm font-extrabold text-stone-900 dark:text-stone-50">
      Could not load the overview
    </p>
    <p className="text-xs text-stone-500 mt-1">{error}</p>
    <button
      onClick={onRetry}
      className={cn(
        MICRO,
        'mt-3 rounded-md border border-stone-300 dark:border-white/15 px-2.5 py-1.5 text-stone-700 dark:text-stone-200'
      )}
    >
      Retry
    </button>
  </div>
);

const AdminOverview = () => {
  const [days, setDays] = useState(7);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const currentRequest = ++requestId.current;
    try {
      setLoading(true);
      setError(null);
      const nextData = await AnalyticsService.getOverview(days);
      if (currentRequest === requestId.current) setData(nextData);
    } catch (loadError) {
      console.error('Error loading admin overview:', loadError);
      if (currentRequest === requestId.current) {
        setError(loadError.message || 'Unable to load overview');
      }
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const { dateLabel, greeting } = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    return {
      dateLabel: now.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
      greeting: hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening',
    };
  }, []);

  const hourly = useMemo(() => normalizeHourlyActivity(data), [data]);
  const maxHourly = useMemo(
    () => hourly.reduce((maximum, entry) => Math.max(maximum, entry.sessions), 0),
    [hourly]
  );
  const peakHour = useMemo(
    () => (maxHourly ? (hourly.find((entry) => entry.sessions === maxHourly)?.hour ?? null) : null),
    [hourly, maxHourly]
  );

  const handleDaysChange = useCallback((nextDays) => {
    setData(null);
    setDays(nextDays);
  }, []);

  if (loading && !data) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={load} />;

  return (
    <AdminOverviewSections
      data={data || {}}
      days={days}
      dateLabel={dateLabel}
      greeting={greeting}
      onDaysChange={handleDaysChange}
      hourly={hourly}
      maxHourly={maxHourly}
      peakHour={peakHour}
    />
  );
};

export default AdminOverview;
