import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Flag, Loader2, Mail, Search } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import {
  AdminPageHeader,
  Empty,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  Pill,
  TILE,
  TITLE,
} from '@/components/admin/ui/primitives';
import { testIssueReportsService } from '@/features/admin/services/testIssueReportsService';

const PAGE_SIZE = 20;
const STATUS_OPTIONS = [
  { id: 'open', label: 'Open' },
  { id: 'reviewing', label: 'Reviewing' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'dismissed', label: 'Dismissed' },
  { id: 'all', label: 'All' },
];
const STATUS_TONE = {
  open: 'warn',
  reviewing: 'accent',
  resolved: 'ok',
  dismissed: 'neutral',
};
const ISSUE_LABEL = {
  question_error: 'Question or instructions',
  answer_error: 'Answer or answer key',
  typo: 'Typo or formatting',
  audio_problem: 'Audio problem',
  other: 'Other',
};
const fieldClass =
  'h-9 rounded-md border border-stone-300 bg-white px-3 text-xs font-medium text-stone-800 outline-none focus-visible:border-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-500/20 dark:border-white/15 dark:bg-[#131315] dark:text-stone-100';

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Unknown date'
    : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
};

export default function TestIssueReports() {
  const [status, setStatus] = useState('open');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [page, setPage] = useState({ items: [], total: 0 });
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setOffset(0);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await testIssueReportsService.adminPage({ status, search, offset });
      setPage({ items: result?.items || [], total: result?.total || 0 });
    } catch (loadError) {
      setPage({ items: [], total: 0 });
      setError(loadError?.message || 'Could not load test issue reports.');
    } finally {
      setLoading(false);
    }
  }, [status, search, offset]);

  useEffect(() => {
    load();
  }, [load]);

  const saveReport = async (report) => {
    const draft = drafts[report.id] || {};
    const nextStatus = draft.status || report.status;
    const nextNote = draft.adminNote ?? report.admin_note ?? '';
    setSavingId(report.id);
    try {
      await testIssueReportsService.updateStatus(report.id, nextStatus, nextNote);
      toast.success('Report updated');
      setDrafts((current) => {
        const next = { ...current };
        delete next[report.id];
        return next;
      });
      await load();
    } catch (saveError) {
      toast.error('Could not update report', {
        description: saveError?.message || 'Please try again.',
      });
    } finally {
      setSavingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(page.total / PAGE_SIZE));
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div className="space-y-4 pb-10 pt-12 md:pt-0">
      <AdminPageHeader
        title="Test issue reports"
        description="Review possible mistakes in Reading and Listening tests and record their status."
      >
        <Pill tone={status === 'open' ? 'warn' : 'neutral'}>
          <span className={NUM}>{page.total}</span> matching
        </Pill>
      </AdminPageHeader>

      <section className={cn(PANEL, 'space-y-3 p-3 sm:p-4')} aria-label="Report filters">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search reports</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400"
              aria-hidden="true"
            />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search test, report, or email"
              className={cn(fieldClass, 'w-full pl-9')}
            />
          </label>
          <div
            role="group"
            className="flex gap-1 overflow-x-auto pb-0.5"
            aria-label="Filter by status"
          >
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={status === option.id}
                onClick={() => {
                  setStatus(option.id);
                  setOffset(0);
                }}
                className={cn(
                  'h-8 shrink-0 rounded-md border px-2.5 text-[10px] font-bold transition-colors',
                  status === option.id
                    ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-400/30 dark:bg-indigo-400/10 dark:text-indigo-200'
                    : 'border-stone-200 text-stone-500 hover:bg-stone-50 dark:border-white/10 dark:text-stone-400 dark:hover:bg-white/5'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-[rgb(var(--signal-fault)/0.3)] bg-[rgb(var(--signal-fault)/0.06)] p-3 text-xs font-semibold text-[rgb(var(--signal-fault))]"
        >
          {error}
        </div>
      ) : null}

      {loading && !page.items.length ? (
        <div className={cn(PANEL, 'flex items-center justify-center gap-2 p-10')}>
          <Loader2 className="h-4 w-4 animate-spin text-indigo-500" aria-hidden="true" />
          <span className={cn('text-xs font-semibold', MUTED)}>Loading reports…</span>
        </div>
      ) : !loading && !page.items.length ? (
        <Empty
          icon={Flag}
          title={error ? 'Reports could not be loaded' : 'No reports in this view'}
          className="py-12"
        >
          {error
            ? 'Check the report service and try again.'
            : 'New learner reports will appear here.'}
        </Empty>
      ) : (
        <div className="space-y-3" aria-live="polite">
          {page.items.map((report) => {
            const draft = drafts[report.id] || {};
            const note = draft.adminNote ?? report.admin_note ?? '';
            return (
              <article key={report.id} className={cn(PANEL, 'space-y-3 p-3 sm:p-4')}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h3 className={TITLE}>{report.test_title || `${report.test_type} test`}</h3>
                      <Pill tone="neutral" className="capitalize">
                        {report.test_type}
                      </Pill>
                      <Pill tone={STATUS_TONE[report.status] || 'neutral'}>{report.status}</Pill>
                    </div>
                    <p className={cn(MICRO, MUTED, 'mt-1')}>
                      {ISSUE_LABEL[report.issue_type] || report.issue_type} ·{' '}
                      {formatDate(report.created_at)}
                    </p>
                  </div>
                  {report.requester_email ? (
                    <a
                      href={`mailto:${report.requester_email}?subject=${encodeURIComponent(`Re: ${report.test_title || 'test issue report'}`)}`}
                      className="inline-flex h-7 items-center gap-1.5 rounded-md border border-stone-200 px-2 text-[10px] font-bold text-stone-600 hover:bg-stone-50 dark:border-white/10 dark:text-stone-300 dark:hover:bg-white/5"
                    >
                      <Mail className="h-3 w-3" aria-hidden="true" />
                      Reply
                      <ExternalLink className="h-2.5 w-2.5" aria-hidden="true" />
                    </a>
                  ) : null}
                </div>

                <div className="grid gap-2 text-[11px] sm:grid-cols-2 lg:grid-cols-4">
                  <div className={cn(TILE, 'min-w-0 p-2.5')}>
                    <span className={cn(MICRO, MUTED)}>Learner</span>
                    <p className="mt-1 truncate font-semibold text-stone-800 dark:text-stone-100">
                      {report.requester_name || 'Learner'}
                    </p>
                    <p className="truncate text-stone-500 dark:text-stone-400">
                      {report.requester_email || 'Email unavailable'}
                    </p>
                  </div>
                  <div className={cn(TILE, 'p-2.5')}>
                    <span className={cn(MICRO, MUTED)}>Test details</span>
                    <p className="mt-1 font-semibold capitalize text-stone-800 dark:text-stone-100">
                      {report.section_label || 'Section unavailable'}
                      {report.question_reference ? ` · ${report.question_reference}` : ''}
                    </p>
                    <p className="capitalize text-stone-500 dark:text-stone-400">
                      {report.test_mode ? `${report.test_mode} mode` : 'Mode unavailable'}
                      {report.test_id ? ` · ID ${report.test_id.slice(0, 12)}` : ''}
                    </p>
                  </div>
                  <div className={cn(TILE, 'p-2.5')}>
                    <span className={cn(MICRO, MUTED)}>Plan</span>
                    <p className="mt-1 font-semibold capitalize text-stone-800 dark:text-stone-100">
                      {report.requester_tier || 'free'}
                    </p>
                  </div>
                  <div className={cn(TILE, 'p-2.5')}>
                    <span className={cn(MICRO, MUTED)}>Report ID</span>
                    <p className={cn(NUM, 'mt-1 truncate text-stone-700 dark:text-stone-200')}>
                      {report.id}
                    </p>
                  </div>
                </div>

                <div className={cn(TILE, 'p-3')}>
                  <p className={cn(MICRO, MUTED, 'mb-1.5')}>Learner details</p>
                  <p className="whitespace-pre-wrap break-words text-xs leading-relaxed text-stone-800 dark:text-stone-100">
                    {report.description}
                  </p>
                </div>

                <div className="grid gap-2 sm:grid-cols-[minmax(130px,0.3fr)_1fr_auto] sm:items-end">
                  <label className="space-y-1">
                    <span className={cn(MICRO, MUTED)}>Status</span>
                    <select
                      value={draft.status || report.status}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [report.id]: { ...current[report.id], status: event.target.value },
                        }))
                      }
                      className={cn(fieldClass, 'block w-full')}
                    >
                      {STATUS_OPTIONS.filter((option) => option.id !== 'all').map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className={cn(MICRO, MUTED)}>Internal note</span>
                    <input
                      value={note}
                      maxLength={500}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [report.id]: { ...current[report.id], adminNote: event.target.value },
                        }))
                      }
                      placeholder="Optional note for the review team"
                      className={cn(fieldClass, 'block w-full')}
                    />
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    disabled={savingId === report.id}
                    onClick={() => saveReport(report)}
                    className="bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    {savingId === report.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Save update
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {page.total > PAGE_SIZE ? (
        <div className="flex items-center justify-end gap-2">
          <span className={cn(NUM, 'mr-2 text-[10px]', MUTED)}>
            Page {currentPage} of {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={offset === 0 || loading}
            onClick={() => setOffset((current) => Math.max(0, current - PAGE_SIZE))}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={offset + PAGE_SIZE >= page.total || loading}
            onClick={() => setOffset((current) => current + PAGE_SIZE)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
