import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { m, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Tag,
  Settings,
  Megaphone,
  FileText,
  Library,
  Cpu,
  CreditCard,
  Gift,
} from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { createPageUrl } from '@/utils';
import PremiumLoading from '@/components/ui/PremiumLoading';
import { AdminPageSkeleton } from '@/components/admin/ui/primitives';

// Lazy load admin components
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

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'tests', label: 'Tests', icon: FileText },
  { id: 'resources', label: 'Resources', icon: Library },
  { id: 'ai-usage', label: 'AI Usage', icon: Cpu },
  { id: 'promo', label: 'Promos', icon: Tag },
  { id: 'referrals', label: 'Referrals', icon: Gift },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  // Tab id stays `notifications` so existing bookmarks and deep links keep working.
  { id: 'notifications', label: 'Communications', icon: Megaphone },
  { id: 'settings', label: 'Settings', icon: Settings },
];

import { AnalyticsService } from '@/features/admin/services/AnalyticsService';

// Wrapper components that fetch data for individual analytics
const UserAnalyticsWrapper = () => {
  const [stats, setStats] = useState({});
  const [analyticsData, setAnalyticsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState('30D');

  const loadAnalyticsData = useCallback(
    async (range) => {
      try {
        setLoading(true);
        // Map UI range to RPC parameter: '30D' -> '30d', '1Y' -> '1y'
        const rpcRange = (range || selectedRange).toLowerCase();
        const data = await AnalyticsService.getDashboardStats(rpcRange);

        setStats({
          totalUsers: data.totalUsers,
          premiumUsers: data.premiumUsers,
          completedTests: data.completedTests,
          conversionRate:
            data.totalUsers > 0 ? ((data.premiumUsers / data.totalUsers) * 100).toFixed(1) : 0,
        });

        setAnalyticsData({
          userGrowthData: data.userGrowthData,
          recentSignups: data.recentSignups,
        });
      } catch (error) {
        console.error('Error loading analytics data:', error);
      } finally {
        setLoading(false);
      }
    },
    [selectedRange]
  );

  useEffect(() => {
    loadAnalyticsData(selectedRange);
  }, [selectedRange, loadAnalyticsData]);

  if (loading && !Object.keys(stats).length) {
    return <AdminPageSkeleton kpis={3} panels={1} />;
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

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);

      // Fetch actual revenue data from billing_history
      const revenueData = await AnalyticsService.getRevenueAnalytics();

      setStats({
        proCount: revenueData.proCount,
        premiumCount: revenueData.premiumCount,
      });

      setAnalyticsData({
        stripeRevenue: revenueData.stripeRevenue,
        manualRevenue: revenueData.manualRevenue,
        monthlyRevenue: revenueData.monthlyRevenue || [],
        revenueByTier: revenueData.revenueByTier || [],
        arpuUsd: revenueData.arpuUsd || 0,
        arpuBdt: revenueData.arpuBdt || 0,
        ltvUsd: revenueData.ltvUsd || 0,
        ltvBdt: revenueData.ltvBdt || 0,
      });

      setRecentTransactions(revenueData.recentTransactions || []);
    } catch (error) {
      console.error('Error loading revenue analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  if (loading) {
    return <AdminPageSkeleton kpis={3} panels={1} />;
  }

  return (
    <div className="animate-panel-in">
      <RevenueAnalytics
        analyticsData={analyticsData}
        stats={stats}
        recentTransactions={recentTransactions}
        data-oid="i8.:9ec"
      />
    </div>
  );
};

export default function AdminPanel() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Modal and form states
  const [isAddingPromo, setIsAddingPromo] = useState(false);

  // Test management states
  const [isCreatingTest, setIsCreatingTest] = useState(false);
  const [editingTest, setEditingTest] = useState(null);

  const { user: currentUser, loading, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

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

    const allowedTabs = TABS.map((t) => t.id).concat(['user-analytics', 'revenue-analytics']);
    if (tab && allowedTabs.includes(tab)) {
      setActiveTab(tab);
    } else {
      setActiveTab('overview');
    }

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
      case 'referrals':
        return <ReferralManagement data-oid="zxyjtkd" />;
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
        className="relative z-10 p-4 md:p-8 lg:p-10 max-w-[1700px] mx-auto min-h-screen"
        data-oid="kqg:fgg"
      >
        <AnimatePresence mode="wait" data-oid="i5fv-jl">
          <m.div
            key={activeTab}
            initial={{ opacity: 0, y: 15, scale: 0.995 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 1.005 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="w-full"
            data-oid="7js.n-c"
          >
            <Suspense fallback={<PremiumLoading data-oid="a4-w0ma" />} data-oid="91_p4e8">
              {renderContent()}
            </Suspense>
          </m.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
