import { ShieldCheck } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/cn';
import MarketingService from '@/features/admin/services/MarketingService';
import {
  AdminButton,
  Empty,
  MICRO,
  MUTED,
  Notice,
  PANEL,
  PanelHeader,
  Pill,
  SIGNAL_BG,
  TILE,
} from '@/components/admin/ui/primitives';

function PolicyCard({ policy, labels = {}, busy, error, act, onPreviewPolicy }) {
  const isEnabled = policy.enabled;
  const policyTitle = labels[policy.playbook_key] || policy.name;
  const statusText = isEnabled ? 'On · preparing for review' : 'Off · prepares nothing';
  const signalClass = isEnabled ? SIGNAL_BG.ok : SIGNAL_BG.idle;
  const statusClass = isEnabled ? 'text-[rgb(var(--signal-ok))]' : MUTED;
  const isSwitchDisabled = Boolean(busy) || Boolean(error);

  const handleToggle = (enabled) => {
    act(
      policy.id,
      () => MarketingService.updateAutopilotPolicy(policy.id, { enabled, mode: 'review' }),
      'policy'
    );
  };

  return (
    <div className={cn(TILE, 'relative flex flex-col overflow-hidden p-3 pl-4')}>
      <span className={cn('absolute inset-y-0 left-0 w-[3px]', signalClass)} />
      <label
        htmlFor={`policy-${policy.id}`}
        className="cursor-pointer text-[12px] font-extrabold leading-snug text-stone-900 dark:text-stone-50"
      >
        {policyTitle}
      </label>
      <p className={cn(MICRO, 'mt-1', statusClass)}>{statusText}</p>
      <div className="mt-auto flex items-center justify-between gap-2 pt-3">
        <AdminButton size="sm" variant="outline" onClick={() => onPreviewPolicy(policy)}>
          Preview
        </AdminButton>
        <Switch
          id={`policy-${policy.id}`}
          checked={isEnabled}
          disabled={isSwitchDisabled}
          aria-label={`Enable ${policyTitle}`}
          onCheckedChange={handleToggle}
        />
      </div>
    </div>
  );
}

export default function AutopilotAutomations({
  policies = [],
  labels = {},
  monitor,
  busy,
  error,
  act,
  onPreviewPolicy,
}) {
  const enabledPolicies = policies.filter((policy) => policy.enabled).length;
  const isCoveragePartial =
    Boolean(monitor?.model_metadata?.learners_scanned) &&
    monitor.model_metadata.learners_scanned >= monitor.model_metadata.scan_limit;

  return (
    <section className={cn(PANEL, 'overflow-hidden')}>
      <PanelHeader
        label="Automations"
        title="What prepares messages for review"
        description="The scheduled worker checks every 15 minutes; this page refreshes every 30 seconds."
        accent={enabledPolicies ? 'ok' : 'idle'}
      >
        <Pill tone={enabledPolicies ? 'ok' : 'neutral'}>
          {enabledPolicies} of {policies.length} on
        </Pill>
      </PanelHeader>

      {isCoveragePartial && (
        <div className="px-3.5 pt-3">
          <Notice tone="warn" title="Coverage is partial">
            The last check reached its {monitor.model_metadata.scan_limit}-learner limit, so some
            learners were not looked at.
          </Notice>
        </div>
      )}

      {policies.length > 0 ? (
        <div className="grid grid-cols-1 gap-2.5 p-3.5 sm:grid-cols-2 xl:grid-cols-3">
          {policies.map((policy) => (
            <PolicyCard
              key={policy.id}
              policy={policy}
              labels={labels}
              busy={busy}
              error={error}
              act={act}
              onPreviewPolicy={onPreviewPolicy}
            />
          ))}
        </div>
      ) : (
        <Empty icon={ShieldCheck} title="No automations configured">
          Automations are defined server-side. Once one exists it appears here, ready to be switched
          on.
        </Empty>
      )}
    </section>
  );
}
