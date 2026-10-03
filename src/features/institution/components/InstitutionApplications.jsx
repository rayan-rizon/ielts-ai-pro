import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Inbox, Search, Copy, ExternalLink, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  PANEL,
  TILE,
  MUTED,
  MICRO,
  NUM,
  Pill,
  Empty,
} from '@/features/dashboard/components/primitives';
import { Input } from '@/components/ui/input';
import { NativeSelect } from './NativeSelect';
import { institutionRequest } from '../services/institutions';
import { historyDate } from '../services/history';
const INPUT =
  'w-full rounded-lg border border-[#e4e2f0] bg-white px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground transition-all hover:border-[#5a63df]/40 focus-visible:border-[#5a63df] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]/20 dark:border-white/10 dark:bg-[#141319] dark:text-slate-100 dark:placeholder:text-stone-500 shadow-2xs';
const BUTTON =
  'inline-flex h-9 items-center justify-center rounded-lg bg-[#5a63df] px-3.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#4d55c7] active:scale-[0.98] disabled:opacity-50 cursor-pointer';
const SECONDARY =
  'inline-flex h-9 items-center justify-center rounded-lg border border-[#e4e2f0] bg-white px-3.5 text-xs font-semibold text-foreground transition-all hover:bg-[#f7f6fd] hover:border-[#5a63df]/40 hover:text-[#5a63df] dark:border-white/10 dark:bg-[#141319] dark:hover:bg-white/5 dark:hover:text-white disabled:opacity-50 cursor-pointer shadow-2xs';
function shouldSkipAutoRefresh(isReviewing, isSaving) {
  if (document.visibilityState === 'hidden') return true;
  if (isReviewing) return true;
  return Boolean(isSaving);
}

function ApplicationFilters({
  status,
  onStatusChange,
  search,
  onSearchChange,
  onSearchSubmit,
  onRefresh,
  busy,
  saving,
  hasReview,
}) {
  return (
    <div className={`${PANEL} flex flex-col sm:flex-row sm:items-end gap-3 p-3.5`}>
      <label className="block w-full sm:w-44 text-xs font-semibold">
        <span className={`${MICRO} ${MUTED} block mb-1`}>Status</span>
        <NativeSelect
          aria-label="Status"
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="h-9 text-xs"
        >
          {[
            ['pending', 'Pending'],
            ['approved', 'Approved'],
            ['declined', 'Declined'],
            ['all', 'All requests'],
          ].map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </NativeSelect>
      </label>
      <form className="flex min-w-0 flex-1 items-end gap-2" onSubmit={onSearchSubmit}>
        <label className="min-w-0 flex-1 text-xs font-semibold">
          <span className={`${MICRO} ${MUTED} block mb-1`}>Search requests</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              className="h-9 pl-8 text-xs rounded-lg border border-[#e4e2f0] dark:border-white/10"
              placeholder="Institution, contact person, or email"
              maxLength={160}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </label>
        <button className={BUTTON} aria-label="Search institution requests">
          <Search className="mr-1.5 h-3.5 w-3.5" />
          Search
        </button>
      </form>
      <button
        type="button"
        className={SECONDARY}
        disabled={busy || saving || hasReview}
        onClick={onRefresh}
      >
        <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
        Refresh requests
      </button>
    </div>
  );
}

function ApplicationResultBanner({ result, onDismiss }) {
  if (!result) return null;
  const isApproved = result.application.status === 'approved';
  return (
    <div role="status" className={`${PANEL} space-y-3 p-4`}>
      <p className="text-sm font-bold">
        {isApproved ? 'Institution approved' : 'Request declined'}
      </p>
      {isApproved && (
        <>
          <p className={`${MUTED} text-xs`}>
            {result.delivery_error ||
              (result.already_reviewed
                ? 'This request was already approved. Open the institution to manage or resend the owner invitation.'
                : 'The owner invitation has been sent. Access starts after they accept it.')}
          </p>
          <Link
            className="inline-flex items-center gap-2 text-xs font-bold text-[#5a63df] dark:text-[#bfc3ff]"
            to={`/admin/panel?tab=institutions&institution=${result.application.institution_id}`}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open institution
          </Link>
          {result.url && (
            <div className="flex gap-2">
              <input
                className={INPUT}
                aria-label="Approved owner invitation link"
                value={result.url}
                readOnly
              />
              <button
                className={SECONDARY}
                aria-label="Copy owner invitation link"
                onClick={() => navigator.clipboard.writeText(result.url)}
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
      {!isApproved && (
        <p className={`${MUTED} text-xs`}>
          The decision and review reason are recorded. No institution or owner access was created.
        </p>
      )}
      <button className={SECONDARY} onClick={onDismiss}>
        Dismiss
      </button>
    </div>
  );
}

function ApplicationItem({ a, saving, onStartReview }) {
  const isPending = a.status === 'pending';
  const tone = a.status === 'approved' ? 'ok' : isPending ? 'warn' : 'neutral';

  return (
    <li className={`${PANEL} min-w-0 space-y-3 p-4 sm:p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words text-sm font-bold">{a.institution_name}</h3>
          <p className={`${MUTED} mt-1 break-words text-xs`}>
            {a.contact_name} · {a.email}
          </p>
        </div>
        <Pill tone={tone}>{a.status}</Pill>
      </div>
      <dl className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <dt className={`${MICRO} ${MUTED}`}>Country</dt>
          <dd className="mt-1 break-words">{a.country}</dd>
        </div>
        <div>
          <dt className={`${MICRO} ${MUTED}`}>Expected seats</dt>
          <dd className={`${NUM} mt-1`}>{a.expected_seats}</dd>
        </div>
        <div className="col-span-2">
          <dt className={`${MICRO} ${MUTED}`}>Requested</dt>
          <dd className="mt-1">{historyDate(a.created_at)}</dd>
        </div>
      </dl>
      {a.message && (
        <p className={`${TILE} whitespace-pre-wrap break-words p-3 text-sm`}>{a.message}</p>
      )}
      {a.decision_reason && (
        <p className={`${MUTED} break-words text-xs`}>
          Reviewed {historyDate(a.reviewed_at)} · {a.decision_reason}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {isPending ? (
          <>
            <button className={BUTTON} disabled={saving} onClick={() => onStartReview(a, true)}>
              Approve & invite owner
            </button>
            <button className={SECONDARY} disabled={saving} onClick={() => onStartReview(a, false)}>
              Decline
            </button>
          </>
        ) : (
          a.institution_id && (
            <Link
              className={SECONDARY}
              to={`/admin/panel?tab=institutions&institution=${a.institution_id}`}
            >
              Manage institution
            </Link>
          )
        )}
      </div>
    </li>
  );
}

function getReviewDialogTexts(approve, institutionName, email) {
  if (approve) {
    return {
      title: 'Approve institution request',
      description: `Create ${institutionName} and invite ${email} as its owner. This does not grant free seats or start a payment.`,
      submitLabel: 'Approve and send invitation',
    };
  }
  return {
    title: 'Decline institution request',
    description: 'Record why this request is being declined. No access will be granted.',
    submitLabel: 'Decline request',
  };
}

function ApplicationReviewForm({ review, saving, error, onClose, onSubmit }) {
  const isApprove = Boolean(review.approve);
  const texts = getReviewDialogTexts(
    isApprove,
    review.application.institution_name,
    review.application.email
  );
  const submitText = saving ? 'Saving…' : texts.submitLabel;

  return (
    <>
      <DialogHeader>
        <DialogTitle>{texts.title}</DialogTitle>
        <DialogDescription>{texts.description}</DialogDescription>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-4">
        {isApprove && (
          <label className="block space-y-1.5 text-xs font-semibold">
            Billing currency
            <NativeSelect name="currency" aria-label="Billing currency" className="h-9 text-xs">
              <option value="USD">USD — US Dollar</option>
              <option value="BDT">BDT — Bangladeshi Taka</option>
            </NativeSelect>
          </label>
        )}
        <label className="block space-y-1.5 text-xs font-semibold">
          Review reason
          <textarea
            className={INPUT}
            name="reason"
            aria-label="Review reason"
            required
            minLength={1}
            maxLength={1000}
            rows={3}
            placeholder="Explain the review decision or audit notes..."
          />
        </label>
        {error && (
          <p role="alert" className="text-sm text-[rgb(var(--signal-fault))]">
            {error}
          </p>
        )}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e4e2f0] dark:border-white/10">
          <button type="button" className={SECONDARY} disabled={saving} onClick={onClose}>
            Cancel
          </button>
          <button className={BUTTON} disabled={saving}>
            {submitText}
          </button>
        </div>
      </form>
    </>
  );
}

function ApplicationReviewDialog({ review, saving, error, onClose, onSubmit }) {
  const handleOpenChange = (open) => {
    if (!open && !saving) {
      onClose();
    }
  };

  return (
    <Dialog open={Boolean(review)} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md rounded-2xl">
        {review && (
          <ApplicationReviewForm
            review={review}
            saving={saving}
            error={error}
            onClose={onClose}
            onSubmit={onSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ApplicationsListFooter({ busy, error, entriesCount, nextCursor, onLoadMore }) {
  const hasNoResults = !busy && !error && entriesCount === 0;

  return (
    <>
      {busy && (
        <p role="status" className={`${MUTED} text-sm`}>
          Loading requests…
        </p>
      )}

      {hasNoResults && (
        <Empty
          icon={Inbox}
          title="No matching requests"
          description="New institution applications appear here. Try another status or search."
        />
      )}

      {nextCursor && (
        <button className={SECONDARY} disabled={busy} onClick={() => onLoadMore(nextCursor)}>
          Load older requests
        </button>
      )}
    </>
  );
}

function useApplicationsList({ status, query, onPendingCountChanged, review, saving }) {
  const [entries, setEntries] = useState([]);
  const [page, setPage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const generation = useRef(0);

  const load = useCallback(
    async (cursor = null) => {
      const version = ++generation.current;
      setBusy(true);
      setError('');
      try {
        const response = await institutionRequest('applications_list', {
          status,
          search: query,
          ...cursor,
        });
        if (version !== generation.current) return;
        setEntries((old) => (cursor ? [...old, ...response.entries] : response.entries));
        setPage(response);
        onPendingCountChanged?.(response.pending_count);
      } catch (e) {
        if (version === generation.current) setError(e.message);
      } finally {
        if (version === generation.current) setBusy(false);
      }
    },
    [status, query, onPendingCountChanged]
  );

  useEffect(() => {
    const requestGeneration = generation;
    setEntries([]);
    setPage(null);
    load();
    return () => {
      requestGeneration.current++;
    };
  }, [load]);

  useEffect(() => {
    const refresh = () => {
      if (shouldSkipAutoRefresh(Boolean(review), saving)) return;
      load();
    };
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [load, review, saving]);

  return { entries, page, busy, error, setError, load };
}

export default function InstitutionApplications({ onApproved, onPendingCountChanged }) {
  const [status, setStatus] = useState('pending');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [review, setReview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  const { entries, page, busy, error, setError, load } = useApplicationsList({
    status,
    query,
    onPendingCountChanged,
    review,
    saving,
  });

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;
    const fields = Object.fromEntries(new FormData(e.currentTarget));
    setSaving(true);
    setError('');
    try {
      const response = await institutionRequest(
        review.approve ? 'application_approve' : 'application_decline',
        { application_id: review.application.id, ...fields }
      );
      setResult(response);
      setReview(null);
      await load();
      if (review.approve) onApproved?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStartReview = (application, approve) => {
    setError('');
    setReview({ application, approve });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setQuery(search.trim());
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-extrabold">Institution requests</h2>
        <p className={`${MUTED} mt-1 text-sm`}>
          Review new institutions before granting access. Approval creates an institution and sends
          an owner invitation. Set pricing and free seats in the institution’s details.
        </p>
      </div>

      <ApplicationFilters
        status={status}
        onStatusChange={setStatus}
        search={search}
        onSearchChange={setSearch}
        onSearchSubmit={handleSearchSubmit}
        onRefresh={() => load()}
        busy={busy}
        saving={saving}
        hasReview={Boolean(review)}
      />

      {error && (
        <div role="alert" className={`${PANEL} p-3 text-sm text-[rgb(var(--signal-fault))]`}>
          {error}{' '}
          {!review && (
            <button className="ml-2 underline" onClick={() => load()}>
              Try again
            </button>
          )}
        </div>
      )}

      <ApplicationResultBanner result={result} onDismiss={() => setResult(null)} />

      <ul className="space-y-3">
        {entries.map((a) => (
          <ApplicationItem key={a.id} a={a} saving={saving} onStartReview={handleStartReview} />
        ))}
      </ul>

      <ApplicationsListFooter
        busy={busy}
        error={error}
        entriesCount={entries.length}
        nextCursor={page?.next_cursor}
        onLoadMore={load}
      />

      <ApplicationReviewDialog
        review={review}
        saving={saving}
        error={error}
        onClose={() => setReview(null)}
        onSubmit={submit}
      />
    </section>
  );
}
