const ADMIN_ACCESS_USER_KEY = 'admin_access_user_id';

export const getAuthUserId = (user) => user?.auth_id || user?.id || null;

const getSessionStorage = () => {
  if (typeof window === 'undefined') return null;

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

export const grantAdminAccess = (userId) => {
  const storage = getSessionStorage();
  if (!storage || typeof userId !== 'string' || !userId.trim()) return false;

  storage.setItem(ADMIN_ACCESS_USER_KEY, userId);
  return true;
};

export const clearAdminAccess = () => {
  getSessionStorage()?.removeItem(ADMIN_ACCESS_USER_KEY);
};

export const hasAdminAccess = (userId) => {
  const storage = getSessionStorage();
  if (!storage || typeof userId !== 'string' || !userId.trim()) return false;

  return storage.getItem(ADMIN_ACCESS_USER_KEY) === userId;
};
