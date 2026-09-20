import { useCallback, useEffect, useState } from 'react';
import { m } from 'framer-motion';
import {
  Check,
  ChevronRight,
  Clock3,
  Lightbulb,
  Mail,
  Search,
  ThumbsUp,
  UserRound,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import { classifyTexts } from '@/lib/classifier';
import {
  AdminButton,
  AdminPageHeader,
  Empty,
  FADE_UP,
  FilterRail,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  PanelHeader,
  Pill,
  STAGGER_CONTAINER,
  TILE,
  TITLE,
} from '@/components/admin/ui/primitives';
import {
  FEATURE_AREAS,
  featureRequestService,
  REQUEST_STATUS,
  requestError,
} from '@/features/feature-requests/featureRequestService';

const STATUS_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'planned', label: 'Planned' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'completed', label: 'Completed' },
  { id: 'declined', label: 'Declined' },
];
const NEXT_STATUS = { approved: 'planned', planned: 'in_progress', in_progress: 'completed' };
const NEXT_LABEL = {
  planned: 'Mark planned',
  in_progress: 'Start work',
  completed: 'Mark completed',
};
const ADMIN_STATUS_TONE = {
  pending: 'warn',
  approved: 'accent',
  planned: 'accent',
  in_progress: 'warn',
  completed: 'ok',
  declined: 'neutral',
};
const field =
  'rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-stone-400 focus-visible:border-indigo-400/60 focus-visible:ring-2 focus-visible:ring-indigo-500/20 dark:border-white/10 dark:bg-[#18181b] dark:text-white dark:placeholder:text-stone-500';

const AREA_ENTRIES = Object.entries(FEATURE_AREAS);
const AREA_LABELS = AREA_ENTRIES.map(([, meta]) => meta.label);
const AREA_KEY_BY_LABEL = Object.fromEntries(AREA_ENTRIES.map(([key, meta]) => [meta.label, key]));
const AREA_SUGGESTION_INSTRUCTIONS =
  'Which IELTS skill area does this feature request concern? Pick "other" only if it is not about a specific skill area.';
const AREA_SUGGESTION_CONFIDENCE = 0.8;

export default function FeatureRequestManagement() {
  const [status, setStatus] = useState('pending');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [notes, setNotes] = useState({});
  const [error, setError] = useState('');
  const [areaSuggestions, setAreaSuggestions] = useState({});

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setOffset(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setPage(await featureRequestService.adminPage({ status, search: query, offset }));
    } catch {
      setError('Could not load feature requests. No request data was changed.');
    } finally {
      setLoading(false);
    }
  }, [status, query, offset]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const items = page?.items;
    if (!items?.length) return undefined;
    let cancelled = false;
    classifyTexts({
      inputs: items.map((request) => `${request.title}\n${request.description}`.slice(0, 2000)),
      labels: AREA_LABELS,
      instructions: AREA_SUGGESTION_INSTRUCTIONS,
    }).then((results) => {
      if (cancelled || !results.length) return;
      setAreaSuggestions((current) => {
        const next = { ...current };
        items.forEach((request, index) => {
          if (results[index]) next[request.id] = results[index];
        });
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [page]);

  const update = async (request, nextStatus) => {
    setSavingId(request.id);
    try {
      await featureRequestService.updateStatus(
        request.id,
        nextStatus,
        notes[request.id] ?? request.admin_note ?? ''
      );
      toast.success(`Request marked ${REQUEST_STATUS[nextStatus]?.label.toLowerCase()}`);
      setNotes((current) => {
        const next = { ...current };
        delete next[request.id];
        return next;
      });
      await load();
    } catch (err) {
      toast.error(requestError(err));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <m.div
      variants={STAGGER_CONTAINER}
      initial="hidden"
      animate="visible"
      className="space-y-4 pb-10 pt-12 md:pt-0"
    >
      <m.div variants={FADE_UP}>
        <AdminPageHeader
          title="Feature requests"
          description="Review learner ideas, publish approved requests, and keep roadmap status current."
        >
          <Pill tone={status === 'pending' ? 'warn' : 'neutral'}>
            <span className={NUM}>{page?.total ?? '—'}</span> matching
          </Pill>
        </AdminPageHeader>
      </m.div>

      <m.section variants={FADE_UP} className={cn(PANEL, 'overflow-hidden')}>
        <PanelHeader
          label="Review queue"
          title={
            status === 'all'
              ? 'All learner submissions'
              : `${STATUS_OPTIONS.find((item) => item.id === status)?.label} requests`
          }
          description="Filter the queue, inspect requester context, then record a learner-facing decision note."
          accent={status === 'pending' ? 'warn' : 'accent'}
        />
        <div className="border-b border-stone-200/80 p-3 dark:border-white/[0.07] sm:p-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <FilterRail
              options={STATUS_OPTIONS}
              value={status}
              onChange={(value) => {
                setStatus(value);
                setOffset(0);
              }}
              layoutId="feature-request-status"
              className="w-full lg:w-auto"
            />
            <label className="relative min-w-0 lg:w-80">
              <span className="sr-only">Search requests or users</span>
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
              <input
                className={cn(field, 'w-full pl-9')}
                maxLength={100}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search title, description, name, or email"
              />
            </label>
          </div>
        </div>

        <div className="p-3 sm:p-4" aria-busy={loading}>
          {error ? (
            <div
              className="rounded-lg border border-[rgb(var(--signal-fault)/0.3)] bg-[rgb(var(--signal-fault)/0.06)] p-4 text-sm text-stone-700 dark:text-stone-200"
              role="alert"
            >
              {error}{' '}
              <button
                type="button"
                onClick={load}
                className="font-bold underline underline-offset-2"
              >
                Retry
              </button>
            </div>
          ) : loading ? (
            <div className="space-y-2 animate-pulse" aria-label="Loading feature request queue">
              {[1, 2, 3].map((number) => (
                <div key={number} className="h-48 rounded-lg bg-stone-100 dark:bg-white/5" />
              ))}
            </div>
          ) : page?.items?.length ? (
            <div className="space-y-2">
              {page.items.map((request) => {
                const statusMeta = REQUEST_STATUS[request.status] || REQUEST_STATUS.pending;
                const area = FEATURE_AREAS[request.category] || FEATURE_AREAS.other;
                const nextStatus = NEXT_STATUS[request.status];
                const note = notes[request.id] ?? request.admin_note ?? '';
                const suggestion = areaSuggestions[request.id];
                const suggestedKey = suggestion && AREA_KEY_BY_LABEL[suggestion.label];
                const suggestedArea =
                  suggestedKey &&
                  suggestedKey !== request.category &&
                  suggestion.confidence >= AREA_SUGGESTION_CONFIDENCE
                    ? FEATURE_AREAS[suggestedKey]
                    : null;
                return (
                  <article key={request.id} className={cn(TILE, 'overflow-hidden')}>
                    <div className="grid min-w-0 gap-0 xl:grid-cols-[minmax(0,1fr)_21rem]">
                      <div className="min-w-0 p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className={cn(TITLE, 'wrap-break-word text-sm')}>{request.title}</h2>
                          <Pill tone={ADMIN_STATUS_TONE[request.status]}>{statusMeta.label}</Pill>
                          <Pill
                            tone={
                              area.tone === 'rose' || area.tone === 'sky' || area.tone === 'amber'
                                ? 'neutral'
                                : area.tone
                            }
                          >
                            {area.label}
                          </Pill>
                          {suggestedArea && (
                            <Pill tone="warn">Suggested: {suggestedArea.label}</Pill>
                          )}
                        </div>
                        <p className="mt-2 whitespace-pre-wrap wrap-break-word text-sm leading-relaxed text-stone-600 dark:text-stone-300">
                          {request.description}
                        </p>
                        <div className="mt-4 grid gap-px overflow-hidden rounded-lg border border-stone-200/80 bg-stone-200/80 dark:border-white/[0.08] dark:bg-white/[0.08] sm:grid-cols-2">
                          <div className="flex min-w-0 items-center gap-2 bg-white px-3 py-2.5 dark:bg-[#171719]">
                            <UserRound className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                            <div className="min-w-0">
                              <p className={cn(MICRO, MUTED)}>Requester</p>
                              <p className="truncate text-xs font-bold text-stone-800 dark:text-stone-100">
                                {request.requester_name || 'Unnamed learner'}
                              </p>
                            </div>
                          </div>
                          <div className="flex min-w-0 items-center gap-2 bg-white px-3 py-2.5 dark:bg-[#171719]">
                            <Mail className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                            <div className="min-w-0">
                              <p className={cn(MICRO, MUTED)}>Account</p>
                              <p className="truncate text-xs font-bold text-stone-800 dark:text-stone-100">
                                {request.requester_email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 bg-white px-3 py-2.5 dark:bg-[#171719]">
                            <ThumbsUp className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                            <p className="text-xs font-bold text-stone-800 dark:text-stone-100">
                              <span className={NUM}>{request.vote_count}</span> votes
                            </p>
                          </div>
                          <div className="flex items-center gap-2 bg-white px-3 py-2.5 dark:bg-[#171719]">
                            <Clock3 className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                            <p className="text-xs font-bold text-stone-800 dark:text-stone-100">
                              {new Date(request.created_at).toLocaleDateString()}
                              <span className={cn(MICRO, MUTED, 'ml-2')}>
                                {request.requester_tier || 'free'}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-stone-200/80 bg-white/60 p-4 dark:border-white/[0.07] dark:bg-white/[0.02] xl:border-l xl:border-t-0">
                        <label className="block text-xs font-bold">
                          <span className="flex items-center justify-between gap-2">
                            Learner update
                            <span className={cn(NUM, MICRO, MUTED)}>{note.length}/500</span>
                          </span>
                          <textarea
                            aria-label="Learner update"
                            maxLength={500}
                            rows={4}
                            value={note}
                            onChange={(event) =>
                              setNotes((current) => ({
                                ...current,
                                [request.id]: event.target.value,
                              }))
                            }
                            className={cn(field, 'mt-1.5 w-full resize-y')}
                            placeholder="Optional note shown to this learner"
                          />
                        </label>
                        <p className={cn('mt-2 text-[10px] font-medium leading-relaxed', MUTED)}>
                          This note appears in My requests. No notification is sent in this version.
                        </p>
                        <div className="mt-3 flex flex-wrap justify-end gap-2">
                          {request.status === 'pending' && (
                            <>
                              <AdminButton
                                type="button"
                                variant="destructive"
                                loading={savingId === request.id}
                                onClick={() => update(request, 'declined')}
                              >
                                <X className="h-3.5 w-3.5" /> Decline
                              </AdminButton>
                              <AdminButton
                                type="button"
                                loading={savingId === request.id}
                                onClick={() => update(request, 'approved')}
                              >
                                <Check className="h-3.5 w-3.5" /> Approve
                              </AdminButton>
                            </>
                          )}
                          {nextStatus && (
                            <AdminButton
                              type="button"
                              loading={savingId === request.id}
                              onClick={() => update(request, nextStatus)}
                            >
                              {NEXT_LABEL[nextStatus]} <ChevronRight className="h-3.5 w-3.5" />
                            </AdminButton>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <Empty icon={Lightbulb} title="No matching requests" className="py-14">
              Try another status or clear the search. New learner submissions will appear here.
            </Empty>
          )}

          {!error && (offset > 0 || offset + 20 < (page?.total || 0)) && (
            <nav
              className="mt-4 flex items-center justify-between border-t border-stone-200/80 pt-4 text-sm dark:border-white/[0.07]"
              aria-label="Feature request pages"
            >
              <AdminButton
                type="button"
                variant="outline"
                disabled={!offset || loading}
                onClick={() => setOffset(Math.max(0, offset - 20))}
              >
                Previous
              </AdminButton>
              <span className={cn(NUM, 'text-xs font-bold')}>
                Page {Math.floor(offset / 20) + 1}
              </span>
              <AdminButton
                type="button"
                variant="outline"
                disabled={loading || offset + 20 >= page.total}
                onClick={() => setOffset(offset + 20)}
              >
                Next
              </AdminButton>
            </nav>
          )}
        </div>
      </m.section>
    </m.div>
  );
}
