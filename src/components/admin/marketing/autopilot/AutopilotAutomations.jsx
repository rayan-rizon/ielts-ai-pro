import { ChevronDown, ShieldCheck } from 'lucide-react';
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
    <div
      className={cn(
        TILE,
        'relative flex flex-col overflow-hidden p-3 pl-4 transition-all duration-200 ease-smooth-out hover:border-stone-300 dark:hover:border-white/20 hover:-translate-y-0.5 hover:shadow-xs'
      )}
    >
      <span
        className={cn(
          'absolute inset-y-0 left-0 w-[3px] transition-colors duration-fast ease-smooth-out',
          signalClass
        )}
      />
      <label
        htmlFor={`policy-${policy.id}`}
        className="cursor-pointer text-[12px] font-extrabold leading-snug text-stone-900 dark:text-stone-50"
      >
        {policyTitle}
      </label>
      <p className={cn(MICRO, 'mt-1 transition-colors duration-fast ease-smooth-out', statusClass)}>
        {statusText}
      </p>
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
    <details className={cn(PANEL, 'group overflow-hidden')}>
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#5a63df]">
        <div className="min-w-0">
          <p className="text-[12px] font-extrabold text-stone-900 dark:text-stone-50">
            Message automations
          </p>
          <p className={cn(MICRO, MUTED, 'mt-1')}>Checks every 15 minutes</p>
        </div>
        <span className="flex shrink-0 items-center gap-2">
          <Pill tone={enabledPolicies ? 'ok' : 'neutral'}>
            {enabledPolicies}/{policies.length} on
          </Pill>
          <ChevronDown className="h-4 w-4 text-stone-400 transition-transform duration-150 ease-out group-open:rotate-180" />
        </span>
      </summary>

      <div className="border-t border-stone-200/80 dark:border-white/[0.07]">
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
            Automations are defined server-side. Once one exists it appears here, ready to be
            switched on.
          </Empty>
        )}
      </div>
    </details>
  );
}
