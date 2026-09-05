import { useMemo, useState } from 'react';
import { m } from 'framer-motion';
import {
  AlertTriangle,
  Ban,
  Eye,
  Megaphone,
  MoreHorizontal,
  Pause,
  Pencil,
  Play,
  Plus,
  Send,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/cn';
import MarketingService from '@/features/admin/services/MarketingService';
import {
  AdminButton,
  Empty,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  Pill,
  SIGNAL_BG,
  Tip,
  WELL,
} from '@/components/admin/ui/primitives';
import CampaignDialog from './dialogs/CampaignDialog';
import EmailPreviewDialog from './dialogs/EmailPreviewDialog';
import {
  CAMPAIGN_FILTERS,
  CHANNEL_SHORT,
  STATUS_TONE,
  blockingIssue,
  primaryAction,
} from './shared';

/** Icon-only secondary action. Label lives in the tooltip to keep the row short. */
const IconAction = ({ icon: Icon, label, onClick, loading }) => (
  <Tip content={label}>
    <AdminButton variant="outline" size="sm" onClick={onClick} loading={loading} aria-label={label}>
      {!loading && <Icon className="h-3 w-3" />}
    </AdminButton>
  </Tip>
);

const CampaignCard = ({
  campaign,
  estimate,
  estimating,
  onEdit,
  onPreview,
  onStatus,
  onDispatch,
  dispatching,
}) => {
  const issue = blockingIssue(campaign);
  const action = primaryAction(campaign);
  const tone = STATUS_TONE[campaign.status] || 'neutral';
  const isCore = campaign.objective === 'paid_conversion';

  return (
    <div className={cn(PANEL, 'relative flex flex-col overflow-hidden text-xs')}>
      {/* Status rail */}
      <span
        className={cn('absolute inset-y-0 left-0 w-[3px]', SIGNAL_BG[tone] || SIGNAL_BG.idle)}
      />

      <div className="flex items-start justify-between gap-1.5 p-2.5 pl-3.5 pb-1.5">
        <div className="min-w-0">
          <h3 className="truncate text-[12px] font-extrabold text-stone-900 dark:text-stone-50">
            {campaign.name}
          </h3>
          <p className={cn('truncate text-[10px] font-medium leading-tight', MUTED)}>
            {campaign.segment?.name || 'No audience'} · {campaign.objective.replaceAll('_', ' ')}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Pill tone={tone} className="px-1.5 py-0 text-[9px]">
            {campaign.status}
          </Pill>
          {isCore && (
            <Pill tone="accent" className="px-1.5 py-0 text-[9px]">
              core
            </Pill>
          )}
        </div>
      </div>

      <div className="space-y-1.5 px-2.5 pl-3.5">
        <div className={cn(WELL, 'rounded-md p-2')}>
          <p className="truncate text-[11px] font-bold leading-tight text-stone-800 dark:text-stone-100">
            {campaign.title}
          </p>
          <p className="mt-0.5 line-clamp-1 text-[10px] leading-snug text-stone-600 dark:text-stone-300">
            {campaign.message}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {campaign.channels.map((channel) => (
            <Pill key={channel} tone="neutral" className="px-1.5 py-0 text-[9px]">
              {CHANNEL_SHORT[channel] || channel.replace('_', ' ')}
            </Pill>
          ))}
          {campaign.promo?.code && (
            <Pill tone="warn" className="px-1.5 py-0 text-[9px]">
              {campaign.promo.code}
            </Pill>
          )}
        </div>
      </div>

      {issue && (
        <div className="ml-3.5 mr-2.5 mt-1.5 flex items-center gap-1 rounded border border-[rgb(var(--signal-warn)/0.3)] bg-[rgb(var(--signal-warn)/0.06)] px-2 py-1">
          <AlertTriangle className="h-2.5 w-2.5 shrink-0 text-[rgb(var(--signal-warn))]" />
          <span
            className={cn(
              MICRO,
              'truncate text-[9px] leading-tight text-[rgb(var(--signal-warn))]'
            )}
          >
            {issue}
          </span>
        </div>
      )}

      {/* Audience estimation */}
      <div className="mt-auto px-2.5 pl-3.5 pt-2">
        <button
          type="button"
          onClick={estimate}
          disabled={estimating || !campaign.segment_id}
          className={cn(
            'flex w-full items-center justify-between rounded border border-dashed border-stone-200 px-2 py-1 transition-colors hover:border-stone-300 disabled:cursor-default disabled:opacity-60 dark:border-white/10 dark:hover:border-white/20'
          )}
        >
          <span className={cn(MICRO, MUTED, 'flex items-center gap-1 text-[9px]')}>
            <Users className="h-2.5 w-2.5" />
            Audience
          </span>
          <span
            className={cn(
              NUM,
              'ml-1 truncate text-[10px] font-bold text-stone-700 dark:text-stone-200'
            )}
          >
            {estimating
              ? 'estimating…'
              : campaign.estimate
                ? `${campaign.estimate.total.toLocaleString()} · ${campaign.estimate.email_eligible.toLocaleString()} email`
                : 'tap to estimate'}
          </span>
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between gap-1.5 border-t border-stone-200/80 p-2 pl-3.5 dark:border-white/[0.07]">
        <span className={cn(NUM, 'truncate text-[9px] font-medium', MUTED)}>
          {campaign.cooldown_hours}h · cap {campaign.frequency_cap}
        </span>
        <div className="flex items-center gap-1">
          {campaign.channels.includes('email') && (
            <IconAction icon={Eye} label="Preview email" onClick={onPreview} />
          )}
          <IconAction icon={Pencil} label="Edit campaign" onClick={onEdit} />

          {action === 'activate' && (
            <AdminButton
              size="sm"
              disabled={Boolean(issue)}
              onClick={() =>
                onStatus(
                  campaign.starts_at && new Date(campaign.starts_at) > new Date()
                    ? 'scheduled'
                    : 'active'
                )
              }
              className="h-7 px-2 text-[11px]"
            >
              <Play className="mr-0.5 h-2.5 w-2.5" />
              Activate
            </AdminButton>
          )}
          {action === 'dispatch' && (
            <AdminButton
              size="sm"
              loading={dispatching}
              onClick={onDispatch}
              className="h-7 px-2 text-[11px]"
            >
              <Send className="mr-0.5 h-2.5 w-2.5" />
              Dispatch
            </AdminButton>
          )}

          {!['completed', 'cancelled'].includes(campaign.status) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <AdminButton
                  variant="ghost"
                  size="sm"
                  aria-label="More actions"
                  className="h-7 w-7 p-0"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </AdminButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {campaign.status === 'active' && (
                  <DropdownMenuItem
                    className="text-xs font-bold"
                    onClick={() => onStatus('paused')}
                  >
                    <Pause className="mr-2 h-3 w-3" />
                    Pause campaign
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="text-xs font-bold text-[rgb(var(--signal-fault))] focus:text-[rgb(var(--signal-fault))]"
                  onClick={() => onStatus('cancelled')}
                >
                  <Ban className="mr-2 h-3 w-3" />
                  Cancel campaign
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
};

const CampaignsPanel = ({ campaigns, segments, promos, templates, onRefresh }) => {
  const [editor, setEditor] = useState(null);
  const [previewCampaign, setPreviewCampaign] = useState(null);
  const [saving, setSaving] = useState(false);
  const [estimating, setEstimating] = useState(null);
  const [estimates, setEstimates] = useState({});
  const [dispatching, setDispatching] = useState(null);
  const [filter, setFilter] = useState('all');

  const save = async (payload) => {
    setSaving(true);
    try {
      if (editor?.id) await MarketingService.updateCampaign(editor.id, payload);
      else await MarketingService.createCampaign(payload);
      toast.success(editor?.id ? 'Campaign updated' : 'Campaign draft created');
      setEditor(null);
      onRefresh();
    } catch (error) {
      toast.error(error.message || 'Could not save campaign');
    } finally {
      setSaving(false);
    }
  };

  const estimate = async (campaign) => {
    if (!campaign.segment_id) return;
    setEstimating(campaign.id);
    try {
      const result = await MarketingService.estimateSegment(campaign.segment_id);
      setEstimates((value) => ({ ...value, [campaign.id]: result }));
    } catch (error) {
      toast.error(error.message || 'Could not estimate audience');
    } finally {
      setEstimating(null);
    }
  };

  const setStatus = async (campaign, status) => {
    try {
      await MarketingService.setCampaignStatus(campaign.id, status);
      toast.success(`Campaign ${status}`);
      onRefresh();
    } catch (error) {
      toast.error(error.message || 'Could not update campaign');
    }
  };

  const dispatch = async (campaign) => {
    setDispatching(campaign.id);
    try {
      const result = await MarketingService.dispatchCampaign(campaign.id);
      toast.success(`Campaign processed for ${result?.audience || 0} learners`);
      onRefresh();
    } catch (error) {
      toast.error(error.message || 'Could not dispatch campaign');
    } finally {
      setDispatching(null);
    }
  };

  // Live paid-conversion work sorts first, then anything else that is running,
  // then the rest alphabetically — the order an operator scans in.
  const ordered = useMemo(
    () =>
      [...campaigns].sort((a, b) => {
        const core = (c) => (c.objective === 'paid_conversion' ? 0 : 1);
        const live = (c) => (c.status === 'active' ? 0 : 1);
        return core(a) - core(b) || live(a) - live(b) || a.name.localeCompare(b.name);
      }),
    [campaigns]
  );

  const visible = useMemo(() => {
    const predicate = CAMPAIGN_FILTERS.find(([id]) => id === filter)?.[2] || (() => true);
    return ordered.filter(predicate);
  }, [ordered, filter]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="no-scrollbar flex items-center gap-1 overflow-x-auto max-w-full rounded-lg border border-stone-200/80 bg-stone-100 p-0.5 dark:border-white/[0.07] dark:bg-white/[0.04]">
          {CAMPAIGN_FILTERS.map(([id, label, predicate]) => {
            const count = ordered.filter(predicate).length;
            const isActive = id === filter;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={cn(
                  'relative flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-colors active:scale-[0.97]',
                  MICRO,
                  isActive
                    ? 'text-stone-900 dark:text-stone-50 font-bold'
                    : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'
                )}
              >
                {isActive && (
                  <m.span
                    layoutId="campaignFilterActivePill"
                    className="absolute inset-0 -z-10 rounded-md bg-white shadow-2xs dark:bg-[#131315]"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative z-10">{label}</span>
                <span className={cn(NUM, 'relative z-10 text-[10px] opacity-60')}>{count}</span>
              </button>
            );
          })}
        </div>
        <AdminButton
          onClick={() => setEditor({})}
          className="w-full sm:w-auto shrink-0 justify-center"
        >
          <Plus className="h-3.5 w-3.5" />
          New campaign
        </AdminButton>
      </div>

      {visible.length === 0 ? (
        <div className={PANEL}>
          <Empty
            icon={Megaphone}
            title={filter === 'all' ? 'No campaigns yet' : `Nothing ${filter}`}
            action={
              filter === 'all' ? (
                <AdminButton size="sm" onClick={() => setEditor({})}>
                  <Plus className="h-3 w-3" />
                  Create the first draft
                </AdminButton>
              ) : (
                <AdminButton size="sm" variant="outline" onClick={() => setFilter('all')}>
                  Show all campaigns
                </AdminButton>
              )
            }
          >
            {filter === 'all'
              ? 'Draft a campaign, estimate its audience, then activate it when the message reads right.'
              : 'No campaigns match this filter right now.'}
          </Empty>
        </div>
      ) : (
        <div className="grid gap-2.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={{ ...campaign, estimate: estimates[campaign.id] }}
              estimating={estimating === campaign.id}
              dispatching={dispatching === campaign.id}
              estimate={() => estimate(campaign)}
              onEdit={() => setEditor(campaign)}
              onPreview={() => setPreviewCampaign(campaign)}
              onStatus={(status) => setStatus(campaign, status)}
              onDispatch={() => dispatch(campaign)}
            />
          ))}
        </div>
      )}

      <CampaignDialog
        open={editor !== null}
        onOpenChange={(open) => !open && setEditor(null)}
        campaign={editor?.id ? editor : null}
        segments={segments}
        promos={promos}
        templates={templates}
        onSave={save}
        saving={saving}
      />
      <EmailPreviewDialog
        campaign={previewCampaign}
        open={previewCampaign !== null}
        onOpenChange={(open) => !open && setPreviewCampaign(null)}
      />
    </div>
  );
};

export default CampaignsPanel;
