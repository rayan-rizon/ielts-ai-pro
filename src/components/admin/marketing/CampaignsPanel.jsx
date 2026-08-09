import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Ban,
  Edit3,
  Eye,
  Megaphone,
  MoreHorizontal,
  Pause,
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
  TITLE,
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
    <div className={cn(PANEL, 'relative flex flex-col overflow-hidden')}>
      {/* Status rail — the card's state is readable before any text is. */}
      <span
        className={cn('absolute inset-y-0 left-0 w-[3px]', SIGNAL_BG[tone] || SIGNAL_BG.idle)}
      />

      <div className="flex items-start justify-between gap-3 p-4 pl-5">
        <div className="min-w-0">
          <h3 className={cn(TITLE, 'truncate')}>{campaign.name}</h3>
          <p className={cn('mt-1 truncate text-[11px] font-medium', MUTED)}>
            {campaign.segment?.name || 'No audience'} · {campaign.objective.replaceAll('_', ' ')}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Pill tone={tone}>{campaign.status}</Pill>
          {isCore && <Pill tone="accent">core</Pill>}
        </div>
      </div>

      <div className="px-4 pl-5">
        <div className={cn(WELL, 'rounded-lg p-3')}>
          <p className="text-xs font-extrabold leading-snug text-stone-800 dark:text-stone-100">
            {campaign.title}
          </p>
          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-stone-600 dark:text-stone-300">
            {campaign.message}
          </p>
        </div>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {campaign.channels.map((channel) => (
            <Pill key={channel} tone="neutral">
              {CHANNEL_SHORT[channel] || channel.replace('_', ' ')}
            </Pill>
          ))}
          {campaign.promo?.code && <Pill tone="warn">{campaign.promo.code}</Pill>}
        </div>
      </div>

      {issue && (
        <div className="ml-5 mr-4 mt-3 flex items-center gap-1.5 rounded-md border border-[rgb(var(--signal-warn)/0.3)] bg-[rgb(var(--signal-warn)/0.06)] px-2.5 py-1.5">
          <AlertTriangle className="h-3 w-3 shrink-0 text-[rgb(var(--signal-warn))]" />
          <span className={cn(MICRO, 'text-[rgb(var(--signal-warn))]')}>{issue}</span>
        </div>
      )}

      {/* Audience read-out sits on its own line so the action row stays short. */}
      <div className="mt-auto px-4 pl-5 pt-3">
        <button
          type="button"
          onClick={estimate}
          disabled={estimating || !campaign.segment_id}
          className={cn(
            'flex w-full items-center justify-between rounded-md border border-dashed border-stone-200 px-2.5 py-1.5 transition-colors hover:border-stone-300 disabled:cursor-default disabled:opacity-60 dark:border-white/10 dark:hover:border-white/20'
          )}
        >
          <span className={cn(MICRO, MUTED, 'flex items-center gap-1.5')}>
            <Users className="h-3 w-3" />
            Audience
          </span>
          <span className={cn(NUM, 'text-[11px] font-bold text-stone-700 dark:text-stone-200')}>
            {estimating
              ? 'estimating…'
              : campaign.estimate
                ? `${campaign.estimate.total.toLocaleString()} · ${campaign.estimate.email_eligible.toLocaleString()} email-ready`
                : 'tap to estimate'}
          </span>
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-stone-200/80 p-3 pl-5 dark:border-white/[0.07]">
        <span className={cn(NUM, 'text-[10px] font-bold', MUTED)}>
          {campaign.cooldown_hours}h cooldown · cap {campaign.frequency_cap}
        </span>
        <div className="flex items-center gap-1.5">
          {campaign.channels.includes('email') && (
            <IconAction icon={Eye} label="Preview email" onClick={onPreview} />
          )}
          <IconAction icon={Edit3} label="Edit campaign" onClick={onEdit} />

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
            >
              <Play className="h-3 w-3" />
              Activate
            </AdminButton>
          )}
          {action === 'dispatch' && (
            <AdminButton size="sm" loading={dispatching} onClick={onDispatch}>
              <Send className="h-3 w-3" />
              Dispatch
            </AdminButton>
          )}

          {!['completed', 'cancelled'].includes(campaign.status) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <AdminButton variant="ghost" size="sm" aria-label="More actions">
                  <MoreHorizontal className="h-3.5 w-3.5" />
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-stone-200/80 bg-stone-100 p-0.5 dark:border-white/[0.07] dark:bg-white/[0.04]">
          {CAMPAIGN_FILTERS.map(([id, label, predicate]) => {
            const count = ordered.filter(predicate).length;
            const isActive = id === filter;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-all active:scale-[0.97]',
                  MICRO,
                  isActive
                    ? 'bg-white text-stone-900 shadow-2xs dark:bg-[#131315] dark:text-stone-50'
                    : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'
                )}
              >
                {label}
                <span className={cn(NUM, 'text-[10px] opacity-60')}>{count}</span>
              </button>
            );
          })}
        </div>
        <AdminButton onClick={() => setEditor({})}>
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
        <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
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
