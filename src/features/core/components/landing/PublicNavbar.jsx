import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/features/auth/context/AuthContext.jsx';
import { useTheme } from '@/components/theme-provider';
import { createPageUrl } from '@/utils';

import Navbar from './Navbar';

/**
 * Shared public-site navbar with the same authentication and theme behavior
 * used by the main marketing site.
 */
export default function PublicNavbar() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, loading: authLoading } = useAuth();
  const isSignedIn = Boolean(user && !authLoading);

  return (
    <Navbar
      isDark={theme === 'dark'}
      setTheme={setTheme}
      handlePrimaryCta={() =>
        navigate(isSignedIn ? createPageUrl('Dashboard') : createPageUrl('SignUp'))
      }
      isSignedIn={isSignedIn}
    />
  );
}
