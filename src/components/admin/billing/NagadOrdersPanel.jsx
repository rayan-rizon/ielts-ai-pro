import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, RefreshCcw, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import { supabase } from '@/lib/supabase';
import {
  fetchNagadPaymentStatus,
  getNagadAvailability,
} from '@/features/subscription/services/nagadPayment';
import {
  AdminButton,
  Empty,
  FilterRail,
  MICRO,
  MUTED,
  NUM,
  Notice,
  PANEL,
  PanelHeader,
  Pill,
} from '../ui/primitives';
import { formatDateTime } from './billingFormat';
import {
  buildNagadReconciliationCsv,
  NAGAD_REPORT_SELECT,
  nagadReportFilename,
} from './nagadReconciliation';

const STATUS_TONE = {
  initiated: 'neutral',
  pending: 'warn',
  paid: 'ok',
  failed: 'fault',
  expired: 'neutral',
  review: 'fault',
};

const AUDIENCES = [
  { id: 'off', label: 'Off' },
  { id: 'admins', label: 'Admins' },
  { id: 'everyone', label: 'Everyone' },
];

const VIEWS = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open', statuses: ['initiated', 'pending'] },
  { id: 'review', label: 'Review', statuses: ['review'] },
  { id: 'failed', label: 'Failed', statuses: ['failed', 'expired'] },
  { id: 'paid', label: 'Paid', statuses: ['paid'] },
];

const OPEN = new Set(['initiated', 'pending']);
const REPORT_PAGE = 1000;
const REPORT_LIMIT = 20000;

/** Every order in one environment, newest first, for the reconciliation CSV. */
async function fetchReportRows(environment) {
  const rows = [];
  for (let from = 0; from < REPORT_LIMIT; from += REPORT_PAGE) {
    let query = supabase
      .from('nagad_payments')
      .select(NAGAD_REPORT_SELECT)
      .order('created_at', { ascending: false })
      .range(from, from + REPORT_PAGE - 1);
    if (environment) query = query.eq('environment', environment);
    const { data, error } = await query;
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < REPORT_PAGE) break;
  }
  return rows;
}

/**
 * Nagad's own ledger: who can pay with it, and every checkout, including the
 * ones that never became a payment (failed, expired, held for review). Paid
 * live orders also appear above as approved payment requests.
 */
export default function NagadOrdersPanel() {
  const [orders, setOrders] = useState([]);
  const [audience, setAudience] = useState(null);
  const [testMode, setTestMode] = useState(false);
  const [view, setView] = useState('all');
  const [loading, setLoading] = useState(true);
  const [savingAudience, setSavingAudience] = useState(false);
  const [checking, setChecking] = useState(null);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [ordersResult, settingResult, availability] = await Promise.all([
      supabase
        .from('nagad_payments')
        .select(
          'order_id, status, amount, tier, billing_interval, environment, nagad_status, nagad_status_code, failure_reason, issuer_payment_ref, created_at, paid_at, user:users!nagad_payments_user_id_fkey(full_name, email)'
        )
        .order('created_at', { ascending: false })
        .limit(50),
      supabase.from('system_settings').select('value').eq('key', 'nagad_payments').maybeSingle(),
      getNagadAvailability(),
    ]);
    if (ordersResult.error) toast.error('Could not load Nagad orders');
    setOrders(ordersResult.data || []);
    setAudience(settingResult.data?.value?.audience || 'admins');
    setTestMode(availability.testMode);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const changeAudience = async (next) => {
    if (next === audience) return;
    setSavingAudience(true);
    const { error } = await supabase.from('system_settings').upsert({
      key: 'nagad_payments',
      value: { audience: next },
      updated_at: new Date().toISOString(),
    });
    setSavingAudience(false);
    if (error) {
      toast.error('Could not change who can pay with Nagad');
      return;
    }
    setAudience(next);
    toast.success(
      next === 'off'
        ? 'Nagad is off for everyone'
        : next === 'admins'
          ? 'Nagad is on for admins only'
          : testMode
            ? 'Saved. Learners get Nagad once live credentials are installed.'
            : 'Nagad is on for every Bangladesh learner'
    );
  };

  const recheck = async (orderId) => {
    setChecking(orderId);
    try {
      const result = await fetchNagadPaymentStatus(orderId);
      toast.info(`Nagad order ${orderId}: ${result.status}`);
      await load();
    } catch (error) {
      toast.error(error.message || 'Could not reach Nagad');
    } finally {
      setChecking(null);
    }
  };

  // Live orders once live keys are installed; sandbox orders while testing.
  const exportReport = async () => {
    const environment = testMode ? 'sandbox' : 'live';
    setExporting(true);
    try {
      const rows = await fetchReportRows(environment);
      const blob = new Blob([buildNagadReconciliationCsv(rows)], {
        type: 'text/csv;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = nagadReportFilename(environment);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${rows.length} ${environment} Nagad orders`);
    } catch {
      toast.error('Could not export the Nagad report');
    } finally {
      setExporting(false);
    }
  };

  const counts = useMemo(() => {
    const byView = {};
    for (const v of VIEWS) {
      byView[v.id] = v.statuses
        ? orders.filter((order) => v.statuses.includes(order.status)).length
        : orders.length;
    }
    return byView;
  }, [orders]);

  const statuses = VIEWS.find((v) => v.id === view)?.statuses;
  const visible = statuses ? orders.filter((order) => statuses.includes(order.status)) : orders;

  return (
    <section className={cn(PANEL, 'overflow-hidden')}>
      <PanelHeader
        label="Nagad"
        title="Nagad online payments"
        description="Who can pay with Nagad, and every checkout, including the ones that did not complete."
      >
        <AdminButton variant="outline" size="sm" onClick={exportReport} loading={exporting}>
          <Download className="h-3 w-3" /> Reconciliation CSV
        </AdminButton>
        <AdminButton variant="outline" size="sm" onClick={load} loading={loading}>
          <RefreshCcw className="h-3 w-3" /> Refresh
        </AdminButton>
      </PanelHeader>

      <div className="space-y-2.5 border-b border-stone-200/80 px-4 py-3 dark:border-white/[0.07]">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className={cn(MICRO, MUTED)}>Available to</span>
          <FilterRail
            options={AUDIENCES}
            value={audience}
            onChange={changeAudience}
            layoutId="nagadAudience"
            className={savingAudience ? 'pointer-events-none opacity-60' : undefined}
          />
          <Pill tone={testMode ? 'warn' : 'ok'}>{testMode ? 'Sandbox keys' : 'Live keys'}</Pill>
        </div>
        {testMode && (
          <Notice tone="warn" title="Sandbox credentials are installed">
            Only admins can use Nagad, whatever this switch says, and sandbox payments grant no
            plan. Learners get Nagad once the live keys from Nagad are installed.
          </Notice>
        )}
      </div>

      <div className="px-4 py-2.5 border-b border-stone-200/80 dark:border-white/[0.07]">
        <FilterRail
          options={VIEWS.map((v) => ({ ...v, count: counts[v.id] }))}
          value={view}
          onChange={setView}
          layoutId="nagadOrderView"
        />
      </div>

      {!loading && visible.length === 0 ? (
        <Empty icon={Wallet} title="No Nagad orders here">
          Checkouts appear here as soon as a learner starts paying with Nagad.
        </Empty>
      ) : (
        <ul className="divide-y divide-stone-100 dark:divide-white/5">
          {visible.map((order) => (
            <li key={order.order_id} className="flex flex-wrap items-start gap-3 px-4 py-2.5">
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="truncate text-[11px] font-extrabold text-stone-900 dark:text-stone-50">
                    {order.user?.full_name || order.user?.email || 'Deleted account'}
                  </span>
                  <Pill tone={STATUS_TONE[order.status] || 'neutral'}>{order.status}</Pill>
                  {order.environment === 'sandbox' && <Pill tone="accent">sandbox</Pill>}
                </div>
                <p className={cn('text-[10px] font-medium', MUTED)}>
                  <span className={NUM}>{order.order_id}</span> · {order.tier}{' '}
                  {order.billing_interval === 'quarterly' ? '3-month pass' : 'monthly'} ·{' '}
                  {formatDateTime(order.created_at)}
                </p>
                {(order.failure_reason || order.nagad_status) && (
                  <p className={cn('text-[10px] font-medium', MUTED)}>
                    Nagad: {order.nagad_status || '—'}
                    {order.nagad_status_code ? ` (${order.nagad_status_code})` : ''}
                    {order.issuer_payment_ref ? ` · TrxID ${order.issuer_payment_ref}` : ''}
                    {order.failure_reason && order.failure_reason !== order.nagad_status
                      ? ` · ${order.failure_reason}`
                      : ''}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className={cn(NUM, 'text-xs font-bold text-stone-900 dark:text-stone-50')}>
                  ৳{Number(order.amount).toLocaleString('en-US')}
                </span>
                {OPEN.has(order.status) && (
                  <AdminButton
                    variant="outline"
                    size="sm"
                    onClick={() => recheck(order.order_id)}
                    loading={checking === order.order_id}
                  >
                    Re-verify
                  </AdminButton>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
