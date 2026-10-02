import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Building2, Users, Clock, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  PANEL,
  NUM,
  MICRO,
  MUTED,
  PanelTitle,
  Stat,
  Pill,
  Empty,
} from '@/features/dashboard/components/primitives';
import { institutionRequest } from '../services/institutions';
import InstitutionHistory from './InstitutionHistory';
import { PRICING_LABELS, STATUS_LABELS } from '../services/history';
import { parseStudentCsv } from '../services/csv';
import { fromStripeAmount } from '../../../../supabase/functions/_shared/planPricing.ts';
const INPUT =
  'w-full min-w-0 rounded-md border border-[#e4e2f0] bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#141319]';
const BUTTON = 'rounded-md bg-[#5a63df] px-3 py-2 text-xs font-bold text-white disabled:opacity-50';
const SECONDARY =
  'rounded-md border border-[#e4e2f0] px-3 py-2 text-xs font-semibold dark:border-white/10 disabled:opacity-50';
const date = (value) => (value ? new Date(value).toLocaleDateString() : '—');
const money = (minor, currency) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(
    fromStripeAmount(minor, currency)
  );
const TABS = ['overview', 'students', 'subscription', 'billing', 'settings'];
const ADMIN_TABS = [...TABS, 'pricing', 'history'];
const TAB_LABELS = {
  overview: 'Overview',
  students: 'Students',
  subscription: 'Buy seats',
  billing: 'Billing',
  settings: 'Settings',
  pricing: 'Pricing',
  history: 'History',
};
const SEAT_LABELS = {
  available: 'Available seats',
  invited: 'Invitations sent',
  waiting: 'Waiting seats',
  active: 'Active students',
};
const Field = ({ label, children }) => (
  <label className="block min-w-0 space-y-1">
    <span className={MICRO}>{label}</span>
    {children}
  </label>
);
const Text = ({ label, name, value, required = false, type = 'text', ...rest }) => (
  <Field label={label}>
    <input
      className={INPUT}
      name={name}
      defaultValue={value}
      required={required}
      type={type}
      {...rest}
    />
  </Field>
);
const Select = ({ label, name, children, value }) => (
  <Field label={label}>
    <select className={INPUT} name={name} defaultValue={value}>
      {children}
    </select>
  </Field>
);
function OperationDialog({ operation, onClose, onSubmit, busy }) {
  const [kind, setKind] = useState(operation?.kind || 'override');
  if (!operation) return null;
  const { action, seat, institution, pricing } = operation;
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{operation.title}</DialogTitle>
          <DialogDescription>
            {operation.description ||
              'Changes apply to this institution. Administrative changes are recorded in its history.'}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            onSubmit({
              ...Object.fromEntries(form),
              ...(action === 'reconcile_refund' ? { seat_ids: form.getAll('seat_ids') } : {}),
            });
          }}
          className="space-y-3"
        >
          {action === 'create' && (
            <>
              <Text label="Institution name" name="name" required />
              <Text label="Owner email" name="owner_email" type="email" required />
              <Text label="Contact email" name="contact_email" type="email" />
              <Text label="Currency" name="currency" value="USD" required pattern="[A-Z]{3}" />
            </>
          )}
          {action === 'update' && (
            <>
              <Text label="Institution name" name="name" value={institution.name} required />
              <Text
                label="Owner email"
                name="owner_email"
                value={institution.owner_email}
                type="email"
                required
              />
              <Text
                label="Currency"
                name="currency"
                value={institution.currency}
                pattern="[A-Z]{3}"
                required
              />
              <Select label="Status" name="status" value={institution.status}>
                {['active', 'suspended', 'archived'].map((x) => (
                  <option key={x} value={x}>
                    {STATUS_LABELS[x] || x}
                  </option>
                ))}
              </Select>
            </>
          )}
          {action === 'grant' && (
            <>
              <Select label="Plan" name="tier">
                <option value="pro">Pro</option>
                <option value="premium">Premium</option>
              </Select>
              <Text
                label="Seats"
                name="quantity"
                type="number"
                min="1"
                max="10000"
                value="5"
                required
              />
              <Text
                label="Access days"
                name="access_days"
                type="number"
                min="1"
                max="3650"
                value="30"
                required
              />
              <Text
                label="Activate by"
                name="activation_deadline"
                type="date"
                value={new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10)}
                required
              />
            </>
          )}
          {action === 'pricing' && (
            <>
              <Field label="Pricing type">
                <select
                  className={INPUT}
                  name="kind"
                  value={kind}
                  onChange={(e) => setKind(e.target.value)}
                  disabled={!!pricing}
                >
                  {(institution
                    ? ['default', 'bulk', 'override', 'package']
                    : ['default', 'bulk']
                  ).map((x) => (
                    <option key={x} value={x}>
                      {PRICING_LABELS[x]}
                    </option>
                  ))}
                </select>
              </Field>
              {pricing && <input type="hidden" name="kind" value={kind} />}
              <p className={`${MUTED} text-xs`}>
                {kind === 'default'
                  ? 'Sets the standard price for every institution without a negotiated rate.'
                  : kind === 'bulk'
                    ? 'Applies to every seat in a purchase once the minimum quantity is reached. This rule is shared by all institutions.'
                    : kind === 'package'
                      ? 'Sets a fixed total for this institution, plan, duration, and exact seat quantity.'
                      : 'Sets a negotiated price per seat for this institution only.'}
              </p>
              <Select label="Plan" name="tier" value={pricing?.tier}>
                <option value="pro">Pro</option>
                <option value="premium">Premium</option>
              </Select>
              <Select label="Access months" name="months" value={pricing?.months}>
                <option value="1">1 month</option>
                <option value="3">3 months</option>
              </Select>
              <Text
                label="Currency"
                name="currency"
                value={pricing?.currency || institution?.currency || 'USD'}
                pattern="[A-Z]{3}"
                required
              />
              {['bulk', 'package'].includes(kind) ? (
                <Text
                  label={kind === 'bulk' ? 'Minimum seats' : 'Exact seats'}
                  name="quantity"
                  type="number"
                  min="1"
                  value={pricing?.quantity || 1}
                  required
                />
              ) : (
                <input type="hidden" name="quantity" value="1" />
              )}
              <Text
                label={kind === 'package' ? 'Package total' : 'Price per seat'}
                name="amount"
                type="number"
                min="0.01"
                step="any"
                value={pricing?.amount}
                required
              />
              <Select label="Enabled" name="enabled" value={String(pricing?.enabled ?? true)}>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </Select>
            </>
          )}
          {action === 'invite' && (
            <>
              <Text
                label="Student email"
                name="email"
                type="email"
                value={seat?.recipient_email}
                required
              />
              <Text label="Student name" name="name" value={seat?.recipient_name} />
            </>
          )}
          {action === 'extend' && (
            <Text label="Access until" name="access_until" type="date" required />
          )}
          {action === 'correct' && (
            <Text label="Correct student email" name="email" type="email" required />
          )}
          {action === 'reconcile_refund' && (
            <>
              <p className="text-sm">
                Select seats whose access should end. Remaining seats will become allocatable again.
              </p>
              {operation.seats.map((s) => (
                <label key={s.id} className="flex gap-2 text-sm">
                  <input type="checkbox" name="seat_ids" value={s.id} />
                  {s.recipient_email || 'Unused seat'} · {s.status}
                </label>
              ))}
            </>
          )}
          {!['invite', 'cancel', 'create'].includes(action) && (
            <Text label="Reason" name="reason" required />
          )}
          <button className={BUTTON} disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
export function PricingTable({ rules, onEdit }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs [&_td]:px-3 [&_td]:py-2 [&_th]:px-3 [&_th]:py-2">
        <thead>
          <tr>
            {['Type', 'Plan', 'Months', 'Seats', 'Currency', 'Amount', 'Status', ''].map((x, i) => (
              <th key={i} className="p-2">
                {x}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rules.map((r) => (
            <tr key={r.id} className="border-t border-[#e4e2f0] dark:border-white/10">
              <td className="p-2">{PRICING_LABELS[r.kind] || r.kind}</td>
              <td>{r.tier === 'premium' ? 'Premium' : 'Pro'}</td>
              <td>
                {r.months} {r.months === 1 ? 'month' : 'months'}
              </td>
              <td>
                {r.kind === 'bulk'
                  ? `${r.quantity}+`
                  : r.kind === 'package'
                    ? `${r.quantity} exactly`
                    : 'Any quantity'}
              </td>
              <td>{r.currency}</td>
              <td className={NUM}>
                {new Intl.NumberFormat(undefined, {
                  style: 'currency',
                  currency: r.currency,
                }).format(r.amount)}
                {r.kind === 'package' ? ' total' : ' / seat'}
              </td>
              <td>{r.enabled ? 'Enabled' : 'Disabled'}</td>
              <td>
                <button className={SECONDARY} onClick={() => onEdit(r)}>
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export default function InstitutionWorkspace({
  institutionId,
  admin = false,
  standalone = false,
  onInstitutionChanged,
}) {
  const [params, setParams] = useSearchParams();
  const sectionKey = admin ? 'section' : 'tab';
  const tabs = admin ? ADMIN_TABS : TABS;
  const tab = tabs.includes(params.get(sectionKey)) ? params.get(sectionKey) : 'overview';
  const [data, setData] = useState(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [operation, setOperation] = useState(null),
    [inviteResult, setInviteResult] = useState(null);
  const [search, setSearch] = useState(''),
    [filter, setFilter] = useState('all'),
    [csv, setCsv] = useState(null),
    [importResults, setImportResults] = useState([]),
    [orderId, setOrderId] = useState('');
  const [purchase, setPurchase] = useState({ tier: 'pro', months: 1, quantity: 10 }),
    [quote, setQuote] = useState(null),
    [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const load = useCallback(async () => {
    try {
      setError('');
      setData(await institutionRequest('detail', { institution_id: institutionId }));
    } catch (e) {
      setError(e.message);
    }
  }, [institutionId]);
  useEffect(() => {
    setData(null);
    setOrderId('');
    setQuote(null);
    setInviteResult(null);
    load();
  }, [load]);
  useEffect(() => {
    setQuote(null);
    setRequestId(crypto.randomUUID());
  }, [purchase, institutionId]);
  const act = async (action, fields = {}) => {
    setBusy(true);
    try {
      const result = await institutionRequest(action, { institution_id: institutionId, ...fields });
      if (result?.url && action.startsWith('invite')) setInviteResult(result);
      toast.success(
        result?.delivery_error ? 'Invitation created; email delivery needs attention' : 'Saved'
      );
      await load();
      onInstitutionChanged?.();
      return result;
    } catch (e) {
      toast.error(e.message);
      return null;
    } finally {
      setBusy(false);
    }
  };
  const submit = async (fields) => {
    let payload = { ...fields };
    const { action, seat, pricing, order } = operation;
    if (action === 'pricing')
      payload = {
        ...payload,
        id: pricing?.id,
        institution_id: ['default', 'bulk'].includes(fields.kind) ? null : institutionId,
        enabled: fields.enabled === 'true',
      };
    if (action === 'reconcile_refund')
      payload = {
        ...payload,
        order_id: order.id,
        seat_ids: Array.isArray(fields.seat_ids)
          ? fields.seat_ids
          : fields.seat_ids
            ? [fields.seat_ids]
            : [],
      };
    if (seat) payload.seat_id = seat.id;
    const result = await act(action, payload);
    if (result) setOperation(null);
  };
  if (!data)
    return (
      <div className={`${PANEL} p-5`} role="status">
        {error || 'Loading institution…'}
        {error && (
          <button className={`${SECONDARY} ml-3`} onClick={load}>
            Retry
          </button>
        )}
      </div>
    );
  const i = data.institution;
  const seats = data.seats;
  const usable = (s) => !s.allocation_blocked && new Date(s.activation_deadline) > new Date();
  const counts = Object.fromEntries(
    ['available', 'invited', 'waiting', 'active'].map((status) => [
      status,
      seats.filter(
        (s) => s.status === status && (['available', 'invited'].includes(status) ? usable(s) : true)
      ).length,
    ])
  );
  const allocations = data.orders.filter(
    (o) =>
      ['paid', 'complimentary'].includes(o.status) && new Date(o.activation_deadline) > new Date()
  );
  const studentSeats = seats.filter(
    (s) =>
      s.recipient_email &&
      (!search ||
        `${s.recipient_email} ${s.recipient_name || ''}`
          .toLowerCase()
          .includes(search.toLowerCase())) &&
      (filter === 'all' || s.status === filter)
  );
  const open = (action, title, extra = {}) =>
    setOperation({ action, title, institution: i, ...extra });
  const buy = async (checkout) => {
    setBusy(true);
    try {
      const result = await institutionRequest(checkout ? 'checkout' : 'quote', {
        institution_id: institutionId,
        ...purchase,
        request_id: requestId,
      });
      if (checkout) window.location.assign(result.url);
      else setQuote(result);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };
  const importCsv = async () => {
    setBusy(true);
    const results = [];
    const rows = csv.filter((r) => !r.error);
    for (let start = 0; start < rows.length; start += 50) {
      const batch = rows.slice(start, start + 50);
      try {
        const result = await institutionRequest('import', {
          institution_id: institutionId,
          order_id: orderId,
          rows: batch.map(({ email, name }) => ({ email, name })),
        });
        results.push(
          ...result.results.map((r) => ({ ...r, delivery_error: r.error || r.delivery_error }))
        );
      } catch (e) {
        results.push(...batch.map((r) => ({ ...r, delivery_error: e.message })));
      }
      setImportResults([...results]);
    }
    await load();
    setBusy(false);
  };
  return (
    <div className="min-w-0 space-y-4">
      {error && (
        <p role="alert" className={`${PANEL} p-3 text-sm text-[rgb(var(--signal-fault))]`}>
          Could not refresh: {error}.{' '}
          <button className="underline" onClick={load}>
            Try again
          </button>
        </p>
      )}
      {admin && (
        <div className={`${PANEL} p-3 text-sm`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <strong>Platform admin management</strong>
              <p className={`${MUTED} mt-1 text-xs`}>
                Manage the institution, pricing, access, and history here.
              </p>
            </div>
            <Link className={SECONDARY} to={`/institution?institution=${i.id}`}>
              Open institution panel
            </Link>
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold">{i.name}</h1>
          <p className={`${MUTED} text-xs`}>
            Student subscription access ·{' '}
            <Pill tone={i.status === 'active' ? 'ok' : 'warn'}>{i.status}</Pill>
          </p>
        </div>
        <button className={SECONDARY} onClick={load} disabled={busy}>
          <RefreshCw className="mr-1 inline h-3 w-3" />
          Refresh
        </button>
      </div>
      {admin && (
        <div className="flex flex-wrap gap-2">
          <button className={SECONDARY} onClick={() => open('update', 'Edit institution')}>
            Edit institution
          </button>
          <button
            className={SECONDARY}
            disabled={busy}
            onClick={() => act('invite_owner', { email: i.owner_email })}
          >
            Invite owner
          </button>
          <button className={BUTTON} onClick={() => open('grant', 'Grant free seats')}>
            Grant free seats
          </button>
          <button className={SECONDARY} onClick={() => open('pricing', 'Set institution pricing')}>
            Set pricing
          </button>
        </div>
      )}
      {i.status !== 'active' && (
        <p className="text-sm text-[rgb(var(--signal-warn))]">
          New purchases and invitations are paused. Activated student access continues unless admin
          explicitly revokes it.
        </p>
      )}
      {inviteResult && (
        <section className={`${PANEL} p-3 space-y-2`}>
          <p className="text-xs">
            {inviteResult.delivery_error || 'Invitation email sent. You can also share this link.'}
          </p>
          <input aria-label="Invitation link" className={INPUT} readOnly value={inviteResult.url} />
          <button
            className={SECONDARY}
            onClick={async () => {
              await navigator.clipboard.writeText(inviteResult.url);
              toast.success('Link copied');
            }}
          >
            Copy link
          </button>
          <button className={`${SECONDARY} ml-2`} onClick={() => setInviteResult(null)}>
            Dismiss
          </button>
        </section>
      )}
      {!standalone && (
        <nav aria-label="Institution sections" className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t}
              className={tab === t ? BUTTON : SECONDARY}
              aria-current={tab === t ? 'page' : undefined}
              onClick={() =>
                setParams((previous) => {
                  const next = new URLSearchParams(previous);
                  next.set(sectionKey, t);
                  return next;
                })
              }
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </nav>
      )}
      {tab === 'overview' && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Object.entries(counts).map(([status, count]) => (
              <Stat
                key={status}
                label={SEAT_LABELS[status]}
                sub={
                  status === 'waiting'
                    ? 'Starts after current access ends'
                    : status === 'invited'
                      ? 'Student has not accepted yet'
                      : status === 'available'
                        ? 'Ready to invite a student'
                        : 'Using institution access'
                }
                size="sm"
                value={count}
                icon={status === 'active' ? Users : Clock}
              />
            ))}
          </div>
          <section className={`${PANEL} p-4 space-y-3`}>
            <PanelTitle label="Your seats" />
            <p className={`${MUTED} text-sm`}>
              Each seat gives one student Pro or Premium access. Buy seats, then invite students
              from the Students section. Waiting seats start when a student's current paid access
              ends.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {['paid', 'complimentary'].map((source) => (
                <div key={source}>
                  <p className={MICRO}>{source === 'paid' ? 'Purchased seats' : 'Free seats'}</p>
                  <p className={NUM}>
                    {
                      seats.filter(
                        (s) => s.source === source && !['revoked', 'expired'].includes(s.status)
                      ).length
                    }{' '}
                    seats
                  </p>
                </div>
              ))}
            </div>
          </section>
          <section className={`${PANEL} p-4`}>
            <PanelTitle label="Expiring in the next 14 days" />
            {seats
              .filter(
                (s) =>
                  s.status === 'active' &&
                  new Date(s.access_until) <= new Date(Date.now() + 14 * 86400000)
              )
              .map((s) => (
                <p key={s.id} className="text-xs">
                  {s.recipient_email} · {date(s.access_until)}
                </p>
              )) || null}
            {!seats.some(
              (s) =>
                s.status === 'active' &&
                new Date(s.access_until) <= new Date(Date.now() + 14 * 86400000)
            ) && <p className={`${MUTED} text-sm`}>No upcoming expiries.</p>}
          </section>
        </>
      )}
      {tab === 'students' && (
        <>
          <section className={`${PANEL} p-4 space-y-3`}>
            <PanelTitle label="Provide student access" />
            <label className="block text-xs">
              Seat allocation
              <select
                className={`${INPUT} mt-1`}
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
              >
                <option value="">Choose an allocation</option>
                {allocations.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.tier} · {o.months ? `${o.months} months` : `${o.access_days} days`} ·{' '}
                    {o.source === 'complimentary' ? 'Free seats' : 'Purchased seats'} ·{' '}
                    {seats.filter((s) => s.order_id === o.id && s.status === 'available').length}{' '}
                    available
                  </option>
                ))}
              </select>
            </label>
            <button
              className={BUTTON}
              disabled={!orderId || busy || i.status !== 'active'}
              onClick={() =>
                open('invite', 'Invite student', {
                  description: 'The student signs in and accepts to receive access.',
                })
              }
            >
              Invite student
            </button>
            <Field label="Import CSV (email,name)">
              <input
                type="file"
                className="w-full min-w-0 text-xs"
                accept=".csv,text/csv"
                disabled={busy || i.status !== 'active'}
                onChange={async (e) => {
                  try {
                    const file = e.target.files?.[0];
                    if (file) {
                      setCsv(parseStudentCsv(await file.text()));
                      setImportResults([]);
                    }
                  } catch (err) {
                    toast.error(err.message);
                  }
                }}
              />
            </Field>
            {csv && (
              <>
                <div className="max-h-48 overflow-auto text-xs">
                  {csv.map((r) => (
                    <p key={r.row}>
                      {r.email} · {r.name}{' '}
                      {r.error && (
                        <span className="text-[rgb(var(--signal-fault))]">{r.error}</span>
                      )}
                    </p>
                  ))}
                </div>
                <button
                  className={SECONDARY}
                  disabled={busy || !orderId || !csv.some((r) => !r.error)}
                  onClick={importCsv}
                >
                  {busy ? 'Sending…' : `Send ${csv.filter((r) => !r.error).length} invitations`}
                </button>
                {importResults.map((r) => (
                  <div key={r.email} className="text-xs">
                    <p>
                      {r.email}: {r.delivery_error || 'Sent'}
                    </p>
                    {r.url && (
                      <a className="text-[#5a63df] underline" href={r.url}>
                        Invitation link
                      </a>
                    )}
                  </div>
                ))}
              </>
            )}
          </section>
          <div className="flex flex-wrap gap-2">
            <input
              className={`${INPUT} max-w-sm`}
              aria-label="Search students"
              placeholder="Search students"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className={`${INPUT} max-w-40`}
              aria-label="Student status"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              {['all', 'invited', 'waiting', 'active', 'expired', 'revoked'].map((x) => (
                <option key={x} value={x}>
                  {STATUS_LABELS[x] || x}
                </option>
              ))}
            </select>
          </div>
          <div className={`${PANEL} overflow-x-auto`}>
            <table className="w-full text-left text-xs [&_td]:px-3 [&_td]:py-2 [&_th]:px-3 [&_th]:py-2">
              <thead>
                <tr>
                  {['Student', 'Plan', 'Source', 'Status', 'Access until', ''].map((x, n) => (
                    <th key={n} className="p-3">
                      {x}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {studentSeats.map((s) => (
                  <tr key={s.id} className="border-t border-[#e4e2f0] dark:border-white/10">
                    <td className="p-3">
                      <p>{s.recipient_name || s.recipient_email}</p>
                      <p className={MUTED}>{s.recipient_email}</p>
                    </td>
                    <td>{s.tier}</td>
                    <td>{s.source}</td>
                    <td>
                      <Pill tone={s.status === 'active' ? 'ok' : 'neutral'}>
                        {STATUS_LABELS[s.status] || s.status}
                      </Pill>
                    </td>
                    <td className={NUM}>
                      {s.status === 'waiting'
                        ? 'After current access'
                        : s.status === 'invited'
                          ? `Accept by ${date(s.activation_deadline)}`
                          : date(s.access_until)}
                    </td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-1">
                        {s.status === 'invited' && (
                          <>
                            <button
                              className={SECONDARY}
                              disabled={busy || !usable(s) || i.status !== 'active'}
                              onClick={() =>
                                act('invite', {
                                  seat_id: s.id,
                                  email: s.recipient_email,
                                  name: s.recipient_name,
                                })
                              }
                            >
                              Resend
                            </button>
                            <button
                              className={SECONDARY}
                              onClick={() => open('invite', 'Reassign unused seat', { seat: s })}
                            >
                              Reassign
                            </button>
                            <button
                              className={SECONDARY}
                              disabled={busy}
                              onClick={() => act('cancel', { seat_id: s.id })}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {admin && (
                          <>
                            {['active', 'expired'].includes(s.status) && (
                              <button
                                className={SECONDARY}
                                onClick={() => open('extend', 'Extend student access', { seat: s })}
                              >
                                Extend
                              </button>
                            )}
                            {s.status === 'waiting' && (
                              <button
                                className={SECONDARY}
                                onClick={() => open('release', 'Release waiting seat', { seat: s })}
                              >
                                Release
                              </button>
                            )}
                            {s.activated_at && s.status === 'active' && (
                              <button
                                className={SECONDARY}
                                onClick={() =>
                                  open('correct', 'Correct seat recipient', { seat: s })
                                }
                              >
                                Correct
                              </button>
                            )}
                            {s.status !== 'revoked' && (
                              <button
                                className={SECONDARY}
                                onClick={() => open('revoke', 'Revoke student access', { seat: s })}
                              >
                                Revoke
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!studentSeats.length && (
              <p className={`${MUTED} p-4 text-sm`}>No students match this view.</p>
            )}
          </div>
        </>
      )}
      {tab === 'subscription' && (
        <section className={`${PANEL} p-4 space-y-4`}>
          <PanelTitle label="Purchase prepaid seats" />
          <p className={`${MUTED} text-sm`}>
            One payment. Students accept within 90 days, then receive their full access duration. No
            automatic renewal.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Plan">
              <select
                className={INPUT}
                disabled={busy}
                value={purchase.tier}
                onChange={(e) => setPurchase({ ...purchase, tier: e.target.value })}
              >
                <option value="pro">Pro</option>
                <option value="premium">Premium</option>
              </select>
            </Field>
            <Field label="Duration">
              <select
                className={INPUT}
                disabled={busy}
                value={purchase.months}
                onChange={(e) => setPurchase({ ...purchase, months: Number(e.target.value) })}
              >
                <option value="1">1 month</option>
                <option value="3">3 months</option>
              </select>
            </Field>
            <Field label="Seats">
              <input
                className={INPUT}
                type="number"
                min="1"
                max="10000"
                disabled={busy}
                value={purchase.quantity}
                onChange={(e) => setPurchase({ ...purchase, quantity: Number(e.target.value) })}
              />
            </Field>
          </div>
          <button
            className={SECONDARY}
            disabled={busy || i.status !== 'active'}
            onClick={() => buy(false)}
          >
            Calculate price
          </button>
          {quote && (
            <div>
              <p className={`${NUM} text-xl`}>{money(quote.amount_minor, quote.currency)}</p>
              <p className={`${MUTED} text-xs`}>
                {PRICING_LABELS[quote.pricing_kind] || 'Standard price'} · {quote.quantity} seats
              </p>
              <button
                className={`${BUTTON} mt-3`}
                disabled={busy || i.status !== 'active'}
                onClick={() => buy(true)}
              >
                Pay with Stripe
              </button>
            </div>
          )}
        </section>
      )}
      {tab === 'billing' && (
        <section className={`${PANEL} p-4`}>
          <PanelTitle label="Purchases and free seats" />
          <p className={`${MUTED} mb-3 text-sm`}>
            Payments, free grants, and available invoices. Students receive access only after a
            payment is confirmed.
          </p>
          {params.get('checkout') === 'success' && (
            <p className="mb-3 text-sm">
              Payment confirmation may take a moment. Refresh to check the purchase status.
            </p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs [&_td]:px-3 [&_td]:py-2 [&_th]:px-3 [&_th]:py-2">
              <thead>
                <tr>
                  {[
                    'Date',
                    'Plan',
                    'Seats',
                    'Amount',
                    'Source',
                    'Status',
                    'Activate by',
                    'Documents',
                  ].map((x) => (
                    <th key={x} className="p-2">
                      {x}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.orders.map((o) => (
                  <tr key={o.id} className="border-t border-[#e4e2f0] dark:border-white/10">
                    <td className="p-2 whitespace-nowrap">{date(o.created_at)}</td>
                    <td>{o.tier === 'premium' ? 'Premium' : 'Pro'}</td>
                    <td className={NUM}>{o.quantity}</td>
                    <td className={NUM}>{money(o.amount_minor, o.currency)}</td>
                    <td>{o.source === 'complimentary' ? 'Free seats' : 'Purchase'}</td>
                    <td>
                      <Pill tone={['paid', 'complimentary'].includes(o.status) ? 'ok' : 'neutral'}>
                        {STATUS_LABELS[o.status] || o.status}
                      </Pill>
                    </td>
                    <td className="whitespace-nowrap">{date(o.activation_deadline)}</td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        {o.invoice_url && (
                          <a
                            href={o.invoice_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#5a63df] underline"
                          >
                            Invoice
                          </a>
                        )}
                        {o.receipt_url && (
                          <a
                            href={o.receipt_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#5a63df] underline"
                          >
                            Receipt
                          </a>
                        )}
                        {admin && o.status === 'reconciliation' && (
                          <button
                            className={SECONDARY}
                            onClick={() =>
                              open('reconcile_refund', 'Reconcile partial refund', {
                                order: o,
                                seats: seats.filter(
                                  (s) => s.order_id === o.id && s.status !== 'revoked'
                                ),
                              })
                            }
                          >
                            Reconcile refund
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!data.orders.length && (
            <Empty
              icon={Building2}
              title="No purchases or free seats yet"
              description="Purchase seats from Buy seats, or ask a platform administrator about a free allocation."
            />
          )}
        </section>
      )}
      {admin && tab === 'billing' && (
        <section className={`${PANEL} p-4 space-y-3`}>
          <PanelTitle label="Unused seats" />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs [&_td]:px-3 [&_td]:py-2 [&_th]:px-3 [&_th]:py-2">
              <thead>
                <tr>
                  {['Seat', 'Source', 'Plan', 'Status', 'Actions'].map((x) => (
                    <th key={x} className="p-2">
                      {x}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {seats
                  .filter((s) => ['available', 'invited'].includes(s.status))
                  .map((s) => (
                    <tr key={s.id} className="border-t border-[#e4e2f0] dark:border-white/10">
                      <td className="p-2 font-mono">{s.id.slice(0, 8)}</td>
                      <td>{s.source}</td>
                      <td>{s.tier}</td>
                      <td>{s.status}</td>
                      <td className="p-2">
                        <button
                          disabled={busy}
                          className={SECONDARY}
                          onClick={() => open('revoke', 'Revoke unused seat', { seat: s })}
                        >
                          Revoke seat
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {tab === 'settings' && (
        <form
          key={i.updated_at}
          className={`${PANEL} p-4 space-y-3`}
          onSubmit={(e) => {
            e.preventDefault();
            act('update', Object.fromEntries(new FormData(e.currentTarget)));
          }}
        >
          <PanelTitle label="Institution details" />
          <Text label="Name" name="name" value={i.name} required />
          <Text label="Contact email" name="contact_email" type="email" value={i.contact_email} />
          <Text label="Contact phone" name="contact_phone" value={i.contact_phone} />
          <Text
            label="Logo URL"
            name="logo_url"
            type="url"
            value={i.logo_url}
            placeholder="https://…"
          />
          <p className={`${MUTED} text-xs`}>
            Owner: {i.owner_email} · Currency: {i.currency}
          </p>
          <button className={BUTTON} disabled={busy}>
            Save details
          </button>
        </form>
      )}
      {admin && tab === 'pricing' && (
        <section className={`${PANEL} p-4 space-y-3`}>
          <PanelTitle label="Institution pricing" />
          <p className={`${MUTED} text-sm`}>
            A matching custom package takes priority, followed by an institution price, bulk price,
            and standard price. Discounts do not stack. Existing purchases keep their original
            price.
          </p>
          <PricingTable
            rules={data.pricing}
            onEdit={(pricing) => open('pricing', 'Edit pricing', { pricing, kind: pricing.kind })}
          />
        </section>
      )}
      {admin && tab === 'history' && (
        <InstitutionHistory key={institutionId} institutionId={institutionId} seats={seats} />
      )}
      <OperationDialog
        key={operation?.title}
        operation={operation}
        onClose={() => setOperation(null)}
        onSubmit={(fields) =>
          submit({ ...fields, ...(operation?.action === 'invite' ? { order_id: orderId } : {}) })
        }
        busy={busy}
      />
    </div>
  );
}
export function InstitutionAdmin() {
  const [data, setData] = useState(null),
    [error, setError] = useState(''),
    [search, setSearch] = useState(''),
    [operation, setOperation] = useState(null),
    [busy, setBusy] = useState(false);
  const [params, setParams] = useSearchParams();
  const selected = params.get('institution');
  const load = useCallback(async () => {
    try {
      setData(await institutionRequest('list'));
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  const submit = async (fields) => {
    setBusy(true);
    try {
      const result = await institutionRequest(operation.action, {
        ...fields,
        institution_id: null,
        id: operation.pricing?.id,
        enabled: fields.enabled === 'true',
      });
      setOperation(null);
      await load();
      if (operation.action === 'create') setParams({ tab: 'institutions', institution: result.id });
      toast.success('Saved');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };
  if (!data)
    return (
      <div className={`${PANEL} p-5`}>
        {error || 'Loading institutions…'}
        {error && (
          <button className={SECONDARY} onClick={load}>
            Retry
          </button>
        )}
      </div>
    );
  // Workspace uses its own section param; admin tab must stay "institutions".
  if (selected)
    return (
      <div className="space-y-3">
        <button className={SECONDARY} onClick={() => setParams({ tab: 'institutions' })}>
          Back to institutions
        </button>
        <InstitutionWorkspace
          key={selected}
          institutionId={selected}
          admin
          onInstitutionChanged={load}
        />
      </div>
    );
  return (
    <div className="min-w-0 space-y-4">
      <h1 className="text-xl font-extrabold">Institutions</h1>
      <div className={`${PANEL} flex flex-wrap items-center gap-3 p-4`}>
        <Pill tone={data.enabled ? 'ok' : 'warn'}>
          {data.enabled ? 'Enabled' : 'Pilot disabled'}
        </Pill>
        <button
          className={SECONDARY}
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await institutionRequest('enable', {
                enabled: !data.enabled,
                reason: 'Admin changed institution rollout gate',
              });
              await load();
            } catch (e) {
              toast.error(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {data.enabled ? 'Disable new institution operations' : 'Enable institution access'}
        </button>
        <button
          className={BUTTON}
          onClick={() => setOperation({ action: 'create', title: 'Create institution' })}
        >
          Create institution
        </button>
      </div>
      <input
        className={`${INPUT} max-w-md`}
        aria-label="Search institutions"
        placeholder="Search by name or owner email"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="grid gap-3 md:grid-cols-2">
        {data.institutions
          .filter((i) => `${i.name} ${i.owner_email}`.toLowerCase().includes(search.toLowerCase()))
          .map((i) => (
            <button
              key={i.id}
              className={`${PANEL} p-4 text-left`}
              onClick={() => setParams({ tab: 'institutions', institution: i.id })}
            >
              <Building2 className="mb-2 h-5 w-5 text-[#5a63df]" />
              <p className="font-bold">{i.name}</p>
              <p className={`${MUTED} text-xs`}>{i.owner_email}</p>
              <Pill tone={i.status === 'active' ? 'ok' : 'warn'}>{i.status}</Pill>
            </button>
          ))}
      </div>
      {!data.institutions.length && (
        <Empty
          icon={Building2}
          title="No institutions yet"
          description="Create an institution, configure its pricing, and invite the owner."
        />
      )}
      <section className={`${PANEL} p-4`}>
        <PanelTitle
          label="Default and bulk pricing"
          action={
            <button
              className={SECONDARY}
              onClick={() =>
                setOperation({
                  action: 'pricing',
                  title: 'Add default or bulk pricing',
                  kind: 'default',
                })
              }
            >
              Add pricing
            </button>
          }
        />
        <PricingTable
          rules={data.pricing.filter((r) => !r.institution_id)}
          onEdit={(pricing) =>
            setOperation({
              action: 'pricing',
              title: 'Edit global pricing',
              pricing,
              kind: pricing.kind,
            })
          }
        />
      </section>
      <OperationDialog
        key={operation?.title}
        operation={operation}
        onClose={() => setOperation(null)}
        onSubmit={submit}
        busy={busy}
      />
    </div>
  );
}
