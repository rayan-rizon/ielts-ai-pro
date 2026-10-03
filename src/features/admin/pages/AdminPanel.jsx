import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  Tag,
  Settings,
  Megaphone,
  FileText,
  Library,
  Cpu,
  CreditCard,
  Gift,
  Target,
  Lightbulb,
  Flag,
} from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { createPageUrl } from '@/utils';
import PremiumLoading from '@/components/ui/PremiumLoading';
import { AnimatePresence, m } from 'framer-motion';
import { ADMIN_PAGE_TRANSITION, AdminPageSkeleton } from '@/components/admin/ui/primitives';

// Lazy load admin components
const InstitutionAdmin = lazy(() =>
  import('@/features/institution/components/InstitutionWorkspace').then((module) => ({
    default: module.InstitutionAdmin,
  }))
);
const AdminOverview = lazy(() => import('@/components/admin/AdminOverview'));
const TestManagement = lazy(() => import('@/components/admin/tests'));
const UserManagement = lazy(() => import('@/components/admin/UserManagement'));
const PromoCodeManagement = lazy(() => import('@/components/admin/PromoManagement'));
const ResourceManagement = lazy(() => import('@/components/admin/ResourceManagement'));
const UserAnalytics = lazy(() => import('@/components/admin/UserAnalytics'));
const RevenueAnalytics = lazy(() => import('@/components/admin/RevenueAnalytics'));
const GlobalSettings = lazy(() => import('@/components/admin/settings/GlobalSettings'));
const PaymentManagement = lazy(() => import('@/components/admin/PaymentManagement'));
const CommunicationsCenter = lazy(() => import('@/components/admin/communications'));
const AIUsageManagement = lazy(() => import('@/components/admin/AIUsageManagement'));
const ReferralManagement = lazy(() => import('@/components/admin/ReferralManagement'));
const MarketingHub = lazy(() => import('@/components/admin/marketing/MarketingHub'));
const FeatureRequestManagement = lazy(() => import('@/components/admin/FeatureRequestManagement'));
const TestIssueReports = lazy(() => import('@/components/admin/TestIssueReports'));

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'institutions', label: 'Institutions', icon: Building2 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'tests', label: 'Tests', icon: FileText },
  { id: 'resources', label: 'Resources', icon: Library },
  { id: 'ai-usage', label: 'AI Usage', icon: Cpu },
  { id: 'feature-requests', label: 'Feature Requests', icon: Lightbulb },
  { id: 'test-reports', label: 'Test Reports', icon: Flag },
  { id: 'promo', label: 'Promos', icon: Tag },
  { id: 'referrals', label: 'Referrals', icon: Gift },
  { id: 'marketing', label: 'Marketing', icon: Target },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  // Tab id stays `notifications` so existing bookmarks and deep links keep working.
  { id: 'notifications', label: 'Communications', icon: Megaphone },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const ADMIN_TAB_IDS = new Set([
  ...TABS.map((tab) => tab.id),
  'user-analytics',
  'revenue-analytics',
]);

const resolveActiveTab = (search) => {
  const tab = new URLSearchParams(search).get('tab');
  return tab && ADMIN_TAB_IDS.has(tab) ? tab : 'overview';
};

import { AnalyticsService } from '@/features/admin/services/AnalyticsService';

// Wrapper components that fetch data for individual analytics
const UserAnalyticsWrapper = () => {
  const [stats, setStats] = useState({});
  const [analyticsData, setAnalyticsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState('30D');
  const mountedRef = useRef(true);

  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    []
  );

  const loadAnalyticsData = useCallback(
    async (range) => {
      try {
        setLoading(true);
        // The RPC owns range-specific aggregation, so every KPI and chart
        // changes together instead of mixing windowed and lifetime values.
        const rpcRange = (range || selectedRange).toLowerCase();
        const data = await AnalyticsService.getUserIntelligence(rpcRange);
        if (!mountedRef.current) return;

        setStats({
          totalUsers: data.totalUsers,
          activeUsers: data.activeUsers,
          testers: data.testers,
          payingUsers: data.payingUsers,
          completedTests: data.completedTests,
          conversionRate: data.conversionRate,
          activationRate: data.activationRate,
          newUsers: data.newUsers,
          engagement: data.engagement || {},
          geoSummary: data.geoSummary || {},
        });

        setAnalyticsData({
          userGrowthData: data.trend,
          recentSignups: data.recentSignups,
          funnel: data.funnel,
          geography: data.geography || [],
          acquisitionChannels: data.acquisitionChannels || [],
        });
      } catch (error) {
        console.error('Error loading analytics data:', error);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [selectedRange]
  );

  useEffect(() => {
    loadAnalyticsData(selectedRange);
  }, [selectedRange, loadAnalyticsData]);

  if (loading && !Object.keys(stats).length) {
    return <AdminPageSkeleton kpis={6} panels={3} />;
  }

  return (
    <div className="animate-panel-in">
      <UserAnalytics
        stats={stats}
        analyticsData={analyticsData}
        selectedRange={selectedRange}
        onRangeChange={setSelectedRange}
        isDataLoading={loading}
        data-oid="89vr.cy"
      />
    </div>
  );
};

const RevenueAnalyticsWrapper = () => {
  const [stats, setStats] = useState({});
  const [analyticsData, setAnalyticsData] = useState({});
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState('30D');
  const mountedRef = useRef(true);

  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    []
  );

  const loadAnalyticsData = useCallback(
    async (range = selectedRange) => {
      try {
        setLoading(true);

        const revenueData = await AnalyticsService.getRevenueIntelligence(range.toLowerCase());
        if (!mountedRef.current) return;

        setStats({
          activeSubscribers: revenueData.activeSubscribers,
          cancellingSubscribers: revenueData.cancellingSubscribers,
          expiringSubscribers: revenueData.expiringSubscribers,
          failedPayments: revenueData.failedPayments,
          transactions: revenueData.transactions,
          previousTransactions: revenueData.previousTransactions,
        });

        setAnalyticsData({
          revenueUsd: revenueData.revenueUsd,
          revenueBdt: revenueData.revenueBdt,
          previousUsd: revenueData.previousUsd,
          previousBdt: revenueData.previousBdt,
          // Records are purged after six months, so a comparison window
          // older than that would read as a fake zero.
          previousRetained: revenueData.previousRetained !== false,
          trend: revenueData.trend || [],
          paymentMethods: revenueData.paymentMethods || [],
        });

        setRecentTransactions(revenueData.recentTransactions || []);
      } catch (error) {
        console.error('Error loading revenue analytics:', error);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [selectedRange]
  );

  useEffect(() => {
    loadAnalyticsData(selectedRange);
  }, [selectedRange, loadAnalyticsData]);

  if (loading) {
    return <AdminPageSkeleton kpis={3} panels={1} />;
  }

  return (
    <div className="animate-panel-in">
      <RevenueAnalytics
        analyticsData={analyticsData}
        stats={stats}
        recentTransactions={recentTransactions}
        selectedRange={selectedRange}
        onRangeChange={setSelectedRange}
        data-oid="i8.:9ec"
      />
    </div>
  );
};

export default function AdminPanel() {
  const [isLoading, setIsLoading] = useState(true);

  // Modal and form states
  const [isAddingPromo, setIsAddingPromo] = useState(false);

  // Test management states
  const [isCreatingTest, setIsCreatingTest] = useState(false);
  const [editingTest, setEditingTest] = useState(null);

  const { user: currentUser, loading, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  // The URL is the single source of truth for sidebar navigation. Deriving this
  // during render prevents one stale frame of the previous tab after a menu click.
  const activeTab = resolveActiveTab(location.search);

  useEffect(() => {
    if (loading) return;
    if (!currentUser) {
      navigate(createPageUrl('AdminLogin'));
      return;
    }
    if (!isAdmin) {
      navigate(createPageUrl('Dashboard'));
      return;
    }
    setIsLoading(false);
  }, [currentUser, loading, navigate, isAdmin]);

  // Handle URL parameters for tab navigation
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    const action = params.get('action');

    // Handle quick actions
    if (action === 'create') {
      if (tab === 'tests') {
        // This is handled by createNewTest function below now
      } else if (tab === 'promo') {
        setIsAddingPromo(true);
      }
      const newParams = new URLSearchParams(location.search);
      newParams.delete('action');
      navigate(`${location.pathname}?${newParams.toString()}`, { replace: true });
    }
  }, [location.search, navigate, location.pathname]);

  const renderContent = () => {
    switch (activeTab) {
      case 'tests':
        return (
          <TestManagement
            isCreatingTest={isCreatingTest}
            setIsCreatingTest={setIsCreatingTest}
            editingTest={editingTest}
            setEditingTest={setEditingTest}
            data-oid="pky1zr_"
          />
        );

      case 'institutions':
        return <InstitutionAdmin />;
      case 'users':
        return <UserManagement data-oid="c.hqmod" />;
      case 'promo':
        return (
          <PromoCodeManagement
            isAddingPromo={isAddingPromo}
            setIsAddingPromo={setIsAddingPromo}
            data-oid="it7d:ct"
          />
        );

      case 'settings':
        return <GlobalSettings data-oid="4kc3k0k" />;
      case 'payments':
        return <PaymentManagement data-oid="x4tt6sy" />;
      case 'notifications':
        return <CommunicationsCenter data-oid="oh20dt3" />;
      case 'resources':
        return <ResourceManagement data-oid="5rqz_bi" />;
      case 'ai-usage':
        return <AIUsageManagement data-oid="_ai6za2" />;
      case 'feature-requests':
        return <FeatureRequestManagement />;
      case 'test-reports':
        return <TestIssueReports />;
      case 'referrals':
        return <ReferralManagement data-oid="zxyjtkd" />;
      case 'marketing':
        return <MarketingHub />;
      case 'user-analytics':
        return <UserAnalyticsWrapper data-oid="sqk1gt_" />;
      case 'revenue-analytics':
        return <RevenueAnalyticsWrapper data-oid="bwmrucr" />;
      case 'overview':
      default:
        return <AdminOverview data-oid="3yok320" />;
    }
  };

  if (isLoading) {
    return <PremiumLoading message="Loading..." data-oid="admin-dashboard-skeleton" />;
  }

  return (
    <div
      className="relative min-h-screen bg-stone-100 dark:bg-[#08080a] transition-colors duration-300 overflow-hidden isolate"
      data-oid="4:.7dcq"
    >
      {/* Quiet instrument-panel backdrop: a faint dot grid, no colour, no external assets. */}
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 pointer-events-none overflow-hidden"
        data-oid="wxlqoe8"
      >
        <div
          className="absolute inset-0 opacity-60 dark:opacity-30 bg-[radial-gradient(circle_at_1px_1px,rgb(168_162_158/0.35)_1px,transparent_0)] dark:bg-[radial-gradient(circle_at_1px_1px,rgb(255_255_255/0.06)_1px,transparent_0)] bg-size-[22px_22px]"
          data-oid="n2hnue4"
        />
      </div>

      <div
        className="relative z-10 p-3 sm:p-4 md:p-8 lg:p-10 max-w-[1700px] mx-auto min-h-screen"
        data-oid="kqg:fgg"
      >
        <div className="w-full" data-oid="7js.n-c">
          <Suspense
            fallback={<AdminPageSkeleton kpis={6} panels={2} data-oid="admin-tab-loading" />}
            data-oid="91_p4e8"
          >
            <AnimatePresence mode="wait" initial={false}>
              <m.div
                key={activeTab}
                initial={ADMIN_PAGE_TRANSITION.initial}
                animate={ADMIN_PAGE_TRANSITION.animate}
                exit={ADMIN_PAGE_TRANSITION.exit}
                className="w-full"
              >
                {renderContent()}
              </m.div>
            </AnimatePresence>
          </Suspense>
        </div>
      </div>
    </div>
  );
}
