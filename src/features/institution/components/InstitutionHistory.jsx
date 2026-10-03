import { useEffect, useRef, useState } from 'react';
import { History, Search, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Empty } from '@/features/dashboard/components/primitives';
import { institutionRequest } from '../services/institutions';
import { ACTION_LABELS, historyChanges, historyDate, historySubject } from '../services/history';
import { NativeSelect } from './NativeSelect';

export default function InstitutionHistory({ institutionId, seats = [] }) {
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(null);
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
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
    <Card className="p-5 sm:p-6 space-y-5">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="h-4 w-1 rounded-full bg-primary dark:bg-[#8f97ff]" />
          <h2 className="text-base font-bold text-foreground">Institution history</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Audit log of seat allocations, student invitations, and pricing changes. Ordered newest
          first.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="space-y-1.5 text-xs font-semibold text-foreground">
          Activity type
          <NativeSelect
            aria-label="History activity type"
            wrapperClassName="w-full sm:w-52"
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
          </NativeSelect>
        </label>

        <form
          className="flex min-w-0 flex-1 items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(search.trim());
          }}
        >
          <label className="min-w-0 flex-1 space-y-1.5 text-xs font-semibold text-foreground">
            Search reasons
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9 h-9"
                placeholder="e.g. trial or refund"
                value={search}
                maxLength={200}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </label>
          <Button type="submit" size="sm" className="h-9" aria-label="Search history">
            Search
          </Button>
        </form>
      </div>

      {/* Error state */}
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
        >
          <span>{error}</span>
          <button
            type="button"
            className="font-bold underline hover:opacity-80"
            onClick={() => load(page?.next_cursor || null)}
          >
            Try again
          </button>
        </div>
      )}

      {/* Events timeline */}
      <ol className="space-y-3" aria-label="Institution history events">
        {entries.map((entry) => {
          const changes = historyChanges(entry);
          return (
            <li
              key={entry.id}
              className="rounded-xl border border-border bg-card p-4 transition-all duration-150 hover:border-primary/30 dark:hover:border-[#8f97ff]/40 space-y-2 shadow-2xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full bg-primary dark:bg-[#8f97ff]"
                    aria-hidden="true"
                  />
                  <p className="text-xs font-bold text-foreground">
                    {ACTION_LABELS[entry.action] || 'Institution activity'}
                  </p>
                </div>
                <time
                  dateTime={entry.created_at}
                  className="font-mono tabular-nums text-muted-foreground text-[11px]"
                >
                  {historyDate(entry.created_at)}
                </time>
              </div>

              {/* Subject */}
              <p className="break-words text-xs font-semibold text-primary dark:text-[#afb5ff]">
                {historySubject(entry, seats)}
              </p>

              {/* Reason */}
              <p className="break-words text-xs text-foreground/90 leading-relaxed">
                {entry.reason || 'No additional reason recorded.'}
              </p>

              {/* Actor */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-1">
                <Badge
                  variant={entry.actor?.role === 'admin' ? 'default' : 'secondary'}
                  className="text-[10px]"
                >
                  {!entry.actor_auth_id
                    ? 'System'
                    : entry.actor?.role === 'admin'
                      ? 'Platform admin'
                      : 'Account'}
                </Badge>
                <span className="break-all text-[11px]">
                  {entry.actor?.full_name ||
                    entry.actor?.email ||
                    (entry.actor_auth_id
                      ? 'Former or unavailable account'
                      : 'Automatic payment processing')}
                </span>
              </div>

              {/* Changes Details Diff */}
              {changes.length > 0 && (
                <details className="mt-3 border-t border-border pt-2.5 group">
                  <summary className="cursor-pointer text-xs font-bold text-primary dark:text-[#afb5ff] hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    View {changes.length} {changes.length === 1 ? 'change' : 'changes'}
                  </summary>
                  <dl className="mt-2.5 space-y-2 rounded-lg bg-muted/40 p-3 text-xs border border-border">
                    {changes.map((change) => (
                      <div
                        key={change.key}
                        className="grid min-w-0 gap-1 text-xs sm:grid-cols-[140px_1fr]"
                      >
                        <dt className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pt-0.5">
                          {change.label}
                        </dt>
                        <dd className="min-w-0 break-words">
                          {!change.created && (
                            <>
                              <span className="text-muted-foreground line-through opacity-80">
                                {change.before}
                              </span>
                              <span aria-label="changed to" className="mx-2 text-muted-foreground">
                                →
                              </span>
                            </>
                          )}
                          <span className="font-semibold text-foreground">{change.after}</span>
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

      {/* Loading state */}
      {busy && (
        <div role="status" className="flex items-center justify-center gap-2 py-4">
          <RefreshCw className="h-4 w-4 animate-spin text-primary dark:text-[#afb5ff]" />
          <span className="text-xs text-muted-foreground">Loading history…</span>
        </div>
      )}

      {/* Empty state */}
      {!busy && !error && !entries.length && (
        <Empty
          icon={History}
          title="No matching activity"
          description="Try a different activity type or search reason. New changes will appear here."
        />
      )}

      {/* Pagination */}
      {page?.next_cursor && (
        <div className="pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => load(page.next_cursor)}
          >
            Load older activity
          </Button>
        </div>
      )}

      {!busy && entries.length > 0 && !page?.next_cursor && (
        <p className="text-center text-xs text-muted-foreground pt-2">
          All matching activity is shown.
        </p>
      )}
    </Card>
  );
}
