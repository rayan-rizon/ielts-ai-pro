import { ChevronDown } from 'lucide-react';
import { TILE } from '@/components/admin/ui/primitives';
import { cn } from '@/lib/cn';
import { pretty, inputClass } from './operationsConstants';

export function WindowSelect({ value, onChange, id, disabled }) {
  return (
    <div className="relative inline-flex items-center">
      <label htmlFor={id} className="sr-only">
        Reporting window
      </label>
      <select
        id={id}
        aria-label="Reporting window"
        className={cn(
          inputClass,
          'appearance-none cursor-pointer pr-7 pl-3 font-medium rounded-lg'
        )}
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      >
        {[7, 14, 30, 90].map((days) => (
          <option key={days} value={days}>
            Last {days} days
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-stone-400 dark:text-stone-500"
        aria-hidden="true"
      />
    </div>
  );
}

const ORDERED_STATUSES = ['accepted', 'delivered', 'viewed', 'clicked', 'skipped', 'failed'];

function ChannelMatrixTable({ channelFacts }) {
  const channels = [...new Set(channelFacts.map((fact) => fact.channel))];
  const presentStatuses = new Set(
    channelFacts.filter((fact) => Number(fact.value) > 0).map((fact) => fact.status)
  );
  const statuses = ORDERED_STATUSES.filter((status) => presentStatuses.has(status));

  return (
    <div className="mt-2 overflow-x-auto rounded-lg border border-stone-200/80 bg-white dark:border-white/[0.07] dark:bg-[#131315]">
      <table className="w-full min-w-[34rem] text-left text-xs">
        <thead className="bg-stone-50 text-stone-500 dark:bg-white/[0.03] dark:text-stone-400">
          <tr>
            <th className="px-3 py-2 font-semibold" scope="col">
              Channel
            </th>
            {statuses.map((status) => (
              <th className="px-3 py-2 font-semibold" scope="col" key={status}>
                {status === 'viewed' ? 'Seen / opened' : pretty(status)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {channels.map((channel) => (
            <tr className="border-t border-stone-100 dark:border-white/5" key={channel}>
              <th className="px-3 py-2 font-semibold" scope="row">
                {pretty(channel)}
              </th>
              {statuses.map((status) => {
                const fact = channelFacts.find(
                  (item) => item.channel === channel && item.status === status
                );
                return (
                  <td className="px-3 py-2 font-mono font-bold tabular-nums" key={status}>
                    {Number(fact?.value) || '—'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FactTileGrid({ facts }) {
  const visible = facts.filter((fact) => Number(fact.value) > 0);

  if (visible.length === 0) {
    return (
      <div className="mt-2">
        <p className="py-2 text-xs text-stone-500">No activity recorded in this window.</p>
      </div>
    );
  }

  return (
    <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
      {visible.map((fact) => (
        <div className={cn(TILE, 'min-w-0 px-2.5 py-2')} key={fact.id}>
          <p className="truncate text-[11px] text-stone-500 dark:text-stone-400" title={fact.label}>
            {fact.label}
          </p>
          <p className="font-mono text-sm font-bold tabular-nums text-stone-900 dark:text-stone-50">
            {fact.value}
          </p>
        </div>
      ))}
    </div>
  );
}

export function ReportFacts({ facts }) {
  const channelFacts = (facts || []).filter((fact) => fact.channel && fact.status);
  if (channelFacts.length > 0) {
    return <ChannelMatrixTable channelFacts={channelFacts} />;
  }
  return <FactTileGrid facts={facts || []} />;
}
