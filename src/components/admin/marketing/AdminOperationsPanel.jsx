import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
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
import {
  AdminButton,
  PANEL,
  PanelHeader,
  TILE,
  WELL,
  TITLE,
  MICRO,
  MUTED,
  Pill,
} from '@/components/admin/ui/primitives';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/cn';

const inputClass =
  'h-8 min-w-0 rounded-lg border border-stone-200/90 bg-white/70 px-3 text-xs font-medium text-stone-900 placeholder:text-stone-400 transition-colors focus:border-[#5a63df] focus:bg-white focus:outline-none focus:ring-1 focus:ring-inset focus:ring-[#5a63df] dark:border-white/10 dark:bg-[#100f15] dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-[#5a63df] dark:focus:bg-[#131315]';
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
  return (
    value
      .split('/')
      .at(-1)
      ?.replace('deepseek-v4-flash-0731', 'DeepSeek V4 Flash')
      .replace('glm-5.3-flash', 'GLM 5.3 Flash') || value
  );
};
const examples = [
  'How are messages performing by channel?',
  'How many messages were dismissed or snoozed?',
  'What is the status of checkout attempts?',
];
const report = (action, parameters) => MarketingService.adminReport(action, parameters);

function WindowSelect({ value, onChange, id, disabled }) {
  return (
    <div className="relative inline-flex items-center">
      <label htmlFor={id} className="sr-only">
        Reporting window
      </label>
      <select
        id={id}
        aria-label="Reporting window"
        className={cn(
          inputClass,
          'appearance-none cursor-pointer pr-7 pl-3 font-medium rounded-lg'
        )}
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
      <ChevronDown
        className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-stone-400 dark:text-stone-500"
        aria-hidden="true"
      />
    </div>
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
      <div className="mt-2 overflow-x-auto rounded-lg border border-stone-200/80 bg-white dark:border-white/[0.07] dark:bg-[#131315]">
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
          <p className="font-mono text-sm font-bold tabular-nums text-stone-900 dark:text-stone-50">
            {fact.value}
          </p>
        </div>
      ))}
      {!visible.length && (
        <p className="col-span-full py-2 text-xs text-stone-500">
          No activity recorded in this window.
        </p>
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
      <label htmlFor="learner-search" className={cn(MICRO, MUTED, 'mb-1.5 block')}>
        Find learner
      </label>
      <form onSubmit={searchUsers} className="flex w-full items-center gap-2 p-0.5">
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
      {!busy && !user && learners.length === 0 && search.length >= 3 && (
        <p className="mt-2 text-xs text-stone-500">No results loaded. Search to find a learner.</p>
      )}
      {!user && learners.length > 0 && (
        <div className="mt-2.5 max-h-48 overflow-y-auto divide-y divide-stone-100 rounded-lg border border-stone-200/80 bg-white dark:divide-white/[0.04] dark:border-white/[0.07] dark:bg-[#131315]">
          {learners.map((item) => (
            <button
              type="button"
              className="flex w-full items-center justify-between p-2.5 text-left text-xs transition-colors hover:bg-stone-50 dark:hover:bg-white/[0.04]"
              key={item.id}
              onClick={() => load(item, days)}
            >
              <span className="font-semibold text-stone-900 dark:text-stone-100">
                {item.full_name || 'Learner'}
              </span>
              <span className={cn(MUTED, 'text-[11px]')}>{item.email}</span>
            </button>
          ))}
        </div>
      )}
      {user && (
        <>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5 rounded-lg border border-stone-200/80 bg-stone-50/70 p-2.5 dark:border-white/[0.07] dark:bg-white/[0.03]">
            <p className="min-w-0 flex-1 text-xs font-bold text-stone-900 dark:text-stone-100">
              {user.full_name || 'Learner'}
              <bdi className={cn(MUTED, 'ml-1.5 font-normal text-[11px]')}>· {user.email}</bdi>
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <WindowSelect
                value={days}
                id="timeline-window"
                onChange={(value) => load(user, value)}
              />
              <div className="relative inline-flex items-center">
                <label htmlFor="timeline-channel" className="sr-only">
                  Channel
                </label>
                <select
                  id="timeline-channel"
                  aria-label="Timeline channel"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className={cn(
                    inputClass,
                    'appearance-none cursor-pointer pr-7 pl-3 font-medium rounded-lg'
                  )}
                >
                  {['all', 'in_app', 'banner', 'email', 'push', 'other'].map((value) => (
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
              <AdminButton
                variant="outline"
                size="sm"
                className="h-8 w-8 rounded-lg p-0"
                onClick={() => load(user, days)}
                disabled={busy}
                aria-label="Refresh timeline"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              </AdminButton>
            </div>
          </div>
          {busy && (
            <div className="flex items-center gap-2 py-3 text-xs text-stone-500">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <p role="status">Loading communications…</p>
            </div>
          )}
          {timeline && (
            <>
              <details className={cn(MUTED, 'my-2 text-[11px]')}>
                <summary className="cursor-pointer py-1 hover:text-stone-800 dark:hover:text-stone-200">
                  History coverage · {items.length} records
                </summary>
                <p className="mt-0.5">
                  {date(timeline.window.since)} – {date(timeline.window.until)}.{' '}
                  {timeline.limitation}
                </p>
              </details>
              {timeline.truncated_sources.length > 0 && (
                <p role="status" className="text-xs text-stone-500">
                  Some history is truncated ({timeline.truncated_sources.join(', ')}). Choose a
                  shorter window.
                </p>
              )}
              <div className="max-h-[28rem] overflow-y-auto rounded-lg border border-stone-200/80 bg-white dark:border-white/[0.07] dark:bg-[#131315]">
                {items.length === 0 && (
                  <p className="py-6 text-center text-xs text-stone-500">
                    No recorded communications in this window and channel.
                  </p>
                )}
                {items.map((item) => (
                  <article
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2.5 gap-y-1 border-b border-stone-100 px-3 py-2 last:border-b-0 dark:border-white/[0.04] sm:grid-cols-[auto_auto_minmax(0,1fr)_auto_auto]"
                    key={`${item.kind}:${item.id}`}
                  >
                    <Pill>
                      {pretty(
                        item.channel ||
                          item.recommended_channel ||
                          (item.kind === 'emails' ? 'email' : item.kind)
                      )}
                    </Pill>
                    <span className="text-[11px] font-bold text-stone-800 dark:text-stone-200">
                      {item.channel === 'email' && item.status === 'viewed'
                        ? 'Open signal'
                        : pretty(item.status || item.action || item.event_type)}
                    </span>
                    <div className="col-span-2 row-start-2 min-w-0 sm:col-span-1 sm:row-auto">
                      <p
                        className="truncate text-xs font-bold text-stone-900 dark:text-stone-100"
                        title={itemTitle(item)}
                      >
                        {itemTitle(item)}
                      </p>
                      {(item.rationale ||
                        item.suppression_reason ||
                        item.failure_reason ||
                        item.error_message) && (
                        <p className={cn(MUTED, 'truncate text-[10.5px]')}>
                          {pretty(
                            item.suppression_reason ||
                              item.failure_reason ||
                              item.error_message ||
                              item.rationale
                          )}
                        </p>
                      )}
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
                      {shortDateTime(itemTime(item))}
                    </time>
                    {(item.content || item.kind === 'emails') && (
                      <AdminButton
                        variant="ghost"
                        size="sm"
                        className="col-start-3 row-start-2 h-7 px-2 text-[11px] sm:col-auto sm:row-auto"
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
      <label htmlFor="admin-question" className={cn(MICRO, MUTED, 'mb-1.5 block')}>
        Ask your admin data
      </label>
      <form onSubmit={ask} className="flex w-full flex-wrap items-center gap-2">
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
        <AdminButton type="submit" loading={busy} className="h-8 shrink-0 rounded-lg">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Ask
        </AdminButton>
      </form>
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span className={cn(MICRO, MUTED, 'mr-0.5 text-[9px]')}>Suggestions:</span>
        {examples.map((text, index) => (
          <button
            key={text}
            type="button"
            className="inline-flex items-center rounded-full border border-stone-200/80 bg-stone-50/70 px-2.5 py-0.5 text-[10px] font-semibold text-stone-600 transition-all hover:border-[#5a63df]/30 hover:bg-[#5a63df]/5 hover:text-[#5a63df] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-stone-300 dark:hover:border-[#5a63df]/40 dark:hover:bg-[#5a63df]/10 dark:hover:text-stone-100"
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
        <p role="alert" className="mt-2.5 text-xs font-semibold text-[rgb(var(--signal-fault))]">
          {error} Try asking again.
        </p>
      )}
      {busy && (
        <div className="mt-3 flex items-center gap-2 text-xs text-stone-500">
          <RefreshCw className="h-3 w-3 animate-spin" />
          <p role="status">Checking the figures…</p>
        </div>
      )}
      {answer && (
        <div
          className="mt-3.5 rounded-lg border border-stone-200/80 bg-white p-3 dark:border-white/[0.07] dark:bg-[#131315]"
          aria-live="polite"
        >
          {answer.unsupported ? (
            <p className="text-xs text-stone-600 dark:text-stone-300">{answer.message}</p>
          ) : (
            <>
              <h4 className={cn(TITLE, 'text-[12.5px]')}>{answer.title}</h4>
              <ReportFacts facts={answer.facts} />
              <details className="group mt-2 text-xs">
                <summary className="flex cursor-pointer list-none items-center gap-1.5 py-1 text-[11px] font-semibold text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200">
                  <ChevronRight
                    className="h-3 w-3 transition-transform duration-150 group-open:rotate-90"
                    aria-hidden="true"
                  />
                  Data details
                </summary>
                <div className={cn(TILE, 'mt-1.5 grid gap-2 p-2.5 sm:grid-cols-3 text-xs')}>
                  <div>
                    <span className={cn(MICRO, MUTED)}>Period</span>
                    <p className="mt-0.5 font-medium text-stone-800 dark:text-stone-200">
                      {shortDate(answer.window.since)}–{shortDate(answer.window.until)}
                    </p>
                  </div>
                  <div>
                    <span className={cn(MICRO, MUTED)}>Source</span>
                    <p className="mt-0.5 break-all font-mono text-[11px] text-stone-800 dark:text-stone-200">
                      {answer.source}
                    </p>
                  </div>
                  <div title={`${answer.model} · ${answer.provider}`}>
                    <span className={cn(MICRO, MUTED)}>Model</span>
                    <p className="mt-0.5 font-medium text-stone-800 dark:text-stone-200">
                      {modelName(answer.model)}
                      {answer.fallback_used ? ' · fallback' : ''}
                    </p>
                  </div>
                  <p className={cn(MUTED, 'text-[10px] sm:col-span-3')}>
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
    <div className={cn(PANEL, 'mb-4 min-w-0 overflow-hidden')} id="admin-ai-workspace">
      <PanelHeader label="AI Workspace" title="Insights & messages" accent="accent">
        <AdminButton
          variant={historyOpen ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setHistoryOpen(!historyOpen)}
          aria-expanded={historyOpen}
          aria-controls="admin-history-panel"
        >
          <History className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Learner history</span>
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 transition-transform duration-200 ease-out',
              historyOpen && 'rotate-180'
            )}
            aria-hidden="true"
          />
        </AdminButton>
        <AdminButton
          variant="outline"
          size="sm"
          loading={busy}
          onClick={load}
          aria-label="Refresh briefing"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
        </AdminButton>
      </PanelHeader>

      <div className="p-3.5 sm:p-4">
        <AskAdminData />
        {error && (
          <p role="alert" className="mt-2 text-xs font-semibold text-[rgb(var(--signal-fault))]">
            {error} Use Refresh briefing to retry.
          </p>
        )}
        {!brief && !error && (
          <div className="mt-3 flex items-center gap-2 text-xs text-stone-500">
            <RefreshCw className="h-3 w-3 animate-spin" />
            <p role="status">Loading briefing…</p>
          </div>
        )}
        {brief && (
          <>
            {brief.items.length === 0 ? (
              <div
                className={cn(
                  WELL,
                  'mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-stone-200/80 px-3 py-2 text-xs dark:border-white/[0.07]'
                )}
                title="No evidence-backed findings are available. This is not a full health check."
              >
                <CircleCheck
                  className="h-3.5 w-3.5 shrink-0 text-[rgb(var(--signal-ok))]"
                  aria-hidden="true"
                />
                <span className="text-[11px] font-bold text-stone-900 dark:text-stone-100">
                  No new findings
                </span>
                <span className={cn(MUTED, 'text-[10.5px]')}>
                  Last checked {date(brief.last_analysis?.created_at)}
                </span>
              </div>
            ) : (
              <details className="group mt-3 rounded-lg border border-stone-200/80 px-3 py-1.5 text-xs dark:border-white/[0.07]">
                <summary className="flex cursor-pointer list-none items-center gap-1.5 py-1.5 text-[11px] font-bold text-stone-800 dark:text-stone-200">
                  <ChevronRight
                    className="h-3.5 w-3.5 transition-transform duration-150 group-open:rotate-90"
                    aria-hidden="true"
                  />
                  Needs attention ({brief.items.length})
                </summary>
                <div className="grid gap-2 py-2 lg:grid-cols-3">
                  {brief.items.map((item) => (
                    <article className={cn(TILE, 'p-3')} key={item.id}>
                      <Pill tone={item.severity === 'urgent' ? 'fault' : 'warn'}>
                        {item.severity}
                      </Pill>
                      <h3 className={cn(TITLE, 'mt-2 text-[12px]')}>{item.title}</h3>
                      <p className="mt-1.5 text-[11px] leading-relaxed text-stone-600 dark:text-stone-300">
                        {item.summary}
                      </p>
                      <p className={cn(MUTED, 'mt-2 text-[10px]')}>
                        Sample: {item.sample_size} · Created {date(item.created_at)} · Window:{' '}
                        {item.measurement_window || 'Not recorded'}
                      </p>
                      <details className="mt-2 text-[10.5px]">
                        <summary className="cursor-pointer text-stone-500 hover:text-stone-800 dark:hover:text-stone-300">
                          Supporting evidence
                        </summary>
                        <pre
                          className={cn(
                            WELL,
                            'mt-1 max-h-40 overflow-auto rounded p-2 text-[10px] whitespace-pre-wrap break-words'
                          )}
                        >
                          {JSON.stringify(item.evidence, null, 2)}
                        </pre>
                      </details>
                      <p className="mt-2 text-[11px] font-semibold text-stone-800 dark:text-stone-200">
                        Suggested step: {item.proposed_action}
                      </p>
                      <a
                        href="#autopilot-recommendations"
                        className="mt-2 inline-block text-[11px] font-semibold text-[#5a63df] hover:underline"
                      >
                        Review recommendation →
                      </a>
                    </article>
                  ))}
                </div>
              </details>
            )}
          </>
        )}
        <AnimatePresence initial={false}>
          {historyOpen && (
            <m.div
              id="admin-history-panel"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{
                height: { duration: 0.28, ease: [0.32, 0.72, 0, 1] },
                opacity: { duration: 0.2, ease: 'easeInOut' },
              }}
              className="overflow-hidden"
            >
              <div className="border-t border-stone-200/80 pt-3.5 mt-3.5 pb-3 px-1 dark:border-white/[0.07]">
                <LearnerTimeline />
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
