import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  service: Object.fromEntries(
    [
      'listCampaigns',
      'listSegments',
      'listTemplates',
      'listJourneys',
      'getDashboard',
      'getOfferIntelligence',
      'getBreakdowns',
      'getJourneyMetrics',
      'getCheckoutRecoveryDashboard',
      'getAutopilotSnapshot',
      'getSubscriptionGrowth',
      'getCurrentSubscriptionSummary',
    ].map((key) => [key, vi.fn()])
  ),
  promos: vi.fn(),
}));
vi.mock('@/features/admin/services/MarketingService', () => ({ default: mocks.service }));
vi.mock('@/entities', () => ({ PromoCode: { list: mocks.promos } }));
vi.mock('@/components/admin/marketing/CommandStrip', () => ({
  default: () => <div>Command strip</div>,
  HubChecks: () => <div>Hub checks</div>,
}));
vi.mock('@/components/admin/marketing/AnalyticsPanel', () => ({
  default: () => <div>Analytics ready</div>,
}));
vi.mock('@/components/admin/marketing/CampaignsPanel', () => ({
  default: ({ onRefresh }) => <button onClick={() => onRefresh()}>Mutation refresh</button>,
}));
vi.mock('@/components/admin/marketing/SegmentsPanel', () => ({
  default: () => <div>Segments ready</div>,
}));
vi.mock('@/components/admin/marketing/TemplatesPanel', () => ({
  default: () => <div>Templates ready</div>,
}));
vi.mock('@/components/admin/marketing/JourneysPanel', () => ({
  default: () => <div>Journeys ready</div>,
}));
vi.mock('@/components/admin/marketing/AutopilotPanel', () => ({
  default: () => <div>Manual controls</div>,
}));
vi.mock('@/components/admin/marketing/AdminOperationsPanel', () => ({
  default: () => <div>Operations</div>,
}));
vi.mock('@/components/admin/marketing/GrowthDecisionPanel', () => ({
  default: () => <div>Growth ready</div>,
}));
vi.mock('@/components/admin/ui/primitives', () => ({
  ADMIN_TABS_LIST: '',
  ADMIN_TAB_TRIGGER: '',
  FADE_UP: {},
  STAGGER_CONTAINER: {},
  AdminPageHeader: ({ children, title }) => (
    <div>
      {title}
      {children}
    </div>
  ),
  AdminButton: ({ children, loading: _loading, ...props }) => (
    <button {...props}>{children}</button>
  ),
  AdminPageSkeleton: () => <div>Loading workspace</div>,
}));
import MarketingHub from '@/components/admin/marketing/MarketingHub';
function clickTab(name) {
  fireEvent.mouseDown(screen.getByRole('tab', { name }), { button: 0, ctrlKey: false });
}
describe('Marketing tab data loading', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    Object.values(mocks.service).forEach((fn) => fn.mockResolvedValue([]));
    mocks.promos.mockResolvedValue([]);
    HTMLElement.prototype.scrollIntoView = vi.fn();
  });
  it('loads only six initial datasets and reuses cached tab data', async () => {
    render(<MarketingHub />);
    await screen.findByText('Manual controls');
    expect(
      Object.values(mocks.service).reduce((n, fn) => n + fn.mock.calls.length, 0) +
        mocks.promos.mock.calls.length
    ).toBe(6);
    [
      'getDashboard',
      'getOfferIntelligence',
      'getBreakdowns',
      'getJourneyMetrics',
      'listTemplates',
      'listSegments',
    ].forEach((key) => expect(mocks.service[key]).not.toHaveBeenCalled());
    clickTab('Performance');
    await screen.findByText('Analytics ready');
    expect(mocks.service.getDashboard).toHaveBeenCalledTimes(1);
    expect(mocks.service.getSubscriptionGrowth).toHaveBeenCalledTimes(1);
    clickTab('Copilot');
    await screen.findByText('Manual controls');
    clickTab('Performance');
    await screen.findByText('Analytics ready');
    expect(mocks.service.getDashboard).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText('Refresh'));
    await waitFor(() => expect(mocks.service.getDashboard).toHaveBeenCalledTimes(2));
  });
  it('shows failed new-tab loading honestly and permits retry without automatic writes', async () => {
    mocks.service.getDashboard.mockRejectedValueOnce(new Error('offline')).mockResolvedValue([]);
    render(<MarketingHub />);
    await screen.findByText('Manual controls');
    clickTab('Performance');
    await screen.findByRole('alert');
    expect(screen.queryByText('Analytics ready')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Refresh'));
    await screen.findByText('Analytics ready');
  });
  it('does not expose empty metrics while a new tab is still loading', async () => {
    let finish;
    mocks.service.getDashboard.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      })
    );
    render(<MarketingHub />);
    await screen.findByText('Manual controls');
    clickTab('Performance');
    expect(screen.queryByText('Analytics ready')).not.toBeInTheDocument();
    await act(async () => finish([]));
    await screen.findByText('Analytics ready');
  });
});
