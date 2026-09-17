import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { m, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  Lightbulb,
  Loader2,
  Search,
  Send,
  SlidersHorizontal,
  ThumbsUp,
  X,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FEATURE_AREAS,
  featureRequestService,
  REQUEST_STATUS,
  requestError,
} from '../featureRequestService';

const primaryButton =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#5a63df] px-4 text-sm font-bold text-white shadow-2xs transition-colors duration-150 hover:bg-[#4a52c9] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 dark:focus-visible:ring-offset-[#100f15]';
const quietButton =
  'inline-flex min-h-9 items-center justify-center rounded-lg border border-[#e4e2f0] bg-white px-3 text-xs font-bold text-slate-700 transition-colors duration-150 hover:border-[#5a63df]/40 hover:text-[#5a63df] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-slate-200';
const field =
  'w-full rounded-lg border border-[#e4e2f0] bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors duration-150 placeholder:text-slate-400 focus:border-[#5a63df] focus:ring-2 focus:ring-[#5a63df]/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 dark:border-white/10 dark:bg-[#18171f] dark:text-white dark:placeholder:text-slate-500 dark:disabled:bg-white/[0.03]';

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

function RequestCardSkeleton() {
  return (
    <div className={cn(TILE, 'flex min-w-0 gap-3 p-3.5 sm:p-4 animate-pulse')}>
      <div className="h-[68px] w-12 shrink-0 rounded-lg bg-slate-200/80 dark:bg-white/10" />
      <div className="min-w-0 flex-1 space-y-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="h-4 w-44 rounded-md bg-slate-200/80 dark:bg-white/10" />
          <div className="h-4 w-16 rounded-full bg-slate-200/80 dark:bg-white/10" />
          <div className="h-4 w-16 rounded-full bg-slate-200/80 dark:bg-white/10" />
        </div>
        <div className="h-3.5 w-full rounded bg-slate-200/70 dark:bg-white/10" />
        <div className="h-3.5 w-4/5 rounded bg-slate-200/70 dark:bg-white/10" />
        <div className="h-2.5 w-28 rounded bg-slate-200/60 dark:bg-white/10 pt-1" />
      </div>
    </div>
  );
}

function RequestCard({ request, onVote, voting }) {
  const status = REQUEST_STATUS[request.status] || REQUEST_STATUS.pending;
  const area = FEATURE_AREAS[request.category] || FEATURE_AREAS.other;
  const canVote = !request.is_mine && !['pending', 'declined'].includes(request.status);

  return (
    <article
      className={cn(
        TILE,
        'group flex min-w-0 gap-3 p-3.5 sm:p-4 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-2xs'
      )}
    >
      <button
        type="button"
        onClick={() => onVote(request.id)}
        disabled={!canVote || voting}
        aria-label={`${request.has_voted ? 'Remove vote from' : 'Upvote'} ${request.title}`}
        aria-pressed={Boolean(request.has_voted)}
        className={cn(
          'flex h-[68px] w-12 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border text-xs font-bold transition-all duration-150 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] disabled:cursor-not-allowed',
          request.has_voted
            ? 'border-[#5a63df] bg-[#5a63df]/12 text-[#434ac9] shadow-2xs dark:border-[#5a63df]/70 dark:bg-[#5a63df]/25 dark:text-[#c3c7ff]'
            : 'border-[#e4e2f0] bg-white text-slate-600 enabled:hover:border-[#5a63df]/40 enabled:hover:text-[#5a63df] enabled:hover:bg-[#faf9ff] dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300 dark:enabled:hover:bg-white/[0.06]',
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
                  className="relative flex rounded-lg bg-[#f4f3fb] p-1 dark:bg-white/[0.06]"
                  role="tablist"
                  aria-label="Request views"
                >
                  {[
                    ['board', 'Explore ideas'],
                    ['mine', 'My requests'],
                  ].map(([value, label]) => {
                    const active = scope === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => {
                          if (scope !== value) {
                            setScope(value);
                            setOffset(0);
                          }
                        }}
                        className={cn(
                          'relative z-10 rounded-md px-3.5 py-1.5 text-xs font-bold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]',
                          active
                            ? 'text-[#434ac9] dark:text-[#c3c7ff]'
                            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                        )}
                      >
                        {active && (
                          <m.div
                            layoutId="feature-tab-pill"
                            className="absolute inset-0 rounded-md bg-white shadow-2xs dark:bg-white/12"
                            transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                          />
                        )}
                        <span className="relative z-10">{label}</span>
                      </button>
                    );
                  })}
                </div>
                <span className={cn(MICRO, MUTED)} aria-live="polite">
                  <span className={NUM}>{page?.total || 0}</span> matching requests
                </span>
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <label className="relative flex-1">
                  <span className="sr-only">Search feature requests</span>
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    className={cn(field, 'pl-9 pr-9')}
                    value={search}
                    maxLength={100}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by title or description"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      aria-label="Clear search"
                      className="absolute right-2.5 top-2.5 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </label>
                <div className="sm:w-44">
                  <Select
                    value={sort}
                    onValueChange={(val) => {
                      setSort(val);
                      setOffset(0);
                    }}
                  >
                    <SelectTrigger
                      id="feature-sort"
                      aria-label="Sort feature requests"
                      className="h-9 w-full rounded-lg border-[#e4e2f0] bg-white px-3 text-xs font-bold text-slate-700 shadow-2xs hover:border-[#5a63df]/40 focus:border-[#5a63df] focus:ring-2 focus:ring-[#5a63df]/20 dark:border-white/10 dark:bg-[#18171f] dark:text-slate-200"
                    >
                      <div className="flex items-center gap-2">
                        <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
                        <SelectValue placeholder="Sort ideas" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="border-[#e4e2f0] bg-white/95 backdrop-blur-md dark:border-white/10 dark:bg-[#141319]">
                      <SelectItem value="top" className="text-xs font-medium cursor-pointer">
                        Top voted
                      </SelectItem>
                      <SelectItem value="new" className="text-xs font-medium cursor-pointer">
                        Newest
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
              ) : (
                <AnimatePresence mode="wait" initial={false}>
                  {loading ? (
                    <m.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-2"
                      aria-label="Loading requests"
                    >
                      <RequestCardSkeleton />
                      <RequestCardSkeleton />
                      <RequestCardSkeleton />
                    </m.div>
                  ) : page?.items?.length ? (
                    <m.div
                      key={`content-${scope}-${sort}-${offset}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="space-y-2"
                    >
                      {page.items.map((request) => (
                        <RequestCard
                          key={request.id}
                          request={request}
                          onVote={vote}
                          voting={votingId === request.id}
                        />
                      ))}
                    </m.div>
                  ) : (
                    <m.div
                      key="empty"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
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
                    </m.div>
                  )}
                </AnimatePresence>
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
                          'relative flex min-h-9 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-xs font-bold transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] disabled:cursor-not-allowed disabled:opacity-50',
                          selected
                            ? 'border-[#5a63df] bg-[#5a63df]/10 text-[#434ac9] shadow-2xs dark:border-[#5a63df]/70 dark:bg-[#5a63df]/20 dark:text-[#c3c7ff]'
                            : 'border-[#e4e2f0] bg-white text-slate-600 hover:border-[#5a63df]/30 hover:bg-[#faf9ff] dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300 dark:hover:bg-white/[0.06]'
                        )}
                      >
                        {selected && (
                          <Check className="h-3 w-3 shrink-0 stroke-[3] text-[#5a63df] dark:text-[#a5adff]" />
                        )}
                        <span>{meta.label}</span>
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
