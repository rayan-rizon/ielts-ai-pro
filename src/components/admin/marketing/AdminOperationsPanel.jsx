import { useEffect, useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import {
  Sparkles,
  History,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  CircleCheck,
  Eye,
} from 'lucide-react';
import MarketingService from '@/features/admin/services/MarketingService';
import { PANEL, TILE, TITLE, MICRO, MUTED, Pill } from '@/features/dashboard/components/primitives';
import { AdminButton } from '@/components/admin/ui/primitives';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/cn';

const inputClass =
  'min-w-0 rounded-md border border-stone-200 bg-transparent px-3 py-2 text-base sm:text-sm dark:border-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';
const pretty = (value) => String(value || 'Unknown').replaceAll('_', ' ');
const date = (value) => (value ? new Date(value).toLocaleString() : 'Not recorded');
const shortDate = (value) =>
  value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—';
const shortDateTime = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '—';
const modelName = (value) => {
  if (!value) return 'Not recorded';
  return value.split('/').at(-1)?.replace('deepseek-v4-flash-0731', 'DeepSeek V4 Flash') || value;
};
const examples = [
  'How are messages performing by channel?',
  'How many messages were dismissed or snoozed?',
  'What is the status of checkout attempts?',
];
const report = (action, parameters) => MarketingService.adminReport(action, parameters);

function WindowSelect({ value, onChange, id, disabled }) {
  return (
    <label className="text-xs">
      <span className="sr-only">Reporting window</span>
      <select
        id={id}
        aria-label="Reporting window"
        className={inputClass}
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
    </label>
  );
}

function ReportFacts({ facts }) {
  const channelFacts = facts.filter((fact) => fact.channel && fact.status);
  if (channelFacts.length) {
    const channels = [...new Set(channelFacts.map((fact) => fact.channel))];
    const presentStatuses = new Set(
      channelFacts.filter((fact) => Number(fact.value) > 0).map((fact) => fact.status)
    );
    const statuses = ['accepted', 'delivered', 'viewed', 'clicked', 'skipped', 'failed'].filter(
      (status) => presentStatuses.has(status)
    );
    return (
      <div className="mt-2 overflow-x-auto rounded-md border border-stone-200 dark:border-white/10">
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
  const visible = facts.filter((fact) => Number(fact.value) > 0);
  return (
    <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
      {visible.map((fact) => (
        <div className={cn(TILE, 'min-w-0 px-2.5 py-2')} key={fact.id}>
          <p className="truncate text-[11px] text-stone-500 dark:text-stone-400" title={fact.label}>
            {fact.label}
          </p>
          <p className="font-mono text-base font-bold tabular-nums">{fact.value}</p>
        </div>
      ))}
      {!visible.length && (
        <p className="col-span-full py-2 text-sm">No activity recorded in this window.</p>
      )}
    </div>
  );
}

function MessagePreview({ item, user, onClose }) {
  const [email, setEmail] = useState(null);
  const [error, setError] = useState('');
  const isEmail = item.kind === 'emails' || item.channel === 'email';
  useEffect(() => {
    let active = true;
    if (isEmail)
      report('admin_email_preview', { user_id: user.id, message_id: item.id, kind: item.kind })
        .then((value) => {
          if (active) setEmail(value);
        })
        .catch((err) => {
          if (active) setError(err.message);
        });
    return () => {
      active = false;
    };
  }, [isEmail, item.id, item.kind, user.id]);
  const html = email?.html
    ? `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; form-action 'none'; base-uri 'none'">${DOMPurify.sanitize(email.html, { FORBID_TAGS: ['script', 'form', 'iframe', 'object', 'embed', 'base', 'meta', 'link', 'img'], FORBID_ATTR: ['srcset', 'src', 'href', 'background'] })}`
    : '';
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Recorded message</DialogTitle>
          <DialogDescription>
            {pretty(item.channel || (isEmail ? 'email' : item.recommended_channel))} ·{' '}
            {date(item.at)}. Preview only; no message will be sent.
          </DialogDescription>
        </DialogHeader>
        {isEmail ? (
          <>
            {error && <p role="alert">{error}</p>}
            {!email && !error && <p role="status">Retrieving original email…</p>}
            {email?.available === false && (
              <>
                <p>{email.reason}</p>
                {item.content && (
                  <div className={cn(TILE, 'p-3')}>
                    <p className={MICRO}>Saved copy · original email unavailable</p>
                    <h3 className={TITLE}>{item.content.title}</h3>
                    <p className="mt-2 text-sm">{item.content.message}</p>
                  </div>
                )}
              </>
            )}
            {email?.available && (
              <>
                <h3 className={TITLE}>{email.subject}</h3>
                <p className="text-xs">
                  Provider status: {pretty(email.provider_status)}. External images and links are
                  disabled in this preview.
                </p>
                {html ? (
                  <iframe
                    title="Original email preview"
                    sandbox=""
                    referrerPolicy="no-referrer"
                    srcDoc={html}
                    className="h-96 w-full border-0"
                  />
                ) : (
                  <pre className="whitespace-pre-wrap text-sm">
                    {email.text || 'The provider has no retained body.'}
                  </pre>
                )}
              </>
            )}
          </>
        ) : (
          <div className={cn(TILE, 'p-4')}>
            <h3 className={TITLE}>{item.content?.title || 'No saved title'}</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm">
              {item.content?.message || 'Message content was not retained.'}
            </p>
            {item.content?.cta_label && (
              <p className="mt-3 text-sm font-bold">{item.content.cta_label}</p>
            )}
            {item.content?.cta_url && (
              <p className="mt-1 break-all text-xs">Destination: {item.content.cta_url}</p>
            )}
            <p className={cn(MUTED, 'mt-3 text-xs')}>
              Saved content; appearance may vary by device. Push lock-screen text may be generic.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function LearnerTimeline() {
  const [search, setSearch] = useState(''),
    [learners, setLearners] = useState([]),
    [user, setUser] = useState(null);
  const [days, setDays] = useState(30),
    [timeline, setTimeline] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [channel, setChannel] = useState('all'),
    [preview, setPreview] = useState(null);
  const request = useRef(0);
  useEffect(
    () => () => {
      request.current++;
    },
    []
  );
  const searchUsers = async (event) => {
    event.preventDefault();
    const version = ++request.current;
    setBusy(true);
    setError('');
    setUser(null);
    setTimeline(null);
    setLearners([]);
    setPreview(null);
    try {
      const value = await report('admin_learners', { search });
      if (version === request.current) setLearners(value.learners);
    } catch (err) {
      if (version === request.current) setError(err.message);
    } finally {
      if (version === request.current) setBusy(false);
    }
  };
  const load = async (selected, windowDays) => {
    const version = ++request.current;
    setUser(selected);
    setDays(windowDays);
    setTimeline(null);
    setPreview(null);
    setBusy(true);
    setError('');
    try {
      const value = await report('admin_timeline', { user_id: selected.id, days: windowDays });
      if (version === request.current) setTimeline(value);
    } catch (err) {
      if (version === request.current) setError(err.message);
    } finally {
      if (version === request.current) setBusy(false);
    }
  };
  const items = (timeline?.items || []).filter(
    (item) =>
      channel === 'all' ||
      (item.channel || item.recommended_channel || (item.kind === 'emails' ? 'email' : 'other')) ===
        channel
  );
  const itemTime = (item) => {
    if (item.status === 'clicked' && item.clicked_at) return item.clicked_at;
    if (item.status === 'viewed' && item.viewed_at) return item.viewed_at;
    return item.at;
  };
  const itemTitle = (item) =>
    item.content?.title ||
    (item.kind === 'events'
      ? `${pretty(item.channel)} activity`
      : pretty(item.email_type || item.playbook_key || item.kind));
  return (
    <section className="min-w-0" id="learner-communications">
      <label htmlFor="learner-search" className="text-xs font-semibold">
        Find learner
      </label>
      <form onSubmit={searchUsers} className="mt-1 flex flex-wrap gap-2">
        <input
          id="learner-search"
          aria-label="Find learner"
          className={cn(inputClass, 'flex-1')}
          value={search}
          minLength={3}
          maxLength={120}
          required
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or full email"
        />
        <AdminButton type="submit" loading={busy}>
          Find learner
        </AdminButton>
      </form>
      {error && (
        <p className="mt-2 text-sm" role="alert">
          {error} Try searching or refreshing again.
        </p>
      )}
      {!busy && !user && learners.length === 0 && search.length >= 3 && (
        <p className="mt-2 text-xs">No results loaded. Search to find a learner.</p>
      )}
      {!user && (
        <div className="mt-2 max-h-48 overflow-y-auto">
          {learners.map((item) => (
            <button
              className="block w-full rounded p-2 text-left text-xs hover:bg-stone-100 dark:hover:bg-white/5"
              key={item.id}
              onClick={() => load(item, days)}
            >
              {item.full_name || 'Learner'} · {item.email}
            </button>
          ))}
        </div>
      )}
      {user && (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <p className="min-w-0 flex-1 text-sm font-bold">
              {user.full_name || 'Learner'}
              <bdi className={cn(MUTED, 'ml-1 font-normal')}>· {user.email}</bdi>
            </p>
            <WindowSelect
              value={days}
              id="timeline-window"
              onChange={(value) => load(user, value)}
            />
            <label className="text-xs">
              <span className="sr-only">Channel</span>
              <select
                aria-label="Timeline channel"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className={inputClass}
              >
                {['all', 'in_app', 'banner', 'email', 'push', 'other'].map((value) => (
                  <option key={value} value={value}>
                    {pretty(value)}
                  </option>
                ))}
              </select>
            </label>
            <AdminButton
              variant="outline"
              size="sm"
              onClick={() => load(user, days)}
              disabled={busy}
              aria-label="Refresh timeline"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            </AdminButton>
          </div>
          {busy && <p role="status">Loading communications…</p>}
          {timeline && (
            <>
              <details className={cn(MUTED, 'my-2 text-xs')}>
                <summary className="cursor-pointer py-1">
                  History coverage · {items.length} records
                </summary>
                <p>
                  {date(timeline.window.since)} – {date(timeline.window.until)}.{' '}
                  {timeline.limitation}
                </p>
              </details>
              {timeline.truncated_sources.length > 0 && (
                <p role="status" className="text-xs">
                  Some history is truncated ({timeline.truncated_sources.join(', ')}). Choose a
                  shorter window.
                </p>
              )}
              <div className="max-h-[28rem] overflow-y-auto rounded-md border border-stone-200 dark:border-white/10">
                {items.length === 0 && (
                  <p className="py-4 text-sm">
                    No recorded communications in this window and channel.
                  </p>
                )}
                {items.map((item) => (
                  <article
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2 gap-y-1 border-b border-stone-100 px-3 py-2 last:border-b-0 dark:border-white/5 sm:grid-cols-[auto_auto_minmax(0,1fr)_auto_auto]"
                    key={`${item.kind}:${item.id}`}
                  >
                    <Pill>
                      {pretty(
                        item.channel ||
                          item.recommended_channel ||
                          (item.kind === 'emails' ? 'email' : item.kind)
                      )}
                    </Pill>
                    <span className="text-xs font-bold">
                      {item.channel === 'email' && item.status === 'viewed'
                        ? 'Open signal'
                        : pretty(item.status || item.action || item.event_type)}
                    </span>
                    <div className="col-span-2 row-start-2 min-w-0 sm:col-span-1 sm:row-auto">
                      <p className="truncate text-xs font-bold" title={itemTitle(item)}>
                        {itemTitle(item)}
                      </p>
                      {(item.rationale ||
                        item.suppression_reason ||
                        item.failure_reason ||
                        item.error_message) && (
                        <p className={cn(MUTED, 'truncate text-xs')}>
                          {pretty(
                            item.suppression_reason ||
                              item.failure_reason ||
                              item.error_message ||
                              item.rationale
                          )}
                        </p>
                      )}
                      {item.snoozed_until && (
                        <p className={cn(MUTED, 'text-xs')}>
                          Snoozed until {shortDateTime(item.snoozed_until)}
                        </p>
                      )}
                    </div>
                    <time
                      className={cn(
                        MUTED,
                        'col-start-3 row-start-1 whitespace-nowrap text-xs sm:col-auto sm:row-auto'
                      )}
                    >
                      {shortDateTime(itemTime(item))}
                    </time>
                    {(item.content || item.kind === 'emails') && (
                      <AdminButton
                        variant="ghost"
                        size="sm"
                        className="col-start-3 row-start-2 sm:col-auto sm:row-auto"
                        aria-label="Preview message"
                        onClick={() => setPreview(item)}
                      >
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                        <span className="hidden sm:inline">Preview</span>
                      </AdminButton>
                    )}
                  </article>
                ))}
              </div>
            </>
          )}
        </>
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

function AskAdminData() {
  const [question, setQuestion] = useState(''),
    [days, setDays] = useState(30),
    [answer, setAnswer] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const ask = async (event) => {
    event.preventDefault();
    setAnswer(null);
    setError('');
    setBusy(true);
    try {
      setAnswer(await report('admin_ask', { question, days }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="min-w-0">
      <label htmlFor="admin-question" className="text-xs font-semibold">
        Ask your admin data
      </label>
      <form onSubmit={ask} className="mt-1 flex flex-wrap items-center gap-2">
        <input
          id="admin-question"
          aria-label="Your question"
          className={cn(inputClass, 'basis-full flex-1 sm:basis-64')}
          placeholder="How are messages performing?"
          minLength={5}
          maxLength={500}
          required
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={busy}
        />
        <WindowSelect
          value={days}
          id="ask-window"
          disabled={busy}
          onChange={(value) => {
            setDays(value);
            setAnswer(null);
          }}
        />
        <AdminButton type="submit" loading={busy}>
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Ask
        </AdminButton>
      </form>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {examples.map((text, index) => (
          <button
            className="min-h-7 rounded-md border border-stone-200 px-2 text-xs text-stone-600 hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-white/10 dark:text-stone-300 dark:hover:bg-white/5"
            key={text}
            onClick={() => {
              setQuestion(text);
              setAnswer(null);
            }}
            disabled={busy}
          >
            {['Message delivery', 'Learner feedback', 'Checkout status'][index]}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm">
          {error} Try asking again.
        </p>
      )}
      {busy && (
        <p role="status" className="mt-3 text-sm">
          Checking the figures…
        </p>
      )}
      {answer && (
        <div className="mt-4" aria-live="polite">
          {answer.unsupported ? (
            <p>{answer.message}</p>
          ) : (
            <>
              <h4 className={TITLE}>{answer.title}</h4>
              <ReportFacts facts={answer.facts} />
              <details className="group mt-1 text-xs">
                <summary className="flex cursor-pointer list-none items-center gap-1 py-1 font-semibold">
                  <ChevronRight className="h-3.5 w-3.5 group-open:rotate-90" aria-hidden="true" />
                  Data details
                </summary>
                <div className={cn(TILE, 'mt-1 grid gap-2 p-2.5 sm:grid-cols-3')}>
                  <div>
                    <span className={MUTED}>Period</span>
                    <p>
                      {shortDate(answer.window.since)}–{shortDate(answer.window.until)}
                    </p>
                  </div>
                  <div>
                    <span className={MUTED}>Source</span>
                    <p className="break-all font-mono">{answer.source}</p>
                  </div>
                  <div title={`${answer.model} · ${answer.provider}`}>
                    <span className={MUTED}>Model</span>
                    <p>
                      {modelName(answer.model)}
                      {answer.fallback_used ? ' · fallback' : ''}
                    </p>
                  </div>
                  <p className={cn(MUTED, 'sm:col-span-3')}>
                    Server-calculated counts. Opens are signals, not confirmed reads.
                  </p>
                </div>
              </details>
            </>
          )}
        </div>
      )}
    </section>
  );
}

export default function AdminOperationsPanel({ refreshKey }) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [brief, setBrief] = useState(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const load = async () => {
    setBusy(true);
    setError('');
    try {
      setBrief(await report('admin_briefing'));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    let active = true;
    setError('');
    report('admin_briefing')
      .then((value) => {
        if (active) setBrief(value);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, [refreshKey]);
  return (
    <div className={cn(PANEL, 'mb-4 min-w-0 p-3 sm:p-4')} id="admin-ai-workspace">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#5a63df] text-white">
            <Sparkles aria-hidden="true" className="h-4 w-4" />
          </span>
          <h2 className={TITLE}>AI workspace</h2>
          <span className={cn(MUTED, 'text-xs')}>Insights & messages</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <AdminButton
            variant="outline"
            onClick={() => setHistoryOpen(!historyOpen)}
            aria-expanded={historyOpen}
            aria-controls="admin-history-panel"
          >
            <History className="h-3.5 w-3.5" aria-hidden="true" /> Learner history
            <ChevronDown
              className={cn('h-3.5 w-3.5', historyOpen && 'rotate-180')}
              aria-hidden="true"
            />
          </AdminButton>
          <AdminButton
            variant="outline"
            loading={busy}
            onClick={load}
            aria-label="Refresh briefing"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          </AdminButton>
        </div>
      </div>
      <AskAdminData />
      {error && (
        <p role="alert" className="mt-2 text-sm">
          {error} Use Refresh briefing to retry.
        </p>
      )}
      {!brief && !error && <p role="status">Loading briefing…</p>}
      {brief && (
        <>
          {brief.items.length === 0 ? (
            <div
              className="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-stone-200 px-3 py-2 text-xs dark:border-white/10"
              title="No evidence-backed findings are available. This is not a full health check."
            >
              <CircleCheck className="h-4 w-4 text-[var(--signal-ok)]" aria-hidden="true" />
              <span className="font-semibold">No new findings</span>
              <span className={MUTED}>Last checked {date(brief.last_analysis?.created_at)}</span>
            </div>
          ) : (
            <details className="group mt-3 rounded-md border border-stone-200 px-3 py-1 text-xs dark:border-white/10">
              <summary className="flex cursor-pointer list-none items-center gap-1 py-2 font-semibold">
                <ChevronRight className="h-3.5 w-3.5 group-open:rotate-90" aria-hidden="true" />
                Needs attention ({brief.items.length})
              </summary>
              <div className="grid gap-2 py-2 lg:grid-cols-3">
                {brief.items.map((item) => (
                  <article className={cn(TILE, 'p-3')} key={item.id}>
                    <Pill tone={item.severity === 'urgent' ? 'fault' : 'warn'}>
                      {item.severity}
                    </Pill>
                    <h3 className={cn(TITLE, 'mt-2')}>{item.title}</h3>
                    <p className="mt-2 text-xs">{item.summary}</p>
                    <p className={cn(MUTED, 'mt-2 text-xs')}>
                      Sample: {item.sample_size} · Created {date(item.created_at)} · Window:{' '}
                      {item.measurement_window || 'Not recorded'}
                    </p>
                    <details className="mt-2 text-xs">
                      <summary>Supporting evidence</summary>
                      <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-words">
                        {JSON.stringify(item.evidence, null, 2)}
                      </pre>
                    </details>
                    <p className="mt-2 text-xs font-semibold">
                      Suggested step: {item.proposed_action}
                    </p>
                    <a
                      href="#autopilot-recommendations"
                      className="mt-2 inline-block text-xs text-[#5a63df] underline"
                    >
                      Review recommendation
                    </a>
                  </article>
                ))}
              </div>
            </details>
          )}
        </>
      )}
      <div
        id="admin-history-panel"
        hidden={!historyOpen}
        className="mt-3 border-t border-stone-200 pt-3 dark:border-white/10"
      >
        {historyOpen && <LearnerTimeline />}
      </div>
    </div>
  );
}
