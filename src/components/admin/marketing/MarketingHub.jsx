import { useCallback, useEffect, useRef, useState } from 'react';
import { useLatestRequest } from '@/hooks/admin/useLatestRequest';
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
import CommandStrip, { HubChecks } from './CommandStrip';
import AnalyticsPanel from './AnalyticsPanel';
import CampaignsPanel from './CampaignsPanel';
import SegmentsPanel from './SegmentsPanel';
import TemplatesPanel from './TemplatesPanel';
import JourneysPanel from './JourneysPanel';
import AutopilotPanel from './AutopilotPanel';
import AdminOperationsPanel from './AdminOperationsPanel';
import GrowthDecisionPanel from './GrowthDecisionPanel';

/**
 * Tab order follows the operator's loop rather than the data model: read the
 * numbers, act on campaigns, then maintain the reusable pieces behind them.
 * "Segments" is labelled Audiences here — the stored entity keeps its name, but
 * nobody scanning a nav bar is looking for a segment.
 */
const TABS = [
  ['copilot', 'Copilot', BrainCircuit, 'Decide what happens next'],
  ['performance', 'Performance', BarChart3, 'What the last 30 days actually produced'],
  ['campaigns', 'Campaigns', Megaphone, 'The messages that go out'],
  ['audiences', 'Audiences', Users, 'Who each message reaches'],
  ['templates', 'Templates', FileText, 'Reusable starting points'],
  ['journeys', 'Journeys', Workflow, 'Automations that send on a trigger'],
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
  currentSubscriptions: { total: 0, pro: 0, premium: 0 },
};

const COMMON_KEYS = ['campaigns', 'journeys', 'recovery', 'autopilot'];
const TAB_KEYS = {
  copilot: ['growth', 'currentSubscriptions'],
  performance: ['growth', 'currentSubscriptions', 'dashboard', 'intelligence', 'breakdowns'],
  campaigns: ['segments', 'promos', 'templates'],
  audiences: ['segments'],
  templates: ['templates'],
  journeys: ['journeyMetrics'],
};

export default function MarketingHub() {
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [tab, setTab] = useState('copilot');
  const [data, setData] = useState(EMPTY_DATA);
  const [loadError, setLoadError] = useState('');
  const loaded = useRef(new Set());
  const inFlight = useRef(new Map());
  const navigationRequest = useRef(0);
  const gate = useLatestRequest();

  const load = useCallback(
    async (force = true) => {
      const request = gate.start();
      if (force) {
        loaded.current.clear();
        inFlight.current.clear();
      }
      setLoading(true);
      try {
        const loaders = {
          campaigns: () => MarketingService.listCampaigns(),
          segments: () => MarketingService.listSegments(),
          templates: () => MarketingService.listTemplates(),
          promos: () => PromoCode.list(),
          journeys: () => MarketingService.listJourneys(),
          dashboard: () => MarketingService.getDashboard(30),
          intelligence: () => MarketingService.getOfferIntelligence(),
          breakdowns: () => MarketingService.getBreakdowns(30),
          journeyMetrics: () => MarketingService.getJourneyMetrics(30),
          recovery: () => MarketingService.getCheckoutRecoveryDashboard(),
          autopilot: () => MarketingService.getAutopilotSnapshot(30),
          growth: () => MarketingService.getSubscriptionGrowth(),
          currentSubscriptions: () => MarketingService.getCurrentSubscriptionSummary(),
        };
        const keys = [...COMMON_KEYS, ...TAB_KEYS[tab]].filter((key) => !loaded.current.has(key));
        const values = await Promise.all(
          keys.map((key) => {
            if (!inFlight.current.has(key)) inFlight.current.set(key, loaders[key]());
            return inFlight.current.get(key);
          })
        );
        if (!gate.isCurrent(request)) return;
        keys.forEach((key) => {
          loaded.current.add(key);
          inFlight.current.delete(key);
        });
        setData((old) => ({
          ...old,
          ...Object.fromEntries(keys.map((key, index) => [key, values[index]])),
        }));
        setLoadError('');
      } catch (error) {
        if (!gate.isCurrent(request)) return;
        inFlight.current.clear();
        console.error('Marketing hub load failed:', error);
        toast.error(error.message || 'Could not load the Marketing hub');
        setLoadError(
          'Could not refresh this workspace. Retry with Refresh; previously loaded data is retained.'
        );
      } finally {
        if (gate.isCurrent(request)) {
          setLoading(false);
          setInitialized(true);
        }
      }
    },
    [tab, gate]
  );

  useEffect(() => {
    load(false);
    return gate.invalidate;
  }, [load, gate]);

  const navigateToTab = useCallback((nextTab) => {
    if (!TABS.some(([value]) => value === nextTab)) return;
    const navigation = ++navigationRequest.current;
    setTab(nextTab);
    requestAnimationFrame(() => {
      if (navigation !== navigationRequest.current) return;
      document.getElementById(`marketing-tab-${nextTab}`)?.focus();
      document.getElementById(`marketing-tabpanel-${nextTab}`)?.scrollIntoView({
        block: 'start',
        behavior: 'smooth',
      });
    });
  }, []);

  useEffect(
    () => () => {
      navigationRequest.current += 1;
    },
    []
  );

  const ready = [...COMMON_KEYS, ...TAB_KEYS[tab]].every((key) => loaded.current.has(key));
  if (!initialized) return <AdminPageSkeleton kpis={5} panels={2} />;

  return (
    <m.div
      variants={STAGGER_CONTAINER}
      initial="hidden"
      animate="visible"
      className="space-y-5 pb-10 pt-12 md:pt-0 min-w-0 max-w-full"
    >
      <m.div variants={FADE_UP}>
        <AdminPageHeader
          title="Marketing"
          description="Grow subscriptions. Review actions. Follow results."
        >
          <AdminButton variant="outline" onClick={() => load()} loading={loading}>
            <RefreshCcw className="h-3.5 w-3.5" />
            Refresh
          </AdminButton>
        </AdminPageHeader>
      </m.div>
      {loadError && (
        <p role="alert" className="text-xs text-amber-700 dark:text-amber-300">
          {loadError}
        </p>
      )}

      {/* Misconfiguration is a property of the hub, not of one tab — a stalled
          journey matters just as much while an operator is writing a campaign,
          so the checks stay above the tab bar rather than inside Performance. */}
      {COMMON_KEYS.every((key) => loaded.current.has(key)) && (
        <m.div variants={FADE_UP}>
          <HubChecks
            campaigns={data.campaigns}
            journeys={data.journeys}
            recovery={data.recovery}
            autopilot={data.autopilot}
            onNavigate={navigateToTab}
          />
        </m.div>
      )}

      <m.div variants={FADE_UP}>
        <Tabs
          value={tab}
          onValueChange={navigateToTab}
          className="space-y-4 border-t border-stone-200/80 pt-4 dark:border-white/[0.07] min-w-0 max-w-full"
        >
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 min-w-0 max-w-full">
            <div className="no-scrollbar touch-pan-x overflow-x-auto pb-1 w-full sm:w-auto">
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
            <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400 break-words">
              {TABS.find(([value]) => value === tab)?.[3]}
            </p>
          </div>

          <TabsContent
            value="copilot"
            id="marketing-tabpanel-copilot"
            className="mt-0 space-y-4 outline-none min-w-0 max-w-full"
          >
            {ready ? (
              <m.div
                initial={{ opacity: 0, y: 6, filter: 'blur(2px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-4 min-w-0 max-w-full"
              >
                <GrowthDecisionPanel
                  growth={data.growth}
                  currentSubscriptions={data.currentSubscriptions}
                  compact
                />
                <AdminOperationsPanel refreshKey={data.autopilot} />
                <AutopilotPanel
                  autopilot={data.autopilot}
                  onRefresh={load}
                  onNavigate={navigateToTab}
                />
              </m.div>
            ) : loading ? (
              <AdminPageSkeleton kpis={3} panels={1} />
            ) : (
              <p className="text-xs text-stone-500">Data unavailable. Use Refresh to try again.</p>
            )}
          </TabsContent>
          <TabsContent
            value="performance"
            id="marketing-tabpanel-performance"
            className="mt-0 space-y-4 outline-none min-w-0 max-w-full"
          >
            {ready ? (
              <m.div
                initial={{ opacity: 0, y: 6, filter: 'blur(2px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-4 min-w-0 max-w-full"
              >
                <GrowthDecisionPanel
                  growth={data.growth}
                  currentSubscriptions={data.currentSubscriptions}
                />
                <CommandStrip campaigns={data.campaigns} dashboard={data.dashboard} />
                <AnalyticsPanel
                  dashboard={data.dashboard}
                  intelligence={data.intelligence}
                  breakdowns={data.breakdowns}
                  recovery={data.recovery}
                />
              </m.div>
            ) : loading ? (
              <AdminPageSkeleton kpis={3} panels={1} />
            ) : (
              <p className="text-xs text-stone-500">Data unavailable. Use Refresh to try again.</p>
            )}
          </TabsContent>
          <TabsContent
            value="campaigns"
            id="marketing-tabpanel-campaigns"
            className="mt-0 outline-none min-w-0 max-w-full"
          >
            {ready ? (
              <m.div
                initial={{ opacity: 0, y: 6, filter: 'blur(2px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="min-w-0 max-w-full"
              >
                <CampaignsPanel
                  campaigns={data.campaigns}
                  segments={data.segments}
                  promos={data.promos}
                  templates={data.templates}
                  onRefresh={load}
                />
              </m.div>
            ) : loading ? (
              <AdminPageSkeleton kpis={3} panels={1} />
            ) : (
              <p className="text-xs text-stone-500">Data unavailable. Use Refresh to try again.</p>
            )}
          </TabsContent>
          <TabsContent
            value="audiences"
            id="marketing-tabpanel-audiences"
            className="mt-0 outline-none min-w-0 max-w-full"
          >
            {ready ? (
              <m.div
                initial={{ opacity: 0, y: 6, filter: 'blur(2px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="min-w-0 max-w-full"
              >
                <SegmentsPanel segments={data.segments} onRefresh={load} />
              </m.div>
            ) : loading ? (
              <AdminPageSkeleton kpis={3} panels={1} />
            ) : (
              <p className="text-xs text-stone-500">Data unavailable. Use Refresh to try again.</p>
            )}
          </TabsContent>
          <TabsContent
            value="templates"
            id="marketing-tabpanel-templates"
            className="mt-0 outline-none min-w-0 max-w-full"
          >
            {ready ? (
              <m.div
                initial={{ opacity: 0, y: 6, filter: 'blur(2px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="min-w-0 max-w-full"
              >
                <TemplatesPanel templates={data.templates} onRefresh={load} />
              </m.div>
            ) : loading ? (
              <AdminPageSkeleton kpis={3} panels={1} />
            ) : (
              <p className="text-xs text-stone-500">Data unavailable. Use Refresh to try again.</p>
            )}
          </TabsContent>
          <TabsContent
            value="journeys"
            id="marketing-tabpanel-journeys"
            className="mt-0 outline-none min-w-0 max-w-full"
          >
            {ready ? (
              <m.div
                initial={{ opacity: 0, y: 6, filter: 'blur(2px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="min-w-0 max-w-full"
              >
                <JourneysPanel
                  journeys={data.journeys}
                  campaigns={data.campaigns}
                  metrics={data.journeyMetrics}
                  onRefresh={load}
                />
              </m.div>
            ) : loading ? (
              <AdminPageSkeleton kpis={3} panels={1} />
            ) : (
              <p className="text-xs text-stone-500">Data unavailable. Use Refresh to try again.</p>
            )}
          </TabsContent>
        </Tabs>
      </m.div>
    </m.div>
  );
}
