import { Eye } from 'lucide-react';
import { AdminButton, Pill, MUTED } from '@/components/admin/ui/primitives';
import { cn } from '@/lib/cn';
import { pretty, shortDateTime } from './operationsConstants';

function getItemChannelPill(item) {
  if (item.channel) return pretty(item.channel);
  if (item.recommended_channel) return pretty(item.recommended_channel);
  if (item.kind === 'emails') return 'email';
  return pretty(item.kind);
}

function getItemStatusText(item) {
  if (item.channel === 'email' && item.status === 'viewed') {
    return 'Open signal';
  }
  return pretty(item.status || item.action || item.event_type);
}

function getItemTitle(item) {
  if (item.content?.title) {
    return item.content.title;
  }
  if (item.kind === 'events') {
    return `${pretty(item.channel)} activity`;
  }
  return pretty(item.email_type || item.playbook_key || item.kind);
}

function getItemReason(item) {
  const reason =
    item.suppression_reason || item.failure_reason || item.error_message || item.rationale;
  return reason ? pretty(reason) : null;
}

function getItemTimestamp(item) {
  if (item.status === 'clicked' && item.clicked_at) return item.clicked_at;
  if (item.status === 'viewed' && item.viewed_at) return item.viewed_at;
  return item.at;
}

export function TimelineItemRow({ item, onPreview }) {
  const title = getItemTitle(item);
  const reason = getItemReason(item);
  const canPreview = Boolean(item.content || item.kind === 'emails');

  return (
    <article className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2.5 gap-y-1 border-b border-stone-100 px-3 py-2 last:border-b-0 dark:border-white/[0.04] sm:grid-cols-[auto_auto_minmax(0,1fr)_auto_auto]">
      <Pill>{getItemChannelPill(item)}</Pill>
      <span className="text-[11px] font-bold text-stone-800 dark:text-stone-200">
        {getItemStatusText(item)}
      </span>
      <div className="col-span-2 row-start-2 min-w-0 sm:col-span-1 sm:row-auto">
        <p className="truncate text-xs font-bold text-stone-900 dark:text-stone-100" title={title}>
          {title}
        </p>
        {reason && <p className={cn(MUTED, 'truncate text-[10.5px]')}>{reason}</p>}
        {item.snoozed_until && (
          <p className={cn(MUTED, 'text-[10px]')}>
            Snoozed until {shortDateTime(item.snoozed_until)}
          </p>
        )}
      </div>
      <time
        className={cn(
          MUTED,
          'col-start-3 row-start-1 whitespace-nowrap text-[10.5px] font-mono sm:col-auto sm:row-auto'
        )}
      >
        {shortDateTime(getItemTimestamp(item))}
      </time>
      {canPreview && (
        <AdminButton
          variant="ghost"
          size="sm"
          className="col-start-3 row-start-2 h-7 px-2 text-[11px] sm:col-auto sm:row-auto"
          aria-label="Preview message"
          onClick={() => onPreview(item)}
        >
          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Preview</span>
        </AdminButton>
      )}
    </article>
  );
}
