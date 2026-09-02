const ADMIN_ACCESS_USER_KEY = 'admin_access_user_id';

export const getAuthUserId = (user) => user?.auth_id || user?.id || null;

const getPersistentStorage = () => {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const getLegacySessionStorage = () => {
  if (typeof window === 'undefined') return null;

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

export const grantAdminAccess = (userId) => {
  // Keep this marker alongside Supabase's persisted browser session. It is
  // only a UX gate: ProtectedRoute still requires a current Supabase session
  // and a freshly checked database admin role before rendering admin content.
  const storage = getPersistentStorage() || getLegacySessionStorage();
  if (!storage || typeof userId !== 'string' || !userId.trim()) return false;

  storage.setItem(ADMIN_ACCESS_USER_KEY, userId);
  return true;
};

export const clearAdminAccess = () => {
  getPersistentStorage()?.removeItem(ADMIN_ACCESS_USER_KEY);
  // Clear the old, tab-only marker too while users move to persistent access.
  getLegacySessionStorage()?.removeItem(ADMIN_ACCESS_USER_KEY);
};

export const hasAdminAccess = (userId) => {
  if (typeof userId !== 'string' || !userId.trim()) return false;

  const persistentStorage = getPersistentStorage();
  if (persistentStorage?.getItem(ADMIN_ACCESS_USER_KEY) === userId) return true;

  // Promote an existing in-tab marker on the first post-upgrade page load, so
  // an admin who was already signed in is not forced through one extra login.
  const legacyStorage = getLegacySessionStorage();
  if (legacyStorage?.getItem(ADMIN_ACCESS_USER_KEY) !== userId) return false;

  persistentStorage?.setItem(ADMIN_ACCESS_USER_KEY, userId);
  legacyStorage.removeItem(ADMIN_ACCESS_USER_KEY);
  return true;
};
