import { Workflow } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/cn';
import MarketingService from '@/features/admin/services/MarketingService';
import {
  Empty,
  FieldLabel,
  MICRO,
  MUTED,
  NUM,
  Notice,
  PANEL,
  Pill,
  SIGNAL_BG,
  WELL,
} from '@/components/admin/ui/primitives';
import { JOURNEY_STATE_TONE, journeyState, STATUS_TONE } from './shared';

/**
 * Journeys are automations, so the question a card must answer is "is this
 * armed, and is it working?". Metrics are ordered along that story — enrolled
 * in, converted out, and the three ways a learner leaves without converting —
 * with failures given signal colour because they are the only figure here that
 * means something is broken.
 */
const METRIC_ROW = [
  ['Enrolled', 'enrolled', 'neutral'],
  ['Converted', 'converted', 'ok'],
  ['Exited', 'exited', 'neutral'],
  ['Cooldown', 'cooldown_skips', 'neutral'],
  ['Failed', 'failures', 'fault'],
];

const JourneysPanel = ({ journeys, campaigns, metrics, onRefresh }) => {
  const toggle = async (journey, checked) => {
    try {
      await MarketingService.updateJourney(journey.id, { is_active: checked });
      toast.success(`${journey.name} ${checked ? 'enabled' : 'paused'}`);
      onRefresh();
    } catch (error) {
      toast.error(error.message || 'Could not update journey');
    }
  };

  const assign = async (journey, campaignId) => {
    try {
      await MarketingService.updateJourney(journey.id, { campaign_id: campaignId || null });
      toast.success('Journey campaign updated');
      onRefresh();
    } catch (error) {
      toast.error(error.message || 'Could not update journey');
    }
  };

  if (!journeys.length) {
    return (
      <div className={PANEL}>
        <Empty icon={Workflow} title="No journeys configured">
          Journeys are trigger-based automations defined server-side. Once one exists it appears
          here, ready to be pointed at a campaign.
        </Empty>
      </div>
    );
  }

  return (
    <div className="grid gap-2.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {journeys.map((journey) => {
        const metric = metrics.find((row) => row.id === journey.id) || {};
        const state = journeyState(journey, campaigns);
        const assigned = campaigns.find((item) => item.id === journey.campaign_id);
        const tone = JOURNEY_STATE_TONE[state];
        return (
          <div
            key={journey.id}
            className={cn(PANEL, 'relative flex flex-col overflow-hidden p-3 pl-4 text-xs')}
          >
            <span
              className={cn('absolute inset-y-0 left-0 w-[3px]', SIGNAL_BG[tone] || SIGNAL_BG.idle)}
            />
            <div className="flex items-start justify-between gap-1.5">
              <div className="min-w-0">
                <h3 className="truncate text-[12px] font-extrabold text-stone-900 dark:text-stone-50">
                  {journey.name}
                </h3>
                <p className={cn('truncate text-[10px] font-medium leading-tight', MUTED)}>
                  {journey.trigger_type.replaceAll('_', ' ')} ·{' '}
                  {journey.segment?.name || 'no segment'} · {journey.cooldown_hours}h cooldown
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Pill tone={tone}>{state}</Pill>
                <Switch
                  aria-label={`Toggle ${journey.name}`}
                  checked={journey.is_active}
                  disabled={state === 'unarmed'}
                  onCheckedChange={(checked) => toggle(journey, checked)}
                />
              </div>
            </div>

            <div className="mt-2.5 block">
              <FieldLabel className="text-[10px]">Campaign</FieldLabel>
              <Select
                value={journey.campaign_id || 'none'}
                onValueChange={(val) => assign(journey, val === 'none' ? '' : val)}
              >
                <SelectTrigger className="h-7 w-full px-2 text-[11px] bg-stone-50 dark:bg-white/[0.04] border border-stone-200 dark:border-white/10 rounded-md focus:ring-1 focus:ring-[#5a63df]/50">
                  <SelectValue placeholder="Choose campaign…" />
                </SelectTrigger>
                <SelectContent className="dark:bg-[#16151a] dark:border-white/10 text-xs z-50">
                  <SelectItem value="none" className="text-[11px] text-stone-400">
                    Choose campaign…
                  </SelectItem>
                  {campaigns.map((campaign) => (
                    <SelectItem
                      key={campaign.id}
                      value={campaign.id}
                      className="text-[11px] py-1.5 cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-3 w-full pr-2">
                        <span className="truncate font-medium">{campaign.name}</span>
                        <Pill tone={STATUS_TONE[campaign.status] || 'neutral'} className="shrink-0">
                          {campaign.status}
                        </Pill>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {state === 'unarmed' && (
              <Notice tone="warn" className="mt-2" title="Assign a campaign to arm this journey" />
            )}

            {state === 'stalled' && (
              <Notice tone="fault" className="mt-2" title="Switched on but sending nothing">
                “{assigned?.name}” is {assigned?.status}. Activate the campaign or switch this off.
              </Notice>
            )}

            <div className={cn(WELL, 'mt-auto grid grid-cols-5 gap-1 rounded-md p-2 mt-2.5')}>
              {METRIC_ROW.map(([label, key, tone]) => {
                const value = Number(metric[key] || 0);
                return (
                  <div key={key}>
                    <p className={cn(MICRO, MUTED, 'text-[8px] truncate')}>{label}</p>
                    <p
                      className={cn(
                        NUM,
                        'mt-0.5 text-xs font-bold',
                        tone === 'fault' && value > 0
                          ? 'text-[rgb(var(--signal-fault))]'
                          : tone === 'ok' && value > 0
                            ? 'text-[rgb(var(--signal-ok))]'
                            : 'text-stone-800 dark:text-stone-100'
                      )}
                    >
                      {value.toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </div>
            <p className={cn(MICRO, MUTED, 'mt-1.5 text-[9px]')}>Last 30 days</p>
          </div>
        );
      })}
    </div>
  );
};

export default JourneysPanel;
