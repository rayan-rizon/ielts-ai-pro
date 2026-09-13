import { useCallback, useEffect, useLayoutEffect, useRef, lazy, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/features/auth/context/AuthContext';
import {
  Sidebar,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
  SidebarRail,
} from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import AnnouncementBanner from '@/components/shared/AnnouncementBanner';
import LearnerMarketingSurface from '@/features/marketing/components/LearnerMarketingSurface';
import { OfflineBanner } from '@/components/OfflineBanner';
import ServiceOutageBanner from '@/components/shared/ServiceOutageBanner';
import { isAnnouncementLive } from '@/lib/communications';
import { cn } from '@/lib/cn';
import ProductTour from '@/features/dashboard/components/ProductTour';

// Modular Components
import { SidebarStyles } from '@/features/core/components/Sidebar/SidebarStyles';

// Lazy load sidebars to reduce initial bundle weight
const UserSidebar = lazy(() =>
  import('@/features/core/components/Sidebar/UserSidebar').then((m) => ({ default: m.UserSidebar }))
);
const AdminSidebar = lazy(() =>
  import('@/features/core/components/Sidebar/AdminSidebar').then((m) => ({
    default: m.AdminSidebar,
  }))
);

const LayoutSkeleton = () => (
  <div
    className="flex-1 flex h-full min-h-0 w-full bg-background overflow-hidden"
    data-oid="5mn8yv7"
  >
    {/* Sidebar Skeleton */}
    <div className="w-64 border-r p-4 hidden md:flex flex-col gap-6 bg-card/30" data-oid="1sh4d1-">
      <div className="flex items-center gap-3" data-oid="zht:tny">
        <Skeleton className="w-12 h-12 rounded-2xl" data-oid=".z-1rqx" />
        <div className="space-y-2" data-oid="5kfb6y1">
          <Skeleton className="h-4 w-24" data-oid="n8d:noy" />
          <Skeleton className="h-3 w-16" data-oid="vsfp8nd" />
        </div>
      </div>
      <div className="space-y-4 flex-1" data-oid="9fw0lbm">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center gap-3" data-oid="el.m1g0">
            <Skeleton className="w-4 h-4 rounded" data-oid="tvk906:" />
            <Skeleton className="h-4 flex-1" data-oid="qxai5t-" />
          </div>
        ))}
      </div>
      <div className="space-y-4 pt-4 border-t" data-oid="9nz_4ua">
        <Skeleton className="h-10 w-full rounded-xl" data-oid="4cgch46" />
        <div className="flex items-center gap-3 p-2 rounded-2xl bg-white/5" data-oid="5bd59fu">
          <Skeleton className="w-10 h-10 rounded-xl" data-oid="asgyt5." />
          <div className="space-y-2 flex-1" data-oid="mi.36g0">
            <Skeleton className="h-3 w-20" data-oid="6kjhv7o" />
            <Skeleton className="h-2 w-12" data-oid="suoq-j." />
          </div>
        </div>
      </div>
    </div>

    {/* Main Content Skeleton */}
    <div className="flex-1 flex flex-col" data-oid="fi.x.y:">
      <header
        className="h-16 border-b px-6 flex items-center justify-between md:hidden"
        data-oid="ubr7sj7"
      >
        <Skeleton className="w-8 h-8 rounded-lg" data-oid="3sa5jgv" />
        <Skeleton className="h-5 w-32" data-oid="a.g5l-d" />
      </header>
      <div className="flex-1 p-8 space-y-6" data-oid="wg.cmry">
        <div className="flex justify-between items-center" data-oid="y34dcky">
          <Skeleton className="h-10 w-48 rounded-lg" data-oid="9zv:044" />
          <Skeleton className="h-10 w-32 rounded-lg" data-oid="z17b:9b" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" data-oid="a021u3v">
          <Skeleton className="h-32 rounded-3xl" data-oid="8tvnhdo" />
          <Skeleton className="h-32 rounded-3xl" data-oid="eg1mls0" />
          <Skeleton className="h-32 rounded-3xl" data-oid="c.ncqjn" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-3xl" data-oid="g_.6mwz" />
      </div>
    </div>
  </div>
);

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const ADMIN_PAGES = ['AdminPanel', 'AdminLogin'];
const TEST_PAGES = [
  'ReadingTest',
  'WritingTask',
  'ListeningTest',
  'SpeakingTest',
  'CambridgeFullTest',
];
const PUBLIC_PAGES = [
  'Index',
  'LandingPage',
  'Login',
  'SignUp',
  'ForgotPassword',
  'UpdatePassword',
  'AdminLogin',
];

function isDashboardRoute(currentPageName, pathname) {
  return currentPageName === 'Dashboard' || pathname === '/dashboard';
}

function isLearnerChromeReady({ user, userProfile, adminCheckComplete, isAdmin }) {
  if (!user || !userProfile || !adminCheckComplete || isAdmin) return false;

  // `isAdmin` is authoritative only after the profile check completes. Keep
  // learner-only promotions hidden while that check is pending, and use the
  // resolved profile as a second fail-closed guard for admin accounts.
  return userProfile.role !== 'admin';
}

function shouldShowAnnouncementBanner({
  isDashboard,
  isAdminView,
  learnerChromeReady,
  announcement,
  user,
}) {
  if (!isDashboard || isAdminView || !learnerChromeReady) return false;
  return isAnnouncementLive(announcement, {
    isAuthenticated: Boolean(user),
    tier: user?.subscription_tier,
  });
}

function shouldRedirectAuthenticatedUser({
  isPublicPage,
  isAdminLogin,
  user,
  authLoading,
  authCheckComplete,
}) {
  if (!isPublicPage || isAdminLogin) return false;
  return Boolean(user && !authLoading && authCheckComplete);
}

function isRedirectingPublicUser(isPublicPage, user, isAdminLogin) {
  return Boolean(isPublicPage && user && !isAdminLogin);
}

function isPublicGuestView(isPublicPage, user, isAdminLogin) {
  if (!isPublicPage) return false;
  return !user || isAdminLogin;
}

function isShellHydrating(authLoading, authCheckComplete, user) {
  return (authLoading || !authCheckComplete) && !user;
}

function PublicRedirectSpinner() {
  return (
    <SidebarStyles data-oid="e.45e4l">
      <div
        className="min-h-screen bg-background flex items-center justify-center"
        data-oid="tmuqbni"
      >
        <div
          className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"
          data-oid="4-6iuek"
        />
      </div>
    </SidebarStyles>
  );
}

function PublicGuestContainer({ children }) {
  return (
    <SidebarStyles data-oid="166-bqh">
      <div className="min-h-screen bg-background text-foreground" data-oid="bamjetg">
        {children}
      </div>
    </SidebarStyles>
  );
}

function HydrationSkeletonShell({ showAnnouncement, announcement }) {
  return (
    <SidebarStyles data-oid="8o5cs_-">
      <div
        className="flex flex-col h-screen w-full bg-slate-50 dark:bg-[#070913] text-foreground overflow-hidden"
        data-oid="69ossux-skel"
      >
        <OfflineBanner data-oid="-4d:8tg-skel" />
        <ServiceOutageBanner />

        {showAnnouncement && (
          <div className="w-full shrink-0 relative z-10" data-oid="hm7p_sl-skel">
            <AnnouncementBanner announcement={announcement} data-oid="z:9x0:g-skel" />
          </div>
        )}

        <LayoutSkeleton data-oid="-url2yn" />
      </div>
    </SidebarStyles>
  );
}

function AppSidebar({ isAdminView, user, location, handleLogout, learnerChromeReady }) {
  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-[#e4e2f0] bg-white dark:border-white/[0.07] dark:bg-[#100f15] sidebar-style"
      data-oid="4vw2urk"
    >
      <Suspense
        fallback={
          <div className="p-4 space-y-4" data-oid="sidebar-loading">
            <Skeleton className="w-12 h-12 rounded-2xl" data-oid="sb-logo" />
            <div className="space-y-2" data-oid="sb-items">
              <Skeleton className="h-4 w-full" data-oid="sb-item-1" />
              <Skeleton className="h-4 w-[90%]" data-oid="sb-item-2" />
              <Skeleton className="h-4 w-[80%]" data-oid="sb-item-3" />
            </div>
          </div>
        }
        data-oid="sidebar-suspense"
      >
        {isAdminView ? (
          <AdminSidebar
            user={user}
            location={location}
            handleLogout={handleLogout}
            data-oid="sel28vx"
          />
        ) : (
          <UserSidebar
            user={user}
            location={location}
            handleLogout={handleLogout}
            showUpgradeOffer={learnerChromeReady}
            data-oid="45utb8k"
          />
        )}
      </Suspense>
      <SidebarRail data-oid="j3nz7xm" />
    </Sidebar>
  );
}

function MainContentArea({
  children,
  isTestPage,
  isAdminView,
  user,
  learnerChromeReady,
  isDashboardPage,
  locationPathname,
  mainContentRef,
}) {
  return (
    <main className="flex-1 flex flex-col overflow-hidden relative" data-oid="ikt0z38">
      {/* Minimal floating toggle for mobile (Hidden on test pages to avoid header overlap) */}
      {!isTestPage && (
        <div
          className="pointer-events-none absolute top-4 left-4 z-50 flex items-center gap-2 md:hidden"
          data-oid="9gb208j"
        >
          <div className="pointer-events-auto rounded-xl border border-border bg-background p-1">
            <SidebarTrigger
              className="h-11 w-11 text-foreground/80 hover:text-primary hover:bg-primary/5 transition-all duration-300"
              aria-label="Open mobile menu"
              data-oid="u0ntjik"
            />
          </div>
        </div>
      )}

      <div
        ref={mainContentRef}
        className={cn(
          'flex-1 bg-[#f8f8fb] dark:bg-[#08080a]',
          isTestPage ? 'flex flex-col h-full min-h-0 overflow-hidden' : 'overflow-auto'
        )}
        data-oid="at8d7y7"
      >
        {isTestPage ? (
          children
        ) : (
          <div
            key={locationPathname}
            className="animate-panel-in min-h-full"
            data-oid="page-transition"
          >
            {!isAdminView && learnerChromeReady && isDashboardPage && (
              <LearnerMarketingSurface user={user} dashboardOnly />
            )}
            {children}
          </div>
        )}
      </div>
    </main>
  );
}

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const mainContentRef = useRef(null);

  // Scroll to top of main container and window whenever location changes (menu clicks, route transitions)
  useIsomorphicLayoutEffect(() => {
    if (!window.location.hash) {
      if (mainContentRef.current) {
        mainContentRef.current.scrollTop = 0;
      }
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [location.pathname, location.search, location.key]);

  const {
    user,
    userProfile,
    loading: authLoading,
    signOut,
    authCheckComplete,
    adminCheckComplete,
    isAdmin,
    announcement,
  } = useAuth();

  const isAdminView = ADMIN_PAGES.includes(currentPageName);
  const isTestPage = TEST_PAGES.includes(currentPageName);
  const isAdminLogin = currentPageName === 'AdminLogin';
  const isPublicPage = PUBLIC_PAGES.includes(currentPageName);
  const isDashboardPage = isDashboardRoute(currentPageName, location.pathname);
  const learnerChromeReady = isLearnerChromeReady({
    user,
    userProfile,
    adminCheckComplete,
    isAdmin,
  });

  const showAnnouncement = shouldShowAnnouncementBanner({
    isDashboard: isDashboardPage,
    isAdminView,
    learnerChromeReady,
    announcement,
    user,
  });

  // Anti-Flash & auto-redirect for authenticated users on public pages
  useEffect(() => {
    if (
      shouldRedirectAuthenticatedUser({
        isPublicPage,
        isAdminLogin,
        user,
        authLoading,
        authCheckComplete,
      })
    ) {
      navigate(createPageUrl('Dashboard'), { replace: true });
    }
  }, [isPublicPage, isAdminLogin, user, authLoading, authCheckComplete, navigate]);

  // UserSidebar is React.memo'd, so an inline arrow here would hand it a new
  // prop identity on every Layout render (i.e. every route change) and defeat
  // the memo entirely.
  const handleLogout = useCallback(async () => {
    await signOut();
    navigate(isAdminView ? createPageUrl('AdminLogin') : createPageUrl('Index'));
  }, [signOut, navigate, isAdminView]);

  if (isRedirectingPublicUser(isPublicPage, user, isAdminLogin)) {
    return <PublicRedirectSpinner />;
  }

  if (isPublicGuestView(isPublicPage, user, isAdminLogin)) {
    return <PublicGuestContainer>{children}</PublicGuestContainer>;
  }

  if (isShellHydrating(authLoading, authCheckComplete, user)) {
    return (
      <HydrationSkeletonShell showAnnouncement={showAnnouncement} announcement={announcement} />
    );
  }

  return (
    <SidebarStyles data-oid="ffg2pb2">
      <div
        className="flex flex-col h-screen w-full bg-slate-50 dark:bg-[#070913] text-foreground overflow-hidden"
        data-oid="69ossux"
      >
        <OfflineBanner data-oid="-4d:8tg" />
        <ServiceOutageBanner />

        {showAnnouncement && (
          <div className="w-full shrink-0 relative z-10" data-oid="hm7p_sl">
            <AnnouncementBanner announcement={announcement} data-oid="z:9x0:g" />
          </div>
        )}

        <SidebarProvider
          defaultOpen={!isTestPage}
          className="flex-1 flex overflow-hidden h-full min-h-0"
          data-oid="yyayifw"
        >
          <SidebarController isTestPage={isTestPage} data-oid="6tzf2_b" />

          <div className="flex w-full flex-1" data-oid="3ubb_cx">
            <AppSidebar
              isAdminView={isAdminView}
              user={user}
              location={location}
              handleLogout={handleLogout}
              learnerChromeReady={learnerChromeReady}
            />

            <MainContentArea
              isTestPage={isTestPage}
              isAdminView={isAdminView}
              user={user}
              learnerChromeReady={learnerChromeReady}
              isDashboardPage={isDashboardPage}
              locationPathname={location.pathname}
              mainContentRef={mainContentRef}
            >
              {children}
            </MainContentArea>
            {!isAdminView && learnerChromeReady && <ProductTour user={user} />}
          </div>
        </SidebarProvider>
      </div>
    </SidebarStyles>
  );
}

/**
 * SidebarController
 * Imperatively controls the sidebar state based on layout changes.
 * Used inside SidebarProvider to access useSidebar hook.
 */
function SidebarController({ isTestPage }) {
  const { open, setOpen, setOpenMobile } = useSidebar();
  const { pathname } = useLocation();
  const savedOpenRef = useRef(null);

  // Automatically close mobile sidebar when the route changes
  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);

  useIsomorphicLayoutEffect(() => {
    if (isTestPage) {
      if (open) {
        savedOpenRef.current = true;
        setOpen(false);
      }
      return;
    }

    if (!savedOpenRef.current) return;

    if (!open) {
      setOpen(true);
      savedOpenRef.current = null;
    }
  }, [isTestPage, open, setOpen]);

  return null;
}
