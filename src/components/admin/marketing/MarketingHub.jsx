import { useCallback, useEffect, useState } from 'react';
import { m } from 'framer-motion';
import {
  BarChart3,
  BrainCircuit,
  FileText,
  Megaphone,
  RefreshCcw,
  Users,
  Workflow,
} from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/cn';
import MarketingService from '@/features/admin/services/MarketingService';
import { PromoCode } from '@/entities';
import {
  ADMIN_TABS_LIST,
  ADMIN_TAB_TRIGGER,
  AdminButton,
  AdminPageHeader,
  AdminPageSkeleton,
  FADE_UP,
  STAGGER_CONTAINER,
} from '@/components/admin/ui/primitives';
import CommandStrip from './CommandStrip';
import AnalyticsPanel from './AnalyticsPanel';
import CampaignsPanel from './CampaignsPanel';
import SegmentsPanel from './SegmentsPanel';
import TemplatesPanel from './TemplatesPanel';
import JourneysPanel from './JourneysPanel';
import AutopilotPanel from './AutopilotPanel';
import AdminOperationsPanel from './AdminOperationsPanel';

/**
 * Tab order follows the operator's loop rather than the data model: read the
 * numbers, act on campaigns, then maintain the reusable pieces behind them.
 * "Segments" is labelled Audiences here — the stored entity keeps its name, but
 * nobody scanning a nav bar is looking for a segment.
 */
const TABS = [
  ['copilot', 'Copilot', BrainCircuit],
  ['performance', 'Performance', BarChart3],
  ['campaigns', 'Campaigns', Megaphone],
  ['audiences', 'Audiences', Users],
  ['templates', 'Templates', FileText],
  ['journeys', 'Journeys', Workflow],
];

const EMPTY_DATA = {
  campaigns: [],
  segments: [],
  templates: [],
  promos: [],
  journeys: [],
  dashboard: { campaigns: [], revenue: [], totals: {} },
  intelligence: { promos: [], referrals: [] },
  breakdowns: { delivery_channels: [], acquisition_sources: [], plans: [], first_touch: [] },
  journeyMetrics: [],
  recovery: { waiting: 0, eligible: 0, sent: 0, recovered: 0, conversion_rate: 0 },
  autopilot: { policies: [], recommendations: [], interventions: [], channels: [], counts: {} },
  growth: null,
};

export default function MarketingHub() {
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [tab, setTab] = useState('copilot');
  const [data, setData] = useState(EMPTY_DATA);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [
        campaigns,
        segments,
        templates,
        promos,
        journeys,
        dashboard,
        intelligence,
        breakdowns,
        journeyMetrics,
        recovery,
        autopilot,
      ] = await Promise.all([
        MarketingService.listCampaigns(),
        MarketingService.listSegments(),
        MarketingService.listTemplates(),
        PromoCode.list(),
        MarketingService.listJourneys(),
        MarketingService.getDashboard(30),
        MarketingService.getOfferIntelligence(),
        MarketingService.getBreakdowns(30),
        MarketingService.getJourneyMetrics(30),
        MarketingService.getCheckoutRecoveryDashboard(),
        MarketingService.getAutopilotSnapshot(30),
      ]);
      setData({
        campaigns,
        segments,
        templates,
        promos,
        journeys,
        dashboard,
        intelligence,
        breakdowns,
        journeyMetrics,
        recovery,
        autopilot,
      });
    } catch (error) {
      console.error('Marketing hub load failed:', error);
      toast.error(error.message || 'Could not load the Marketing hub');
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const navigateToTab = useCallback((nextTab) => {
    if (!TABS.some(([value]) => value === nextTab)) return;
    setTab(nextTab);
    requestAnimationFrame(() => {
      document.getElementById(`marketing-tab-${nextTab}`)?.focus();
      document.getElementById(`marketing-tabpanel-${nextTab}`)?.scrollIntoView({
        block: 'start',
        behavior: 'smooth',
      });
    });
  }, []);

  if (!initialized) return <AdminPageSkeleton kpis={5} panels={2} />;

  return (
    <m.div
      variants={STAGGER_CONTAINER}
      initial="hidden"
      animate="visible"
      className="space-y-4 pb-10 pt-12 md:pt-0"
    >
      <m.div variants={FADE_UP}>
        <AdminPageHeader
          title="Marketing"
          description="Grow subscriptions. Review actions. Follow results."
        >
          <AdminButton variant="outline" onClick={load} loading={loading}>
            <RefreshCcw className="h-3.5 w-3.5" />
            Refresh
          </AdminButton>
        </AdminPageHeader>
      </m.div>

      <m.div variants={FADE_UP}>
        <Tabs value={tab} onValueChange={navigateToTab} className="space-y-4">
          <div className="overflow-x-auto pb-1 no-scrollbar">
            <TabsList className={ADMIN_TABS_LIST}>
              {TABS.map(([value, label, Icon]) => {
                const isActive = tab === value;
                return (
                  <TabsTrigger
                    key={value}
                    value={value}
                    id={`marketing-tab-${value}`}
                    aria-controls={`marketing-tabpanel-${value}`}
                    className={cn(
                      ADMIN_TAB_TRIGGER,
                      'relative z-0 overflow-visible transition-colors',
                      'data-[state=active]:bg-transparent data-[state=active]:shadow-none'
                    )}
                  >
                    {isActive && (
                      <m.span
                        layoutId="marketingMainTabActivePill"
                        className="absolute inset-0 -z-10 rounded-md bg-white shadow-2xs dark:bg-[#131315]"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                    <Icon
                      className={cn(
                        'relative z-10 h-3.5 w-3.5 shrink-0 transition-colors pointer-events-none',
                        isActive
                          ? 'text-stone-900 dark:text-stone-50'
                          : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'
                      )}
                    />
                    <span
                      className={cn(
                        'relative z-10 transition-colors pointer-events-none',
                        isActive
                          ? 'text-stone-900 dark:text-stone-50 font-bold'
                          : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'
                      )}
                    >
                      {label}
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          <TabsContent
            value="copilot"
            id="marketing-tabpanel-copilot"
            className="mt-0 outline-none"
          >
            <AutopilotPanel
              autopilot={data.autopilot}
              onRefresh={load}
              onNavigate={navigateToTab}
            />
            <details className="mt-4">
              <summary className="cursor-pointer py-2 text-xs font-semibold">
                Explore learner history and reports
              </summary>
              <AdminOperationsPanel refreshKey={data.autopilot} />
            </details>
          </TabsContent>
          <TabsContent
            value="performance"
            id="marketing-tabpanel-performance"
            className="mt-0 space-y-4 outline-none"
          >
            <CommandStrip
              campaigns={data.campaigns}
              journeys={data.journeys}
              recovery={data.recovery}
              dashboard={data.dashboard}
              autopilot={data.autopilot}
              onNavigate={navigateToTab}
            />
            <AnalyticsPanel
              dashboard={data.dashboard}
              intelligence={data.intelligence}
              breakdowns={data.breakdowns}
              recovery={data.recovery}
            />
          </TabsContent>
          <TabsContent
            value="campaigns"
            id="marketing-tabpanel-campaigns"
            className="mt-0 outline-none"
          >
            <CampaignsPanel
              campaigns={data.campaigns}
              segments={data.segments}
              promos={data.promos}
              templates={data.templates}
              onRefresh={load}
            />
          </TabsContent>
          <TabsContent
            value="audiences"
            id="marketing-tabpanel-audiences"
            className="mt-0 outline-none"
          >
            <SegmentsPanel segments={data.segments} onRefresh={load} />
          </TabsContent>
          <TabsContent
            value="templates"
            id="marketing-tabpanel-templates"
            className="mt-0 outline-none"
          >
            <TemplatesPanel templates={data.templates} onRefresh={load} />
          </TabsContent>
          <TabsContent
            value="journeys"
            id="marketing-tabpanel-journeys"
            className="mt-0 outline-none"
          >
            <JourneysPanel
              journeys={data.journeys}
              campaigns={data.campaigns}
              metrics={data.journeyMetrics}
              onRefresh={load}
            />
          </TabsContent>
        </Tabs>
      </m.div>
    </m.div>
  );
}
