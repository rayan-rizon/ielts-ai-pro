import { ChevronDown, RefreshCw } from 'lucide-react';
import { AdminButton, MICRO, MUTED } from '@/components/admin/ui/primitives';
import { cn } from '@/lib/cn';
import { WindowSelect } from './operationsShared';
import { date, pretty, inputClass } from './operationsConstants';
import { useLearnerTimeline } from './useLearnerTimeline';
import { TimelineItemRow } from './TimelineItemRow';
import { MessagePreview } from './MessagePreview';

const CHANNELS = ['all', 'in_app', 'banner', 'email', 'push', 'other'];

function checkShowNoResults({ busy, user, learnersCount, searchLength }) {
  if (busy || user) return false;
  return learnersCount === 0 && searchLength >= 3;
}

function LearnerSearchForm({ search, setSearch, onSearch, busy, error, showNoResults }) {
  return (
    <div>
      <label htmlFor="learner-search" className={cn(MICRO, MUTED, 'mb-1.5 block')}>
        Find learner
      </label>
      <form onSubmit={onSearch} className="flex w-full items-center gap-2 p-0.5">
        <input
          id="learner-search"
          aria-label="Find learner"
          className={cn(inputClass, 'min-w-0 flex-1')}
          value={search}
          minLength={3}
          maxLength={120}
          required
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or full email"
        />
        <AdminButton
          type="submit"
          loading={busy}
          className="h-8 shrink-0 rounded-lg whitespace-nowrap"
        >
          Find learner
        </AdminButton>
      </form>
      {error && (
        <p className="mt-2 text-xs font-semibold text-[rgb(var(--signal-fault))]" role="alert">
          {error} Try searching or refreshing again.
        </p>
      )}
      {showNoResults && (
        <p className="mt-2 text-xs text-stone-500">No results loaded. Search to find a learner.</p>
      )}
    </div>
  );
}

function LearnerSearchResults({ learners, onSelectLearner, days }) {
  return (
    <div className="mt-2.5 max-h-48 overflow-y-auto divide-y divide-stone-100 rounded-lg border border-stone-200/80 bg-white dark:divide-white/[0.04] dark:border-white/[0.07] dark:bg-[#131315]">
      {learners.map((item) => (
        <button
          type="button"
          className="flex w-full items-center justify-between p-2.5 text-left text-xs transition-colors hover:bg-stone-50 dark:hover:bg-white/[0.04]"
          key={item.id}
          onClick={() => onSelectLearner(item, days)}
        >
          <span className="font-semibold text-stone-900 dark:text-stone-100">
            {item.full_name || 'Learner'}
          </span>
          <span className={cn(MUTED, 'text-[11px]')}>{item.email}</span>
        </button>
      ))}
    </div>
  );
}

function LearnerChannelSelect({ channel, onChange }) {
  return (
    <div className="relative inline-flex items-center">
      <label htmlFor="timeline-channel" className="sr-only">
        Channel
      </label>
      <select
        id="timeline-channel"
        aria-label="Timeline channel"
        value={channel}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          inputClass,
          'appearance-none cursor-pointer pr-7 pl-3 font-medium rounded-lg'
        )}
      >
        {CHANNELS.map((value) => (
          <option key={value} value={value}>
            {pretty(value)}
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

function LearnerUserBar({ user, days, onWindowChange, channel, onChannelChange, onRefresh, busy }) {
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5 rounded-lg border border-stone-200/80 bg-stone-50/70 p-2.5 dark:border-white/[0.07] dark:bg-white/[0.03]">
      <p className="min-w-0 flex-1 text-xs font-bold text-stone-900 dark:text-stone-100">
        {user.full_name || 'Learner'}
        <bdi className={cn(MUTED, 'ml-1.5 font-normal text-[11px]')}>· {user.email}</bdi>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <WindowSelect value={days} id="timeline-window" onChange={onWindowChange} />
        <LearnerChannelSelect channel={channel} onChange={onChannelChange} />
        <AdminButton
          variant="outline"
          size="sm"
          className="h-8 w-8 rounded-lg p-0"
          onClick={onRefresh}
          disabled={busy}
          aria-label="Refresh timeline"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
        </AdminButton>
      </div>
    </div>
  );
}

function LearnerTimelineCoverage({ timeline, itemsCount }) {
  const hasTruncatedSources = timeline.truncated_sources?.length > 0;

  return (
    <>
      <details className={cn(MUTED, 'my-2 text-[11px]')}>
        <summary className="cursor-pointer py-1 hover:text-stone-800 dark:hover:text-stone-200">
          History coverage · {itemsCount} records
        </summary>
        <p className="mt-0.5">
          {date(timeline.window.since)} – {date(timeline.window.until)}. {timeline.limitation}
        </p>
      </details>
      {hasTruncatedSources && (
        <p role="status" className="text-xs text-stone-500">
          Some history is truncated ({timeline.truncated_sources.join(', ')}). Choose a shorter
          window.
        </p>
      )}
    </>
  );
}

function LearnerTimelineList({ items, onPreview }) {
  return (
    <div className="max-h-[28rem] overflow-y-auto rounded-lg border border-stone-200/80 bg-white dark:border-white/[0.07] dark:bg-[#131315]">
      {items.length === 0 ? (
        <p className="py-6 text-center text-xs text-stone-500">
          No recorded communications in this window and channel.
        </p>
      ) : (
        items.map((item) => (
          <TimelineItemRow key={`${item.kind}:${item.id}`} item={item} onPreview={onPreview} />
        ))
      )}
    </div>
  );
}

function LearnerTimelineActiveView({
  user,
  days,
  load,
  channel,
  setChannel,
  busy,
  timeline,
  filteredItems,
  onPreview,
}) {
  return (
    <>
      <LearnerUserBar
        user={user}
        days={days}
        onWindowChange={(val) => load(user, val)}
        channel={channel}
        onChannelChange={setChannel}
        onRefresh={() => load(user, days)}
        busy={busy}
      />
      {busy && (
        <div className="flex items-center gap-2 py-3 text-xs text-stone-500">
          <RefreshCw className="h-3 w-3 animate-spin" />
          <p role="status">Loading communications…</p>
        </div>
      )}
      {timeline && (
        <>
          <LearnerTimelineCoverage timeline={timeline} itemsCount={filteredItems.length} />
          <LearnerTimelineList items={filteredItems} onPreview={onPreview} />
        </>
      )}
    </>
  );
}

export function LearnerTimeline() {
  const {
    search,
    setSearch,
    learners,
    user,
    days,
    timeline,
    busy,
    error,
    channel,
    setChannel,
    preview,
    setPreview,
    searchUsers,
    load,
    filteredItems,
  } = useLearnerTimeline();

  const showNoResults = checkShowNoResults({
    busy,
    user,
    learnersCount: learners.length,
    searchLength: search.length,
  });

  return (
    <section className="min-w-0" id="learner-communications">
      <LearnerSearchForm
        search={search}
        setSearch={setSearch}
        onSearch={searchUsers}
        busy={busy}
        error={error}
        showNoResults={showNoResults}
      />

      {!user && learners.length > 0 && (
        <LearnerSearchResults learners={learners} onSelectLearner={load} days={days} />
      )}

      {user && (
        <LearnerTimelineActiveView
          user={user}
          days={days}
          load={load}
          channel={channel}
          setChannel={setChannel}
          busy={busy}
          timeline={timeline}
          filteredItems={filteredItems}
          onPreview={setPreview}
        />
      )}

      {preview && (
        <MessagePreview
          key={`${preview.kind}:${preview.id}`}
          item={preview}
          user={user}
          onClose={() => setPreview(null)}
        />
      )}
    </section>
  );
}
