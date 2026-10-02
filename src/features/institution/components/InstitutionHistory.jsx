import { useEffect, useRef, useState } from 'react';
import { History, Search } from 'lucide-react';
import {
  PANEL,
  TILE,
  MICRO,
  MUTED,
  PanelTitle,
  Pill,
  Empty,
} from '@/features/dashboard/components/primitives';
import { institutionRequest } from '../services/institutions';
import { ACTION_LABELS, historyChanges, historyDate, historySubject } from '../services/history';
export default function InstitutionHistory({ institutionId, seats }) {
  const [category, setCategory] = useState('all'),
    [search, setSearch] = useState(''),
    [query, setQuery] = useState('');
  const [page, setPage] = useState(null),
    [entries, setEntries] = useState([]),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const version = useRef(0);
  const load = async (cursor = null, generation = version.current) => {
    setBusy(true);
    setError('');
    try {
      const result = await institutionRequest('history', {
        institution_id: institutionId,
        category,
        search: query,
        cursor,
      });
      if (generation !== version.current) return;
      setEntries((previous) => (cursor ? [...previous, ...result.entries] : result.entries));
      setPage(result);
    } catch (e) {
      if (generation === version.current) setError(e.message);
    } finally {
      if (generation === version.current) setBusy(false);
    }
  };
  useEffect(() => {
    const generation = ++version.current;
    setEntries([]);
    setPage(null);
    load(null, generation);
    return () => {
      version.current = generation + 1;
    };
    // Query inputs define this request; stale responses are discarded on every change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [institutionId, category, query]);
  return (
    <section className={`${PANEL} space-y-4 p-4`}>
      <PanelTitle label="Institution history" />
      <p className={`${MUTED} text-sm`}>
        A record of institution changes, student access, pricing, and payments. Newest first. Times
        use your local timezone.
      </p>
      <div className="grid gap-3 sm:flex sm:flex-wrap">
        <label className="space-y-1 text-xs">
          Activity type
          <select
            aria-label="History activity type"
            className="block w-full rounded-md border border-[#e4e2f0] bg-white px-3 py-2 dark:border-white/10 dark:bg-[#141319] sm:w-auto"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {[
              ['all', 'All activity'],
              ['institution', 'Institution & owner'],
              ['students', 'Student access'],
              ['pricing', 'Pricing'],
              ['billing', 'Payments & free seats'],
            ].map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <form
          className="flex min-w-0 flex-1 items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(search.trim());
          }}
        >
          <label className="min-w-0 flex-1 space-y-1 text-xs">
            Search reasons
            <input
              className="block w-full rounded-md border border-[#e4e2f0] bg-white px-3 py-2 dark:border-white/10 dark:bg-[#141319]"
              placeholder="e.g. trial or refund"
              value={search}
              maxLength={200}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <button className="rounded-md bg-[#5a63df] p-2.5 text-white" aria-label="Search history">
            <Search className="h-4 w-4" />
          </button>
        </form>
      </div>
      {error && (
        <p role="alert" className="text-sm text-[rgb(var(--signal-fault))]">
          {error}{' '}
          <button className="underline" onClick={() => load(page?.next_cursor || null)}>
            Try again
          </button>
        </p>
      )}
      <ol className="space-y-3" aria-label="Institution history events">
        {entries.map((entry) => {
          const changes = historyChanges(entry);
          return (
            <li key={entry.id} className={`${TILE} p-3 sm:p-4`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold">
                  {ACTION_LABELS[entry.action] || 'Institution activity'}
                </p>
                <time dateTime={entry.created_at} className={`${MUTED} text-xs`}>
                  {historyDate(entry.created_at)}
                </time>
              </div>
              <p className="mt-1 break-words text-xs text-[#5a63df] dark:text-[#bfc3ff]">
                {historySubject(entry, seats)}
              </p>
              <p className="mt-2 break-words text-sm">
                {entry.reason || 'No additional reason recorded.'}
              </p>
              <div className={`mt-2 flex flex-wrap items-center gap-2 ${MUTED} text-xs`}>
                <Pill tone="neutral">
                  {!entry.actor_auth_id
                    ? 'System'
                    : entry.actor?.role === 'admin'
                      ? 'Platform admin'
                      : 'Account'}
                </Pill>
                <span className="break-all">
                  {entry.actor?.full_name ||
                    entry.actor?.email ||
                    (entry.actor_auth_id
                      ? 'Former or unavailable account'
                      : 'Automatic payment processing')}
                </span>
              </div>
              {changes.length > 0 && (
                <details className="mt-3 border-t border-[#e4e2f0] pt-2 dark:border-white/[0.07]">
                  <summary className="cursor-pointer text-xs font-semibold text-[#5a63df] dark:text-[#bfc3ff]">
                    View {changes.length} {changes.length === 1 ? 'change' : 'changes'}
                  </summary>
                  <dl className="mt-3 space-y-2">
                    {changes.map((change) => (
                      <div
                        key={change.key}
                        className="grid min-w-0 gap-1 text-xs sm:grid-cols-[140px_1fr]"
                      >
                        <dt className={`${MICRO} ${MUTED}`}>{change.label}</dt>
                        <dd className="min-w-0 break-words">
                          {!change.created && (
                            <>
                              <span className={MUTED}>{change.before}</span>
                              <span aria-label="changed to" className="mx-2">
                                →
                              </span>
                            </>
                          )}
                          <span className="font-semibold">{change.after}</span>
                        </dd>
                      </div>
                    ))}
                  </dl>
                </details>
              )}
            </li>
          );
        })}
      </ol>
      {busy && (
        <p role="status" className={`${MUTED} text-sm`}>
          Loading history…
        </p>
      )}
      {!busy && !error && !entries.length && (
        <Empty
          icon={History}
          title="No matching activity"
          description="Try a different activity type or search reason. New changes will appear here."
        />
      )}
      {page?.next_cursor && (
        <button
          disabled={busy}
          className="rounded-md border border-[#e4e2f0] px-3 py-2 text-xs font-bold dark:border-white/10 disabled:opacity-50"
          onClick={() => load(page.next_cursor)}
        >
          Load older activity
        </button>
      )}
      {!busy && entries.length > 0 && !page?.next_cursor && (
        <p className={`${MUTED} text-xs`}>All matching activity is shown.</p>
      )}
    </section>
  );
}
