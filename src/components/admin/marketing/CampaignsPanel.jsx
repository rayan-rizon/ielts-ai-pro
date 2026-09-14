import { m, AnimatePresence } from 'framer-motion';
import { useMemo, useState } from 'react';
import {
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
  FilterRail,
  MICRO,
  MUTED,
  NUM,
  Notice,
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
    <m.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        PANEL,
        'relative flex flex-col overflow-hidden text-xs transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-xs hover:border-stone-300 dark:hover:border-white/20'
      )}
    >
      {/* Status rail */}
      <span
        className={cn('absolute inset-y-0 left-0 w-[3px]', SIGNAL_BG[tone] || SIGNAL_BG.idle)}
      />

      <div className="flex items-start justify-between gap-1.5 px-3 pb-2 pl-4 pt-2.5">
        <div className="min-w-0">
          <h3 className="truncate text-[12px] font-extrabold text-stone-900 dark:text-stone-50">
            {campaign.name}
          </h3>
          <p className={cn('truncate text-[10px] font-medium leading-tight', MUTED)}>
            {campaign.segment?.name || 'No audience'} · {campaign.objective.replaceAll('_', ' ')}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {isCore && <Pill tone="accent">core</Pill>}
          <Pill tone={tone}>{campaign.status}</Pill>
        </div>
      </div>

      <div className="space-y-2 px-3 pl-4">
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
            <Pill key={channel} tone="neutral">
              {CHANNEL_SHORT[channel] || channel.replace('_', ' ')}
            </Pill>
          ))}
          {campaign.promo?.code && <Pill tone="warn">{campaign.promo.code}</Pill>}
        </div>
        {issue && <Notice tone="warn" title={issue} />}
      </div>

      {/* Audience estimation — the figure that decides whether this is worth
          dispatching, so it sits directly above the action row. */}
      <div className="mt-auto px-3 pl-4 pt-2">
        <button
          type="button"
          onClick={estimate}
          disabled={estimating || !campaign.segment_id}
          className="flex w-full items-center justify-between gap-2 rounded-md border border-dashed border-stone-200 px-2 py-1.5 transition-colors hover:border-stone-300 hover:bg-stone-50 disabled:cursor-default disabled:opacity-60 disabled:hover:bg-transparent dark:border-white/10 dark:hover:border-white/20 dark:hover:bg-white/[0.03]"
        >
          <span className={cn(MICRO, MUTED, 'flex items-center gap-1')}>
            <Users className="h-2.5 w-2.5" />
            Audience
          </span>
          <span
            className={cn(NUM, 'truncate text-[10px] font-bold text-stone-700 dark:text-stone-200')}
          >
            {estimating
              ? 'estimating…'
              : campaign.estimate
                ? `${campaign.estimate.total.toLocaleString()} · ${campaign.estimate.email_eligible.toLocaleString()} email`
                : 'tap to estimate'}
          </span>
        </button>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-1.5 border-t border-stone-200/80 px-3 py-2 pl-4 dark:border-white/[0.07]">
        <Tip
          content={`At most ${campaign.frequency_cap} message${campaign.frequency_cap === 1 ? '' : 's'} per learner, ${campaign.cooldown_hours}h apart`}
        >
          <span
            className={cn(NUM, 'shrink-0 cursor-default truncate text-[9px] font-medium', MUTED)}
          >
            {campaign.cooldown_hours}h · cap {campaign.frequency_cap}
          </span>
        </Tip>
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
            >
              <Play className="h-2.5 w-2.5" />
              Activate
            </AdminButton>
          )}
          {action === 'dispatch' && (
            <AdminButton size="sm" loading={dispatching} onClick={onDispatch}>
              <Send className="h-2.5 w-2.5" />
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
    </m.div>
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
        <FilterRail
          layoutId="campaignFilterActivePill"
          value={filter}
          onChange={setFilter}
          options={CAMPAIGN_FILTERS.map(([id, label, predicate]) => ({
            id,
            label,
            count: ordered.filter(predicate).length,
          }))}
        />
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
          <AnimatePresence mode="popLayout">
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
          </AnimatePresence>
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
