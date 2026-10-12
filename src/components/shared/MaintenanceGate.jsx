import { useAuth } from '@/features/auth/context/AuthContext';
import { Outlet, useLocation } from 'react-router-dom';
import useMaintenanceClock from '@/hooks/useMaintenanceClock';
import PremiumLoading from '@/components/ui/PremiumLoading';
import { canBypassMaintenance, isMaintenanceActive } from '@/lib/communications';
import MaintenanceScreen from './MaintenanceScreen';

/**
 * Paths that must stay reachable while the site is down, or an admin who
 * enables maintenance mode from another device locks themselves out.
 */
const ALWAYS_REACHABLE = ['/admin', '/admin-login', '/adminlogin'];

const isEscapeHatch = (pathname) => {
  const path = (pathname || '').toLowerCase();
  return ALWAYS_REACHABLE.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
};

/**
 * Site-wide maintenance gate.
 *
 * This is a root route layout, outside the app shell. The gate used to
 * live inside `Layout`, which only wraps authenticated and auth-form routes —
 * so the landing page, the SEO pages, the blog, the calculators and every
 * other public route stayed fully open while maintenance mode was "on". Those
 * are exactly the pages a maintenance window most needs to cover.
 */
export default function MaintenanceGate({ children }) {
  const { maintenance, settingsLoading, isAdmin, authCheckComplete, adminCheckComplete, user } =
    useAuth();
  const { pathname } = useLocation();
  const now = useMaintenanceClock(maintenance);
  const content = children ?? <Outlet />;

  const active = isMaintenanceActive(maintenance, now);

  if (isEscapeHatch(pathname)) return content;
  // Hold the route while checking fresh settings and bypass eligibility;
  // rendering it first briefly exposes the site during maintenance.
  if (settingsLoading || (active && (!authCheckComplete || (user && !adminCheckComplete))))
    return <PremiumLoading message="Checking site availability..." fullScreen />;
  if (!active) return content;
  if (canBypassMaintenance(maintenance, { isAdmin, email: user?.email })) return content;

  return <MaintenanceScreen config={maintenance} />;
}
