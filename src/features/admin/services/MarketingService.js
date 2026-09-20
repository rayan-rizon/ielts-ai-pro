import { supabase } from '@/lib/supabase';
import { readAdminRpc } from './adminReadRpc';

// Both directions are linked in the schema: a campaign can select a promo and
// a promo can record its owning campaign. Pin the embed to the campaign's
// promo_code_id foreign key; keep comments outside the PostgREST select string.
const CAMPAIGN_SELECT = `
  *,
  segment:marketing_segments(id,name,description,rules),
  promo:promo_codes!marketing_campaigns_promo_code_id_fkey(id,code,label,discount_type,discount_value)
`;

const normalizeCampaign = (campaign) => ({
  ...campaign,
  channels: Array.isArray(campaign.channels) ? campaign.channels : ['in_app'],
  starts_at: campaign.starts_at || null,
  ends_at: campaign.ends_at || null,
  segment_id: campaign.segment_id || null,
  promo_code_id: campaign.promo_code_id || null,
});

const throwInvocationError = async (error) => {
  if (!error) return;
  let message = error.message || 'The server action failed';
  const response = error.context;
  if (response && typeof response.clone === 'function') {
    try {
      const payload = await response.clone().json();
      if (typeof payload?.error === 'string' && payload.error.trim()) message = payload.error;
    } catch {
      // Keep the SDK message when the function did not return JSON.
    }
  }
  throw new Error(message);
};

export const MarketingService = {
  async adminReport(action, parameters = {}) {
    const { data, error } = await supabase.functions.invoke('retention-autopilot', {
      body: { ...parameters, action },
    });
    await throwInvocationError(error);
    if (data?.error) throw new Error(data.error);
    return data;
  },
  async listCampaigns() {
    const { data, error } = await supabase
      .from('marketing_campaigns')
      .select(CAMPAIGN_SELECT)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async createCampaign(campaign) {
    const { data, error } = await supabase
      .from('marketing_campaigns')
      .insert(normalizeCampaign(campaign))
      .select(CAMPAIGN_SELECT)
      .single();
    if (error) throw error;
    return data;
  },

  async updateCampaign(id, campaign) {
    const { data, error } = await supabase
      .from('marketing_campaigns')
      .update({ ...campaign, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(CAMPAIGN_SELECT)
      .single();
    if (error) throw error;
    return data;
  },

  async setCampaignStatus(id, status) {
    return this.updateCampaign(id, {
      status,
      ...(status === 'active' ? { activated_at: new Date().toISOString() } : {}),
      ...(status === 'completed' ? { completed_at: new Date().toISOString() } : {}),
    });
  },

  async deleteCampaign(id) {
    const { error } = await supabase.from('marketing_campaigns').delete().eq('id', id);
    if (error) throw error;
  },

  async dispatchCampaign(id) {
    const { data, error } = await supabase.functions.invoke('marketing-campaign-dispatch', {
      body: { campaign_id: id },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  },

  async listSegments() {
    const { data, error } = await supabase.from('marketing_segments').select('*').order('name');
    if (error) throw error;
    return data || [];
  },

  async createSegment(segment) {
    const { data, error } = await supabase
      .from('marketing_segments')
      .insert(segment)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateSegment(id, patch) {
    const { data, error } = await supabase
      .from('marketing_segments')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteSegment(id) {
    const { error } = await supabase.from('marketing_segments').delete().eq('id', id);
    if (error) throw error;
  },

  async listTemplates() {
    const { data, error } = await supabase
      .from('marketing_campaign_templates')
      .select('*')
      .order('name');
    if (error) throw error;
    return data || [];
  },

  async createTemplate(template) {
    const { data, error } = await supabase
      .from('marketing_campaign_templates')
      .insert(template)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateTemplate(id, patch) {
    const { data, error } = await supabase
      .from('marketing_campaign_templates')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async estimateSegment(id) {
    const { data, error } = await supabase.rpc('estimate_marketing_segment', {
      p_segment_id: id,
    });
    if (error) throw error;
    return data || { total: 0, email_eligible: 0, email_suppressed: 0 };
  },

  async getDashboard(days = 30) {
    const { data, error } = await supabase.rpc('get_marketing_dashboard', { p_days: days });
    if (error) throw error;
    return data || { campaigns: [], revenue: [], totals: {} };
  },

  async getCheckoutRecoveryDashboard() {
    const { data, error } = await supabase.rpc('get_checkout_recovery_dashboard');
    if (error) throw error;
    return data || { waiting: 0, eligible: 0, sent: 0, recovered: 0, conversion_rate: 0 };
  },

  async getOfferIntelligence() {
    const { data, error } = await supabase.rpc('get_marketing_offer_intelligence');
    if (error) throw error;
    return data || { promos: [], referrals: [] };
  },

  async getBreakdowns(days = 30) {
    const { data, error } = await supabase.rpc('get_marketing_breakdowns', { p_days: days });
    if (error) throw error;
    return data || { delivery_channels: [], acquisition_sources: [], plans: [], first_touch: [] };
  },

  async getJourneyMetrics(days = 30) {
    const { data, error } = await supabase.rpc('get_marketing_journey_metrics', { p_days: days });
    if (error) throw error;
    return data || [];
  },

  async getAutopilotSnapshot(days = 30) {
    try {
      return (
        (await readAdminRpc(supabase, 'get_marketing_autopilot_snapshot', { p_days: days })) || {
          policies: [],
          recommendations: [],
          interventions: [],
          channels: [],
          counts: {},
        }
      );
    } catch (error) {
      if (['42883', 'PGRST202'].includes(error?.code))
        return {
          policies: [],
          recommendations: [],
          interventions: [],
          channels: [],
          counts: {},
        };
      throw error;
    }
  },

  async getSubscriptionGrowth(since = '2026-08-01T00:00:00.000Z') {
    try {
      return (
        (await readAdminRpc(supabase, 'get_subscription_growth_dashboard', {
          p_since: since,
        })) || null
      );
    } catch (error) {
      if (['42883', 'PGRST202'].includes(error?.code)) {
        return {
          unavailable: true,
          since,
          stages: [],
          countries: [],
          selected_plans: [],
          cohorts: [],
        };
      }
      throw error;
    }
  },

  async getCurrentSubscriptionSummary() {
    const overview = await readAdminRpc(supabase, 'get_admin_overview', { p_days: 30 });
    return overview?.kpis?.paying || { total: 0, pro: 0, premium: 0 };
  },

  async updateAutopilotPolicy(id, patch) {
    const { data, error } = await supabase.rpc('set_marketing_autopilot_policy_state', {
      p_policy_id: id,
      p_enabled: typeof patch.enabled === 'boolean' ? patch.enabled : null,
      p_mode: patch.mode || null,
    });
    if (error) throw error;
    return data;
  },

  async runAutopilot({ dryRun = false } = {}) {
    const { data, error } = await supabase.functions.invoke('retention-autopilot', {
      body: { dry_run: dryRun },
    });
    await throwInvocationError(error);
    if (data?.error) throw new Error(data.error);
    return data;
  },

  async analyzeAutopilot() {
    const { data, error } = await supabase.functions.invoke('retention-autopilot', {
      body: { action: 'analyze' },
    });
    await throwInvocationError(error);
    if (data?.error) throw new Error(data.error);
    return data;
  },

  async copilotRequest(body) {
    // Older workers treat unknown actions as reconciliation. Probe with dry_run
    // before using the new action contract, so an old deployment cannot send.
    const capability = await supabase.functions.invoke('retention-autopilot', {
      body: { action: 'copilot_capabilities', dry_run: true },
    });
    await throwInvocationError(capability.error);
    if (capability.data?.version !== 1)
      throw new Error(
        'The Copilot worker update is not deployed yet. Review actions will be available after deployment.'
      );
    const { data, error } = await supabase.functions.invoke('retention-autopilot', { body });
    await throwInvocationError(error);
    if (data?.error) throw new Error(data.error);
    return data;
  },

  async getCopilotState(offset = 0) {
    try {
      return await this.copilotRequest({ action: 'copilot_snapshot', offset });
    } catch (error) {
      // Keep the workspace useful while the new worker rolls out. The existing
      // snapshot is read-only and already contains prepared interventions, so
      // it is safe to show as review mode without pretending live actions work.
      if (!/copilot worker update|not deployed|unsupported action/i.test(error?.message || ''))
        throw error;

      const snapshot = await this.getAutopilotSnapshot(30);
      const interventions = Array.isArray(snapshot?.interventions) ? snapshot.interventions : [];
      const queue = interventions
        .filter((item) => ['needs_approval', 'prepared'].includes(item.status))
        .map((item) => ({
          ...item,
          updated_at: item.updated_at || item.created_at || null,
        }));
      const history = interventions
        .filter((item) => !['needs_approval', 'prepared'].includes(item.status))
        .map((item) => ({
          ...item,
          updated_at: item.updated_at || item.created_at || item.sent_at || null,
        }));

      return {
        queue: queue.slice(offset, offset + 20),
        total: Number(snapshot?.counts?.prepared ?? queue.length),
        history,
        monitor: null,
        offset,
        available: false,
        setupPending: true,
        setupMessage:
          'Review mode is ready. Live prepare, rewrite, approve, and dismiss actions will activate after the Copilot worker update is deployed.',
      };
    }
  },

  async prepareCopilotActions() {
    return this.copilotRequest({ action: 'prepare_actions' });
  },

  async dismissIntervention(id, revision) {
    return this.copilotRequest({ action: 'dismiss', intervention_id: id, revision });
  },

  async approveIntervention(id, revision) {
    return this.copilotRequest({ action: 'approve', intervention_id: id, revision });
  },

  async generateInterventionCopy(id) {
    const { data, error } = await supabase.functions.invoke('retention-autopilot', {
      body: { action: 'generate_copy', intervention_id: id },
    });
    await throwInvocationError(error);
    if (data?.error) throw new Error(data.error);
    return data;
  },

  async updateRecommendation(id, status) {
    const { data, error } = await supabase
      .from('marketing_admin_recommendations')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async listJourneys() {
    const { data, error } = await supabase
      .from('marketing_journeys')
      .select(
        '*, segment:marketing_segments(id,name), campaign:marketing_campaigns(id,name,status)'
      )
      .order('created_at');
    if (error) throw error;
    return data || [];
  },

  async updateJourney(id, patch) {
    const { data, error } = await supabase
      .from('marketing_journeys')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(
        '*, segment:marketing_segments(id,name), campaign:marketing_campaigns(id,name,status)'
      )
      .single();
    if (error) throw error;
    return data;
  },
};

export default MarketingService;
