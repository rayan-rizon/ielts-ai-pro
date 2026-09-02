import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { cn } from '@/lib/cn';
import { AnalyticsService } from '@/features/admin/services/AnalyticsService';
import { AdminOverviewSections } from './overview/AdminOverviewSections';
import { MICRO, PANEL, AdminPageSkeleton } from './ui/primitives';

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

// Shape-matched skeleton instead of a spinner: the Suspense boundary one
// level up (AdminPanel's tab-switch fallback) already shows PremiumLoading
// while this chunk downloads, so by the time we get here the page shell is
// visible and swapping to a *different* full-screen loader for the data
// fetch is what used to read as a flash. This renders in the page's own
// flow, sized like the real Overview content, and fades in the same way
// the real content will (see `.animate-panel-in` in index.css).
const LoadingState = () => <AdminPageSkeleton kpis={6} panels={2} />;

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
    <div className="animate-panel-in">
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
    </div>
  );
};

export default AdminOverview;
