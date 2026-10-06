import React, { lazy, Suspense } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  useLocation,
  useRouteError,
} from 'react-router-dom';
import { trackAppEvent, trackPageView } from '@/lib/tracking';
import { isChunkReloadPending, recoverFromChunkLoadError } from '@/lib/chunkLoadRecovery';
import { scheduleIdle } from '@/lib/scheduleIdle';
import GlobalLegalRoute from '@/features/core/components/legal/GlobalLegalRoute.jsx';

import ErrorBoundary from '@/components/shared/ErrorBoundary';
import MaintenanceGate from '@/components/shared/MaintenanceGate';
import PremiumLoading from '@/components/ui/PremiumLoading';
import LandingPage from '@/features/core/pages/LandingPage.jsx';
import Error500 from '@/features/core/pages/Error500.jsx';

const LazySonnerToaster = lazy(() =>
  import('@/components/ui/sonner').then((module) => ({ default: module.Toaster }))
);

function PracticeLabRedirect() {
  const location = useLocation();
  return (
    <Navigate
      replace
      to={
        location.pathname.replace('/skill-lab', '/practice-lab') + location.search + location.hash
      }
    />
  );
}

const RouteLoading = ({ message = 'Loading...', fullScreen = true }) => {
  if (typeof window !== 'undefined' && window.location.pathname === '/institutions') {
    return (
      <div
        role="status"
        className="fixed inset-0 z-100 flex min-h-screen flex-col items-center justify-center gap-5 bg-[#fdfdff] text-[#545e80]"
      >
        <img src="/logo.svg" width="180" height="43" alt="IELTS Ai Pro" />
        <p className="text-sm">Loading institution overview…</p>
      </div>
    );
  }
  return <PremiumLoading message={message} fullScreen={fullScreen} />;
};

const IdleToaster = () => {
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const callback = () => setReady(true);

    return scheduleIdle(callback, { timeout: 2000, fallbackDelay: 1200 });
  }, []);

  if (!ready) return null;

  return (
    <Suspense fallback={null}>
      <LazySonnerToaster position="top-center" data-oid="-lx3xts" />
    </Suspense>
  );
};

/**
 * Lazy load with automatic recovery when this tab is still running an older
 * deployment whose chunk hashes are no longer on the server.
 */
const lazyWithRetry = (componentImport) =>
  lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      if (recoverFromChunkLoadError(error)) {
        return { default: () => <RouteLoading message="Updating to the latest version..." /> };
      }
      throw error;
    }
  });

/**
 * Root level Error Element for React Router.
 * A stale-chunk failure shows a loading state while the single reload runs —
 * several chunks fail together after a deploy, and only the first one
 * schedules the reload, so the rest must not fall through to the 500 page.
 */
const GlobalErrorElement = () => {
  const error = useRouteError();

  if (recoverFromChunkLoadError(error) || isChunkReloadPending()) {
    return <RouteLoading message="Updating to the latest version..." fullScreen />;
  }

  return (
    <Suspense fallback={<RouteLoading message="Loading error page..." fullScreen />}>
      <Error500 data-oid="o.z4:zc" />
    </Suspense>
  );
};

const withGlobalRouteErrors = (routes) =>
  routes.map((route) => ({
    ...route,
    errorElement: route.errorElement ?? <GlobalErrorElement />,
  }));

// Lazy loaded shared components (not needed for landing page initial load)
const ProtectedRoute = lazyWithRetry(() => import('@/components/ProtectedRoute.jsx'));
const Layout = lazyWithRetry(() => import('@/features/core/pages/Layout.jsx'));

// Lazy loaded pages (heavy pages, less frequently accessed)
const AdminLogin = lazyWithRetry(() => import('@/features/auth/pages/AdminLogin.jsx'));
const Login = lazyWithRetry(() => import('@/features/auth/pages/Login.jsx'));
const ForgotPassword = lazyWithRetry(() => import('@/features/auth/pages/ForgotPassword.jsx'));
const UpdatePassword = lazyWithRetry(() => import('@/features/auth/pages/UpdatePassword.jsx'));
const EmailConfirmation = lazyWithRetry(
  () => import('@/features/auth/pages/EmailConfirmation.jsx')
);
const Dashboard = lazyWithRetry(() => import('@/features/dashboard/pages/Dashboard.jsx'));
const AiCoach = lazyWithRetry(() => import('@/features/ai-coach/pages/AiCoach.jsx'));
const Listening = lazyWithRetry(() => import('@/features/testing/shared/pages/Listening.jsx'));
const Reading = lazyWithRetry(() => import('@/features/testing/shared/pages/Reading.jsx'));
const Speaking = lazyWithRetry(() => import('@/features/testing/shared/pages/Speaking.jsx'));
const Writing = lazyWithRetry(() => import('@/features/testing/shared/pages/Writing.jsx'));
const InstitutionLanding = lazyWithRetry(
  () => import('@/features/institution/pages/InstitutionLanding.jsx')
);
const InstitutionPanel = lazyWithRetry(
  () => import('@/features/institution/pages/InstitutionPanel.jsx')
);
const InstitutionLogin = lazyWithRetry(
  () => import('@/features/institution/pages/InstitutionLogin.jsx')
);
const InstitutionApply = lazyWithRetry(
  () => import('@/features/institution/pages/InstitutionApply.jsx')
);
const AcceptInstitutionInvitation = lazyWithRetry(
  () => import('@/features/institution/pages/AcceptInvitation.jsx')
);
const AdminPanel = lazyWithRetry(() => import('@/features/admin/pages/AdminPanel.jsx'));
const AdminUserDetails = lazyWithRetry(() => import('@/features/admin/pages/AdminUserDetails.jsx'));
const CambridgeTests = lazyWithRetry(
  () => import('@/features/testing/shared/pages/CambridgeTests.jsx')
);
const ListeningTest = lazyWithRetry(
  () => import('@/features/testing/listening/pages/ListeningTest.jsx')
);
const ReadingTest = lazyWithRetry(() => import('@/features/testing/reading/pages/ReadingTest.jsx'));
const Settings = lazyWithRetry(() => import('@/features/settings/pages/Settings.jsx'));
const FeatureRequests = lazyWithRetry(
  () => import('@/features/feature-requests/pages/FeatureRequests.jsx')
);
const Vocabulary = lazyWithRetry(() => import('@/features/vocabulary/pages/Vocabulary.jsx'));
const VocabularyKits = lazyWithRetry(
  () => import('@/features/vocabulary/pages/VocabularyKits.jsx')
);
const GrammarLab = lazyWithRetry(() => import('@/features/grammar/pages/GrammarLab.jsx'));
const SpeakingTest = lazyWithRetry(
  () => import('@/features/testing/speaking/pages/SpeakingTest.jsx')
);
const PracticeLab = lazyWithRetry(() => import('@/features/skill-lab/pages/SkillLab.jsx'));
const WritingTask = lazyWithRetry(() => import('@/features/testing/writing/pages/WritingTask.jsx'));
const Pricing = lazyWithRetry(() => import('@/features/subscription/pages/Pricing.jsx'));
const Upgrade = lazyWithRetry(() => import('@/features/subscription/pages/Upgrade.jsx'));
const Analytics = lazyWithRetry(() => import('@/features/analytics/pages/Analytics.jsx'));
const Leaderboard = lazyWithRetry(() => import('@/features/gamification/pages/Leaderboard.jsx'));
const LearningPath = lazyWithRetry(() => import('@/features/learning/pages/LearningPath.jsx'));
const Onboarding = lazyWithRetry(() => import('@/features/onboarding/pages/Onboarding.jsx'));
const ResourcesPage = lazyWithRetry(() => import('@/features/learning/pages/ResourcesPage.jsx'));
const BlogIndex = lazyWithRetry(() => import('@/features/learning/pages/BlogIndex.jsx'));
const BlogPost = lazyWithRetry(() => import('@/features/learning/pages/BlogPost.jsx'));
const PrivacyPolicy = lazyWithRetry(() => import('@/features/core/pages/PrivacyPolicy.jsx'));
const TermsOfService = lazyWithRetry(() => import('@/features/core/pages/TermsOfService.jsx'));
const GlobalRefundPolicy = lazyWithRetry(
  () => import('@/features/core/pages/GlobalRefundPolicy.jsx')
);
const BangladeshLegalPage = lazyWithRetry(
  () => import('@/features/core/pages/BangladeshLegalPage.jsx')
);
const NotFound = lazyWithRetry(() => import('@/features/core/pages/NotFound.jsx'));
const About = lazyWithRetry(() => import('@/features/core/pages/About.jsx'));
const Contact = lazyWithRetry(() => import('@/features/core/pages/Contact.jsx'));
const BandScoreCalculator = lazyWithRetry(
  () => import('@/features/core/pages/BandScoreCalculator.jsx')
);
const IeltsWritingChecker = lazyWithRetry(
  () => import('@/features/core/pages/IeltsWritingChecker.jsx')
);
const IeltsSeoLanding = lazyWithRetry(() => import('@/features/core/pages/IeltsSeoLanding.jsx'));
// Public by design: this is a top-of-funnel search entry point, so it must work
// before anyone has an account. It moves inside the user panel later as well.
const UniversityRequirements = lazyWithRetry(
  () => import('@/features/core/pages/UniversityRequirements.jsx')
);
// Public by design: the unsubscribe link in every marketing email lands here,
// and someone opting out is often not signed in.
const UnsubscribeConfirmation = lazyWithRetry(
  () => import('@/features/marketing/pages/UnsubscribeConfirmation.jsx')
);
const SubscriptionSuccess = lazyWithRetry(
  () => import('@/features/subscription/pages/SubscriptionSuccess.jsx')
);
const MotionProvider = lazyWithRetry(() => import('@/components/shared/MotionProvider.jsx'));
const RouteProviders = lazyWithRetry(() => import('@/components/shared/RouteProviders.jsx'));

const LazyPage = ({ children, className }) => {
  const location = useLocation();
  const { pathname } = location;

  React.useLayoutEffect(() => {
    if (!window.location.hash) {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [location.pathname, location.search, location.key]);

  const page = (
    <Suspense
      fallback={<RouteLoading message="Loading..." fullScreen data-oid="n1xqtod" />}
      data-oid="fnq31q0"
    >
      <div className={className} key={pathname}>
        {children}
      </div>
    </Suspense>
  );

  if (pathname === '/' || pathname === '/institutions') return page;

  return (
    <Suspense fallback={<RouteLoading message="Loading..." fullScreen />}>
      <RouteProviders>
        <MotionProvider>{page}</MotionProvider>
      </RouteProviders>
    </Suspense>
  );
};

const router = createBrowserRouter(
  withGlobalRouteErrors([
    {
      path: '/',
      element: (
        <LazyPage data-oid="nul.jxn">
          <LandingPage data-oid="aewymnf" />
        </LazyPage>
      ),

      errorElement: <GlobalErrorElement data-oid="47:0tr-" />,
    },
    {
      path: '/landing-v2',
      element: (
        <LazyPage data-oid="0s9jmzh">
          <LandingPage data-oid="131r.i0" />
        </LazyPage>
      ),
    },
    {
      path: '/about',
      element: (
        <LazyPage data-oid="about-page">
          <About data-oid="about-comp" />
        </LazyPage>
      ),
    },
    {
      path: '/contact',
      element: (
        <LazyPage data-oid="contact-page">
          <Contact data-oid="contact-comp" />
        </LazyPage>
      ),
    },
    {
      path: '/ielts-band-score-calculator',
      element: (
        <LazyPage data-oid="calc-page">
          <BandScoreCalculator data-oid="calc-comp" />
        </LazyPage>
      ),
    },
    {
      path: '/ielts-university-requirements',
      element: (
        <LazyPage data-oid="university-requirements-page">
          <UniversityRequirements data-oid="university-requirements-comp" />
        </LazyPage>
      ),
    },
    {
      path: '/ielts-writing-checker',
      element: (
        <LazyPage data-oid="writing-checker-page">
          <IeltsWritingChecker data-oid="writing-checker-comp" />
        </LazyPage>
      ),
    },
    {
      path: '/cambridge-ielts-practice-tests',
      element: (
        <LazyPage data-oid="seo-practice-page">
          <IeltsSeoLanding data-oid="seo-practice-comp" />
        </LazyPage>
      ),
    },
    {
      path: '/ielts-speaking-practice-ai',
      element: (
        <LazyPage data-oid="seo-speaking-page">
          <IeltsSeoLanding data-oid="seo-speaking-comp" />
        </LazyPage>
      ),
    },
    {
      path: '/ielts-mock-test-online',
      element: <Navigate to="/cambridge-ielts-practice-tests" replace />,
    },
    {
      path: '/free-ielts-practice-tests',
      element: <Navigate to="/cambridge-ielts-practice-tests" replace />,
    },
    {
      path: '/ai-ielts-preparation',
      element: (
        <LazyPage data-oid="seo-prep-page">
          <LandingPage data-oid="seo-prep-comp" />
        </LazyPage>
      ),
    },
    {
      path: '/ielts-band-score-feedback',
      element: (
        <LazyPage data-oid="seo-feedback-page">
          <LandingPage data-oid="seo-feedback-comp" />
        </LazyPage>
      ),
    },
    {
      path: '/login',
      element: (
        <Layout currentPageName="Login" data-oid="_midz-.">
          <LazyPage data-oid=":ig6lw4">
            <Login data-oid="wmjddcd" />
          </LazyPage>
        </Layout>
      ),
    },
    {
      path: '/signup',
      element: (
        <Layout currentPageName="SignUp" data-oid="qbz5.nj">
          <LazyPage data-oid="qx::cx6">
            <Login data-oid="r-a-bsp" />
          </LazyPage>
        </Layout>
      ),
    },
    {
      path: '/register',
      element: <Navigate to="/signup" replace data-oid="re:dir1" />,
    },
    {
      path: '/forgot-password',
      element: (
        <Layout currentPageName="ForgotPassword" data-oid="b7358i_">
          <LazyPage data-oid="6e7dy:t">
            <ForgotPassword data-oid="cx7ddp_" />
          </LazyPage>
        </Layout>
      ),
    },
    {
      path: '/update-password',
      element: (
        <Layout currentPageName="UpdatePassword" data-oid="w8fka35">
          <LazyPage data-oid="3l0ddci">
            <UpdatePassword data-oid="hu68k4h" />
          </LazyPage>
        </Layout>
      ),
    },
    {
      path: '/auth/confirm',
      element: (
        <LazyPage data-oid="email-confirmation-page">
          <EmailConfirmation data-oid="email-confirmation-comp" />
        </LazyPage>
      ),
    },
    {
      path: '/institutions',
      element: (
        <LazyPage>
          <InstitutionLanding />
        </LazyPage>
      ),
    },
    {
      path: '/institution/login',
      element: (
        <LazyPage>
          <InstitutionLogin />
        </LazyPage>
      ),
    },
    {
      path: '/institution/apply',
      element: (
        <LazyPage>
          <InstitutionApply />
        </LazyPage>
      ),
    },
    {
      path: '/institution',
      element: (
        <ProtectedRoute redirectPath="/institution/login">
          <LazyPage>
            <InstitutionPanel />
          </LazyPage>
        </ProtectedRoute>
      ),
    },
    {
      path: '/institution/accept',
      element: (
        <ProtectedRoute redirectPath="/institution/login">
          <LazyPage>
            <AcceptInstitutionInvitation />
          </LazyPage>
        </ProtectedRoute>
      ),
    },
    {
      path: '/dashboard',
      element: (
        <ProtectedRoute data-oid="s7:2m_z">
          <Layout currentPageName="Dashboard" data-oid="k9so93y">
            <LazyPage data-oid="68oq19r">
              <Dashboard data-oid="-.oi-50" />
            </LazyPage>
          </Layout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/ai-coach',
      element: (
        <ProtectedRoute>
          <Layout currentPageName="AiCoach">
            <LazyPage>
              <AiCoach />
            </LazyPage>
          </Layout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/admin/login',
      element: (
        <Layout currentPageName="AdminLogin" data-oid=":b6aih1">
          <LazyPage data-oid="ly-vr9l">
            <AdminLogin data-oid="gupt3v1" />
          </LazyPage>
        </Layout>
      ),
    },
    {
      path: '/admin/panel',
      element: (
        <ProtectedRoute adminOnly data-oid="-2b_.t1">
          <Layout currentPageName="AdminPanel" data-oid="iiz0354">
            <LazyPage data-oid="u7in7hv">
              <AdminPanel data-oid="315_tjq" />
            </LazyPage>
          </Layout>
        </ProtectedRoute>
      ),
    },
    {
      // Superseded by the Security section of Global Settings.
      path: '/admin/settings',
      element: <Navigate to="/admin/panel?tab=settings&section=security" replace />,
    },
    {
      path: '/admin/user/:id',
      element: (
        <ProtectedRoute adminOnly data-oid="ro0-_90">
          <Layout currentPageName="AdminUserDetails" data-oid="2s1aw06">
            <LazyPage data-oid="sxq2tzn">
              <AdminUserDetails data-oid="ouob912" />
            </LazyPage>
          </Layout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/cambridge-tests',
      element: (
        <ProtectedRoute data-oid="bzlg439">
          <Layout currentPageName="CambridgeTests" data-oid="_-mns0s">
            <LazyPage data-oid="jy_vo2-">
              <CambridgeTests data-oid="fpr_he." />
            </LazyPage>
          </Layout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/listening',
      element: (
        <ProtectedRoute data-oid="fccilhq">
          <Layout currentPageName="Listening" data-oid=".rfusye">
            <LazyPage data-oid="01yrxrq">
              <Listening data-oid="uzxyw6b" />
            </LazyPage>
          </Layout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/listening-test',
      element: (
        <ProtectedRoute data-oid="wj_t-8q">
          <Layout currentPageName="ListeningTest" data-oid="mf.rj6p">
            <LazyPage className="flex h-full min-h-0 flex-col" data-oid="1._qfi_">
              <ListeningTest data-oid="ukl40:i" />
            </LazyPage>
          </Layout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/listening-test/:id',
      element: (
        <ProtectedRoute data-oid="1uu.7xp">
          <Layout currentPageName="ListeningTest" data-oid="uldn6:q">
            <LazyPage className="flex h-full min-h-0 flex-col" data-oid="12hl6f_">
              <ListeningTest data-oid="4:4-0ey" />
            </LazyPage>
          </Layout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/reading',
      element: (
        <ProtectedRoute data-oid="fkvv4:c">
          <Layout currentPageName="Reading" data-oid="ldqr:ux">
            <LazyPage data-oid="eo1d5_n">
              <Reading data-oid=":7pvqmb" />
            </LazyPage>
          </Layout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/reading-test',
      element: (
        <ProtectedRoute data-oid="5xj-lkv">
          <Layout currentPageName="ReadingTest" data-oid="t7xxst3">
            <LazyPage className="flex h-full min-h-0 flex-col" data-oid="2-8ue88">
              <ReadingTest data-oid="zgd9x6n" />
            </LazyPage>
          </Layout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/reading-test/:id',
      element: (
        <ProtectedRoute data-oid="-1uf170">
          <Layout currentPageName="ReadingTest" data-oid="5ek0v6b">
            <LazyPage className="flex h-full min-h-0 flex-col" data-oid="-31lp4y">
              <ReadingTest data-oid="-d7e.lz" />
            </LazyPage>
          </Layout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/settings',
      element: (
        <ProtectedRoute data-oid="w.61ztw">
          <Layout currentPageName="Settings" data-oid="z1127ih">
            <LazyPage data-oid="d95:o9x">
              <Settings data-oid="ewz-jh3" />
            </LazyPage>
          </Layout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/feature-requests',
      element: (
        <ProtectedRoute>
          <Layout currentPageName="FeatureRequests">
            <LazyPage>
              <FeatureRequests />
            </LazyPage>
          </Layout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/vocabulary',
      element: (
        <ProtectedRoute data-oid="nky6.15">
          <Layout currentPageName="Vocabulary" data-oid="mjllbml">
            <LazyPage data-oid="tyz.03p">
              <Vocabulary data-oid="zvfmptq" />
            </LazyPage>
          </Layout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/vocabulary/kits',
      element: (
        <ProtectedRoute data-oid="vocabulary-kits-protected">
          <Layout currentPageName="Vocabulary" data-oid="vocabulary-kits-layout">
            <LazyPage data-oid="vocabulary-kits-page">
              <VocabularyKits data-oid="vocabulary-kits" />
            </LazyPage>
          </Layout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/vocabulary/kits/:kitSlug',
      element: (
        <ProtectedRoute data-oid="vocabulary-kit-protected">
          <Layout currentPageName="Vocabulary" data-oid="vocabulary-kit-layout">
            <LazyPage data-oid="vocabulary-kit-page">
              <VocabularyKits data-oid="vocabulary-kit" />
            </LazyPage>
          </Layout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/grammar',
      element: (
        <ProtectedRoute data-oid="grammar-protected">
          <Layout currentPageName="GrammarLab" data-oid="grammar-layout">
            <LazyPage data-oid="grammar-page">
              <GrammarLab data-oid="grammar-lab" />
            </LazyPage>
          </Layout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/grammar/guides/:guideSlug',
      element: (
        <ProtectedRoute data-oid="grammar-guide-protected">
          <Layout currentPageName="GrammarLab" data-oid="grammar-guide-layout">
            <LazyPage data-oid="grammar-guide-page">
              <GrammarLab data-oid="grammar-guide" />
            </LazyPage>
          </Layout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/speaking',
      element: (
        <ProtectedRoute data-oid="g-hx0uc">
          <Layout currentPageName="Speaking" data-oid="3ni91l9">
            <LazyPage data-oid="n_t:h7l">
              <Speaking data-oid="d713b2d" />
            </LazyPage>
          </Layout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/speaking-test',
      element: (
        <ProtectedRoute data-oid="4dabvb.">
          <Layout currentPageName="SpeakingTest" data-oid="1gl_hmj">
            <LazyPage className="flex h-full min-h-0 flex-col" data-oid="0hqo37c">
              <SpeakingTest data-oid="cld_opi" />
            </LazyPage>
          </Layout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/speaking-test/:id',
      element: (
        <ProtectedRoute data-oid="kn.-mu1">
          <Layout currentPageName="SpeakingTest" data-oid="j4e35mg">
            <LazyPage className="flex h-full min-h-0 flex-col" data-oid="x.c:i45">
              <SpeakingTest data-oid="vcvm0eq" />
            </LazyPage>
          </Layout>
        </ProtectedRoute>
      ),
    },
    ...['/skill-lab', '/skill-lab/session/:sessionId'].map((path) => ({
      path,
      element: <PracticeLabRedirect />,
    })),
    { path: '/study-groups', element: <Navigate to="/practice-lab" replace /> },
    {
      path: '/practice-lab',
      element: (
        <ProtectedRoute>
          <Layout currentPageName="PracticeLab">
            <LazyPage>
              <PracticeLab />
            </LazyPage>
          </Layout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/practice-lab/session/:sessionId',
      element: (
        <ProtectedRoute>
          <Layout currentPageName="PracticeLab">
            <LazyPage>
              <PracticeLab />
            </LazyPage>
          </Layout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/writing',
      element: (
        <ProtectedRoute data-oid="-_g3ii3">
          <Layout currentPageName="Writing" data-oid="95cenxn">
            <LazyPage data-oid="a3qed83">
              <Writing data-oid="9dcv6rn" />
            </LazyPage>
          </Layout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/writing-task',
      element: (
        <ProtectedRoute data-oid="jk:flzt">
          <Layout currentPageName="WritingTask" data-oid="g6k0zze">
            <LazyPage className="flex h-full min-h-0 flex-col" data-oid="o5hp-6f">
              <WritingTask data-oid="ex866do" />
            </LazyPage>
          </Layout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/writing-task/:id',
      element: (
        <ProtectedRoute data-oid="huf60xh">
          <Layout currentPageName="WritingTask" data-oid="yjbtplh">
            <LazyPage className="flex h-full min-h-0 flex-col" data-oid="ivw.4.t">
              <WritingTask data-oid="dbtdq9." />
            </LazyPage>
          </Layout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/pricing',
      element: (
        <ProtectedRoute data-oid="xmbp-b_">
          <Layout currentPageName="Pricing" data-oid="tp9-wu2">
            <LazyPage data-oid="jxm9enu">
              <Pricing data-oid="knzikf7" />
            </LazyPage>
          </Layout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/upgrade',
      element: (
        <ProtectedRoute data-oid="upgrade-rt">
          <Layout currentPageName="Upgrade" data-oid="upgrade-ly">
            <LazyPage data-oid="upgrade-lp">
              <Upgrade data-oid="upgrade-pg" />
            </LazyPage>
          </Layout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/subscription/success',
      element: (
        <ProtectedRoute data-oid="f2xx4tv">
          <Layout currentPageName="SubscriptionSuccess" data-oid="_cq__i4">
            <LazyPage data-oid="pd:s_zj">
              <SubscriptionSuccess data-oid="l-973to" />
            </LazyPage>
          </Layout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/analytics',
      element: (
        <ProtectedRoute data-oid="v3gvt1p">
          <Layout currentPageName="Analytics" data-oid="0892jez">
            <LazyPage data-oid="17zkf3i">
              <Analytics data-oid="-ltj3m1" />
            </LazyPage>
          </Layout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/leaderboard',
      element: (
        <ProtectedRoute data-oid="6skgfvx">
          <Layout currentPageName="Leaderboard" data-oid="pzjjj1-">
            <LazyPage data-oid="0th593t">
              <Leaderboard data-oid=":o5.88k" />
            </LazyPage>
          </Layout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/learning-path',
      element: (
        <ProtectedRoute requireOnboarding requirePro data-oid="ref7jz3">
          <Layout currentPageName="LearningPath" data-oid="uaa5l7u">
            <LazyPage data-oid="9faz2x4">
              <LearningPath data-oid="sudqvrt" />
            </LazyPage>
          </Layout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/learning-path-preview',
      element: <Navigate to="/learning-path" replace />,
    },
    {
      path: '/resources',
      element: (
        <ProtectedRoute data-oid="4cw5.c1">
          <Layout currentPageName="Resources" data-oid=".k-9yb.">
            <LazyPage data-oid="faaxt9e">
              <ResourcesPage data-oid="5zgn62c" />
            </LazyPage>
          </Layout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/blog',
      element: (
        <LazyPage>
          <BlogIndex />
        </LazyPage>
      ),
    },
    {
      path: '/blog/:slug',
      element: (
        <LazyPage data-oid="nt2:x1o">
          <BlogPost data-oid="t17tr7u" />
        </LazyPage>
      ),
    },
    {
      path: '/onboarding',
      element: (
        <ProtectedRoute data-oid="_77c5:1">
          <Layout currentPageName="Onboarding" data-oid="5on1x2.">
            <LazyPage data-oid="moe24.2">
              <Onboarding data-oid="8lpnwq-" />
            </LazyPage>
          </Layout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/500',
      element: (
        <LazyPage data-oid="gplm2k1">
          <Error500 data-oid="hmp9pks" />
        </LazyPage>
      ),
    },
    {
      path: '/terms',
      element: (
        <LazyPage data-oid="sreucji">
          <GlobalLegalRoute documentType="terms">
            <TermsOfService data-oid="m4_kqjl" />
          </GlobalLegalRoute>
        </LazyPage>
      ),
    },
    {
      path: '/refund',
      element: (
        <LazyPage>
          <GlobalLegalRoute documentType="refund">
            <GlobalRefundPolicy />
          </GlobalLegalRoute>
        </LazyPage>
      ),
    },
    {
      path: '/email/unsubscribed',
      element: (
        <LazyPage>
          <UnsubscribeConfirmation />
        </LazyPage>
      ),
    },
    {
      path: '/privacy',
      element: (
        <LazyPage data-oid="-s9wkj.">
          <GlobalLegalRoute documentType="privacy">
            <PrivacyPolicy data-oid=":r:pqo6" />
          </GlobalLegalRoute>
        </LazyPage>
      ),
    },
    {
      path: '/bd/terms',
      element: (
        <LazyPage>
          <BangladeshLegalPage documentType="terms" language="en" />
        </LazyPage>
      ),
    },
    {
      path: '/bd/privacy',
      element: (
        <LazyPage>
          <BangladeshLegalPage documentType="privacy" language="en" />
        </LazyPage>
      ),
    },
    {
      path: '/bd/refund-cancellation',
      element: (
        <LazyPage>
          <BangladeshLegalPage documentType="refund" language="en" />
        </LazyPage>
      ),
    },
    {
      path: '/bn/terms',
      element: (
        <LazyPage>
          <BangladeshLegalPage documentType="terms" language="bn" />
        </LazyPage>
      ),
    },
    {
      path: '/bn/privacy',
      element: (
        <LazyPage>
          <BangladeshLegalPage documentType="privacy" language="bn" />
        </LazyPage>
      ),
    },
    {
      path: '/bn/refund-cancellation',
      element: (
        <LazyPage>
          <BangladeshLegalPage documentType="refund" language="bn" />
        </LazyPage>
      ),
    },
    {
      path: '*',
      element: (
        <LazyPage data-oid="1hewsjt">
          <NotFound data-oid="3.c:t_q" />
        </LazyPage>
      ),
    },
  ]),

  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_skipActionErrorRevalidation: true,
    },
  }
);

function App() {
  React.useEffect(() => {
    const scrollToPageTop = () => {
      const root = document.documentElement;
      const previousScrollBehavior = root.style.scrollBehavior;

      // Page anchors use smooth scrolling, but route changes must not animate from
      // the previous page's position.
      root.style.scrollBehavior = 'auto';
      window.scrollTo(0, 0);
      root.scrollTop = 0;
      document.body.scrollTop = 0;
      root.style.scrollBehavior = previousScrollBehavior;
    };

    const detectTestType = (pathname) => {
      if (pathname.startsWith('/reading-test')) return 'reading';
      if (pathname.startsWith('/listening-test')) return 'listening';
      if (pathname.startsWith('/writing-task')) return 'writing';
      if (pathname.startsWith('/speaking-test')) return 'speaking';
      return null;
    };

    let lastPathname = window.location.pathname;
    let lastNavigationPathname = lastPathname;

    trackPageView(lastPathname);

    const initialTestType = detectTestType(lastPathname);
    if (initialTestType) {
      trackAppEvent('test_started', {
        test_type: initialTestType,
        path: lastPathname,
      });
    }

    // Reset scroll as soon as a new route starts loading. Waiting for the lazy route
    // to finish would briefly leave the landing-page footer visible on the next page.
    const unsubscribe = router.subscribe((state) => {
      const nextLocation = state.navigation.location ?? state.location;

      if (nextLocation.pathname !== lastNavigationPathname) {
        lastNavigationPathname = nextLocation.pathname;

        // Preserve intentional in-page anchor navigation.
        if (!nextLocation.hash) {
          scrollToPageTop();
        }
      }

      // Track completed route changes after the router has committed the destination.
      if (state.navigation.state === 'idle' && state.location.pathname !== lastPathname) {
        lastPathname = state.location.pathname;
        trackPageView(state.location.pathname);

        const testType = detectTestType(state.location.pathname);
        if (testType) {
          trackAppEvent('test_started', {
            test_type: testType,
            path: state.location.pathname,
          });
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <ErrorBoundary data-oid="wz-jyt7">
      {/* Wraps the router, not the app shell: public routes (landing, SEO
          pages, blog, calculators) never render Layout, so a gate inside
          Layout left them open during a maintenance window. */}
      <MaintenanceGate>
        <Suspense
          fallback={<RouteLoading message="Starting up..." fullScreen data-oid="router-fallback" />}
        >
          <RouterProvider router={router} data-oid="m-t-6xh" />
        </Suspense>
      </MaintenanceGate>
      <IdleToaster />
    </ErrorBoundary>
  );
}

export default App;
