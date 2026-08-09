import { AlertTriangle, Workflow } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/cn';
import MarketingService from '@/features/admin/services/MarketingService';
import {
  Empty,
  FIELD,
  FieldLabel,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  Pill,
  SIGNAL_BG,
  TITLE,
  WELL,
} from '@/components/admin/ui/primitives';

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
    <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
      {journeys.map((journey) => {
        const metric = metrics.find((row) => row.id === journey.id) || {};
        const unarmed = !journey.campaign_id;
        const running = journey.is_active && !unarmed;
        return (
          <div
            key={journey.id}
            className={cn(PANEL, 'relative flex flex-col overflow-hidden p-4 pl-5')}
          >
            <span
              className={cn(
                'absolute inset-y-0 left-0 w-[3px]',
                running ? SIGNAL_BG.ok : unarmed ? SIGNAL_BG.warn : SIGNAL_BG.idle
              )}
            />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className={cn(TITLE, 'truncate')}>{journey.name}</h3>
                <p className={cn('mt-1 truncate text-[11px] font-medium', MUTED)}>
                  {journey.trigger_type.replaceAll('_', ' ')} ·{' '}
                  {journey.segment?.name || 'no segment'} · {journey.cooldown_hours}h cooldown
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Pill tone={running ? 'ok' : unarmed ? 'warn' : 'neutral'}>
                  {running ? 'running' : unarmed ? 'unarmed' : 'paused'}
                </Pill>
                <Switch
                  aria-label={`Toggle ${journey.name}`}
                  checked={journey.is_active}
                  disabled={unarmed}
                  onCheckedChange={(checked) => toggle(journey, checked)}
                />
              </div>
            </div>

            <label className="mt-3 block">
              <FieldLabel>Campaign</FieldLabel>
              <select
                className={cn(FIELD, 'w-full px-3')}
                value={journey.campaign_id || ''}
                onChange={(event) => assign(journey, event.target.value)}
              >
                <option value="">Choose campaign…</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name} · {campaign.status}
                  </option>
                ))}
              </select>
            </label>

            {unarmed && (
              <div className="mt-2 flex items-center gap-1.5 rounded-md border border-[rgb(var(--signal-warn)/0.3)] bg-[rgb(var(--signal-warn)/0.06)] px-2.5 py-1.5">
                <AlertTriangle className="h-3 w-3 shrink-0 text-[rgb(var(--signal-warn))]" />
                <span className={cn(MICRO, 'text-[rgb(var(--signal-warn))]')}>
                  Assign a campaign to arm this journey
                </span>
              </div>
            )}

            <div className={cn(WELL, 'mt-auto grid grid-cols-5 gap-2 rounded-lg p-3')}>
              {METRIC_ROW.map(([label, key, tone]) => {
                const value = Number(metric[key] || 0);
                return (
                  <div key={key}>
                    <p className={cn(MICRO, MUTED)}>{label}</p>
                    <p
                      className={cn(
                        NUM,
                        'mt-1 text-sm font-bold',
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
            <p className={cn(MICRO, MUTED, 'mt-2')}>Last 30 days</p>
          </div>
        );
      })}
    </div>
  );
};

export default JourneysPanel;
