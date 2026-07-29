import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Loader2 } from 'lucide-react';
import PropTypes from 'prop-types';
import { getAuthUserId, hasAdminAccess } from '@/features/auth/utils/adminAccess';

/**
 * ProtectedRoute component that handles:
 * 1. Authentication check
 * 2. Admin authorization
 * 3. Onboarding completion check (optional)
 */
const ProtectedRoute = ({
  children,
  adminOnly = false,
  requireOnboarding = false,
  requirePro = false,
  redirectPath = '/login',
}) => {
  const { user, loading, isAdmin, authCheckComplete, adminCheckComplete } = useAuth();
  const location = useLocation();

  // Wait for auth check to complete — show loading spinner to prevent
  // rendering protected content before Supabase verifies the session
  if (loading || !authCheckComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (adminOnly && user && !adminCheckComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // 1. Authentication check
  if (!user) {
    // If it's an admin route, we might want to redirect to /admin/login instead
    const targetRedirect = adminOnly ? '/admin/login' : redirectPath;
    return <Navigate to={targetRedirect} state={{ from: location }} replace data-oid="l65p9c_" />;
  }

  // 2. Admin authorization check
  if (adminOnly && (!isAdmin || !hasAdminAccess(getAuthUserId(user)))) {
    // Role authorization comes from the database. Admin UI access also requires
    // an explicit login through the dedicated admin entry point for this tab.
    const targetRedirect = isAdmin ? '/admin/login' : '/dashboard';
    return <Navigate to={targetRedirect} replace data-oid="h3edd.e" />;
  }

  // 3. Pro/Premium tier requirement check
  if (requirePro && !isAdmin) {
    const tier = (user.subscription_tier || 'free').toLowerCase();
    if (tier === 'free') {
      return <Navigate to="/upgrade" replace data-oid="pro-gate" />;
    }
  }

  // 4. Onboarding completion check
  // REMOVED FORCED REDIRECT: We now allow users to navigate freely.
  // A soft prompt is shown on the Dashboard if onboarding is not completed.
  if (requireOnboarding && !isAdmin) {
    // No-op: We keep the prop for backward compatibility but remove the blocking redirect.
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  adminOnly: PropTypes.bool,
  requireOnboarding: PropTypes.bool,
  requirePro: PropTypes.bool,
  redirectPath: PropTypes.string,
};

export default ProtectedRoute;
