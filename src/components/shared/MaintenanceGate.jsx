import { useAuth } from '@/features/auth/context/AuthContext';
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
 * This deliberately wraps the *router*, not the app shell. The gate used to
 * live inside `Layout`, which only wraps authenticated and auth-form routes —
 * so the landing page, the SEO pages, the blog, the calculators and every
 * other public route stayed fully open while maintenance mode was "on". Those
 * are exactly the pages a maintenance window most needs to cover.
 */
export default function MaintenanceGate({ children }) {
  const { maintenance, settingsLoading, isAdmin, adminCheckComplete, user } = useAuth();

  const active = isMaintenanceActive(maintenance);

  // Never gate on a value we have not read yet, and never gate before we know
  // whether this person is an admin — otherwise every admin gets the
  // maintenance screen flashed at them on each cold load.
  if (settingsLoading || !active) return children;
  if (typeof window !== 'undefined' && isEscapeHatch(window.location.pathname)) return children;
  if (user && !adminCheckComplete) return children;
  if (canBypassMaintenance(maintenance, { isAdmin, email: user?.email })) return children;

  return <MaintenanceScreen config={maintenance} />;
}
