import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Lightbulb,
  Loader2,
  Search,
  Send,
  ThumbsUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import {
  Bar,
  Empty,
  FADE_UP,
  IconChip,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  PanelTitle,
  Pill,
  STAGGER_CONTAINER,
  TILE,
  TITLE,
} from '@/features/dashboard/components/primitives';
import {
  FEATURE_AREAS,
  featureRequestService,
  REQUEST_STATUS,
  requestError,
} from '../featureRequestService';

const primaryButton =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#5a63df] px-4 text-sm font-bold text-white transition-all duration-150 ease-smooth-out hover:bg-[#4a52c9] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 dark:focus-visible:ring-offset-[#100f15]';
const quietButton =
  'inline-flex min-h-9 items-center justify-center rounded-lg border border-[#e4e2f0] bg-white px-3 text-xs font-bold text-slate-700 transition-colors hover:border-[#5a63df]/40 hover:text-[#5a63df] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-slate-200';
const field =
  'w-full rounded-lg border border-[#e4e2f0] bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus-visible:border-[#5a63df]/50 focus-visible:ring-2 focus-visible:ring-[#5a63df]/25 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 dark:border-white/10 dark:bg-[#18171f] dark:text-white dark:placeholder:text-slate-500 dark:disabled:bg-white/[0.03]';

const REVIEW_STEPS = [
  { icon: Send, label: 'Send privately', detail: 'Only you and admins can see it' },
  { icon: CheckCircle2, label: 'Team review', detail: 'Approved ideas join the board' },
  { icon: ThumbsUp, label: 'Vote and follow', detail: 'Roadmap status stays visible' },
];

function PageSkeleton() {
  return (
    <main className="min-h-full bg-[#f8f8fb] px-3 py-4 dark:bg-[#08080a] sm:px-4 md:px-5 md:py-5">
      <div
        className="mx-auto max-w-6xl animate-pulse space-y-3"
        aria-label="Loading feature requests"
      >
        <div className="h-28 rounded-xl border border-[#e4e2f0] bg-white dark:border-white/[0.07] dark:bg-[#131315]" />
        <div className="grid gap-3 lg:grid-cols-12">
          <div className="h-[34rem] rounded-xl border border-[#e4e2f0] bg-white dark:border-white/[0.07] dark:bg-[#131315] lg:col-span-8" />
          <div className="h-[30rem] rounded-xl border border-[#e4e2f0] bg-white dark:border-white/[0.07] dark:bg-[#131315] lg:col-span-4" />
        </div>
      </div>
    </main>
  );
}

function RequestCard({ request, onVote, voting }) {
  const status = REQUEST_STATUS[request.status] || REQUEST_STATUS.pending;
  const area = FEATURE_AREAS[request.category] || FEATURE_AREAS.other;
  const canVote = !request.is_mine && !['pending', 'declined'].includes(request.status);

  return (
    <article className={cn(TILE, 'group flex min-w-0 gap-3 p-3.5 sm:p-4')}>
      <button
        type="button"
        onClick={() => onVote(request.id)}
        disabled={!canVote || voting}
        aria-label={`${request.has_voted ? 'Remove vote from' : 'Upvote'} ${request.title}`}
        aria-pressed={Boolean(request.has_voted)}
        className={cn(
          'flex h-[68px] w-12 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border text-xs font-bold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] disabled:cursor-not-allowed',
          request.has_voted
            ? 'border-[#5a63df]/50 bg-[#5a63df]/10 text-[#4a52c9] dark:text-[#bdc2ff]'
            : 'border-[#e4e2f0] bg-white text-slate-600 enabled:hover:border-[#5a63df]/40 enabled:hover:text-[#5a63df] dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300',
          request.is_mine && 'bg-slate-50 text-slate-400 dark:bg-white/[0.02] dark:text-slate-500'
        )}
      >
        {voting ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <ThumbsUp className="h-4 w-4" aria-hidden="true" />
        )}
        <span className={NUM}>{request.vote_count}</span>
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <h3 className={cn(TITLE, 'wrap-break-word text-sm')}>{request.title}</h3>
          <Pill tone={status.tone}>{status.label}</Pill>
          <Pill tone={area.tone}>{area.label}</Pill>
          {request.is_mine && <Pill tone="neutral">Your idea</Pill>}
        </div>
        <p className="mt-1.5 wrap-break-word whitespace-pre-wrap text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {request.description}
        </p>
        <div className={cn(MICRO, MUTED, 'mt-3 flex flex-wrap items-center gap-x-3 gap-y-1')}>
          <span className="inline-flex items-center gap-1">
            <Clock3 className="h-3 w-3" aria-hidden="true" />
            {new Date(request.created_at).toLocaleDateString()}
          </span>
          {request.is_mine && <span>Voting is disabled on your own request</span>}
        </div>
        {request.admin_note && (
          <div className="mt-3 rounded-lg border border-[#e4e2f0] bg-[#f4f3fb] px-3 py-2.5 text-sm text-slate-700 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200">
            <p
              className={cn(
                MICRO,
                'mb-1 flex items-center gap-1.5 text-[#5a63df] dark:text-[#afb5ff]'
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#5a63df]" aria-hidden="true" />
              Team update
            </p>
            <p>{request.admin_note}</p>
          </div>
        )}
      </div>
    </article>
  );
}

export default function FeatureRequests() {
  const [scope, setScope] = useState('board');
  const [sort, setSort] = useState('top');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('reading');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [votingId, setVotingId] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setOffset(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setPage(
        await featureRequestService.learnerPage({ scope, sort, search: debouncedSearch, offset })
      );
    } catch {
      setError('Could not load requests. Your saved ideas and votes are unchanged.');
    } finally {
      setLoading(false);
    }
  }, [scope, sort, debouncedSearch, offset]);

  useEffect(() => {
    load();
  }, [load]);

  const quotaPercent = useMemo(() => {
    if (!page?.limit) return 0;
    return ((page.limit - page.remaining) / page.limit) * 100;
  }, [page]);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await featureRequestService.submit(title.trim(), description.trim(), category);
      setTitle('');
      setDescription('');
      setSearch('');
      setDebouncedSearch('');
      setOffset(0);
      setScope('mine');
      toast.success('Request sent for review');
      if (scope === 'mine') await load();
    } catch (err) {
      toast.error(requestError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const vote = async (id) => {
    setVotingId(id);
    try {
      const hasVoted = await featureRequestService.toggleVote(id);
      setPage((current) => ({
        ...current,
        items: current.items.map((item) =>
          item.id === id
            ? {
                ...item,
                has_voted: hasVoted,
                vote_count: Math.max(0, item.vote_count + (hasVoted ? 1 : -1)),
              }
            : item
        ),
      }));
    } catch (err) {
      toast.error(requestError(err));
    } finally {
      setVotingId(null);
    }
  };

  if (loading && !page) return <PageSkeleton />;

  return (
    <main className="relative min-h-full overflow-hidden bg-[#f8f8fb] px-3 py-4 pb-10 text-slate-950 dark:bg-[#08080a] dark:text-white sm:px-4 md:px-5 md:py-5">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(#5a63df_1.2px,transparent_1.2px)] bg-size-[20px_20px] opacity-[0.08] dark:opacity-[0.12]"
      />
      <m.div
        variants={STAGGER_CONTAINER}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto max-w-6xl space-y-3"
      >
        <m.header variants={FADE_UP} className={cn(PANEL, 'overflow-hidden')}>
          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between md:p-5">
            <div className="min-w-0">
              <Link
                to="/settings"
                className="mb-2 inline-flex items-center gap-1 rounded-sm text-xs font-bold text-[#5a63df] transition-colors hover:text-[#424bb7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Account settings
              </Link>
              <div className="flex items-center gap-3">
                <IconChip icon={Lightbulb} size="md" />
                <div className="min-w-0">
                  <h1 className="text-2xl font-extrabold tracking-tight">Feature requests</h1>
                  <p className={cn('mt-0.5 max-w-2xl text-sm', MUTED)}>
                    Share product ideas, vote on approved requests, and follow what moves onto the
                    roadmap.
                  </p>
                </div>
              </div>
            </div>
            <a href="#suggest-feature" className={cn(primaryButton, 'w-full sm:w-auto')}>
              <Lightbulb className="h-4 w-4" /> Suggest a feature
            </a>
          </div>
          <div className="grid gap-px border-t border-[#e4e2f0] bg-[#e4e2f0] dark:border-white/[0.07] dark:bg-white/[0.07] sm:grid-cols-3">
            {REVIEW_STEPS.map(({ icon: Icon, label, detail }, index) => (
              <div
                key={label}
                className="flex items-center gap-2.5 bg-white px-4 py-3 dark:bg-[#131217]"
              >
                <span className={cn(NUM, 'text-xs font-bold text-[#5a63df] dark:text-[#afb5ff]')}>
                  0{index + 1}
                </span>
                <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-xs font-extrabold text-slate-800 dark:text-slate-100">
                    {label}
                  </span>
                  <span className={cn('block truncate text-[10px] font-medium', MUTED)}>
                    {detail}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </m.header>

        <div className="grid min-w-0 gap-3 lg:grid-cols-12 lg:items-start">
          <m.section
            variants={FADE_UP}
            className={cn(PANEL, 'min-w-0 overflow-hidden lg:col-span-8')}
            aria-label="Feature request board"
            aria-busy={loading}
          >
            <div className="border-b border-[#e4e2f0] p-4 dark:border-white/[0.07]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div
                  className="flex rounded-lg bg-[#f4f3fb] p-0.5 dark:bg-white/[0.06]"
                  role="tablist"
                  aria-label="Request views"
                >
                  {[
                    ['board', 'Explore ideas'],
                    ['mine', 'My requests'],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      role="tab"
                      aria-selected={scope === value}
                      onClick={() => {
                        setScope(value);
                        setOffset(0);
                      }}
                      className={cn(
                        'rounded-md px-3 py-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]',
                        scope === value
                          ? 'bg-white text-[#4a52c9] ring-1 ring-[#e4e2f0] dark:bg-white/10 dark:text-[#bdc2ff] dark:ring-white/10'
                          : MUTED
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <span className={cn(MICRO, MUTED)} aria-live="polite">
                  <span className={NUM}>{page?.total || 0}</span> matching requests
                </span>
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <label className="relative flex-1">
                  <span className="sr-only">Search feature requests</span>
                  <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    className={cn(field, 'pl-9')}
                    value={search}
                    maxLength={100}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by title or description"
                  />
                </label>
                <label className="sr-only" htmlFor="feature-sort">
                  Sort ideas
                </label>
                <select
                  id="feature-sort"
                  className={cn(field, 'sm:w-36')}
                  value={sort}
                  onChange={(event) => {
                    setSort(event.target.value);
                    setOffset(0);
                  }}
                >
                  <option value="top">Top voted</option>
                  <option value="new">Newest</option>
                </select>
              </div>
            </div>

            <div className="p-4">
              {error ? (
                <div
                  className="rounded-lg border border-[rgb(var(--signal-fault)/0.3)] bg-[rgb(var(--signal-fault)/0.06)] p-4 text-sm"
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
                <div className="space-y-2 animate-pulse" aria-label="Loading requests">
                  {[1, 2, 3].map((number) => (
                    <div key={number} className="h-32 rounded-lg bg-slate-100 dark:bg-white/5" />
                  ))}
                </div>
              ) : page?.items?.length ? (
                <div className="space-y-2">
                  {page.items.map((request) => (
                    <RequestCard
                      key={request.id}
                      request={request}
                      onVote={vote}
                      voting={votingId === request.id}
                    />
                  ))}
                </div>
              ) : (
                <Empty
                  icon={Lightbulb}
                  title={scope === 'mine' ? 'No requests yet' : 'No ideas found'}
                  message={
                    scope === 'mine'
                      ? 'Your private submissions and team updates will appear here.'
                      : 'Try another search or submit the first idea.'
                  }
                  className="py-12"
                />
              )}
              {!error && (offset > 0 || offset + 20 < (page?.total || 0)) && (
                <nav
                  aria-label="Request pages"
                  className="mt-4 flex items-center justify-between gap-3 border-t border-[#e4e2f0] pt-4 text-sm dark:border-white/[0.07]"
                >
                  <button
                    type="button"
                    disabled={!offset || loading}
                    className={quietButton}
                    onClick={() => setOffset(Math.max(0, offset - 20))}
                  >
                    Previous
                  </button>
                  <span className={cn(NUM, 'text-xs font-bold')}>
                    Page {Math.floor(offset / 20) + 1}
                  </span>
                  <button
                    type="button"
                    disabled={loading || offset + 20 >= page.total}
                    className={quietButton}
                    onClick={() => setOffset(offset + 20)}
                  >
                    Next
                  </button>
                </nav>
              )}
            </div>
          </m.section>

          <m.aside
            id="suggest-feature"
            variants={FADE_UP}
            className={cn(PANEL, 'h-fit min-w-0 scroll-mt-4 p-4 lg:sticky lg:top-4 lg:col-span-4')}
          >
            <PanelTitle label="Suggest a feature" accent />
            <p className={cn('text-sm leading-relaxed', MUTED)}>
              Describe one product improvement and why it would help your IELTS practice. Support
              questions still belong on the contact page.
            </p>

            <div
              className={cn(TILE, 'mt-3 p-3')}
              aria-label={`${page?.remaining ?? 0} of ${page?.limit ?? 0} requests remaining ${
                page?.period === 'month' ? 'this UTC month' : 'for this account'
              }`}
            >
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className={cn(MICRO, MUTED)}>Submission allowance</p>
                  <p className="mt-1 text-xs font-bold text-slate-700 dark:text-slate-200">
                    <span className={cn(NUM, 'text-base text-slate-950 dark:text-white')}>
                      {page?.remaining ?? '—'}
                    </span>{' '}
                    of <span className={NUM}>{page?.limit ?? '—'}</span> remaining
                  </p>
                </div>
                <Pill tone={page?.remaining ? 'accent' : 'neutral'}>
                  {page?.period === 'month' ? 'UTC month' : 'Lifetime'}
                </Pill>
              </div>
              <Bar value={quotaPercent} className="mt-3" />
              <p className={cn('mt-2 text-[10px] font-medium leading-relaxed', MUTED)}>
                All submissions count, including requests the team does not plan to pursue.
              </p>
            </div>

            <form onSubmit={submit} className="mt-4 space-y-3">
              <fieldset disabled={!page?.remaining || submitting}>
                <legend className="text-xs font-bold">Which area is this for?</legend>
                <div
                  className="mt-1.5 grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3"
                  role="radiogroup"
                  aria-label="Feature area"
                >
                  {Object.entries(FEATURE_AREAS).map(([value, meta]) => {
                    const selected = category === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setCategory(value)}
                        className={cn(
                          'min-h-9 rounded-lg border px-2.5 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] disabled:cursor-not-allowed disabled:opacity-50',
                          selected
                            ? 'border-[#5a63df]/50 bg-[#5a63df]/10 text-[#4a52c9] dark:text-[#bdc2ff]'
                            : 'border-[#e4e2f0] bg-white text-slate-600 hover:border-[#5a63df]/30 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300'
                        )}
                      >
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
              <label className="block text-xs font-bold">
                <span className="flex items-center justify-between gap-2">
                  Title
                  <span className={cn(NUM, MICRO, MUTED)}>{title.length}/120</span>
                </span>
                <input
                  className={cn(field, 'mt-1')}
                  required
                  minLength={8}
                  maxLength={120}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="What should we add?"
                  disabled={!page?.remaining || submitting}
                />
              </label>
              <label className="block text-xs font-bold">
                <span className="flex items-center justify-between gap-2">
                  Why would it help?
                  <span className={cn(NUM, MICRO, MUTED)}>{description.length}/1000</span>
                </span>
                <textarea
                  className={cn(field, 'mt-1 min-h-32 resize-y')}
                  required
                  minLength={20}
                  maxLength={1000}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Describe the problem and the outcome you want."
                  disabled={!page?.remaining || submitting}
                />
              </label>
              <button
                type="submit"
                className={cn(primaryButton, 'w-full')}
                disabled={!page?.remaining || submitting}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {submitting ? 'Sending for review…' : 'Send request'}
              </button>
            </form>
            {!page?.remaining && (
              <p
                className={cn(
                  'mt-3 rounded-lg bg-[#f4f3fb] p-3 text-xs leading-relaxed dark:bg-white/[0.05]',
                  MUTED
                )}
              >
                You can still vote on approved ideas. Paid allowances refresh at the next UTC month;
                the free allowance is lifetime.
              </p>
            )}
          </m.aside>
        </div>
      </m.div>
    </main>
  );
}
