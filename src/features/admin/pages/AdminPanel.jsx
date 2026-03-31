import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { m, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  LayoutDashboard,
  Users,
  Tag,
  BarChart3,
  Settings,
  Bell,
  FileText,
  Library,
  Cpu,
  UserX,
  CreditCard,
  Gift,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/context/AuthContext';
import { createPageUrl } from '@/utils';
// Button, Card, CardContent removed as unused

// Lazy load admin components
const AdminOverview = lazy(() => import('@/components/admin/AdminOverview'));
const TestManagement = lazy(() => import('@/components/admin/tests'));
const UserManagement = lazy(() => import('@/components/admin/UserManagement'));
const PromoCodeManagement = lazy(() => import('@/components/admin/PromoManagement'));
const ResourceManagement = lazy(() => import('@/components/admin/ResourceManagement'));
const PassageQuestionManager = lazy(
  () => import('@/components/admin/tests/builders/PassageQuestionManager')
);
const AnalyticsDashboard = lazy(() => import('@/components/admin/AnalyticsDashboard'));
const UserAnalytics = lazy(() => import('@/components/admin/UserAnalytics'));
const RevenueAnalytics = lazy(() => import('@/components/admin/RevenueAnalytics'));
const GlobalSettings = lazy(() => import('@/components/admin/settings/GlobalSettings'));
const PaymentManagement = lazy(() => import('@/components/admin/PaymentManagement'));
const NotificationCenter = lazy(
  () => import('@/components/admin/notifications/NotificationCenter')
);
const AIUsageManagement = lazy(() => import('@/components/admin/AIUsageManagement'));
const ReferralManagement = lazy(() => import('@/components/admin/ReferralManagement'));

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, component: AdminOverview },
  { id: 'users', label: 'Users', icon: Users, component: UserManagement },
  { id: 'inactive', label: 'Inactive', icon: UserX, component: null }, // Lazy loaded
  { id: 'tests', label: 'Tests', icon: FileText, component: TestManagement },
  { id: 'resources', label: 'Resources', icon: Library, component: ResourceManagement },
  { id: 'ai-usage', label: 'AI Usage', icon: Cpu, component: null }, // Lazy loaded
  { id: 'analytics', label: 'Analytics', icon: BarChart3, component: AnalyticsDashboard },
  { id: 'promo', label: 'Promos', icon: Tag, component: PromoCodeManagement },
  { id: 'referrals', label: 'Referrals', icon: Gift, component: ReferralManagement },
  { id: 'payments', label: 'Payments', icon: CreditCard, component: PaymentManagement },
  { id: 'notifications', label: 'Notifications', icon: Bell, component: NotificationCenter },
  { id: 'settings', label: 'Settings', icon: Settings, component: GlobalSettings },
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
          totalQuestions: data.totalQuestions,
          totalPassages: data.totalPassages,
          completedTests: data.completedTests,
          avgScore: data.avgScore,
          conversionRate:
            data.totalUsers > 0 ? ((data.premiumUsers / data.totalUsers) * 100).toFixed(1) : 0,
        });

        setAnalyticsData({
          weeklyActiveUsers: 0, // Not currently returned by RPC, can be added later
          monthlyActiveUsers: 0,
          liveUsers: 0,
          totalRevenue: data.totalRevenue,
          monthlyGrowth: 0,
          userGrowthData: data.userGrowthData,
          scoreDistribution: data.scoreDistribution,
          recentSignups: data.recentSignups,
          sessionActivity: [
            { name: 'Completed', value: data.completedTests, color: '#10B981' },
            // Note: Abandoned count calculation requires total attempts which RPC doesn't currently return
            // Falling back to 0 for abandoned to avoid misleading data
            { name: 'Abandoned', value: 0, color: '#F43F5E' },
          ],
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
    return (
      <div className="flex items-center justify-center h-64" data-oid="my23qeg">
        <div className="text-center" data-oid="4arauko">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"
            data-oid="::govpt"
          ></div>
          <p className="text-muted-foreground" data-oid="7nmda9p">
            Loading expert insights...
          </p>
        </div>
      </div>
    );
  }

  return (
    <UserAnalytics
      stats={stats}
      analyticsData={analyticsData}
      selectedRange={selectedRange}
      onRangeChange={setSelectedRange}
      isDataLoading={loading}
      data-oid="89vr.cy"
    />
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
        totalUsers: revenueData.activeSubscribers,
        premiumUsers: revenueData.activeSubscribers,
        proCount: revenueData.proCount,
        premiumCount: revenueData.premiumCount,
        conversionRate: 0, // Not calculated in revenue view
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
        churnRate: 0,
        churnRiskCount: 0,
        atRiskUsers: [],
        promoStats: [],
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
    return (
      <div className="flex items-center justify-center h-64" data-oid="zmsuw94">
        <div className="text-center" data-oid="_o2yjtq">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"
            data-oid="1yettxw"
          ></div>
          <p className="text-muted-foreground" data-oid=".iahg7_">
            Loading revenue analytics...
          </p>
        </div>
      </div>
    );
  }

  return (
    <RevenueAnalytics
      analyticsData={analyticsData}
      stats={stats}
      recentTransactions={recentTransactions}
      data-oid="i8.:9ec"
    />
  );
};

export default function AdminPanel() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Modal and form states
  const [isAddingPromo, setIsAddingPromo] = useState(false);

  // Question management states (for PassageQuestionManager)
  const [editingQuestion, setEditingQuestion] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [selectedContent, setSelectedContent] = useState(null);

  // Test management states
  const [isCreatingTest, setIsCreatingTest] = useState(false);
  const [editingTest, setEditingTest] = useState(null);

  const { user: currentUser, loading, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const showToast = (title, description, variant = 'default') => {
    if (variant === 'destructive') {
      toast.error(title, { description });
    } else {
      toast.success(title, { description });
    }
  };

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

    const allowedTabs = TABS.map((t) => t.id).concat([
      'passage_questions',
      'user-analytics',
      'revenue-analytics',
    ]);
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

      case 'passage_questions':
        if (!selectedContent) {
          setActiveTab('tests');
          return null;
        }
        return (
          <PassageQuestionManager
            selectedContent={selectedContent}
            showToast={showToast}
            setEditingQuestion={setEditingQuestion}
            editingQuestion={editingQuestion}
            setActiveTab={setActiveTab}
            data-oid="jyd9n.j"
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
        return <NotificationCenter data-oid="oh20dt3" />;
      case 'resources':
        return <ResourceManagement data-oid="5rqz_bi" />;
      case 'ai-usage':
        return <AIUsageManagement data-oid="_ai6za2" />;
      case 'analytics':
        return <AnalyticsDashboard data-oid="o9mkpy:" />;
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
    return (
      <div className="flex items-center justify-center h-screen bg-background" data-oid="dx1vtaz">
        <div className="text-center" data-oid="2v.c.7g">
          <m.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 bg-gradient-to-r from-violet-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl"
            data-oid="kt7sm:n"
          >
            <Loader2 className="w-8 h-8 text-white" data-oid="7v1c4.o" />
          </m.div>
          <p className="text-xl font-semibold text-foreground" data-oid="6fcv0ai">
            Loading Dashboard...
          </p>
          <p className="text-muted-foreground mt-2" data-oid="dv0skih">
            Preparing your analytics
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500 overflow-hidden isolate"
      data-oid="4:.7dcq"
    >
      {/* Enhanced Premium Background - Matched with User Dashboard */}
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 pointer-events-none overflow-hidden"
        data-oid="wxlqoe8"
      >
        {/* Multi-layered gradient mesh */}
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops)),rgba(99,102,241,0.12)_0%,transparent_40%),radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops)),rgba(168,85,247,0.08)_0%,transparent_40%),radial-gradient(ellipse_at_center,_var(--tw-gradient-stops)),rgba(59,130,246,0.06)_0%,transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops)),rgba(99,102,241,0.2)_0%,transparent_40%),radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops)),rgba(168,85,247,0.15)_0%,transparent_40%),radial-gradient(ellipse_at_center,_var(--tw-gradient-stops)),rgba(59,130,246,0.1)_0%,transparent_50%)]"
          data-oid="n2hnue4"
        />

        {/* Enhanced grid pattern with perspective */}
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,#6366f104_1px,transparent_1px),linear-gradient(to_bottom,#6366f104_1px,transparent_1px)] bg-[size:60px_60px] dark:bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)]"
          data-oid="ya-wf90"
        />

        {/* Subtle animated gradient overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/5 dark:to-black/10 animate-pulse"
          data-oid="a5i84sr"
        />

        {/* Premium texture with better performance */}
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"
          data-oid="cihn99s"
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
            <Suspense
              fallback={
                <div
                  className="flex flex-col items-center justify-center h-[60vh]"
                  data-oid="a4-w0ma"
                >
                  <div className="relative" data-oid="o987s6k">
                    <div
                      className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"
                      data-oid="jfoorbe"
                    />

                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      data-oid="-skvujs"
                    >
                      <div
                        className="w-8 h-8 bg-primary/20 rounded-full animate-pulse"
                        data-oid="44to_vz"
                      />
                    </div>
                  </div>
                  <p
                    className="mt-4 text-sm font-medium text-muted-foreground animate-pulse"
                    data-oid="f0k.-5t"
                  >
                    Loading {activeTab}...
                  </p>
                </div>
              }
              data-oid="91_p4e8"
            >
              {renderContent()}
            </Suspense>
          </m.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
